using System;
using ConstructionApp.Api.Models;
using ConstructionApp.Api.Repositories.Interfaces;

namespace ConstructionApp.Api.Repositories.Implementations;

    public class AdminDashboardRepository : IAdminDashboardRepository
    {
        // In a real app, inject DbContext here for DB operations
        public async Task<DashboardStats> GetDashboardStatsAsync()
        {
            await Task.Delay(100); // Simulate DB/API call
            return new DashboardStats
            {
                TotalRevenue = 1_200_000m,
                RevenueChange = 2.5m,
                ActiveTechnicians = 150,
                TechnicianChange = 15.0m,
                JobsInProgress = 78,
                JobsChange = -21.0m,
                NewRegistrations = 32
            };
        }

        public async Task<List<RecentActivity>> GetRecentActivityAsync()
        {
            await Task.Delay(100); // Simulate DB/API call
            return new List<RecentActivity>
            {
                new() { Message = "New booking created", TimeAgo = "2 mins ago", Color = "teal" },
                new() { Message = "Technician account approved", TimeAgo = "15 mins ago", Color = "green" },
                new() { Message = "Invoice paid • Invoice #INV-587 • $250.00", TimeAgo = "1 hour ago", Color = "blue" },
                new() { Message = "New service review • 5-star rating", TimeAgo = "3 hours ago", Color = "yellow" },
                new() { Message = "New booking created", TimeAgo = "5 hours ago", Color = "purple" }
            };
        }

        public async Task<List<int>> GetBookingCountsLast30DaysAsync()
        {
            await Task.Delay(100); // Simulate DB/API call
            return new List<int> { 45, 52, 48, 61, 58, 72, 68, 81, 79, 92, 88, 105, 98, 115, 120, 132, 128, 145, 140, 158, 165, 172, 180, 195, 188, 210, 205, 220, 228, 240 };
        }
    }
