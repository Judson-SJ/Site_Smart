using System;
using System.ComponentModel.DataAnnotations;

namespace ConstructionApp.Api.Models;

public class AuditLog
{
     [Key]
        public int LogID { get; set; }

        public int AdminID { get; set; }
        public string Action { get; set; } = string.Empty; // "User Created", "Service Updated"
        public string Details { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public User Admin { get; set; } = null!;
}
