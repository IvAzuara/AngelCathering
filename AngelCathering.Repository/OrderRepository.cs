using AngelCathering.Data;
using AngelCathering.Models.DTOs;
using AngelCathering.Models.Entities;
using Dapper;

namespace AngelCathering.Repository;

public interface IOrderRepository
{
    Task<IEnumerable<Order>> GetActiveOrdersAsync();
    Task<IEnumerable<Order>> GetHistoryOrdersAsync();
    Task<Order?> GetByIdAsync(int id);
    Task<int> CreateOrderAsync(UpsertOrderDto dto);
    Task<bool> UpdateOrderAsync(int id, UpsertOrderDto dto);
    Task<bool> UpdateStatusAsync(int id, UpdateOrderStatusDto dto);
    Task<bool> DeleteOrderAsync(int id);
}

public class OrderRepository : IOrderRepository
{
    private readonly IDbConnectionFactory _db;

    public OrderRepository(IDbConnectionFactory db)
    {
        _db = db;
    }

    public async Task<IEnumerable<Order>> GetActiveOrdersAsync()
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_order AS IdOrder, customer_name AS CustomerName, customer_phone AS CustomerPhone,
                   customer_email AS CustomerEmail, event_type AS EventType, event_date AS EventDate,
                   guest_count AS GuestCount, status, is_urgent AS IsUrgent, sort_priority AS SortPriority,
                   total_estimated AS TotalEstimated, notes, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM fn_order_list_active();
        """;
        return await conn.QueryAsync<Order>(sql);
    }

    public async Task<IEnumerable<Order>> GetHistoryOrdersAsync()
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_order AS IdOrder, customer_name AS CustomerName, customer_phone AS CustomerPhone,
                   customer_email AS CustomerEmail, event_type AS EventType, event_date AS EventDate,
                   guest_count AS GuestCount, status, is_urgent AS IsUrgent, sort_priority AS SortPriority,
                   total_estimated AS TotalEstimated, notes, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM fn_order_list_history();
        """;
        return await conn.QueryAsync<Order>(sql);
    }

    public async Task<Order?> GetByIdAsync(int id)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT id_order AS IdOrder, customer_name AS CustomerName, customer_phone AS CustomerPhone,
                   customer_email AS CustomerEmail, event_type AS EventType, event_date AS EventDate,
                   guest_count AS GuestCount, status, is_urgent AS IsUrgent, sort_priority AS SortPriority,
                   total_estimated AS TotalEstimated, notes, created_at AS CreatedAt, updated_at AS UpdatedAt
            FROM fn_order_get_by_id(@Id);
        """;
        return await conn.QueryFirstOrDefaultAsync<Order>(sql, new { Id = id });
    }

    public async Task<int> CreateOrderAsync(UpsertOrderDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            SELECT fn_order_create(
                @CustomerName, @CustomerPhone, @CustomerEmail, @EventType,
                @EventDate, @GuestCount, @Status, @IsUrgent, @SortPriority,
                @TotalEstimated, @Notes
            );
        """;
        return await conn.ExecuteScalarAsync<int>(sql, dto);
    }

    public async Task<bool> UpdateOrderAsync(int id, UpsertOrderDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            CALL sp_order_update(
                @Id, @CustomerName, @CustomerPhone, @CustomerEmail, @EventType,
                @EventDate, @GuestCount, @Status, @IsUrgent, @SortPriority,
                @TotalEstimated, @Notes
            );
        """;
        var rows = await conn.ExecuteAsync(sql, new
        {
            Id = id,
            dto.CustomerName,
            dto.CustomerPhone,
            dto.CustomerEmail,
            dto.EventType,
            dto.EventDate,
            dto.GuestCount,
            dto.Status,
            dto.IsUrgent,
            dto.SortPriority,
            dto.TotalEstimated,
            dto.Notes
        });
        return rows >= 0;
    }

    public async Task<bool> UpdateStatusAsync(int id, UpdateOrderStatusDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            CALL sp_order_update_status(
                @Id, @Status, @IsUrgent, @SortPriority
            );
        """;
        var rows = await conn.ExecuteAsync(sql, new
        {
            Id = id,
            dto.Status,
            dto.IsUrgent,
            dto.SortPriority
        });
        return rows >= 0;
    }

    public async Task<bool> DeleteOrderAsync(int id)
    {
        using var conn = _db.CreateConnection();
        const string sql = "CALL sp_order_delete(@Id);";
        var rows = await conn.ExecuteAsync(sql, new { Id = id });
        return rows >= 0;
    }
}
