namespace SeoulKenshi.Coordinator;

public sealed class CoordinatorOptions
{
    public const string SectionName = "Coordinator";

    public int Port { get; set; } = 1219;

    public int SessionMaxGuests { get; set; } = 4;

    public int SessionHostTimeoutSeconds { get; set; } = 30;

    public int SessionMemberTimeoutSeconds { get; set; } = 30;

    /// <summary>생존 스윕 간격(초). 양수여야 한다(PeriodicTimer가 0 이하를 거부한다).</summary>
    public double SweepIntervalSeconds { get; set; } = 10;
}
