using System;
using SeoulKenshi.Common;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Contents.Inventory;
using SeoulKenshi.Spec;
using SeoulKenshi.Storage;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Reward.Operators
{
    public class GiveHeroOperator : IGiveRewardOperator
    {
        public RewardType Type { get { return RewardType.Hero; } }

        public IRewardResult Process(IY2KDbConnector db, UserData userData, GiveRewardParam param)
        {
            var rewardParam = param as GiveHeroParam;

            var account = userData.GetData<Account>();
            var inventory = userData.GetData<HeroInventory>();

            if (inventory.IsEnoughSlot(rewardParam.RunCount) == false)
                return null;

            var heroSpec = SpecConfig.HERO_SPEC.FindHeroSpec(rewardParam.ID);

            var newHero = inventory.CreateHero(param.Cause, account.AccountIdx, heroSpec, DateTime.Now);

            db.Attach(newHero.GetEntity(DbCommandType.Insert));

            return new HeroRewardResult(param.Cause, newHero);
        }
    }
}