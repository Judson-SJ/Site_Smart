using System;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace ConstructionApp.Api.DTOs;

public class ApiResponseDto
{
    public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public object? Data { get; set; }
        public IEnumerable<string>? Errors { get; set; }
    }

    // Optional: Helper extension for ModelState
    public static class ModelStateExtensions
    {
        public static ApiResponseDto ToApiResponse(this ModelStateDictionary modelState)
        {
            return new ApiResponseDto
            {
                Success = false,
                Message = "Validation failed",
                Errors = modelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
            };
        }
}
