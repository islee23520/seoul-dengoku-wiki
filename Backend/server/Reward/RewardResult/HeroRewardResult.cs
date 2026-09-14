using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;
using SeoulKenshi.Contents.Class;

namespace SeoulKenshi.Contents.Reward
{
    public class HeroRewardResult : RewardResult
    {
        #region Properties
        public Hero Data { get; set; }
        #endregion

        #region 생성자         
        public HeroRewardResult() : base(RewardType.Hero) { }
        public HeroRewardResult(GameLogCause cause, Hero hero)
            : base(RewardType.Hero, cause)
        {
            Data = hero;
        }
        #endregion

        public override string ToJson()
        {
            return Data.ToJson();
        }
    }
}
