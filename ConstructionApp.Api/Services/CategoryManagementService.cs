using System;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.Repositories.Interfaces;
using ConstructionApp.Api.DTOs;
using AutoMapper;

namespace ConstructionApp.Api.Services
{
    public class CategoryManagementService
    {
        private readonly ICategoryRepository _categoryRepo;
        private readonly IMapper _mapper;

        public CategoryManagementService(ICategoryRepository categoryRepo, IMapper mapper)
        {
            _categoryRepo = categoryRepo;
            _mapper = mapper;
        }

        public async Task<IEnumerable<CategoryDto>> GetAllAsync(bool includeInactive = false)
        {
            var categories = await _categoryRepo.GetAllAsync(includeInactive) 
                             ?? Enumerable.Empty<Category>();

            var dtos = _mapper.Map<IEnumerable<CategoryDto>>(categories);

            foreach (var dto in dtos)
            {
                var category = await _categoryRepo.GetByIdAsync(dto.CategoryID);
                dto.TotalServices = category?.Services?.Count ?? 0;
            }

            return dtos;
        }

        public async Task<CategoryDto?> GetByIdAsync(int id)
        {
            var category = await _categoryRepo.GetByIdAsync(id);
            if (category == null)
                return null;

            var dto = _mapper.Map<CategoryDto>(category);
            dto.TotalServices = category.Services?.Count ?? 0;
            return dto;
        }

        public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
        {
            var category = _mapper.Map<Category>(dto) 
                           ?? throw new InvalidOperationException("Mapping failed.");

            var created = await _categoryRepo.AddAsync(category);

            return _mapper.Map<CategoryDto>(created) 
                   ?? throw new InvalidOperationException("DTO mapping failed.");
        }

        public async Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto dto)
        {
            var existing = await _categoryRepo.GetByIdAsync(id);
            if (existing == null)
                return null;

            _mapper.Map(dto, existing);
            await _categoryRepo.UpdateAsync(existing);

            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            if (!await _categoryRepo.ExistsAsync(id))
                return false;

            if (await _categoryRepo.HasServicesAsync(id))
                throw new InvalidOperationException("Cannot delete category that has associated services.");

            await _categoryRepo.DeleteAsync(id);
            return true;
        }
    }
}
