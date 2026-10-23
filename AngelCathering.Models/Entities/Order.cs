namespace AngelCathering.Models.Entities;

public class Order
{
    public int IdOrder { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public string? CustomerEmail { get; set; }
    public string EventType { get; set; } = "Evento General";
    public DateTime EventDate { get; set; }
    public int GuestCount { get; set; } = 1;
    public string Status { get; set; } = "PENDIENTE"; // PENDIENTE, EN_PROCESO, COMPLETADO, CANCELADO
    public bool IsUrgent { get; set; }
    public int SortPriority { get; set; }
    public decimal TotalEstimated { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
