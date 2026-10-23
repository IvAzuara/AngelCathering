using AngelCathering.Data;
using AngelCathering.Models.Entities;
using Dapper;

namespace AngelCathering.Repository;

public interface IUserRepository
{
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByIdAsync(int id);
}

public class UserRepository : IUserRepository
{
    private readonly IDbConnectionFactory _db;

    public UserRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_user AS IdUser, username, password_hash AS PasswordHash, 
                   full_name AS FullName, is_active AS IsActive, created_at AS CreatedAt
            FROM users
            WHERE LOWER(username) = LOWER(@Username) AND is_active = TRUE
            LIMIT 1;
        """;
        return await conn.QueryFirstOrDefaultAsync<User>(sql, new { Username = username });
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_user AS IdUser, username, password_hash AS PasswordHash, 
                   full_name AS FullName, is_active AS IsActive, created_at AS CreatedAt
            FROM users
            WHERE id_user = @Id
            LIMIT 1;
        """;
        return await conn.QueryFirstOrDefaultAsync<User>(sql, new { Id = id });
    }
}
