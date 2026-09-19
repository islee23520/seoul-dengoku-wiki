using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace Janseon.Foundation.Presentation
{
    /// <summary>
    /// Places the baked Seoul landmark models (decision 10; Tripo-generated per
    /// the 2026-09-18 owner directive, simplified to ~80k faces each) at their
    /// real-world positions on the strategy map, scaled to game units.
    /// Source of truth: GAME/Assets/Janseon/Data/StrategyMap/Landmarks/
    /// landmarks-manifest.json — slugs, lat/lon, worldX/worldZ, gameScale.
    /// </summary>
    public sealed class StrategyMapLandmarks : MonoBehaviour
    {
        [System.Serializable]
        private sealed class LandmarkEntry
        {
            public string slug;
            public float lat;
            public float lon;
            public float worldX;
            public float worldZ;
            public float gameScale = 6f;
        }

        [System.Serializable]
        private sealed class LandmarkManifest
        {
            public string kind;
            public List<LandmarkEntry> landmarks;
        }

        private readonly List<GameObject> placed = new();

        public int PlacedCount => placed.Count;

        public static StrategyMapLandmarks Build(
            Component host,
            IReadOnlyList<GameObject> landmarkPrefabs,
            string manifestJson)
        {
            if (host == null) throw new System.ArgumentNullException(nameof(host));
            var go = new GameObject("strategy-map-landmarks");
            go.transform.SetParent(host.transform, false);
            var marker = go.AddComponent<StrategyMapLandmarks>();
            marker.Place(landmarkPrefabs, manifestJson);
            return marker;
        }

        private void Place(IReadOnlyList<GameObject> prefabs, string manifestJson)
        {
            var manifest = JsonUtility.FromJson<LandmarkManifest>(manifestJson);
            if (manifest?.landmarks == null || prefabs == null) return;
            // OBJ importer materials (Standard shader) render magenta in batchmode;
            // force a pastel unlit material so landmarks always paint.
            Shader landmarkShader = Shader.Find("Unlit/Color");
            for (int i = 0; i < manifest.landmarks.Count && i < prefabs.Count; i++)
            {
                LandmarkEntry entry = manifest.landmarks[i];
                if (prefabs[i] == null) continue;
                var child = Instantiate(prefabs[i], transform);
                child.name = $"landmark-{entry.slug}";
                child.transform.localPosition = new Vector3(entry.worldX, 0f, entry.worldZ);
                child.transform.localScale = Vector3.one * entry.gameScale;
                child.transform.localRotation = Quaternion.identity;
                if (landmarkShader != null)
                {
                    foreach (MeshRenderer renderer in child.GetComponentsInChildren<MeshRenderer>())
                    {
                        var mat = new Material(landmarkShader);
                        mat.SetColor("_Color", new Color(0.84f, 0.80f, 0.74f)); // pale ivory
                        renderer.sharedMaterial = mat;
                    }
                }
                placed.Add(child);
            }
        }
    }
}
