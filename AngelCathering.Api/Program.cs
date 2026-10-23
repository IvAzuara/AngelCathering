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
builder.Services.AddSingleton<IDbConnectionFactory, DbConnectionFactory>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IMenuRepository, MenuRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();

var app = builder.Build();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

// ==========================================
// ENDPOINTS DE SALUD
// ==========================================
app.MapGet("/", () => Results.Ok(new { status = "online", service = "Rose Catering API .NET 10" }));
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

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
    var menu = await repo.GetPublicMenuAsync();
    return Results.Ok(menu);
});

// ==========================================
// MENU ADMIN (PROTEGIDO)
// ==========================================
var menuGroup = app.MapGroup("/api/menu").RequireAuthorization();

menuGroup.MapGet("/categories", async (IMenuRepository repo) =>
{
    var categories = await repo.GetCategoriesAsync();
    return Results.Ok(categories);
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
    var orders = await repo.GetHistoryOrdersAsync();
    return Results.Ok(orders);
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
