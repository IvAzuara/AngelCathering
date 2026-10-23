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
            FROM orders
            WHERE status IN ('PENDIENTE', 'EN_PROCESO')
            ORDER BY is_urgent DESC, sort_priority ASC, event_date ASC;
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
            FROM orders
            WHERE status IN ('COMPLETADO', 'CANCELADO')
            ORDER BY updated_at DESC, event_date DESC;
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
            FROM orders
            WHERE id_order = @Id
            LIMIT 1;
        """;
        return await conn.QueryFirstOrDefaultAsync<Order>(sql, new { Id = id });
    }

    public async Task<int> CreateOrderAsync(UpsertOrderDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            INSERT INTO orders (customer_name, customer_phone, customer_email, event_type, 
                               event_date, guest_count, status, is_urgent, sort_priority, 
                               total_estimated, notes)
            VALUES (@CustomerName, @CustomerPhone, @CustomerEmail, @EventType, 
                    @EventDate, @GuestCount, @Status, @IsUrgent, @SortPriority, 
                    @TotalEstimated, @Notes)
            RETURNING id_order;
        """;
        return await conn.ExecuteScalarAsync<int>(sql, dto);
    }

    public async Task<bool> UpdateOrderAsync(int id, UpsertOrderDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            UPDATE orders
            SET customer_name = @CustomerName,
                customer_phone = @CustomerPhone,
                customer_email = @CustomerEmail,
                event_type = @EventType,
                event_date = @EventDate,
                guest_count = @GuestCount,
                status = @Status,
                is_urgent = @IsUrgent,
                sort_priority = @SortPriority,
                total_estimated = @TotalEstimated,
                notes = @Notes,
                updated_at = NOW()
            WHERE id_order = @Id;
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
        return rows > 0;
    }

    public async Task<bool> UpdateStatusAsync(int id, UpdateOrderStatusDto dto)
    {
        using var conn = _db.CreateConnection();
        const string sql = """
            UPDATE orders
            SET status = @Status,
                is_urgent = COALESCE(@IsUrgent, is_urgent),
                sort_priority = COALESCE(@SortPriority, sort_priority),
                updated_at = NOW()
            WHERE id_order = @Id;
        """;
        var rows = await conn.ExecuteAsync(sql, new
        {
            Id = id,
            dto.Status,
            dto.IsUrgent,
            dto.SortPriority
        });
        return rows > 0;
    }

    public async Task<bool> DeleteOrderAsync(int id)
    {
        using var conn = _db.CreateConnection();
        const string sql = "DELETE FROM orders WHERE id_order = @Id;";
        var rows = await conn.ExecuteAsync(sql, new { Id = id });
        return rows > 0;
    }
}
