using System.Linq;
using SeoulKenshi.Common;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Storage;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Reward.Operators
{
    public class GiveExpOperator : IGiveRewardOperator
    {
        public RewardType Type { get { return RewardType.Exp; } }

        public IRewardResult Process(IY2KDbConnector db, UserData userData, GiveRewardParam param)
        {
            var rewardParam = param as GiveExpParam;

            var account = userData.GetData<Account>();

            var isLevelup = false;
            short nowLevel = 0;
            int nowExp = 0;
            int value = 0;

            if (rewardParam.ExpType == ExpType.Account)
            {
                isLevelup = account.AddExp(rewardParam.GainExp);
                nowLevel = account.Level;
                nowExp = account.Exp;
                value = rewardParam.GainExp;

                db.Attach(account.GetEntity(DbCommandType.Update));
            }

            return new ExpRewardResult(param.Cause, rewardParam.ExpType, isLevelup, nowLevel, nowExp, value);
        }
    }
}