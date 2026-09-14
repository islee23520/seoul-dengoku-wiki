using System;
using SeoulKenshi.Common;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Storage;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Reward.Operators
{
    public class GiveEnergyOperator : IGiveRewardOperator
    {
        public RewardType Type { get { return RewardType.Energy; } }

        public IRewardResult Process(IY2KDbConnector db, UserData userData, GiveRewardParam param)
        {
            var rewardParam = param as GiveEnergyParam;

            var account = userData.GetData<Account>();
           
            if (account.EnergyBag.Data.TryGetValue(rewardParam.EnergyType, out var energy) == false)
                throw new ErrorCodeException(GoodsErrorCode.ERROR_NOT_FOUND_ENERGY, $"not found energy.. type: {rewardParam.EnergyType}");

            energy.CheckChargeTime(DateTime.Now);
            energy.IncreaseExtraAmount(rewardParam.Cause, rewardParam.Amount);

            db.Attach(energy.GetEntity(DbCommandType.Update));

            return new EnergyRewardResult(param.Cause, energy, rewardParam.Amount);
        }
    }
}