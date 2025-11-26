// Models/Service.cs – இதை முழுக்க replace பண்ணுங்க!
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConstructionApp.Api.Models
{
    public class Service
    {
        [Key]
        public int ServiceID { get; set; }

        [Required, StringLength(100)]
        public string ServiceName { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal FixedRate { get; set; }

        [Column(TypeName = "decimal(3,1)")]
        public decimal EstimatedDuration { get; set; } = 1.0m;

        [Required]
        public int CategoryID { get; set; }

        [ForeignKey("CategoryID")]
        public Category Category { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public string? ImagePublicId { get; set; }

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}