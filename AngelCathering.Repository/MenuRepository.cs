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
            FROM fn_menu_category_list();
        """;
        var categories = (await conn.QueryAsync<MenuCategory>(catSql)).ToList();

        const string itemSql = """
            SELECT id_item AS IdItem, id_category AS IdCategory, id_season AS IdSeason,
                   season_name AS SeasonName, category_name AS CategoryName,
                   title, description, price, unit_label AS UnitLabel, 
                   image_url AS ImageUrl, is_available AS IsAvailable,
                   created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM fn_menu_item_list_public();
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
        const string sql = """
            SELECT id_item AS IdItem, id_category AS IdCategory, category_name AS CategoryName,
                   title, description, price, unit_label AS UnitLabel, 
                   image_url AS ImageUrl, is_available AS IsAvailable,
                   created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM fn_menu_item_list_all(@IncludeInactive);
        """;
        return await conn.QueryAsync<MenuItem>(sql, new { IncludeInactive = includeInactive });
    }

    public async Task<MenuItem?> GetItemByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_item AS IdItem, id_category AS IdCategory, category_name AS CategoryName,
                   title, description, price, unit_label AS UnitLabel, 
                   image_url AS ImageUrl, is_available AS IsAvailable,
                   created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM fn_menu_item_get_by_id(@Id);
        """;
        return await conn.QueryFirstOrDefaultAsync<MenuItem>(sql, new { Id = id });
    }

    public async Task<int> CreateItemAsync(UpsertMenuItemDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT fn_menu_item_create(
                @IdCategory, @Title, @Description, @Price, @UnitLabel, @ImageUrl, @IsAvailable
            );
        """;
        return await conn.ExecuteScalarAsync<int>(sql, dto);
    }

    public async Task<bool> UpdateItemAsync(int id, UpsertMenuItemDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            CALL sp_menu_item_update(
                @Id, @IdCategory, @Title, @Description, @Price, @UnitLabel, @ImageUrl, @IsAvailable
            );
        """;
        await conn.ExecuteAsync(sql, new
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
        return true;
    }

    public async Task<bool> DeleteItemAsync(int id)
    {
        using var conn = _db.CreateConnection();
        const string sql = "CALL sp_menu_item_delete(@Id);";
        await conn.ExecuteAsync(sql, new { Id = id });
        return true;
    }

    public async Task<IEnumerable<MenuCategory>> GetCategoriesAsync()
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_category AS IdCategory, name, description, sort_order AS SortOrder, is_active AS IsActive
            FROM fn_menu_category_list();
        """;
        return await conn.QueryAsync<MenuCategory>(sql);
    }
}
