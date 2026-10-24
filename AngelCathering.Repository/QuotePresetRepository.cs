using AngelCathering.Data;
using AngelCathering.Models.DTOs;
using AngelCathering.Models.Entities;
using Dapper;

namespace AngelCathering.Repository;

public interface IQuotePresetRepository
{
    Task<IEnumerable<QuotePreset>> GetAllPresetsAsync();
    Task<QuotePreset?> GetByIdAsync(int id);
    Task<int> CreatePresetAsync(UpsertQuotePresetDto dto);
    Task<bool> UpdatePresetAsync(int id, UpsertQuotePresetDto dto);
    Task<bool> DeletePresetAsync(int id);
}

public class QuotePresetRepository : IQuotePresetRepository
{
    private readonly IDbConnectionFactory _db;

    public QuotePresetRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<QuotePreset>> GetAllPresetsAsync()
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_preset AS IdPreset, name, service_type AS ServiceType,
                   included_menu AS IncludedMenu, price_per_person AS PricePerPerson,
                   food_details AS FoodDetails, complement_details AS ComplementDetails,
                   includes_details AS IncludesDetails, default_description AS DefaultDescription,
                   is_active AS IsActive, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM fn_quote_preset_list();
        """;
        return await conn.QueryAsync<QuotePreset>(sql);
    }

    public async Task<QuotePreset?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_preset AS IdPreset, name, service_type AS ServiceType,
                   included_menu AS IncludedMenu, price_per_person AS PricePerPerson,
                   food_details AS FoodDetails, complement_details AS ComplementDetails,
                   includes_details AS IncludesDetails, default_description AS DefaultDescription,
                   is_active AS IsActive, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM fn_quote_preset_get_by_id(@Id);
        """;
        return await conn.QuerySingleOrDefaultAsync<QuotePreset>(sql, new { Id = id });
    }

    public async Task<int> CreatePresetAsync(UpsertQuotePresetDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT fn_quote_preset_create(
                @Name, @ServiceType, @IncludedMenu, @PricePerPerson,
                @FoodDetails, @ComplementDetails, @IncludesDetails, @DefaultDescription
            );
        """;
        return await conn.ExecuteScalarAsync<int>(sql, new
        {
            dto.Name,
            dto.ServiceType,
            dto.IncludedMenu,
            dto.PricePerPerson,
            dto.FoodDetails,
            dto.ComplementDetails,
            dto.IncludesDetails,
            dto.DefaultDescription
        });
    }

    public async Task<bool> UpdatePresetAsync(int id, UpsertQuotePresetDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            CALL sp_quote_preset_update(
                @Id, @Name, @ServiceType, @IncludedMenu, @PricePerPerson,
                @FoodDetails, @ComplementDetails, @IncludesDetails, @DefaultDescription, @IsActive
            );
        """;
        var rows = await conn.ExecuteAsync(sql, new
        {
            Id = id,
            dto.Name,
            dto.ServiceType,
            dto.IncludedMenu,
            dto.PricePerPerson,
            dto.FoodDetails,
            dto.ComplementDetails,
            dto.IncludesDetails,
            dto.DefaultDescription,
            dto.IsActive
        });
        return rows >= 0;
    }

    public async Task<bool> DeletePresetAsync(int id)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            CALL sp_quote_preset_delete(@Id);
        """;
        var rows = await conn.ExecuteAsync(sql, new { Id = id });
        return rows >= 0;
    }
}
