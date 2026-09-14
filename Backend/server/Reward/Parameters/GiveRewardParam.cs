using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Contents.Reward
{
    public interface IHaveProcessRunCount
    {
        short RunCount { get; set; }
    }

    /// <summary>
    /// GiveReward 객체에서 유저에게 아이템을 지급할 때 사용되는 기본 파라메터 클래스 입니다.
    /// </summary>
    public abstract class GiveRewardParam
    {
        public RewardType Type { get; protected set; }

        /// <summary>
        /// 이 보상이 지급 되는 사유(로그 찍을 때 사용됨)
        /// </summary>
        public GameLogCause Cause { get; protected set; }

        #region 생성자
        public GiveRewardParam(RewardType type, GameLogCause cause)
        {
            Type = type;
            Cause = cause;
        }
        #endregion

        public abstract int GetCompareKey();
        public abstract void MergeReward(RewardSpec reward);
    }
}
