using Microsoft.AspNetCore.Http;
using System.IO;

namespace ConstructionApp.Api.Helpers
{
    public static class FileUploadHelper
    {
        // ← THIS METHOD NAME MUST BE SaveImageAsync
        public static async Task<string?> SaveImageAsync(IFormFile? file, IWebHostEnvironment env)
        {
            if (file == null || file.Length == 0)
                return null;

            // Correct path: wwwroot is accessed via env.WebRootPath (not WebHostPath)
            var uploadsFolder = Path.Combine(env.WebRootPath, "uploads", "references");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = Guid.NewGuid().ToString() + "_" + Path.GetFileName(file.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            // Return the URL that client can access
            return "/uploads/references/" + uniqueFileName;
        }
    }
}