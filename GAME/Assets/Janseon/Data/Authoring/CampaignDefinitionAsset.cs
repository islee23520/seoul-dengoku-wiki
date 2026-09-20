using UnityEngine;

namespace Janseon.Data.Authoring
{
    [CreateAssetMenu(menuName = "Janseon/Data/Campaign Definition", fileName = "CampaignDefinition")]
    public sealed class CampaignDefinitionAsset : ScriptableObject
    {
        [SerializeField] private string battleRulesVersion;
        [SerializeField] private string persistentPartyUnitId;
        [SerializeField] private int persistentPartyMaxHp;

        public string BattleRulesVersion => battleRulesVersion;
        public string PersistentPartyUnitId => persistentPartyUnitId;
        public int PersistentPartyMaxHp => persistentPartyMaxHp;
    }
}
