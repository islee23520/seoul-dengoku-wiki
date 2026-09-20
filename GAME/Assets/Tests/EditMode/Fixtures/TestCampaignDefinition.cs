using Janseon.Core;
using Janseon.Core.Data;

namespace Janseon.Tests.EditMode.Fixtures
{
    /// <summary>Boundary fixture with deliberately synthetic, noncanonical campaign values.</summary>
    public sealed class TestCampaignDefinition : IReadOnlyCampaignDefinition
    {
        public const string TestBattleRulesVersion = "test-boundary-rules-v937";
        public const string TestPersistentPartyUnitId = "test-boundary-party-unit-41";
        public const int TestPersistentPartyMaxHp = 73;

        public static TestCampaignDefinition Instance { get; } = new TestCampaignDefinition();

        public string BattleRulesVersion => TestBattleRulesVersion;
        public string PersistentPartyUnitId => TestPersistentPartyUnitId;
        public int PersistentPartyMaxHp => TestPersistentPartyMaxHp;

        public UnitHpSnapshot MaxHp => UnitHpSnapshot.DefaultParty(
            PersistentPartyUnitId,
            PersistentPartyMaxHp);

        TestCampaignDefinition()
        {
        }
    }
}
