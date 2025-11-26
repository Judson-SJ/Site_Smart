

namespace ConstructionApp.Api.Models
{
public enum VerificationStatus
{
    Pending,
    Verified,
    Suspended,
    Rejected
}

public enum BookingStatus
{
    Pending,
    Accepted,
    InProgress,
    Completed,
    Cancelled,
    Requested
}
}