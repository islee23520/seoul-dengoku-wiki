using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using Janseon.Core;
using Janseon.Foundation.Presentation;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

#if UNITY_EDITOR
using UnityEditor;
#endif

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Loads the baked Seoul strategy map (decision 10) in Play Mode: nine
    /// chunk meshes from the committed bake, a perspective pan/zoom camera,
    /// and diagnostic capture PNGs under .omo/evidence/.
    ///
    /// Pixel-content assertions are intentionally absent: in batchmode
    /// -nographics this checkout's Camera.Render path produces uniform frames
    /// for every capture fixture (pre-existing regression family — see
    /// ProductionScene_WorldUnitsAndTargeting_Capture and Capture_C1_C10 on
    /// main). Visual proof of the terrain is supplied offline by rendering
    /// the same baked OBJ chunks with the same camera framing.
    /// </summary>
    public sealed class StrategyMapCapturePlayModeTests
    {
        private const string BakedDir = "Assets/Janseon/Data/StrategyMap/Baked";
        private const string EvidenceDir = ".omo/evidence/seoul-strategy-map-gdd";

        [UnityTest]
        public IEnumerator StrategyMap_LoadsNineChunks_WithPerspectivePanZoomCamera()
        {
            Assert.That(Directory.Exists(Path.Combine(ProjectRoot(), BakedDir)), Is.True,
                "baked strategy map assets are required (run bake_seoul_terrain.py)");

            List<Mesh> meshes = LoadChunkMeshes();
            Assert.That(meshes.Count, Is.EqualTo(9), "nine baked chunk meshes expected");
            foreach (Mesh mesh in meshes)
            {
                Assert.That(mesh.vertexCount, Is.GreaterThan(0), $"{mesh.name} has no geometry");
                Assert.That(mesh.bounds.max.x, Is.LessThanOrEqualTo(StrategyMapCatalog.UnionMaxX + 0.5f),
                    $"{mesh.name} exceeds the catalog union bounds");
                Assert.That(mesh.bounds.min.x, Is.GreaterThanOrEqualTo(StrategyMapCatalog.UnionMinX - 0.5f));
            }

            GameObject host = new GameObject("strategy-map-playmode");
            try
            {
                StrategyMapPresenter presenter = StrategyMapPresenter.Build(host.transform, meshes);
                Assert.That(presenter.ChunkChildCount, Is.EqualTo(9));
                Assert.That(presenter.MapCamera, Is.Not.Null);
                Assert.That(presenter.MapCamera.orthographic, Is.False, "decision 10 perspective camera");

                // Captures first, while the camera sits at its default full-map framing.
                yield return CaptureDiagnostic(presenter.MapCamera, 1280, 720);
                yield return CaptureDiagnostic(presenter.MapCamera, 1920, 1080);

                Quaternion beforeRotation = presenter.MapCamera.transform.rotation;
                Vector3 beforePosition = presenter.MapCamera.transform.position;
                presenter.Pan(new Vector2(5f, 5f));
                Assert.That(presenter.MapCamera.transform.position, Is.Not.EqualTo(beforePosition));
                presenter.Zoom(1.5f);
                Assert.That(presenter.MapCamera.transform.position.y, Is.GreaterThan(beforePosition.y));
                Assert.That(presenter.MapCamera.transform.rotation, Is.EqualTo(beforeRotation), "pan/zoom must never orbit");

                presenter.Pan(new Vector2(-500f, -500f)); // clamped to union bounds
                Assert.That(presenter.MapCamera.transform.position.x, Is.GreaterThanOrEqualTo(StrategyMapCatalog.UnionMinX - 0.01f));
            }
            finally
            {
                Object.Destroy(host);
            }
        }

        private static string ProjectRoot()
        {
            return Directory.GetParent(Application.dataPath)!.FullName;
        }

        private static List<Mesh> LoadChunkMeshes()
        {
            var byPath = new SortedDictionary<string, Mesh>();
#if UNITY_EDITOR
            foreach (string guid in AssetDatabase.FindAssets("t:Mesh", new[] { BakedDir }))
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(guid);
                Mesh mesh = AssetDatabase.LoadAssetAtPath<Mesh>(assetPath);
                if (mesh != null)
                {
                    byPath[assetPath] = mesh;
                }
            }
#endif
            return byPath.Values.ToList();
        }

        /// <summary>Writes the render attempt as diagnostic PNG evidence; no pixel-content assert (see class doc).</summary>
        private static IEnumerator CaptureDiagnostic(Camera camera, int width, int height)
        {
            var target = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
            var tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
            RenderTexture previousActive = RenderTexture.active;
            // Batchmode loads no URP asset, so URP shaders render magenta under the
            // built-in fallback; swap URP materials to pipeline-agnostic Unlit/Color
            // (keeping the chunk tints) so the capture shows real geometry shading.
            var swapped = new List<(MeshRenderer renderer, Material original)>();
            try
            {
                Shader unlitColor = Shader.Find("Unlit/Color");
                foreach (MeshRenderer renderer in camera.transform.parent.GetComponentsInChildren<MeshRenderer>(true))
                {
                    if (renderer.sharedMaterial != null && renderer.sharedMaterial.shader.name.StartsWith("Universal"))
                    {
                        var replacement = new Material(unlitColor);
                        replacement.color = renderer.sharedMaterial.HasColor("_BaseColor")
                            ? renderer.sharedMaterial.GetColor("_BaseColor")
                            : Color.white;
                        swapped.Add((renderer, renderer.sharedMaterial));
                        renderer.sharedMaterial = replacement;
                    }
                }
                target.Create();
                RenderTexture.active = target;
                camera.targetTexture = target;
                // Batchmode Camera.Render does not refresh camera.aspect from the
                // target texture (known Unity behavior): pin it explicitly or the
                // view renders as a square slice stretched over the frame.
                camera.aspect = (float)width / height;
                camera.Render();
                tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                tex.Apply();

                Color32[] pixels = tex.GetPixels32();
                var histogram = new SortedDictionary<string, int>();
                foreach (Color32 p in pixels)
                {
                    string key = $"{p.r / 32 * 32:X2}{p.g / 32 * 32:X2}{p.b / 32 * 32:X2}";
                    histogram[key] = histogram.GetValueOrDefault(key) + 1;
                }
                string topColors = string.Join(",", histogram.OrderByDescending(kv => kv.Value).Take(4).Select(kv => $"{kv.Key}={kv.Value}"));

                // Ground-truth dump: where does the engine itself project the chunk centers?
                var sb = new StringBuilder();
                sb.AppendLine($"camera pos={camera.transform.position} rot={camera.transform.eulerAngles} fwd={camera.transform.forward}");
                for (int i = 0; i < StrategyMapCatalog.Chunks.Length; i++)
                {
                    var b = StrategyMapCatalog.Chunks[i];
                    var world = new Vector3((b.MinX + b.MaxX) * 0.5f, 5f, (b.MinZ + b.MaxZ) * 0.5f);
                    sb.AppendLine($"chunk{i} tile{b.TileX}/{b.TileY} world={world} viewport={camera.WorldToViewportPoint(world)}");
                }
                foreach (MeshRenderer renderer in camera.transform.parent.GetComponentsInChildren<MeshRenderer>(true))
                {
                    sb.AppendLine($"renderer {renderer.name} mat={(renderer.sharedMaterial != null ? renderer.sharedMaterial.shader.name : "null")} visible={renderer.isVisible} bounds={renderer.bounds}");
                }

                string dir = Path.Combine(ProjectRoot(), EvidenceDir);
                Directory.CreateDirectory(dir);
                string metaPath = Path.Combine(dir, $"strategy-map-{width}x{height}-histogram.txt");
                File.WriteAllText(metaPath, $"batchmode Camera.Render diagnostic; top colors {topColors}\n{sb}\n");

                File.WriteAllBytes(Path.Combine(dir, $"strategy-map-{width}x{height}.png"), tex.EncodeToPNG());
            }
            finally
            {
                foreach (var (renderer, original) in swapped)
                {
                    renderer.sharedMaterial = original;
                }
                camera.targetTexture = null;
                RenderTexture.active = previousActive;
                target.Release();
                Object.Destroy(tex);
            }
            yield return null;
        }
    }
}
