using UnityEngine;

namespace Janseon.Data.Authoring
{
    /// <summary>
    /// Baked Seoul strategy-map assets, registered for validated consumption.
    /// Populated by StrategyMapAssetCatalogBuilder from the Baked directory;
    /// tests and presenters read these fields — never path-based loads.
    /// Unity asset-consumption lock: .omo/locks/unity-asset-consumption-rules.md
    /// </summary>
    [CreateAssetMenu(menuName = "Janseon/Data/Strategy Map Asset Catalog", fileName = "StrategyMapAssetCatalog")]
    public sealed class StrategyMapAssetCatalog : ScriptableObject
    {
        /// <summary>Well-known asset path; the builder creates and the test consumes this single reference.</summary>
        public const string CatalogAssetPath = "Assets/Janseon/Data/Authoring/StrategyMapAssetCatalog.asset";

        [Header("Terrain chunks (z11 3×3)")]
        [Tooltip("Nine chunk meshes, sorted by tile x then y")]
        public Mesh[] chunkMeshes = new Mesh[0];

        [Tooltip("Nine chunk albedo textures (hillshade + OSM landcover + region tint)")]
        public Texture2D[] chunkTextures = new Texture2D[0];

        [Header("Buildings")]
        [Tooltip("Nine binary building placement blobs")]
        public TextAsset[] buildingBinaries = new TextAsset[0];

        [Header("Landmarks")]
        [Tooltip("JSON manifest with world positions")]
        public TextAsset landmarksManifest;

        [Tooltip("Fourteen landmark prefabs (Tripo-decimated OBJ imports)")]
        public GameObject[] landmarkPrefabs = new GameObject[0];

        public bool IsComplete =>
            chunkMeshes.Length == 9
            && chunkTextures.Length == 9
            && buildingBinaries.Length == 9
            && landmarksManifest != null
            && landmarkPrefabs.Length >= 14;
    }
}
