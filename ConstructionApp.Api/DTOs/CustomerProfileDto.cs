// DTOs/CustomerProfileDto.cs
using System.ComponentModel.DataAnnotations;

namespace ConstructionApp.Api.DTOs
{
    public class CustomerProfileResponseDto
    {
        public int UserID { get; set; }
        public required string FullName { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? Phone { get; set; }
    }

    public class UpdateProfileDto
    {
        [Required, StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Phone]
        [StringLength(20)]
        public string Phone { get; set; } = string.Empty;
    }

    // public class ApiResponse
    // {
    //     public bool Success { get; set; }
    //     public string Message { get; set; } = string.Empty;
    //     public object? Data { get; set; }
    //     public string[]? Errors { get; internal set; }
    // }
}