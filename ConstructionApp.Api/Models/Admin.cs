// File: Models/Admin.cs  (New File!)
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConstructionApp.Api.Models
{
    public class Admin
    {
        [Key]
        public int AdminID { get; set; }

        [ForeignKey("User")]
        public int UserID { get; set; }

        public string? ProfileImage { get; set; }

        [StringLength(50)]
        public string AdminLevel { get; set; } = "SuperAdmin"; // SuperAdmin, Moderator

        public bool CanManageUsers { get; set; } = true;
        public bool CanManageServices { get; set; } = true;
        public bool CanViewReports { get; set; } = true;

        public DateTime LastLoginAt { get; set; }
        public string? LastLoginIP { get; set; }

        // Navigation
        public User User { get; set; } = null!;
    }
}