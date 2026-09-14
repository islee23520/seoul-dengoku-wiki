using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Contents.Reward
{
    public class GiveExpParam : GiveRewardParam
    {
        public ExpType ExpType { get; set; }
        public int GainExp { get; set; }

        #region 생성자
        public GiveExpParam(GameLogCause cause, ExpType type, int gainExp)
            : base(RewardType.Exp, cause)
        {
            ExpType = type;
            GainExp = gainExp;
        }
        #endregion

        public override int GetCompareKey()
        {
            return (int)ExpType;
        }
        public override void MergeReward(RewardSpec reward)
        {
            GainExp += reward.Param2;
        }
    }
}
