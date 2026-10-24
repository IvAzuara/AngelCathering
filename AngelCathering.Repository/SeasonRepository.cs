using AngelCathering.Data;
using AngelCathering.Models.DTOs;
using AngelCathering.Models.Entities;
using Dapper;

namespace AngelCathering.Repository;

public interface ISeasonRepository
{
    Task<IEnumerable<Season>> GetActiveSeasonsAsync();
    Task<IEnumerable<Season>> GetAllSeasonsAsync();
    Task<int> CreateSeasonAsync(UpsertSeasonDto dto);
    Task<bool> UpdateSeasonAsync(int id, UpsertSeasonDto dto);
    Task<bool> ToggleActiveAsync(int id, bool isActive);
}

public class SeasonRepository : ISeasonRepository
{
    private readonly IDbConnectionFactory _db;

    public SeasonRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Season>> GetActiveSeasonsAsync()
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_season AS IdSeason, name, slug, badge_text AS BadgeText,
                   description, banner_url AS BannerUrl, is_active AS IsActive
            FROM fn_season_list_active();
        """;
        return await conn.QueryAsync<Season>(sql);
    }

    public async Task<IEnumerable<Season>> GetAllSeasonsAsync()
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_season AS IdSeason, name, slug, badge_text AS BadgeText,
                   description, banner_url AS BannerUrl, is_active AS IsActive,
                   created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM fn_season_list_all();
        """;
        return await conn.QueryAsync<Season>(sql);
    }

    public async Task<int> CreateSeasonAsync(UpsertSeasonDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT fn_season_create(
                @Name, @Slug, @BadgeText, @Description, @BannerUrl, @IsActive
            );
        """;
        return await conn.ExecuteScalarAsync<int>(sql, new
        {
            dto.Name,
            dto.Slug,
            dto.BadgeText,
            dto.Description,
            dto.BannerUrl,
            dto.IsActive
        });
    }

    public async Task<bool> UpdateSeasonAsync(int id, UpsertSeasonDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            CALL sp_season_update(
                @Id, @Name, @Slug, @BadgeText, @Description, @BannerUrl, @IsActive
            );
        """;
        var rows = await conn.ExecuteAsync(sql, new
        {
            Id = id,
            dto.Name,
            dto.Slug,
            dto.BadgeText,
            dto.Description,
            dto.BannerUrl,
            dto.IsActive
        });
        return rows >= 0;
    }

    public async Task<bool> ToggleActiveAsync(int id, bool isActive)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            CALL sp_season_toggle_active(@Id, @IsActive);
        """;
        var rows = await conn.ExecuteAsync(sql, new { Id = id, IsActive = isActive });
        return rows >= 0;
    }
}
