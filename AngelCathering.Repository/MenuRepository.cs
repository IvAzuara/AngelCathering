using AngelCathering.Data;
using AngelCathering.Models.DTOs;
using AngelCathering.Models.Entities;
using Dapper;

namespace AngelCathering.Repository;

public interface IMenuRepository
{
    Task<IEnumerable<MenuCategory>> GetPublicMenuAsync();
    Task<IEnumerable<MenuItem>> GetAllItemsAsync(bool includeInactive = false);
    Task<MenuItem?> GetItemByIdAsync(int id);
    Task<int> CreateItemAsync(UpsertMenuItemDto dto);
    Task<bool> UpdateItemAsync(int id, UpsertMenuItemDto dto);
    Task<bool> DeleteItemAsync(int id);
    Task<IEnumerable<MenuCategory>> GetCategoriesAsync();
}

public class MenuRepository : IMenuRepository
{
    private readonly IDbConnectionFactory _db;

    public MenuRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<MenuCategory>> GetPublicMenuAsync()
    {
        using var conn = _db.CreateConnection();
        const string catSql = """
            SELECT id_category AS IdCategory, name, description, sort_order AS SortOrder, is_active AS IsActive
            FROM menu_categories
            WHERE is_active = TRUE
            ORDER BY sort_order ASC, name ASC;
        """;
        var categories = (await conn.QueryAsync<MenuCategory>(catSql)).ToList();

        const string itemSql = """
            SELECT i.id_item AS IdItem, i.id_category AS IdCategory, c.name AS CategoryName,
                   i.title, i.description, i.price, i.unit_label AS UnitLabel, 
                   i.image_url AS ImageUrl, i.is_available AS IsAvailable,
                   i.created_at AS CreatedAt, i.updated_at AS UpdatedAt
            FROM menu_items i
            JOIN menu_categories c ON i.id_category = c.id_category
            WHERE i.is_available = TRUE AND c.is_active = TRUE
            ORDER BY i.id_category, i.title ASC;
        """;
        var items = (await conn.QueryAsync<MenuItem>(itemSql)).ToList();

        foreach (var cat in categories)
        {
            cat.Items = items.Where(x => x.IdCategory == cat.IdCategory).ToList();
        }

        return categories;
    }

    public async Task<IEnumerable<MenuItem>> GetAllItemsAsync(bool includeInactive = false)
    {
        using var conn = _db.CreateConnection();
        string sql = $"""
            SELECT i.id_item AS IdItem, i.id_category AS IdCategory, c.name AS CategoryName,
                   i.title, i.description, i.price, i.unit_label AS UnitLabel, 
                   i.image_url AS ImageUrl, i.is_available AS IsAvailable,
                   i.created_at AS CreatedAt, i.updated_at AS UpdatedAt
            FROM menu_items i
            JOIN menu_categories c ON i.id_category = c.id_category
            {(includeInactive ? "" : "WHERE i.is_available = TRUE")}
            ORDER BY i.id_category, i.title ASC;
        """;
        return await conn.QueryAsync<MenuItem>(sql);
    }

    public async Task<MenuItem?> GetItemByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT i.id_item AS IdItem, i.id_category AS IdCategory, c.name AS CategoryName,
                   i.title, i.description, i.price, i.unit_label AS UnitLabel, 
                   i.image_url AS ImageUrl, i.is_available AS IsAvailable,
                   i.created_at AS CreatedAt, i.updated_at AS UpdatedAt
            FROM menu_items i
            JOIN menu_categories c ON i.id_category = c.id_category
            WHERE i.id_item = @Id
            LIMIT 1;
        """;
        return await conn.QueryFirstOrDefaultAsync<MenuItem>(sql, new { Id = id });
    }

    public async Task<int> CreateItemAsync(UpsertMenuItemDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            INSERT INTO menu_items (id_category, title, description, price, unit_label, image_url, is_available)
            VALUES (@IdCategory, @Title, @Description, @Price, @UnitLabel, @ImageUrl, @IsAvailable)
            RETURNING id_item;
        """;
        return await conn.ExecuteScalarAsync<int>(sql, dto);
    }

    public async Task<bool> UpdateItemAsync(int id, UpsertMenuItemDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            UPDATE menu_items
            SET id_category = @IdCategory,
                title = @Title,
                description = @Description,
                price = @Price,
                unit_label = @UnitLabel,
                image_url = @ImageUrl,
                is_available = @IsAvailable,
                updated_at = NOW()
            WHERE id_item = @Id;
        """;
        var rows = await conn.ExecuteAsync(sql, new
        {
            Id = id,
            dto.IdCategory,
            dto.Title,
            dto.Description,
            dto.Price,
            dto.UnitLabel,
            dto.ImageUrl,
            dto.IsAvailable
        });
        return rows > 0;
    }

    public async Task<bool> DeleteItemAsync(int id)
    {
        using var conn = _db.CreateConnection();
        const string sql = "DELETE FROM menu_items WHERE id_item = @Id;";
        var rows = await conn.ExecuteAsync(sql, new { Id = id });
        return rows > 0;
    }

    public async Task<IEnumerable<MenuCategory>> GetCategoriesAsync()
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_category AS IdCategory, name, description, sort_order AS SortOrder, is_active AS IsActive
            FROM menu_categories
            WHERE is_active = TRUE
            ORDER BY sort_order ASC;
        """;
        return await conn.QueryAsync<MenuCategory>(sql);
    }
}
