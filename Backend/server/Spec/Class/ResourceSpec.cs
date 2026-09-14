using SeoulKenshi.Common;

namespace SeoulKenshi.Spec.Class
{
    public class ResourceSpec
    {
        public RewardType RewardType { get; set; }
        public int Param1 { get; set; }
        public int Param2 { get; set; }

        #region 생성자
        public ResourceSpec() { }
        public ResourceSpec(RewardType type, int param1, int param2)
        {
            RewardType = type;
            Param1 = param1;
            Param2 = param2;
        }
        #endregion

        public RewardSpec ToRewardSpec()
        {
            return new RewardSpec(RewardType, Param1, Param2, 0, 0);
        }
    }
}
