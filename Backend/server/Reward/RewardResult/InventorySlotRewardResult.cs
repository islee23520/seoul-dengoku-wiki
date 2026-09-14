using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;

namespace SeoulKenshi.Contents.Reward
{
    public class InventorySlotRewardResult : RewardResult
    {
        #region Properties
        public InventoryType InventoryType { get; set; }
        /// <summary>
        /// 기본적으로 습득한 값
        /// </summary>
        public int Value { get; set; }

        /// <summary>
        /// 현재 수량
        /// </summary>
        public long TotalValue { get; set; }
        #endregion

        #region 생성자         
        public InventorySlotRewardResult() : base(RewardType.InventorySlot) { }
        public InventorySlotRewardResult(GameLogCause cause, InventoryType type, int incValue, int nowValue)
            : base(RewardType.InventorySlot, cause)
        {
            InventoryType = type;
            Value = incValue;
            TotalValue = nowValue;
        }
        #endregion

    }
}
