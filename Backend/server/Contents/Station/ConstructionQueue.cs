using System;

namespace SeoulKenshi.Contents.Station
{
    public readonly struct ResourceCost
    {
        public ResourceCost(long food, long parts, long energy, long vouchers = 0)
        {
            Food = food;
            Parts = parts;
            Energy = energy;
            Vouchers = vouchers;
        }

        public long Food { get; }
        public long Parts { get; }
        public long Energy { get; }
        public long Vouchers { get; }
    }

    public sealed class ConstructionJob
    {
        public FacilityKind FacilityKind { get; set; }
        public int TargetLevel { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime CompletesAt { get; set; }
    }

    /// <summary>
    /// 1역 동시 1건 건설 대기열. 비용 = base × 1.6^(레벨-1), 시간(초) = 60 × 1.5^(레벨-1).
    /// 완료는 읽기 시점 IsCompleted(now)로 판정하고 Complete(now)로 확정한다.
    /// </summary>
    public sealed class ConstructionQueue
    {
        public const long BaseFoodCost = 100;
        public const long BasePartsCost = 80;
        public const long BaseEnergyCost = 40;
        public const double CostGrowth = 1.6;
        public const int BaseDurationSeconds = 60;
        public const double DurationGrowth = 1.5;

        public ConstructionJob Current { get; private set; }

        public bool HasJob
        {
            get { return Current != null; }
        }

        public static ResourceCost CostFor(int targetLevel)
        {
            EnsureLevel(targetLevel);
            var factor = Math.Pow(CostGrowth, targetLevel - 1);
            return new ResourceCost(
                RoundCost(BaseFoodCost * factor),
                RoundCost(BasePartsCost * factor),
                RoundCost(BaseEnergyCost * factor),
                0);
        }

        public static int DurationSecondsFor(int targetLevel)
        {
            EnsureLevel(targetLevel);
            return (int)Math.Round(
                BaseDurationSeconds * Math.Pow(DurationGrowth, targetLevel - 1),
                MidpointRounding.AwayFromZero);
        }

        public bool TryStart(FacilityKind kind, int targetLevel, DateTime now)
        {
            if (Current != null)
                return false;
            if (!Enum.IsDefined(typeof(FacilityKind), kind))
                throw new ArgumentOutOfRangeException(nameof(kind));

            var duration = DurationSecondsFor(targetLevel);
            Current = new ConstructionJob
            {
                FacilityKind = kind,
                TargetLevel = targetLevel,
                StartedAt = now,
                CompletesAt = now.AddSeconds(duration)
            };
            return true;
        }

        public bool IsCompleted(DateTime now)
        {
            return Current != null && now >= Current.CompletesAt;
        }

        public bool Complete(DateTime now)
        {
            if (!IsCompleted(now))
                return false;
            Current = null;
            return true;
        }

        public bool Complete(StationState state, DateTime now)
        {
            if (state == null)
                throw new ArgumentNullException(nameof(state));
            if (!IsCompleted(now))
                return false;

            state.SetLevel(Current.FacilityKind, Current.TargetLevel);
            Current = null;
            return true;
        }

        private static void EnsureLevel(int targetLevel)
        {
            if (targetLevel < 1)
                throw new ArgumentOutOfRangeException(nameof(targetLevel));
        }

        private static long RoundCost(double value)
        {
            return (long)Math.Round(value, MidpointRounding.AwayFromZero);
        }
    }
}
