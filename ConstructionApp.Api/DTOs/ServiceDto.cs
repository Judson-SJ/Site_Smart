// DTOs/ServiceDto.cs
namespace ConstructionApp.Api.DTOs;

public class ServiceDto
{
    public int ServiceID { get; set; }
    public string ServiceName { get; set; } = null!;
    public string? Description { get; set; }
    public decimal FixedRate { get; set; }
    public decimal EstimatedDuration { get; set; }
    public string CategoryName { get; set; } = "Uncategorized"; // இது must!
    public int CategoryID { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImagePublicId { get; set; }
}

public class CreateServiceDto
{
    public string ServiceName { get; set; } = null!;
    public string? Description { get; set; }
    public decimal FixedRate { get; set; }
    public decimal EstimatedDuration { get; set; } 
    public int CategoryID { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImagePublicId { get; set; }
}

public class UpdateServiceDto
{
    public string? ServiceName { get; set; }
    public string? Description { get; set; }
    public decimal? FixedRate { get; set; }
    public decimal? EstimatedDuration { get; set; }
    public int? CategoryID { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImagePublicId { get; set; }
}