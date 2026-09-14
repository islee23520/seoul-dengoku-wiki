using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Spec.Class;

namespace SeoulKenshi.Contents.Reward
{
    public class GiveHeroParam : GiveRewardParam, IHaveProcessRunCount
    {
        public int ID { get; set; }
        public short Level { get; set; }
        public short RunCount { get; set; }

        #region 생성자
        public GiveHeroParam(GameLogCause cause, int id, int level)
            : base(RewardType.Hero, cause)
        {
            ID = id;
            Level = (short)level;
            RunCount = 1;
        }
        #endregion

        public override int GetCompareKey()
        {
            return ID;
        }
        public override void MergeReward(RewardSpec reward)
        {
            RunCount++;
        }
    }
}
