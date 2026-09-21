using System;
using UnityEngine;
using Janseon.Core;

namespace Janseon.Data.Authoring
{
    [Serializable] public sealed class BattlefieldAnchorDefinition { public string stableId; public int x; public int y; }
    [CreateAssetMenu(menuName = "Janseon/Data/Battlefield Definition", fileName = "BattlefieldDefinition")]
    public sealed class BattlefieldDefinitionAsset : ScriptableObject
    {
        public string authoringVersion = "target-v1";
        public string stableId;
        public int width = 1, height = 1;
        public int[] heights;
        public Vector2Int[] blocked;
        public BattlefieldAnchorDefinition[] anchors;
        public string[] passages;
        public bool hasTuning = true;
        void OnValidate() { if (string.IsNullOrEmpty(stableId)) Debug.LogError("Battlefield stableId is required.", this); if (width <= 0 || height <= 0) Debug.LogError("Battlefield dimensions are invalid.", this); }
    }
}
