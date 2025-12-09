using System;

namespace ConstructionApp.Api.DTOs
{
    public class TechnicianVerificationDto
    {
        public int TechnicianID { get; set; }
        public int UserID { get; set; }

        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;

        public string VerificationStatus { get; set; } = "Pending";
        public string? IDProof { get; set; }
        public string? Certificate { get; set; }
        public int ExperienceYears { get; set; }

        // Address (detail view-le use aagum, list-le null irundha paravayilla)
        public string? Street { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }

        public DateTime? VerifiedAt { get; set; }
    }

    public class UpdateTechnicianVerificationRequest
    {
        // "Approved" | "Rejected" | "Pending"
        public string Status { get; set; } = string.Empty;

        // Optional – UI-le kaamikka reason store panna vechukalam (model-le field add panna na)
        public string? Reason { get; set; }
    }
}