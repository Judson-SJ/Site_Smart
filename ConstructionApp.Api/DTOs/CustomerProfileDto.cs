// DTOs/CustomerProfileDto.cs → FINAL CLEAN VERSION
using System.ComponentModel.DataAnnotations;

namespace ConstructionApp.Api.DTOs
{
    // Response DTOs
    public class CustomerProfileResponseDto
    {
        public int UserID { get; set; }
        public required string FullName { get; set; }
        public required string Email { get; set; }
        public string? Phone { get; set; }
        public string? ProfileImage { get; set; }  // ← இது missing ஆ இருந்தது!
    }

    // Request DTOs
    public class UpdateProfileDto
    {
        [Required(ErrorMessage = "Full Name is required")]
        [StringLength(100, MinimumLength = 2)]
        public string FullName { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid phone number")]
        [StringLength(20)]
        public string? Phone { get; set; }
    }

    public class UpdateProfileImageDto
    {
        [Required]
        [Url(ErrorMessage = "Invalid image URL")]
        public string ProfileImage { get; set; } = string.Empty;
    }

}