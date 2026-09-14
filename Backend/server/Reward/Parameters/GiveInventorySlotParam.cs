using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Contents.Reward
{
    public class GiveInventorySlotParam : GiveRewardParam
    {
        public InventoryType InventoryType { get; set; }
        public short Value { get; set; }

        #region 생성자
        public GiveInventorySlotParam(GameLogCause cause, InventoryType type, int count)
            : base(RewardType.InventorySlot, cause)
        {
            InventoryType = type;
            Value = (short)count;
        }
        #endregion

        public override int GetCompareKey()
        {
            return (int)InventoryType;
        }
        public override void MergeReward(RewardSpec reward)
        {
            Value += (short)reward.Param1;
        }
    }
}
