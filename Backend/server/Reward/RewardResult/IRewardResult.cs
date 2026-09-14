using SeoulKenshi.Common;
using SeoulKenshi.Common.Log;

namespace SeoulKenshi.Contents.Reward
{
    public interface IRewardResult
    {
        RewardType RewardType { get; }
        GameLogCause Cause { get; }
        string ToJson();
    }
}
