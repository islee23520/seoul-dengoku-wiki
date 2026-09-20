using UnityEngine;

namespace Janseon.Data.Authoring
{
    [CreateAssetMenu(menuName = "Janseon/Data/Battle Unit Definition", fileName = "BattleUnitDefinition")]
    public sealed class BattleUnitDefinitionAsset : ScriptableObject
    {
        public string authoringVersion = "target-v1";
        public string stableId;
        public string role;
        public float speedMetersPerSecond = 1.5f;
        public float radiusMeters = 0.25f;
        public int hp = 100;
        public float meleeRangeMeters = 0.8f;
        public int damage = 10;
        public float cooldownSeconds = 1f;
        public int toHitBasisPoints = 10000;
    }
}
