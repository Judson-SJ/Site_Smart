// Models/User.cs + Technician.cs (All in one file or separate)
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConstructionApp.Api.Models
{
    public class User
    {
        [Key]
        public int UserID { get; set; }

        [Required, StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, StringLength(255), EmailAddress]
        public string Email { get; set; } = string.Empty;

        [StringLength(20), Phone]
        public string? Phone { get; set; }

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [StringLength(20)]
        public string Role { get; set; } = "Customer"; // Customer, Technician, Admin

        [StringLength(20)]
        public string Status { get; set; } = "Active"; // Active, Inactive, Banned

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // EMAIL VERIFICATION
        public string? VerificationToken { get; set; }
        public bool EmailConfirmed { get; set; } = false;
        public DateTime? TokenExpires { get; set; }

        // RESET PASSWORD
        public string? ResetToken { get; set; }
        public DateTime? ResetTokenExpires { get; set; }

        // NAVIGATION PROPERTIES

        public Admin? Admin { get; set; }
        public Technician? Technician { get; set; } // 1:1 with Technician

        // BOOKINGS (Customer side)
        public ICollection<Booking> CustomerBookings { get; set; } = new List<Booking>();
    }

    public class Technician
    {
        [Key]
        public int TechnicianID { get; set; }

        public int UserID { get; set; } // Foreign Key to User

        [StringLength(500)]
        public string? ProfileImage { get; set; }

        public int ExperienceYears { get; set; } = 0;

        [Column(TypeName = "decimal(3,2)")]
        public decimal RatingAverage { get; set; } = 0.0m; // 0.00 to 5.00

        public int TotalRatings { get; set; } = 0;

        [StringLength(20)]
        public string AvailabilityStatus { get; set; } = "Available"; // Available, Busy, Offline

        [Column(TypeName = "decimal(18,2)")]
        public decimal WalletBalance { get; set; } = 0.00m;

        public int TotalJobsCompleted { get; set; } = 0;

        [StringLength(20)]
        public string VerificationStatus { get; set; } = "Pending"; // Pending, Verified, Rejected

        public DateTime? VerifiedAt { get; set; }

        // NAVIGATION
        public User User { get; set; } = null!;

        // Assigned Bookings (Technician side)
        public ICollection<Booking> AssignedBookings { get; set; } = new List<Booking>();
    }
}