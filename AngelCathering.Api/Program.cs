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

// Configurar CORS para permitir GitHub Pages y local
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configuración JWT
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") 
    ?? builder.Configuration["Jwt:Secret"] 
    ?? "AngelCathering_SuperSecret_Jwt_Key_2026_Development_Key_Min32Chars!";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
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
app.MapGet("/", () => Results.Ok(new { status = "online", service = "AngelCathering API .NET 10" }));
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// ==========================================
// AUTH ENDPOINTS
// ==========================================
app.MapPost("/api/auth/login", async (LoginRequestDto dto, IUserRepository userRepo) =>
{
    var user = await userRepo.GetByUsernameAsync(dto.Username);
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
        Expires = DateTime.UtcNow.AddDays(7),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
    };

    var token = tokenHandler.CreateToken(tokenDescriptor);
    return Results.Ok(new LoginResponseDto(tokenHandler.WriteToken(token), user.Username, user.FullName));
});

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
    var newId = await repo.CreateItemAsync(dto);
    return Results.Created($"/api/menu/items/{newId}", new { id = newId });
});

menuGroup.MapPut("/items/{id:int}", async (int id, UpsertMenuItemDto dto, IMenuRepository repo) =>
{
    var success = await repo.UpdateItemAsync(id, dto);
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
    var newId = await repo.CreateOrderAsync(dto);
    return Results.Created($"/api/orders/{newId}", new { id = newId });
});

ordersGroup.MapPut("/{id:int}", async (int id, UpsertOrderDto dto, IOrderRepository repo) =>
{
    var success = await repo.UpdateOrderAsync(id, dto);
    return success ? Results.NoContent() : Results.NotFound();
});

ordersGroup.MapPatch("/{id:int}/status", async (int id, UpdateOrderStatusDto dto, IOrderRepository repo) =>
{
    var success = await repo.UpdateStatusAsync(id, dto);
    return success ? Results.NoContent() : Results.NotFound();
});

ordersGroup.MapDelete("/{id:int}", async (int id, IOrderRepository repo) =>
{
    var success = await repo.DeleteOrderAsync(id);
    return success ? Results.NoContent() : Results.NotFound();
});

app.Run();
