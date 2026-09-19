using System.IO;
using System.Linq;
using Janseon.Data.Authoring;
using UnityEditor;
using UnityEngine;

namespace Janseon.Data.Editor
{
    /// <summary>
    /// Projects baked strategy-map assets into the StrategyMapAssetCatalog.
    /// Run after the Python bakes produce their output under Baked/.
    /// Unity asset-consumption lock: catalog registration, not path loads.
    /// </summary>
    public static class StrategyMapAssetCatalogBuilder
    {
        private const string BakedDir = "Assets/Janseon/Data/StrategyMap/Baked";
        // Catalog path comes from the constant on the catalog class itself.

        [MenuItem("Janseon/Data/Build Strategy Map Asset Catalog")]
        public static void Build()
        {
            var meshes = LoadSorted<Mesh>("t:Mesh", "chunk-");
            var textures = LoadSorted<Texture2D>("t:Texture2D", "chunk-");
            var buildings = LoadSorted<TextAsset>("t:TextAsset", "buildings-")
                .Where(b => b.name.Contains("17")) // exclude buildings-manifest.json
                .ToArray();

            // Landmark OBJ imports live under StrategyMap/Landmarks, not Baked/.
            const string landmarksDir = "Assets/Janseon/Data/StrategyMap/Landmarks";
            var manifest = LoadSorted<TextAsset>("t:TextAsset", "landmarks-manifest", BakedDir)
                .Concat(LoadSorted<TextAsset>("t:TextAsset", "landmarks-manifest", landmarksDir))
                .FirstOrDefault();

            var landmarkPrefabs = Directory.GetFiles(landmarksDir, "*.obj")
                .OrderBy(p => p)
                .Select(p => AssetDatabase.LoadAssetAtPath<GameObject>(p))
                .Where(p => p != null)
                .ToArray();

            var catalog = AssetDatabase.LoadAssetAtPath<StrategyMapAssetCatalog>(StrategyMapAssetCatalog.CatalogAssetPath);
            if (catalog == null)
            {
                catalog = ScriptableObject.CreateInstance<StrategyMapAssetCatalog>();
                AssetDatabase.CreateAsset(catalog, StrategyMapAssetCatalog.CatalogAssetPath);
            }

            catalog.chunkMeshes = meshes;
            catalog.chunkTextures = textures;
            catalog.buildingBinaries = buildings;
            catalog.landmarksManifest = manifest;
            catalog.landmarkPrefabs = landmarkPrefabs;
            EditorUtility.SetDirty(catalog);
            AssetDatabase.SaveAssets();

            Debug.Log($"StrategyMapAssetCatalog: {meshes.Length} meshes, {textures.Length} textures, "
                + $"{buildings.Length} buildings, {landmarkPrefabs.Length} landmark prefabs. "
                + $"Complete={catalog.IsComplete}");
        }

        private static T[] LoadSorted<T>(string filter, string prefix, string searchDir = null) where T : Object
        {
            return AssetDatabase.FindAssets(filter, new[] { searchDir ?? BakedDir })
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(p => string.IsNullOrEmpty(prefix) || Path.GetFileNameWithoutExtension(p).StartsWith(prefix))
                .OrderBy(p => p)
                .Select(p => AssetDatabase.LoadAssetAtPath<T>(p))
                .Where(a => a != null)
                .ToArray();
        }
    }
}
