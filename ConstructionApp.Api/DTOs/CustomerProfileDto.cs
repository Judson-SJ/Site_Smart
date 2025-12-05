// DTOs/CustomerProfileDto.cs → FINAL CLEAN VERSION
using System.ComponentModel.DataAnnotations;

namespace ConstructionApp.Api.DTOs
{
    // Response DTOs
    // DTOs/CustomerProfileDto.cs
    public class CustomerProfileDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string ProfileImage { get; set; } = string.Empty;
    }

    public class UpdateCustomerProfileRequest
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? ProfileImage { get; set; }
    }
    public class UpdateProfileImageDto
    {
        public string ProfileImage { get; set; } = string.Empty;
    }

}