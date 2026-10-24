namespace AngelCathering.Models.Entities;

public class Season
{
    public int IdSeason { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? BadgeText { get; set; }
    public string? Description { get; set; }
    public string? BannerUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
