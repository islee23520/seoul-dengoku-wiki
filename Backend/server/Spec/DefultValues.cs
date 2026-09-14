using SeoulKenshi.Common;

namespace SeoulKenshi.Spec
{
    /// <summary>
    /// 에너지와 관련된 스펙 객체
    /// </summary>
    public class EnergySpec
    {
        public EnergyType Type { get; set; }
        /// <summary>
        /// 계정 생성 시 지급 받게 되는 에너지 기본 값
        /// </summary>
        public short DefaultAmount { get; set; }
        /// <summary>
        /// 충전 시 증가되는 에너지 값
        /// </summary>
        public short ChargeAmount { get; set; }
        /// <summary>
        /// 에너지 최대 충전 수치
        /// </summary>
        public short MaxChargeValue { get; set; }
        /// <summary>
        /// 충전 시간 기본 값(단위는 초)
        /// </summary>
        public int ChargeIntervalPerSec { get; set; }

    }

    public class InventoryDefaultValueSpec
    {
        public InventoryType Type { get; set; }
        public short DefaultSlot { get; set; }
        public short MaxSlot { get; set; }
    }
}
