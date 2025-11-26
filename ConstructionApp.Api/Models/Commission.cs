using System;


namespace ConstructionApp.Api.Models;

public class Commission
{
     public int CommissionID { get; set; }
    public int BookingID { get; set; }
    public int TechnicianID { get; set; }
    public decimal CommissionPercentage { get; set; }
    public decimal CommissionAmount { get; set; }
    public DateTime? DeductionDateTime { get; set; }

    public Booking Booking { get; set; } = null!;
    public Technician Technician { get; set; } = null!;
}
