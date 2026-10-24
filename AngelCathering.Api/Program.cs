using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AngelCathering.Data;
using AngelCathering.Models.DTOs;
using AngelCathering.Repository;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

// Cargar variables .env si existe localmente
Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// Configurar CORS
var allowedOriginsEnv = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") ?? "";
var allowedOrigins = allowedOriginsEnv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
        else
        {
            // Entorno local por defecto
            policy.SetIsOriginAllowed(origin =>
            {
                var uri = new Uri(origin);
                return uri.Host is "localhost" or "127.0.0.1" || uri.Host.EndsWith(".github.io");
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        }
    });
});

// Configuración JWT
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET");
if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
{
    if (builder.Environment.IsProduction())
    {
        throw new InvalidOperationException("FATAL: JWT_SECRET debe tener al menos 32 caracteres y estar configurado en producción.");
    }
    jwtSecret = "AngelCathering_SuperSecret_Jwt_Key_2026_Development_Key_Min32Chars!";
}

var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "rosecatering-api";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "rosecatering-app";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

// Inyección de dependencias
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IMenuRepository, MenuRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

var app = builder.Build();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// ==========================================
// ENDPOINTS DE SALUD Y DIAGNÓSTICO
// ==========================================
app.MapGet("/", () => Results.Ok(new { status = "online", service = "Rose Catering API .NET 10" }));
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.MapGet("/api/diagnostics/db", async (IDbConnectionFactory db) =>
{
    var rawConn = Environment.GetEnvironmentVariable("CONNECTION_STRING") ?? "(no CONNECTION_STRING env)";
    
    // Ocultar la contraseña por seguridad en el reporte
    var maskedConn = System.Text.RegularExpressions.Regex.Replace(
        rawConn, 
        "(Password|pwd)=[^;]+", 
        "$1=********", 
        System.Text.RegularExpressions.RegexOptions.IgnoreCase
    );

    try
    {
        using var conn = db.CreateConnection();
        conn.Open();

        using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT current_database(), current_user, version();";
        using var reader = cmd.ExecuteReader();
        reader.Read();
        var currentDb = reader.GetString(0);
        var currentUser = reader.GetString(1);
        var version = reader.GetString(2);
        reader.Close();

        // Verificar existencia de tablas críticas
        cmd.CommandText = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name IN ('user', 'menu_item', 'menu_category', 'order', 'table_sequence');
        """;
        var tables = new List<string>();
        using var tableReader = cmd.ExecuteReader();
        while (tableReader.Read())
        {
            tables.Add(tableReader.GetString(0));
        }
        tableReader.Close();

        // Probar ejecución de fn_menu_category_list
        object? testCategoryResult = null;
        string? testCategoryError = null;
        try
        {
            cmd.CommandText = "SELECT COUNT(*) FROM fn_menu_category_list();";
            testCategoryResult = cmd.ExecuteScalar();
        }
        catch (Exception fnEx)
        {
            testCategoryError = fnEx.Message;
        }

        // Probar ejecución de fn_order_list_history
        object? testOrderResult = null;
        string? testOrderError = null;
        try
        {
            cmd.CommandText = "SELECT COUNT(*) FROM fn_order_list_history();";
            testOrderResult = cmd.ExecuteScalar();
        }
        catch (Exception fnEx)
        {
            testOrderError = fnEx.Message;
        }

        return Results.Ok(new
        {
            status = "connected",
            database = currentDb,
            user = currentUser,
            tablesFound = tables,
            testCategoryResult,
            testCategoryError,
            testOrderResult,
            testOrderError,
            connectionStringConfigured = maskedConn,
            serverVersion = version
        });
    }
    catch (Exception ex)
    {
        return Results.Problem(
            detail: ex.ToString(),
            title: "Error al conectar con la Base de Datos",
            statusCode: 500,
            extensions: new Dictionary<string, object?>
            {
                { "connectionStringConfigured", maskedConn },
                { "exceptionType", ex.GetType().FullName },
                { "errorMessage", ex.Message }
            }
        );
    }
});

// ==========================================
// AUTH ENDPOINTS
// ==========================================
app.MapPost("/api/auth/login", async (LoginRequestDto dto, IUserRepository userRepo) =>
{
    if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
    {
        return Results.BadRequest(new { error = "El usuario y contraseña son requeridos." });
    }

    var user = await userRepo.GetByUsernameAsync(dto.Username.Trim());
    if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
    {
        return Results.Unauthorized();
    }

    var tokenHandler = new JwtSecurityTokenHandler();
    var key = Encoding.UTF8.GetBytes(jwtSecret);
    var tokenDescriptor = new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, user.IdUser.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("fullName", user.FullName)
        ]),
        Issuer = jwtIssuer,
        Audience = jwtAudience,
        Expires = DateTime.UtcNow.AddHours(8), // Expiración controlada de sesión
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    return Results.Ok(new LoginResponseDto(tokenHandler.WriteToken(token), user.Username, user.FullName));
});

// Endpoint para validar el token y devolver los claims activos del usuario actual
app.MapGet("/api/auth/me", (ClaimsPrincipal user) =>
{
    var idClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var nameClaim = user.FindFirst(ClaimTypes.Name)?.Value;
    var fullNameClaim = user.FindFirst("fullName")?.Value;

    if (string.IsNullOrEmpty(idClaim) || string.IsNullOrEmpty(nameClaim))
    {
        return Results.Unauthorized();
    }

    return Results.Ok(new
    {
        idUser = int.Parse(idClaim),
        username = nameClaim,
        fullName = fullNameClaim ?? nameClaim
    });
}).RequireAuthorization();

// ==========================================
// MENU PÚBLICO
// ==========================================
app.MapGet("/api/menu/public", async (IMenuRepository repo) =>
{
    try
    {
        var menu = await repo.GetPublicMenuAsync();
        return Results.Ok(menu);
    }
    catch (Exception ex)
    {
        return Results.Problem(
            detail: ex.ToString(),
            title: "Error in /api/menu/public",
            statusCode: 500
        );
    }
});

// ==========================================
// MENU ADMIN (PROTEGIDO)
// ==========================================
var menuGroup = app.MapGroup("/api/menu").RequireAuthorization();

menuGroup.MapGet("/categories", async (IMenuRepository repo) =>
{
    try
    {
        var categories = await repo.GetCategoriesAsync();
        return Results.Ok(categories);
    }
    catch (Exception ex)
    {
        return Results.Problem(
            detail: ex.ToString(),
            title: "Error in /api/menu/categories",
            statusCode: 500
        );
    }
});

menuGroup.MapGet("/items", async (IMenuRepository repo) =>
{
    var items = await repo.GetAllItemsAsync(includeInactive: true);
    return Results.Ok(items);
});

menuGroup.MapGet("/items/{id:int}", async (int id, IMenuRepository repo) =>
{
    var item = await repo.GetItemByIdAsync(id);
    return item is not null ? Results.Ok(item) : Results.NotFound();
});

menuGroup.MapPost("/upload-image", async (IFormFile file, IHttpClientFactory httpClientFactory) =>
{
    if (file == null || file.Length == 0)
    {
        return Results.BadRequest(new { error = "No se ha seleccionado ningún archivo de imagen." });
    }

    // Validar extensiones permitidas
    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".avif" };
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!allowedExtensions.Contains(extension))
    {
        return Results.BadRequest(new { error = "Formato no permitido. Solo se aceptan imágenes (.jpg, .jpeg, .png, .webp, .avif)." });
    }

    // Tamaño máximo: 5MB
    if (file.Length > 5 * 1024 * 1024)
    {
        return Results.BadRequest(new { error = "La imagen supera el límite máximo permitido de 5MB." });
    }

    // Configuración de Supabase Storage
    var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL") 
        ?? "https://zbjztvtagkorxejxvyjz.supabase.co";
    var supabaseKey = Environment.GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY") 
        ?? Environment.GetEnvironmentVariable("SUPABASE_KEY")
        ?? Environment.GetEnvironmentVariable("SUPABASE_ANON_KEY");
    var bucketName = Environment.GetEnvironmentVariable("SUPABASE_BUCKET") ?? "menu-images";

    if (string.IsNullOrWhiteSpace(supabaseKey))
    {
        return Results.Problem(
            title: "Supabase Storage no configurado",
            detail: "Falta configurar la variable de entorno SUPABASE_KEY o SUPABASE_SERVICE_ROLE_KEY en el servidor.",
            statusCode: 500
        );
    }

    // Nombre único para el archivo en el bucket
    var uniqueFileName = $"{Guid.NewGuid():N}{extension}";

    // Determinar Content-Type
    var contentType = extension switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".webp" => "image/webp",
        ".avif" => "image/avif",
        _ => "application/octet-stream"
    };

    var client = httpClientFactory.CreateClient();
    var cleanBaseUrl = supabaseUrl.TrimEnd('/');
    var uploadEndpoint = $"{cleanBaseUrl}/storage/v1/object/{bucketName}/{uniqueFileName}";

    using var requestMessage = new HttpRequestMessage(HttpMethod.Post, uploadEndpoint);
    requestMessage.Headers.Add("apikey", supabaseKey);
    requestMessage.Headers.Add("Authorization", $"Bearer {supabaseKey}");

    using var stream = file.OpenReadStream();
    using var streamContent = new StreamContent(stream);
    streamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
    requestMessage.Content = streamContent;

    var response = await client.SendAsync(requestMessage);

    if (!response.IsSuccessStatusCode)
    {
        var errorContent = await response.Content.ReadAsStringAsync();
        return Results.Problem(
            title: "Error al subir imagen a Supabase Storage",
            detail: $"Supabase respondió con código {(int)response.StatusCode}: {errorContent}. Asegúrate de que el bucket '{bucketName}' exista y sea público.",
            statusCode: (int)response.StatusCode
        );
    }

    // URL pública permanente de Supabase Storage
    var publicUrl = $"{cleanBaseUrl}/storage/v1/object/public/{bucketName}/{uniqueFileName}";

    return Results.Ok(new { imageUrl = publicUrl });
}).DisableAntiforgery();

menuGroup.MapPost("/items", async (UpsertMenuItemDto dto, IMenuRepository repo) =>
{
    if (string.IsNullOrWhiteSpace(dto.Title) || dto.Price < 0 || dto.IdCategory <= 0)
    {
        return Results.BadRequest(new { error = "Datos del platillo inválidos." });
    }

    var cleanDto = dto with 
    { 
        Title = dto.Title.Trim(),
        Description = dto.Description?.Trim(),
        UnitLabel = string.IsNullOrWhiteSpace(dto.UnitLabel) ? "por persona" : dto.UnitLabel.Trim(),
        ImageUrl = dto.ImageUrl?.Trim()
    };

    var newId = await repo.CreateItemAsync(cleanDto);
    return Results.Created($"/api/menu/items/{newId}", new { id = newId });
});

menuGroup.MapPut("/items/{id:int}", async (int id, UpsertMenuItemDto dto, IMenuRepository repo) =>
{
    if (string.IsNullOrWhiteSpace(dto.Title) || dto.Price < 0 || dto.IdCategory <= 0)
    {
        return Results.BadRequest(new { error = "Datos del platillo inválidos." });
    }

    var cleanDto = dto with 
    { 
        Title = dto.Title.Trim(),
        Description = dto.Description?.Trim(),
        UnitLabel = string.IsNullOrWhiteSpace(dto.UnitLabel) ? "por persona" : dto.UnitLabel.Trim(),
        ImageUrl = dto.ImageUrl?.Trim()
    };

    var success = await repo.UpdateItemAsync(id, cleanDto);
    return success ? Results.NoContent() : Results.NotFound();
});

menuGroup.MapDelete("/items/{id:int}", async (int id, IMenuRepository repo) =>
{
    var success = await repo.DeleteItemAsync(id);
    return success ? Results.NoContent() : Results.NotFound();
});

// ==========================================
// PEDIDOS MANUALES & KANBAN (PROTEGIDO)
// ==========================================
var ordersGroup = app.MapGroup("/api/orders").RequireAuthorization();

ordersGroup.MapGet("/active", async (IOrderRepository repo) =>
{
    var orders = await repo.GetActiveOrdersAsync();
    return Results.Ok(orders);
});

ordersGroup.MapGet("/history", async (IOrderRepository repo) =>
{
    try
    {
        var orders = await repo.GetHistoryOrdersAsync();
        return Results.Ok(orders);
    }
    catch (Exception ex)
    {
        return Results.Problem(
            detail: ex.ToString(),
            title: "Error in /api/orders/history",
            statusCode: 500
        );
    }
});

ordersGroup.MapGet("/{id:int}", async (int id, IOrderRepository repo) =>
{
    var order = await repo.GetByIdAsync(id);
    return order is not null ? Results.Ok(order) : Results.NotFound();
});

ordersGroup.MapPost("/", async (UpsertOrderDto dto, IOrderRepository repo) =>
{
    if (string.IsNullOrWhiteSpace(dto.CustomerName))
    {
        return Results.BadRequest(new { error = "El nombre del cliente es obligatorio." });
    }

    var validStatuses = new[] { "PENDIENTE", "EN_PROCESO", "COMPLETADO", "CANCELADO" };
    var status = validStatuses.Contains(dto.Status?.ToUpper()) ? dto.Status!.ToUpper() : "PENDIENTE";

    var cleanDto = dto with
    {
        CustomerName = dto.CustomerName.Trim(),
        CustomerPhone = dto.CustomerPhone?.Trim(),
        CustomerEmail = dto.CustomerEmail?.Trim(),
        EventType = string.IsNullOrWhiteSpace(dto.EventType) ? "Evento General" : dto.EventType.Trim(),
        Status = status,
        Notes = dto.Notes?.Trim()
    };

    var newId = await repo.CreateOrderAsync(cleanDto);
    return Results.Created($"/api/orders/{newId}", new { id = newId });
});

ordersGroup.MapPut("/{id:int}", async (int id, UpsertOrderDto dto, IOrderRepository repo) =>
{
    if (string.IsNullOrWhiteSpace(dto.CustomerName))
    {
        return Results.BadRequest(new { error = "El nombre del cliente es obligatorio." });
    }

    var validStatuses = new[] { "PENDIENTE", "EN_PROCESO", "COMPLETADO", "CANCELADO" };
    var status = validStatuses.Contains(dto.Status?.ToUpper()) ? dto.Status!.ToUpper() : "PENDIENTE";

    var cleanDto = dto with
    {
        CustomerName = dto.CustomerName.Trim(),
        CustomerPhone = dto.CustomerPhone?.Trim(),
        CustomerEmail = dto.CustomerEmail?.Trim(),
        EventType = string.IsNullOrWhiteSpace(dto.EventType) ? "Evento General" : dto.EventType.Trim(),
        Status = status,
        Notes = dto.Notes?.Trim()
    };

    var success = await repo.UpdateOrderAsync(id, cleanDto);
    return success ? Results.NoContent() : Results.NotFound();
});

ordersGroup.MapPatch("/{id:int}/status", async (int id, UpdateOrderStatusDto dto, IOrderRepository repo) =>
{
    var validStatuses = new[] { "PENDIENTE", "EN_PROCESO", "COMPLETADO", "CANCELADO" };
    if (!validStatuses.Contains(dto.Status?.ToUpper()))
    {
        return Results.BadRequest(new { error = "Estado de pedido inválido." });
    }

    var cleanDto = dto with { Status = dto.Status!.ToUpper() };
    var success = await repo.UpdateStatusAsync(id, cleanDto);
    return success ? Results.NoContent() : Results.NotFound();
});

ordersGroup.MapDelete("/{id:int}", async (int id, IOrderRepository repo) =>
{
    var success = await repo.DeleteOrderAsync(id);
    return success ? Results.NoContent() : Results.NotFound();
});

app.Run();
