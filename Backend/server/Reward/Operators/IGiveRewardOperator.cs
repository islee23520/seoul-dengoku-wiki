using SeoulKenshi.Common;
using SeoulKenshi.Storage;
using Y2K.Core.DataBase;

namespace SeoulKenshi.Contents.Reward.Operators
{
    public interface IGiveRewardOperator
    {
        RewardType Type { get; }

        IRewardResult Process(IY2KDbConnector db, UserData userData, GiveRewardParam param);
    }
}
