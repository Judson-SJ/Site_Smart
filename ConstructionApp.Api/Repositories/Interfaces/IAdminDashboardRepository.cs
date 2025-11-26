using System;
using ConstructionApp.Api.Models;

namespace ConstructionApp.Api.Repositories.Interfaces;

public interface IAdminDashboardRepository
    {
        Task<DashboardStats> GetDashboardStatsAsync();                  // ← no body, just semicolon
        Task<List<RecentActivity>> GetRecentActivityAsync();           // ← no body
        Task<List<int>> GetBookingCountsLast30DaysAsync();             // ← no body
    }

