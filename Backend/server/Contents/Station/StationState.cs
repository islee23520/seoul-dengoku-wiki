using System;

namespace SeoulKenshi.Contents.Station
{
    /// <summary>
    /// 역 자원 4종과 시설 레벨, 마지막 정산 시각.
    /// </summary>
    public sealed class StationState
    {
        public long AccountIdx { get; set; }
        public long Food { get; set; }
        public long Parts { get; set; }
        public long Energy { get; set; }
        public long Vouchers { get; set; }
        public DateTime LastUpdated { get; set; }
        public int SupplyLevel { get; set; }
        public int WorkshopLevel { get; set; }
        public int SubstationLevel { get; set; }
        public int ExchangeLevel { get; set; }

        public static StationState CreateDefault(long accountIdx, DateTime now)
        {
            return new StationState
            {
                AccountIdx = accountIdx,
                LastUpdated = now,
                SupplyLevel = 1,
                WorkshopLevel = 1,
                SubstationLevel = 1,
                ExchangeLevel = 1
            };
        }

        public int GetLevel(FacilityKind kind)
        {
            switch (kind)
            {
                case FacilityKind.Supply: return SupplyLevel;
                case FacilityKind.Workshop: return WorkshopLevel;
                case FacilityKind.Substation: return SubstationLevel;
                case FacilityKind.Exchange: return ExchangeLevel;
                default: throw new ArgumentOutOfRangeException(nameof(kind));
            }
        }

        public void SetLevel(FacilityKind kind, int level)
        {
            if (level < 0)
                throw new ArgumentOutOfRangeException(nameof(level));

            switch (kind)
            {
                case FacilityKind.Supply: SupplyLevel = level; break;
                case FacilityKind.Workshop: WorkshopLevel = level; break;
                case FacilityKind.Substation: SubstationLevel = level; break;
                case FacilityKind.Exchange: ExchangeLevel = level; break;
                default: throw new ArgumentOutOfRangeException(nameof(kind));
            }
        }

        public long GetResource(FacilityKind kind)
        {
            switch (kind)
            {
                case FacilityKind.Supply: return Food;
                case FacilityKind.Workshop: return Parts;
                case FacilityKind.Substation: return Energy;
                case FacilityKind.Exchange: return Vouchers;
                default: throw new ArgumentOutOfRangeException(nameof(kind));
            }
        }

        public void SetResource(FacilityKind kind, long amount)
        {
            switch (kind)
            {
                case FacilityKind.Supply: Food = amount; break;
                case FacilityKind.Workshop: Parts = amount; break;
                case FacilityKind.Substation: Energy = amount; break;
                case FacilityKind.Exchange: Vouchers = amount; break;
                default: throw new ArgumentOutOfRangeException(nameof(kind));
            }
        }
    }
}
