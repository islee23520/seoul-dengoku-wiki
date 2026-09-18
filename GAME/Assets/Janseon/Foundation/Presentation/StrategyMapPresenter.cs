using System.Collections.Generic;
using Janseon.Core;
using UnityEngine;

namespace Janseon.Foundation.Presentation
{
    /// <summary>
    /// Builds and drives the Seoul strategy map screen (Intent 결정 10):
    /// nine baked heightmap chunks under a perspective pan/zoom camera.
    /// The camera pans and zooms but never orbits; combat is untouched.
    /// </summary>
    public sealed class StrategyMapPresenter : MonoBehaviour
    {
        private const float InitialHeight = 42f;
        private const float PanUnitsPerScreenUnit = 0.06f;
        private const float MinHeight = 12f;
        private const float MaxHeight = 90f;

        private Transform chunkRoot;
        private Camera mapCamera;

        public int ChunkChildCount => chunkRoot != null ? chunkRoot.childCount : 0;

        public Camera MapCamera => mapCamera;

        public static StrategyMapPresenter Build(
            Component host,
            IReadOnlyList<Mesh> chunkMeshes)
        {
            if (host == null) throw new System.ArgumentNullException(nameof(host));
            if (chunkMeshes == null) throw new System.ArgumentNullException(nameof(chunkMeshes));
            if (chunkMeshes.Count != StrategyMapCatalog.Chunks.Length)
            {
                throw new System.ArgumentException(
                    $"strategy map expects {StrategyMapCatalog.Chunks.Length} chunks, got {chunkMeshes.Count}");
            }

            StrategyMapPresenter presenter = host.gameObject.AddComponent<StrategyMapPresenter>();
            presenter.BuildInternal(chunkMeshes);
            return presenter;
        }

        private void BuildInternal(IReadOnlyList<Mesh> chunkMeshes)
        {
            chunkRoot = new GameObject("strategy-map-chunks").transform;
            chunkRoot.SetParent(transform, false);
            Shader unlit = Shader.Find("Universal Render Pipeline/Unlit");
            for (int i = 0; i < chunkMeshes.Count; i++)
            {
                var child = new GameObject($"chunk-{StrategyMapCatalog.Chunks[i].TileX}-{StrategyMapCatalog.Chunks[i].TileY}");
                child.transform.SetParent(chunkRoot, false);
                child.AddComponent<MeshFilter>().sharedMesh = chunkMeshes[i];
                var renderer = child.AddComponent<MeshRenderer>();
                if (unlit != null)
                {
                    // Distinct tint per chunk so captures show the 3x3 chunk coverage.
                    var material = new Material(unlit);
                    var tint = Color.HSVToRGB((i % 3) / 3f, 0.45f, 0.55f + (i / 3) * 0.15f);
                    material.SetColor("_BaseColor", tint);
                    material.color = tint;
                    renderer.sharedMaterial = material;
                }
            }

            var cameraObject = new GameObject("strategy-map-camera");
            cameraObject.transform.SetParent(transform, false);
            mapCamera = cameraObject.AddComponent<Camera>();
            mapCamera.orthographic = false;
            mapCamera.clearFlags = CameraClearFlags.SolidColor;
            mapCamera.backgroundColor = new Color(0.043f, 0.067f, 0.11f, 1f);
            ResetCamera();
        }

        private void ResetCamera()
        {
            // Seoul's north is -Z; sit south of the map and look north-down.
            // Unity cameras look +Z by default, so yaw 180 aims the pitch-down view
            // across the whole map (center ray lands near z ~ 4.6).
            mapCamera.transform.rotation = Quaternion.Euler(55f, 180f, 0f);
            mapCamera.transform.position = new Vector3(0f, InitialHeight, 34f);
            mapCamera.fieldOfView = 45f;
        }

        /// <summary>Pans the map camera over the terrain plane; never rotates.</summary>
        public void Pan(Vector2 screenDelta)
        {
            if (mapCamera == null) return;
            Vector3 position = mapCamera.transform.position;
            position.x = Mathf.Clamp(position.x + screenDelta.x * PanUnitsPerScreenUnit, StrategyMapCatalog.UnionMinX, StrategyMapCatalog.UnionMaxX);
            position.z = Mathf.Clamp(position.z + screenDelta.y * PanUnitsPerScreenUnit, StrategyMapCatalog.UnionMinZ, StrategyMapCatalog.UnionMaxZ);
            mapCamera.transform.position = position;
        }

        /// <summary>Zooms by moving the camera height; never rotates.</summary>
        public void Zoom(float factor)
        {
            if (mapCamera == null) return;
            Vector3 position = mapCamera.transform.position;
            position.y = Mathf.Clamp(position.y * factor, MinHeight, MaxHeight);
            mapCamera.transform.position = position;
        }
    }
}
