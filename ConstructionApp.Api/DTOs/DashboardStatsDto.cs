using System;

namespace ConstructionApp.Api.DTOs;

public class DashboardStatsDto
    {
      public decimal TotalRevenue { get; set; }
        public int ActiveTechnicians { get; set; }
        public int JobsInProgress { get; set; }
        public int NewRegistrations { get; set; }
        public decimal RevenueChange { get; set; }
        public decimal TechnicianChange { get; set; }
        public decimal JobsChange { get; set; }
    }

    public class RecentActivityDto
    {
        public string Message { get; set; } = string.Empty;
        public string TimeAgo { get; set; } = string.Empty;
        public string Color { get; set; } = "teal";
    }

