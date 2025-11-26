// Helpers/UserExtensions.cs
using System.Security.Claims;

namespace ConstructionApp.Api.Helpers
{
    public static class UserExtensions
    {
        /// <summary>
        /// JWT Token-ல இருந்து User ID எடுக்கும் (int)
        /// </summary>
        public static int GetUserId(this ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? user.FindFirst("sub")?.Value
                           ?? user.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                throw new UnauthorizedAccessException("User ID not found in token");

            if (int.TryParse(userIdClaim, out int userId))
                return userId;

            throw new UnauthorizedAccessException("Invalid User ID in token");
        }

        /// <summary>
        /// JWT Token-ல இருந்து User Full Name எடுக்கும்
        /// </summary>
        public static string GetFullName(this ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Name)?.Value
                ?? user.FindFirst("name")?.Value
                ?? user.FindFirst("fullname")?.Value
                ?? "Customer";
        }

        /// <summary>
        /// JWT Token-ல இருந்து Role எடுக்கும்
        /// </summary>
        public static string GetRole(this ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Role)?.Value
                ?? user.FindFirst("role")?.Value
                ?? "Customer";
        }

        /// <summary>
        /// JWT Token-ல இருந்து Email எடுக்கும்
        /// </summary>
        public static string GetEmail(this ClaimsPrincipal user)
        {
            return user.FindFirst(ClaimTypes.Email)?.Value
                ?? user.FindFirst("email")?.Value
                ?? string.Empty;
        }
    }
}