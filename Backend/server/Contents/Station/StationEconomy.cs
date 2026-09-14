using System;

namespace SeoulKenshi.Contents.Station
{
    /// <summary>
    /// 시간당 생산 = 기본산출 30 × 레벨. 저장고 상한 = 500 × 레벨.
    /// 읽기 시점 lazy tick으로 경과 시간을 정산하고 상한에 클램프한다.
    /// </summary>
    public static class StationEconomy
    {
        public const long BaseOutputPerHour = 30;
        public const long StoragePerLevel = 500;

        public static long ProductionPerHour(int facilityLevel)
        {
            if (facilityLevel <= 0)
                return 0;
            return BaseOutputPerHour * facilityLevel;
        }

        public static long StorageCap(int facilityLevel)
        {
            if (facilityLevel <= 0)
                return 0;
            return StoragePerLevel * facilityLevel;
        }

        public static long ProductionPerHour(StationState state, FacilityKind kind)
        {
            return ProductionPerHour(state.GetLevel(kind));
        }

        public static long StorageCap(StationState state, FacilityKind kind)
        {
            return StorageCap(state.GetLevel(kind));
        }

        public static void ApplyTick(StationState state, DateTime now)
        {
            if (state == null)
                throw new ArgumentNullException(nameof(state));

            var elapsed = now - state.LastUpdated;
            if (elapsed.Ticks > 0)
            {
                var hours = elapsed.TotalHours;
                Accrue(state, FacilityKind.Supply, hours);
                Accrue(state, FacilityKind.Workshop, hours);
                Accrue(state, FacilityKind.Substation, hours);
                Accrue(state, FacilityKind.Exchange, hours);
                state.LastUpdated = now;
            }

            ClampAll(state);
        }

        private static void Accrue(StationState state, FacilityKind kind, double hours)
        {
            var cap = StorageCap(state, kind);
            var current = state.GetResource(kind);
            if (current >= cap)
            {
                state.SetResource(kind, cap);
                return;
            }

            var produced = (long)Math.Floor(ProductionPerHour(state, kind) * hours);
            if (produced < 0)
                produced = 0;

            var room = cap - current;
            var add = produced > room ? room : produced;
            state.SetResource(kind, current + add);
        }

        private static void ClampAll(StationState state)
        {
            ClampOne(state, FacilityKind.Supply);
            ClampOne(state, FacilityKind.Workshop);
            ClampOne(state, FacilityKind.Substation);
            ClampOne(state, FacilityKind.Exchange);
        }

        private static void ClampOne(StationState state, FacilityKind kind)
        {
            var cap = StorageCap(state, kind);
            var current = state.GetResource(kind);
            if (current > cap)
                state.SetResource(kind, cap);
            else if (current < 0)
                state.SetResource(kind, 0);
        }
    }
}
