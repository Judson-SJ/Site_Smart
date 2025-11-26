// DTOs/CategoryDto.cs
using System.ComponentModel.DataAnnotations;

namespace ConstructionApp.Api.DTOs
{
    public class CategoryDto
    {
        [Key]
        public int CategoryID { get; set; }

        [Required, StringLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public string CreatedBy { get; set; } = "system";

        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedDate { get; set; }
        public int TotalServices { get; set; }
    }

    public class CreateCategoryDto
    {
        [Required]
        [StringLength(50)]
        public string CategoryName { get; set; } = null!;

        [StringLength(200)]
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
         public string? CreatedBy { get; set; }
    }

    public class UpdateCategoryDto
    {
        [StringLength(50)]
        public string? CategoryName { get; set; }

        [StringLength(200)]
        public string? Description { get; set; }

        public bool? IsActive { get; set; }
    }
}