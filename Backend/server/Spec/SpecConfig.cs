using System.Data;
using SeoulKenshi.Spec.Containers;
using SeoulKenshi.Spec.Entities;

namespace SeoulKenshi.Spec
{
    public class SpecConfig
    {
        #region spec containers
        public static AccountSpecContainer ACCOUNT_SPEC { get { return Instance._accountSpec; } }
        public static HeroSpecContainer HERO_SPEC { get { return Instance._heroSpec; } }
        public static RewardSpecContainer REWARD_SPEC { get { return Instance._rewardSpec; } }
        public static GlobalConfigSpecContainer GLOBAL_CONFIG { get { return Instance._globalConfigSpec; } }
        #endregion

        #region Instance
        public static SpecConfig Instance { get; } = new SpecConfig();
        #endregion

        #region private Members
        AccountSpecContainer _accountSpec { get; set; }
        HeroSpecContainer _heroSpec { get; set; }
        RewardSpecContainer _rewardSpec { get; set; }
        GlobalConfigSpecContainer _globalConfigSpec { get; set; }
        #endregion

        public void Init(IDbConnection conn)
        {
            var newGlobalConfigSpec = new GlobalConfigSpecContainer(conn);
            _globalConfigSpec = newGlobalConfigSpec;

            var newAccountSpec = new AccountSpecContainer(conn);
            var newHeroSpec = new HeroSpecContainer(conn);
            var newRewardSpec = new RewardSpecContainer(conn);

            _accountSpec = newAccountSpec;
            _heroSpec = newHeroSpec;
            _rewardSpec = newRewardSpec;
        }
    }
}
