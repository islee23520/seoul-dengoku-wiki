using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Contents.Reward
{
    public class GiveEquipmentParam : GiveRewardParam, IHaveProcessRunCount
    {
        public int ID { get; set; }
        public short DefaultLevel { get; set; }
        
        public short RunCount { get; set; }

        #region 생성자
        public GiveEquipmentParam(GameLogCause cause, int equipmentId, int defaultLevel)
            : base(RewardType.Equipment, cause)
        {
            ID = equipmentId;
            DefaultLevel = (short)defaultLevel;
            RunCount = 1;
        }
        #endregion

        public override int GetCompareKey()
        {
            return ID;
        }
        public override void MergeReward(RewardSpec reward)
        {
            RunCount++;            
        }
    }
}
