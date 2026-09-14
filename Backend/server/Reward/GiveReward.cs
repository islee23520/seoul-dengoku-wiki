using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using SeoulKenshi.Common;
using SeoulKenshi.Contents.Class;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Contents.Reward.Operators;
using SeoulKenshi.Spec;
using SeoulKenshi.Storage;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Reward
{
    /// <summary>
    /// 보상 정보를 유저에게 지급하기 위해 사용되는 Help class
    /// </summary>
    public class GiveReward
    {
        Dictionary<RewardType, IGiveRewardOperator> operatores { get; set; } = new Dictionary<RewardType, IGiveRewardOperator>();

        #region Instance
        static GiveReward m_Instance = new GiveReward();
        public static GiveReward Instance
        {
            get { return m_Instance; }
        }
        #endregion

        #region 생성자
        public GiveReward()
        {
            var assembly = Assembly.GetExecutingAssembly();
            foreach (var t in assembly.ExportedTypes)
            {
                var implementedInterfaces = t.GetInterfaces();
                foreach (var implementObject in implementedInterfaces)
                {
                    if (implementObject == typeof(IGiveRewardOperator))
                    {
                        var rewardOperator = Activator.CreateInstance(t) as IGiveRewardOperator;
                        if (rewardOperator != null && operatores.ContainsKey(rewardOperator.Type) == false)
                            operatores.Add(rewardOperator.Type, rewardOperator);
                    }
                }
            }
        }
        #endregion

        public IRewardResult Process(IY2KDbConnector db, UserData userData, GiveRewardParam param)
        {
            if (param == null)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_ARGUMENT, "parameter는 null일 수 없습니다.");

            return operatores[param.Type].Process(db, userData, param);
        }

        public List<IRewardResult> Process(IY2KDbConnector db, UserData userData, IEnumerable<GiveRewardParam> giveRewardParams)
        {
            var result = new List<IRewardResult>();

            if (giveRewardParams.Count() == 0)
                return result;

            foreach (var param in giveRewardParams)
            {
                if(param is IHaveProcessRunCount processCount)
                {
                    for (var i = 0; i < processCount.RunCount; ++i)
                    {
                        var rewardResult = operatores[param.Type].Process(db, userData, param);
                        if (rewardResult != null)
                            result.Add(rewardResult);
                    }
                }
                else
                {
                    var rewardResult = operatores[param.Type].Process(db, userData, param);
                    if (rewardResult != null)
                        result.Add(rewardResult);
                }
            }

            // todo: 계정 레벨업 보상 지급을 일단 여기서 하도록 하고 추후에 더 좋은 방안이 생각나면 수정한다.
            var account = userData.GetData<Account>();
            if (account.LevelupRewards.Count > 0)
                result.AddRange(GainAccountLevelupRewards(db, userData, account.LevelupRewards));

            return result;
        }

        List<IRewardResult> GainAccountLevelupRewards(IY2KDbConnector db, UserData userData, List<int> rewardIds)
        {
            var result = new List<IRewardResult>();

            var rewardParams = new List<GiveRewardParam>();
            var cause = new GameLogCause(CauseType.AccountLevelup);
            foreach(var rewardId in rewardIds)
            {
                var rewards = SpecConfig.REWARD_SPEC.FindRewardSpec(rewardId);
                rewardParams.AddRange(GiveRewardParamMaker.MakeRewardParams(cause, rewards));
            }

            rewardIds.Clear();

            return Process(db, userData, rewardParams);
        }
    }
}
