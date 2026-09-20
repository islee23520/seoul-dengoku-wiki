using System;
using System.Collections.Generic;

namespace Janseon.Foundation.Presentation
{
    public interface IReadOnlyStrategyMapAssetCatalog
    {
        IReadOnlyList<UnityEngine.Mesh> Meshes { get; }
        IReadOnlyList<UnityEngine.Texture2D> Textures { get; }
        IReadOnlyList<UnityEngine.TextAsset> BuildingBinaries { get; }
        IReadOnlyList<UnityEngine.GameObject> Prefabs { get; }
        UnityEngine.TextAsset Manifest { get; }
        string Fingerprint { get; }
    }

    public sealed class StrategyMapAssetRepository : IReadOnlyStrategyMapAssetCatalog
    {
        public IReadOnlyList<UnityEngine.Mesh> Meshes { get; }
        public IReadOnlyList<UnityEngine.Texture2D> Textures { get; }
        public IReadOnlyList<UnityEngine.TextAsset> BuildingBinaries { get; }
        public IReadOnlyList<UnityEngine.GameObject> Prefabs { get; }
        public UnityEngine.TextAsset Manifest { get; }
        public string Fingerprint { get; }

        public StrategyMapAssetRepository(StrategyMapAssetCatalog catalog)
        {
            if (catalog == null)
                throw new InvalidOperationException("Strategy map asset catalog is required.");

            var meshes = CopyExact(catalog.ChunkMeshes, 9, "meshes");
            var textures = CopyExact(catalog.ChunkTextures, 9, "textures");
            var buildingBinaries = CopyExact(catalog.BuildingBinaries, 9, "building binaries");
            var prefabCount = catalog.LandmarkPrefabs == null ? 0 : catalog.LandmarkPrefabs.Count;
            if (prefabCount == 0 && catalog.LandmarkManifest != null)
                throw new InvalidOperationException("Strategy map asset manifest requires landmark prefabs.");
            if (prefabCount > 0 && catalog.LandmarkManifest == null)
                throw new InvalidOperationException("Strategy map asset manifest is required when landmark prefabs are authored.");
            var prefabs = prefabCount == 0
                ? Array.AsReadOnly(Array.Empty<UnityEngine.GameObject>())
                : CopyAndValidate(catalog.LandmarkPrefabs, "prefabs");

            Meshes = meshes;
            Textures = textures;
            BuildingBinaries = buildingBinaries;
            Prefabs = prefabs;
            Manifest = catalog.LandmarkManifest;
            Fingerprint = ComputeFingerprint(meshes, textures, buildingBinaries, prefabs, Manifest);
        }

        private static IReadOnlyList<T> CopyExact<T>(IReadOnlyList<T> values, int expected, string label) where T : UnityEngine.Object
        {
            if (values == null || values.Count != expected)
                throw new InvalidOperationException($"Strategy map asset {label} must contain exactly {expected} entries.");

            return CopyAndValidate(values, label);
        }

        private static IReadOnlyList<T> CopyMinimum<T>(IReadOnlyList<T> values, int minimum, string label) where T : UnityEngine.Object
        {
            if (values == null || values.Count < minimum)
                throw new InvalidOperationException($"Strategy map asset {label} must contain at least {minimum} entries.");

            return CopyAndValidate(values, label);
        }

        private static IReadOnlyList<T> CopyAndValidate<T>(IReadOnlyList<T> values, string label) where T : UnityEngine.Object
        {
            var copy = new T[values.Count];
            for (var index = 0; index < values.Count; index++)
            {
                if (values[index] == null)
                    throw new InvalidOperationException($"Strategy map asset {label} contains a null entry at index {index}.");
                copy[index] = values[index];
            }

            return Array.AsReadOnly(copy);
        }

        private static string ComputeFingerprint(
            IReadOnlyList<UnityEngine.Mesh> meshes,
            IReadOnlyList<UnityEngine.Texture2D> textures,
            IReadOnlyList<UnityEngine.TextAsset> buildingBinaries,
            IReadOnlyList<UnityEngine.GameObject> prefabs,
            UnityEngine.TextAsset manifest)
        {
            unchecked
            {
                var hash = 17;
                hash = AddNames(hash, meshes);
                hash = AddNames(hash, textures);
                hash = AddNames(hash, buildingBinaries);
                hash = AddNames(hash, prefabs);
                hash = AddName(hash, manifest == null ? "<empty-manifest>" : manifest.name);
                return hash.ToString("X8");
            }
        }

        private static int AddNames<T>(int hash, IReadOnlyList<T> values) where T : UnityEngine.Object
        {
            hash = hash * 31 + values.Count;
            for (var index = 0; index < values.Count; index++)
                hash = AddName(hash, values[index].name);
            return hash;
        }

        private static int AddName(int hash, string name)
        {
            for (var index = 0; index < name.Length; index++)
                hash = hash * 31 + name[index];
            return hash;
        }
    }
}
