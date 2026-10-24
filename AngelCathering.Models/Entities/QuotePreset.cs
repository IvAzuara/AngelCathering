namespace AngelCathering.Models.Entities;

public class QuotePreset
{
    public int IdPreset { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public string IncludedMenu { get; set; } = string.Empty;
    public decimal PricePerPerson { get; set; }
    public string? FoodDetails { get; set; }
    public string? ComplementDetails { get; set; }
    public string? IncludesDetails { get; set; }
    public string? DefaultDescription { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
