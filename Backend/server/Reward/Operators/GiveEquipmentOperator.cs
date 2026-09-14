using System.Collections.Generic;
using System.Linq;
using SeoulKenshi.Common;
using SeoulKenshi.Storage;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Reward.Operators
{
    public class GiveEquipmentOperator : IGiveRewardOperator
    {
        public RewardType Type { get { return RewardType.Equipment; } }

        public IRewardResult Process(IY2KDbConnector db, UserData userData, GiveRewardParam param)
        {
            //var rewardParam = param as GiveEquipmentParam;

            //var account = userData.GetAccount();
            //var inventory = userData.GetEquipmentInventory();

            //if (inventory.IsEnoughSlot(rewardParam.RunCount) == false)
            //    return null;

            //var newEquipment = inventory.CreateEquipment(param.Cause, account.AccountIdx, rewardParam.ID, rewardParam.DefaultLevel);

            //db.Attach(newEquipment.GetEntity(DbCommandType.Insert));

            //return new EquipmentRewardResult(param.Cause, newEquipment);

            return null;
        }
    }
}
