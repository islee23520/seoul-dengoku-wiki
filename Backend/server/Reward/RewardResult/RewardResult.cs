using System.Text.Json;
using System.Text.Json.Serialization;
using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;

namespace SeoulKenshi.Contents.Reward
{
    public class RewardResult : IRewardResult
    {
        [JsonIgnore]
        public RewardType RewardType { get; }
        [JsonIgnore]
        public GameLogCause Cause { get; set; }

        #region 생성자
        public RewardResult(RewardType rewardType)
        {
            RewardType = rewardType;
        }
        public RewardResult(RewardType rewardType, GameLogCause cause)
        {
            RewardType = rewardType;
            Cause = cause;
        }
        #endregion

        public virtual string ToJson()
        {
            return JsonSerializer.Serialize(this, GetType());
        }
    }
}
