using System;

namespace ConstructionApp.Api.Models;

public class DashboardStats
{
     public decimal TotalRevenue { get; set; }
        public int ActiveTechnicians { get; set; }
        public int JobsInProgress { get; set; }
        public int NewRegistrations { get; set; }
        public decimal RevenueChange { get; set; }
        public decimal TechnicianChange { get; set; }
        public decimal JobsChange { get; set; }
}
