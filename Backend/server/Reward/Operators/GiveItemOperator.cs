using SeoulKenshi.Common;
using SeoulKenshi.Storage;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Reward.Operators
{
    public class GiveItemOperator : IGiveRewardOperator
    {
        public RewardType Type { get { return RewardType.Item; } }

        public IRewardResult Process(IY2KDbConnector db, UserData userData, GiveRewardParam param)
        {
            //var rewardParam = param as GiveItemParam;

            //var account = userData.GetAccount();
            //var inventory = userData.GetItemInventory();

            //var before = 0;
            //// 여기서는 아이템 보유 여부에 따라 생성을 해야하기 때문에 null 체크 후 에러를 내는 GetItem()을 사용하지 않는다.
            //if(inventory.Data.TryGetValue(rewardParam.ItemID, out var item) == false)
            //{
            //    var prototype = ItemConfig.Instance.FindItemPrototype(rewardParam.ItemID);
            //    item = prototype.Create(account.AccountIdx, rewardParam.Amount);
            //    inventory.Data.Add(item.ItemID, item);

            //    db.Attach(item.GetEntity(DbCommandType.Insert));
            //} else
            //{
            //    before = item.Amount;
            //    item.Increase(rewardParam.Amount);

            //    if (item.ItemIdx == 0)
            //        db.Attach(item.GetEntity(DbCommandType.Insert));
            //    else
            //        db.Attach(item.GetEntity(DbCommandType.Update));
            //}

            //return new ItemRewardResult(param.Cause, item, rewardParam.Amount);
            return null;
        }
    }
}
