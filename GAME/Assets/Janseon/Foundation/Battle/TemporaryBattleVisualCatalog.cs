using System;
using UnityEngine;

namespace Janseon.Foundation.Battle
{
    public enum TemporaryCombatantKind
    {
        HeroMelee,
        HeroRanged,
        SoldierMelee,
        SoldierRanged,
    }

    public enum TemporaryCombatantPose
    {
        Idle,
        Moving,
        Attacking,
        Hit,
        Dead,
    }

    [Serializable]
    public sealed class TemporaryBattleVisualEntry
    {
        [SerializeField] TemporaryCombatantKind kind;
        [SerializeField] GameObject prefab;

        public TemporaryCombatantKind Kind => kind;
        public GameObject Prefab => prefab;

        public TemporaryBattleVisualEntry(TemporaryCombatantKind kind, GameObject prefab)
        {
            this.kind = kind;
            this.prefab = prefab;
        }
    }

    [CreateAssetMenu(fileName = "TemporaryBattleVisualCatalog", menuName = "Janseon/Temporary Battle Visual Catalog")]
    public sealed class TemporaryBattleVisualCatalog : ScriptableObject
    {
        [SerializeField] string source = "unity-generated-blockout";
        [SerializeField] string use = "temporary-gameplay-mesh";
        [SerializeField] GameObject[] prefabs = Array.Empty<GameObject>();
        [SerializeField] TemporaryBattleVisualEntry[] entries = Array.Empty<TemporaryBattleVisualEntry>();

        public string Source => source;
        public string Use => use;
        public TemporaryBattleVisualEntry[] Entries => entries;

        public GameObject Instantiate(TemporaryCombatantKind kind, Transform parent = null)
        {
            foreach (TemporaryBattleVisualEntry entry in entries)
                if (entry.Kind == kind && entry.Prefab != null)
                    return UnityEngine.Object.Instantiate(entry.Prefab, parent);
            throw new InvalidOperationException($"Temporary combatant prefab is not serialized for {kind}");
        }

#if UNITY_EDITOR
        public void SetGeneratedEntries(TemporaryBattleVisualEntry[] value)
        {
            source = "unity-generated-blockout";
            use = "temporary-gameplay-mesh";
            entries = value ?? Array.Empty<TemporaryBattleVisualEntry>();
            prefabs = new GameObject[entries.Length];
            for (int i = 0; i < entries.Length; i++) prefabs[i] = entries[i].Prefab;
        }
#endif
    }
}
