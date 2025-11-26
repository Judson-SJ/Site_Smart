// Mapping/MappingProfile.cs – 100% CORRECT & FINAL
using AutoMapper;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.DTOs;

namespace ConstructionApp.Api.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Create DTO → Entity
        CreateMap<CreateServiceDto, Service>()
            .ForMember(dest => dest.ServiceName, opt => opt.MapFrom(src => src.ServiceName))
            .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.ImageUrl))
            .ForMember(dest => dest.ImagePublicId, opt => opt.MapFrom(src => src.ImagePublicId));

        // Update DTO → Entity (only non-null values)
        CreateMap<UpdateServiceDto, Service>()
            .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

        // Entity → DTO (Main Fix Here!)
        CreateMap<Service, ServiceDto>()
            .ForMember(dest => dest.ServiceName, opt => opt.MapFrom(src => src.ServiceName))
            .ForMember(dest => dest.CategoryName, 
                opt => opt.MapFrom(src => src.Category != null ? src.Category.CategoryName : "Uncategorized"))
            .ForMember(dest => dest.CategoryID, opt => opt.MapFrom(src => src.CategoryID));
    }
}