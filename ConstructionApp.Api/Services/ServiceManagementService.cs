// Services/ServiceManagementService.cs – .NET 9 + ZERO WARNINGS GUARANTEED!
using ConstructionApp.Api.Repositories.Interfaces;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.DTOs;
using AutoMapper;

namespace ConstructionApp.Api.Services;

public sealed class ServiceManagementService(IServiceRepository serviceRepo, IMapper mapper)
{
    private readonly IServiceRepository _serviceRepo = serviceRepo 
        ?? throw new ArgumentNullException(nameof(serviceRepo));
    private readonly IMapper _mapper = mapper 
        ?? throw new ArgumentNullException(nameof(mapper));

    public async Task<IEnumerable<ServiceDto>> GetAllServicesAsync()
    {
        var services = await _serviceRepo.GetAllWithCategoryAsync();
        return _mapper.Map<List<ServiceDto>>(services);
    }

    public async Task<ServiceDto?> GetServiceByIdAsync(int id)
    {
        var service = await _serviceRepo.GetByIdAsync(id);
        return service is not null ? _mapper.Map<ServiceDto>(service) : null;
    }

    public async Task<ServiceDto> CreateServiceAsync(CreateServiceDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        // இந்த line தான் warning fix பண்ணும்!
        var service = _mapper.Map<Service>(dto)!; // "!" = "I know it's not null"

        var created = await _serviceRepo.AddAsync(service);

        var createdWithCategory = await _serviceRepo.GetByIdAsync(created.ServiceID)
            ?? throw new InvalidOperationException("Service not found after insert");

        return _mapper.Map<ServiceDto>(createdWithCategory)!;
    }

    public async Task<ServiceDto?> UpdateServiceAsync(int id, UpdateServiceDto dto)
    {
        var existing = await _serviceRepo.GetByIdAsync(id);
        if (existing is null) return null;

        _mapper.Map(dto, existing);
        await _serviceRepo.UpdateAsync(existing);

        var updated = await _serviceRepo.GetByIdAsync(id);
        return updated is not null ? _mapper.Map<ServiceDto>(updated)! : null;
    }

    public async Task<bool> DeleteServiceAsync(int id)
    {
        if (!await _serviceRepo.ExistsAsync(id)) return false;
        if (await _serviceRepo.HasBookingsAsync(id))
            throw new InvalidOperationException("Cannot delete service with existing bookings.");

        await _serviceRepo.DeleteAsync(id);
        return true;
    }

    public async Task<IEnumerable<ServiceDto>> GetServicesByCategoryAsync(int categoryId)
    {
        var services = await _serviceRepo.GetByCategoryIdAsync(categoryId);
        return _mapper.Map<List<ServiceDto>>(services);
    }
}