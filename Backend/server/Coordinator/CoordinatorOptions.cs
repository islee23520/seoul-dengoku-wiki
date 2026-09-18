namespace SeoulKenshi.Coordinator;

public sealed class CoordinatorOptions
{
    public const string SectionName = "Coordinator";

    public int Port { get; set; } = 1219;

    public int SessionMaxGuests { get; set; } = 4;

    public int SessionHostTimeoutSeconds { get; set; } = 30;

    public int SessionMemberTimeoutSeconds { get; set; } = 30;
}
