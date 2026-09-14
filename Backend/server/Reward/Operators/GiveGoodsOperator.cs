using SeoulKenshi.Common;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Storage;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Reward.Operators
{
    public class GiveGoodsOperator : IGiveRewardOperator
    {
        public RewardType Type { get { return RewardType.Goods; } }

        public IRewardResult Process(IY2KDbConnector db, UserData userData, GiveRewardParam param)
        {
            var rewardParam = param as GiveGoodsParam;

            var goodsBag = userData.GetData<GoodsBag>();
            
            (var entity, var giveValue, var nowValue) = goodsBag.AddGoods(rewardParam.Cause, rewardParam.GoodsType, rewardParam.Value, rewardParam.Bonus);

            //Goods의 경우 addGoods 함수 안에서 DbCommandType이 결정되서 반환되기 떄문에 그냥 Attach만 한다.
            db.Attach(entity);

            return new GoodsRewardResult(param.Cause, rewardParam.GoodsType, giveValue, rewardParam.Bonus, nowValue);
        }
    }
}
