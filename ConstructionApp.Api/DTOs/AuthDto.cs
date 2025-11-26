namespace ConstructionApp.Api.DTOs
{
    // REGISTER
    public class RegisterDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "Customer"; // Customer, Technician, Admin
    }

    // LOGIN
    public class LoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // RESEND VERIFICATION
    public class ResendDto
    {
        public string Email { get; set; } = string.Empty;
    }

    // FORGOT PASSWORD
    public class ForgotDto
    {
        public string Email { get; set; } = string.Empty;
    }

    // RESET PASSWORD
    public class ResetDto
    {
        public string Token { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    // AUTH RESPONSE (FOR ALL ENDPOINTS)
    public class AuthResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? Token { get; set; }
        public string? Role { get; set; }
        public string? RedirectUrl { get; set; }
    }
}