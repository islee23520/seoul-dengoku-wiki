using System.Collections.Generic;
using System.Linq;
using SeoulKenshi.Common;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Contents.Reward
{
    public static class Extention
    {
        public static bool TryMerge(this List<GiveRewardParam> container, RewardSpec reward)
        {
            if (container.Count == 0)
                return false;

            if (reward == null)
                return false;

            var origin = container.Where(r => r.Type == reward.RewardType && r.GetCompareKey() == reward.Param1).FirstOrDefault();
            if (origin == null)
                return false;

            origin.MergeReward(reward);

            return true;
        }

        /// <summary>
        /// GiveRewardParam 목록에 인벤토리 슬롯 체크가 필요한 요소가 있는지 확인하고 각 인벤토리 별로 필요 갯수를 반환 합니다.
        /// </summary>
        /// <param name="container"></param>
        /// <returns>(인벤토리 타입, 확인이 필요한 여유 슬롯 갯수)</returns>
        public static Dictionary<InventoryType, int> NeedComfirmationInventorySlotCount(this List<GiveRewardParam> container)
        {
           var result = new Dictionary<InventoryType, int>();

            var targets = container.Where(r => r.Type == RewardType.Hero || r.Type == RewardType.Equipment || r.Type == RewardType.Item).ToList();
            foreach (var group in targets.GroupBy(r => r.Type))
            {
                InventoryType type;
                switch (group.Key)
                {
                    case RewardType.Hero:
                        type = InventoryType.Hero;
                        break;
                    case RewardType.Equipment:
                        type = InventoryType.Equipment;
                        break;
                    case RewardType.Item:
                        type = InventoryType.Item;
                        break;
                    default:
                        continue;
                }
                result.Add(type, group.ToList().Count);
            }

            return result;
        }

    }
}
