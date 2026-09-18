using System.Collections;
using System.Collections.Generic;
using System.IO;
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
    /// Renders the baked Seoul strategy map (decision 10) at both capture
    /// resolutions and writes PNG evidence under .omo/evidence/.
    /// </summary>
    public sealed class StrategyMapCapturePlayModeTests
    {
        private const string BakedDir = "Assets/Janseon/Data/StrategyMap/Baked";
        private const string EvidenceDir = ".omo/evidence/seoul-strategy-map-gdd";

        [UnityTest]
        public IEnumerator StrategyMap_RendersAt_1280x720_And_1920x1080()
        {
            Assert.That(Directory.Exists(Path.Combine(ProjectRoot(), BakedDir)), Is.True,
                "baked strategy map assets are required (run bake_seoul_terrain.py)");

            List<Mesh> meshes = LoadChunkMeshes();
            Assert.That(meshes.Count, Is.EqualTo(9), "nine baked chunks expected");

            GameObject host = new GameObject("strategy-map-capture");
            try
            {
                StrategyMapPresenter presenter = StrategyMapPresenter.Build(host.transform, meshes);
                Assert.That(presenter.ChunkChildCount, Is.EqualTo(9));

                yield return Capture(presenter.MapCamera, 1280, 720);
                yield return Capture(presenter.MapCamera, 1920, 1080);
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
            var meshes = new List<Mesh>();
#if UNITY_EDITOR
            foreach (Object asset in AssetDatabase.LoadAllAssetsAtPath(BakedDir))
            {
                if (asset is Mesh mesh && mesh.name.StartsWith("chunk-"))
                {
                    meshes.Add(mesh);
                }
            }
            meshes.Sort((a, b) => string.CompareOrdinal(a.name, b.name));
#endif
            return meshes;
        }

        private static IEnumerator Capture(Camera camera, int width, int height)
        {
            var target = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
            var tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
            RenderTexture previousActive = RenderTexture.active;
            try
            {
                target.Create();
                RenderTexture.active = target;
                camera.targetTexture = target;
                camera.Render();
                tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                tex.Apply();

                Color32[] pixels = tex.GetPixels32();
                int nonDark = 0, varied = 0;
                var first = pixels[0];
                foreach (Color32 p in pixels)
                {
                    float lum = 0.2126f * p.r + 0.7152f * p.g + 0.0722f * p.b;
                    if (lum > 20f) nonDark++;
                    if (Mathf.Abs(p.r - first.r) > 4 || Mathf.Abs(p.g - first.g) > 4 || Mathf.Abs(p.b - first.b) > 4) varied++;
                }
                Assert.That(nonDark, Is.GreaterThan(0), "strategy map capture has no terrain pixels");
                Assert.That(varied, Is.GreaterThan(width * height / 100), "strategy map capture is a flat frame");

                string dir = Path.Combine(ProjectRoot(), EvidenceDir);
                Directory.CreateDirectory(dir);
                File.WriteAllBytes(Path.Combine(dir, $"strategy-map-{width}x{height}.png"), tex.EncodeToPNG());
            }
            finally
            {
                camera.targetTexture = null;
                RenderTexture.active = previousActive;
                target.Release();
                Object.Destroy(tex);
            }
            yield return null;
        }
    }
}
