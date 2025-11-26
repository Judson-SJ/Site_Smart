using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ConstructionApp.Api.DTOs;
using ConstructionApp.Api.Repositories.Interfaces;
using ConstructionApp.Api.Models;

namespace ConstructionApp.Api.Services
{
    public class AdminDashboardService
    {
        private readonly IAdminDashboardRepository _repository;

        public AdminDashboardService(IAdminDashboardRepository repository)
        {
            _repository = repository;
        }

        public async Task<DashboardStatsDto> GetDashboardStatsAsync()
        {
            var stats = await _repository.GetDashboardStatsAsync();
            return new DashboardStatsDto
            {
                TotalRevenue = stats.TotalRevenue,
                RevenueChange = stats.RevenueChange,
                ActiveTechnicians = stats.ActiveTechnicians,
                TechnicianChange = stats.TechnicianChange,
                JobsInProgress = stats.JobsInProgress,
                JobsChange = stats.JobsChange,
                NewRegistrations = stats.NewRegistrations
            };
        }

        public async Task<List<RecentActivityDto>> GetRecentActivityAsync()
        {
            var activities = await _repository.GetRecentActivityAsync();
            return activities.Select(a => new RecentActivityDto
            {
                Message = a.Message,
                TimeAgo = a.TimeAgo,
                Color = a.Color
            }).ToList();
        }

        public async Task<object> GetBookingTrendsAsync()
        {
            var data = await _repository.GetBookingCountsLast30DaysAsync();
            var labels = Enumerable.Range(1, 30).Select(d => $"Day {d}").ToArray();

            return new
            {
                labels,
                datasets = new[]
                {
                    new
                    {
                        label = "Bookings",
                        data,
                        borderColor = "#14b8a6",
                        backgroundColor = "rgba(20, 184, 166, 0.1)",
                        tension = 0.4
                    }
                },
                growth = "+15.3%"
            };
        }
    }
}
