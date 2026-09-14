using SeoulKenshi.Common;

namespace SeoulKenshi.Spec.Class
{
    public class RewardSpec : ResourceSpec
    {
        public int Param3 { get; set; }
        public int Param4 { get; set; }

        #region 생성자
        public RewardSpec() { }
        public RewardSpec(RewardType type, int param1, int param2, int param3, int param4)
            : base(type, param1, param2)
        {
            Param3 = param3;
            Param4 = param4;
        }

        public RewardSpec(ResourceSpec resource)
            : base(resource.RewardType, resource.Param1, resource.Param2)
        {

        }

        #endregion
    }
}
