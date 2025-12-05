// DTOs/TechnicianJobDto.cs
namespace ConstructionApp.Api.DTOs
{
    public class TechnicianJobDto
    {
        public int BookingID { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal Rate { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = "new"; // new, accepted, inprogress, completed
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerPhone { get; set; } = string.Empty;
        public string CreatedAt { get; set; } = string.Empty;
        public string PreferredDate { get; set; } = string.Empty;
    }

    // Request DTO
    public class UpdateJobStatusRequest
    {
        public string? Status { get; set; }
    }
}