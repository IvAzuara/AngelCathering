namespace AngelCathering.Models.DTOs;

public record LoginRequestDto(string Username, string Password);

public record LoginResponseDto(string Token, string Username, string FullName);

public record UpsertMenuItemDto(
    int IdCategory,
    string Title,
    string? Description,
    decimal Price,
    string UnitLabel,
    string? ImageUrl,
    bool IsAvailable
);

public record UpsertOrderDto(
    string CustomerName,
    string? CustomerPhone,
    string? CustomerEmail,
    string EventType,
    DateTime EventDate,
    int GuestCount,
    string Status,
    bool IsUrgent,
    int SortPriority,
    decimal TotalEstimated,
    string? Notes
);

public record UpdateOrderStatusDto(
    string Status,
    bool? IsUrgent,
    int? SortPriority
);

public record UpsertQuotePresetDto(
    string Name,
    string ServiceType,
    string IncludedMenu,
    decimal PricePerPerson,
    string? FoodDetails,
    string? ComplementDetails,
    string? IncludesDetails,
    string? DefaultDescription,
    bool IsActive = true
);
