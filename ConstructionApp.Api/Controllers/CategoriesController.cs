using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.DTOs;
using ConstructionApp.Api.Data;

namespace ConstructionApp.Api.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _db;

        public CategoriesController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _db.Categories
                .OrderBy(c => c.CategoryName)
                .ToListAsync();
            return Ok(list);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto?.CategoryName))
                return BadRequest(new { message = "CategoryName is required." });

            var name = dto.CategoryName.Trim();

            // unique check
            var exists = await _db.Categories.AnyAsync(c => c.CategoryName.ToLower() == name.ToLower());
            if (exists)
                return Conflict(new { message = "Category name already exists." });

            var category = new Category
            {
                CategoryName = name,
                Description = dto.Description,
                IsActive = dto.IsActive ,
                CreatedBy = dto.CreatedBy ?? "system",
                CreatedDate = DateTime.UtcNow
            };

            _db.Categories.Add(category);
            await _db.SaveChangesAsync();

            // return created entity (or DTO)
            return CreatedAtAction(nameof(GetById), new { id = category.CategoryID }, category);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var cat = await _db.Categories.FindAsync(id);
            if (cat == null) return NotFound();
            return Ok(cat);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryDto dto)
        {
            var cat = await _db.Categories.FindAsync(id);
            if (cat == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.CategoryName))
            {
                var name = dto.CategoryName.Trim();
                var exists = await _db.Categories.AnyAsync(c => c.CategoryID != id && c.CategoryName.ToLower() == name.ToLower());
                if (exists) return Conflict(new { message = "Category name already exists." });
                cat.CategoryName = name;
            }

            if (dto.Description != null) cat.Description = dto.Description;
            if (dto.IsActive.HasValue) cat.IsActive = dto.IsActive.Value;

            cat.UpdatedDate = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var cat = await _db.Categories.FindAsync(id);
            if (cat == null) return NotFound();

            _db.Categories.Remove(cat);
            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}