// Models/Address.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConstructionApp.Api.Models
{
    [Table("Addresses")]
    public class Address
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AddressID { get; set; }

        [Required]
        public int UserID { get; set; }               // Owner of the address

        [Required]
        [StringLength(200)]
        public string Street { get; set; } = null!;

        [StringLength(100)]
        public string City { get; set; } = null!;

        [StringLength(100)]
        public string State { get; set; } = null!;

        [StringLength(20)]
        public string PostalCode { get; set; } = null!;

        [StringLength(100)]
        public string Country { get; set; } = "Pakistan"; // or whatever default

        public bool IsDefault { get; set; } = false;

        // Navigation
        public User User { get; set; } = null!;

        // Optional: many bookings can use the same address
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}