using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Contents.Class;

namespace SeoulKenshi.Contents.Reward
{
    public class EnergyRewardResult : RewardResult
    {
        #region Properties
        public EnergyType Type { get; set; }
        public int Value { get; set; }
        public int TotalValue { get; set; }
        public long NextChargeTime { get; set; }
        #endregion

        #region 생성자         
        public EnergyRewardResult() : base(RewardType.Energy) { }
        public EnergyRewardResult(GameLogCause cause, Energy energy, int gainValue) 
            : base(RewardType.Energy, cause)
        {
            Type = energy.EnergyType;
            Value = gainValue;
            TotalValue = energy.GetAmount();
            NextChargeTime = energy.NextChargeTime.Ticks;
        }
        #endregion
    }
}
