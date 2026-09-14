using System.Collections.Generic;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Contents.Reward
{
    public static class GiveRewardParamMaker
    {
        public static List<GiveRewardParam> MakeRewardParams(GameLogCause cause, IEnumerable<RewardSpec> RewardSpecs, bool isMerge = true)
        {
            var result = new List<GiveRewardParam>();

            foreach (var reward in RewardSpecs)
            {
                if (isMerge == true && result.TryMerge(reward) == true)
                    continue;

                result.Add(MakeRewardParam(cause, reward.RewardType, reward.Param1, reward.Param2, reward.Param3, reward.Param4));
            }

            return result;
        }
        public static GiveRewardParam MakeRewardParam(GameLogCause cause, RewardSpec master)
        {
            return MakeRewardParam(cause, master.RewardType, master.Param1, master.Param2, master.Param3, master.Param4);
        }
        public static GiveRewardParam MakeRewardParam(GameLogCause cause, RewardType rewardType, int param1, int param2, int param3, int param4)
        {
            GiveRewardParam result;
            switch (rewardType)
            {
                case RewardType.Exp:
                    result = new GiveExpParam(cause, (ExpType)param1, param2);
                    break;
                case RewardType.Goods:
                    var value = param2 == param3 || param3 == 0 ? param2 : GlobalRandom.Between(param2, param3);
                    result = new GiveGoodsParam(cause, (GoodsType)param1, value, param4);
                    break;
                case RewardType.Hero:
                    result= new GiveHeroParam(cause, param1, param2);
                    break;
                case RewardType.Equipment:
                    result = new GiveEquipmentParam(cause, param1, param2);
                    break;
                case RewardType.Item:
                    var amount = param2 == param3 || param3 == 0 ? param2 : GlobalRandom.Between(param2, param3);
                    result = new GiveItemParam(cause, param1, amount);
                    break;
                case RewardType.Energy:
                    var ticketAmount = param2 == param3 || param3 == 0 ? param2 : GlobalRandom.Between(param2, param3);
                    result = new GiveEnergyParam(cause, (EnergyType)param1, ticketAmount);
                    break;
                case RewardType.InventorySlot:
                    result = new GiveInventorySlotParam(cause, (InventoryType)param1, param2);
                    break;
                default:
                    throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_TYPE, $"invalid reward type... reward type: {rewardType}");
            }

            return result;
        }
    }
}
