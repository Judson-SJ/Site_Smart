// Models/Booking.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ConstructionApp.Api.Models;

namespace ConstructionApp.Api.Models
{
    [Table("Bookings")] // Explicit table name (optional but recommended)
    public class Booking
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int BookingID { get; set; }

        // Customer who created the booking
        [Required]
        [ForeignKey("User")]
        public int UserID { get; set; }

        public User User { get; set; } = null!;

        // Technician assigned (nullable until accepted)
        [ForeignKey("Technician")]
        public int? TechnicianID { get; set; }

        public Technician? Technician { get; set; }

        // Service selected
        [Required]
        [ForeignKey("Service")]
        public int ServiceID { get; set; }

        public Service Service { get; set; } = null!;

        // Customer address for the job
        [Required]
        [ForeignKey("Address")]
        public int AddressID { get; set; }

        public Address Address { get; set; } = null!;

        // Job description
        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = null!;

        // Optional reference photo
        [StringLength(500)]
        public string? ReferenceImage { get; set; }

        // When booking was created
        [Required]
        public DateTime BookingDate { get; set; } = DateTime.UtcNow;

        // Preferred time window
        [Required]
        public DateTime PreferredStartDateTime { get; set; }

        [Required]
        public DateTime PreferredEndDateTime { get; set; }

        // Status: Pending, Accepted, InProgress, Completed, Cancelled
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Pending";

        // Fixed price from Service.FixedRate
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        // When technician marked as completed
        public DateTime? WorkCompletionDateTime { get; set; }

        // Optional: Index for performance
        [NotMapped]
        public string CustomerFullName => User?.FullName ?? "Unknown";

        [NotMapped]
        public string TechnicianFullName => Technician?.User?.FullName ?? "Not Assigned";

        [NotMapped]
        public string ServiceName => Service?.ServiceName ?? "Unknown";

        // Timestamps for auditing
        [Column(TypeName = "datetime2")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column(TypeName = "datetime2")]
        public DateTime? UpdatedAt { get; set; }
    }

     public class CreateBookingRequest
    {
        public int ServiceID { get; set; }
        public DateTime PreferredDate { get; set; }
        public string PreferredTime { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }
}