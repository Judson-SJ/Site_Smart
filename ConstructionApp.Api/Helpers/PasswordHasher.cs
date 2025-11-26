// File: Helpers/PasswordHasher.cs
using BCrypt.Net;

namespace ConstructionApp.Api.Helpers
{
    public static class PasswordHasher
    {
        // Hash a password
        public static string Hash(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                throw new ArgumentException("Password cannot be null or empty.", nameof(password));

            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        // Verify password
        public static bool Verify(string password, string hash)
        {
            if (string.IsNullOrWhiteSpace(password))
                return false;

            if (string.IsNullOrWhiteSpace(hash))
                return false;

            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
    }
}