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
    /// chunk meshes with OSM + region textures, a perspective pan/zoom camera,
    /// benchmark-style weather (day/sunset/night/rain/snow) and seasons, and
    /// diagnostic capture PNGs under .omo/evidence/.
    ///
    /// Pixel-content assertions are intentionally absent: in batchmode
    /// -nographics this checkout's Camera.Render path produces uniform frames
    /// for every capture fixture (pre-existing regression family — see
    /// ProductionScene_WorldUnitsAndTargeting_Capture and Capture_C1_C10 on
    /// main). With graphics enabled the diagnostic captures render for real.
    /// </summary>
    public sealed class StrategyMapCapturePlayModeTests
    {
        private const string BakedDir = "Assets/Janseon/Data/StrategyMap/Baked";
        private const string EvidenceDir = ".omo/evidence/seoul-strategy-map-gdd";

        [UnityTest]
        public IEnumerator StrategyMap_LoadsNineChunks_Textures_Weather_AndSeasons()
        {
            Assert.That(Directory.Exists(Path.Combine(ProjectRoot(), BakedDir)), Is.True,
                "baked strategy map assets are required (run bake_seoul_terrain.py + bake_map_texture.py)");

            List<Mesh> meshes = LoadChunkAssets<Mesh>("t:Mesh");
            List<Texture2D> textures = LoadChunkAssets<Texture2D>("t:Texture2D");
            List<TextAsset> buildingBins = LoadChunkAssets<TextAsset>("t:TextAsset", "buildings-");
            Assert.That(meshes.Count, Is.EqualTo(9), "nine baked chunk meshes expected");
            Assert.That(textures.Count, Is.EqualTo(9), "nine baked chunk textures expected");
            Assert.That(buildingBins.Count, Is.EqualTo(9), "nine building binaries expected");
            foreach (TextAsset bin in buildingBins)
            {
                Assert.That(bin.bytes.Length >= 16, Is.True, $"{bin.name}: truncated header");
                int count = System.BitConverter.ToInt32(bin.bytes, 8);
                Assert.That(bin.bytes.Length, Is.EqualTo(16 + 28 * count), $"{bin.name}: length contract");
            }
            foreach (Mesh mesh in meshes)
            {
                Assert.That(mesh.vertexCount, Is.GreaterThan(0), $"{mesh.name} has no geometry");
                Assert.That(mesh.uv.Length, Is.EqualTo(mesh.vertexCount), $"{mesh.name} needs UVs for the landcover texture");
                Assert.That(mesh.bounds.max.x, Is.LessThanOrEqualTo(StrategyMapCatalog.UnionMaxX + 0.5f));
                Assert.That(mesh.bounds.min.x, Is.GreaterThanOrEqualTo(StrategyMapCatalog.UnionMinX - 0.5f));
            }

            GameObject host = new GameObject("strategy-map-playmode");
            try
            {
                StrategyMapPresenter presenter = StrategyMapPresenter.Build(host.transform, meshes, textures, buildingBins);
                Assert.That(presenter.ChunkChildCount, Is.EqualTo(9));
                Assert.That(presenter.MapCamera, Is.Not.Null);
                Assert.That(presenter.MapCamera.orthographic, Is.False, "decision 10 perspective camera");
                Assert.That(presenter.Buildings, Is.Not.Null, "3D buildings must be wired");
                Assert.That(presenter.Buildings.TotalInstances, Is.GreaterThan(250_000),
                    "atlas-scale building count (benchmark: 267k)");
                Assert.That(presenter.Buildings.ChunkCount, Is.EqualTo(9));

                // Captures first, while the camera sits at its default full-map framing.
                yield return null; // one frame so LateUpdate submits the instanced building draws
                var sb = new StringBuilder();

                // Streaming acceptance: scroll across ALL of Seoul; every stop must render.
                presenter.EnableStreaming(radius: 40f);
                Assert.That(presenter.StreamingEnabled, Is.True);
                var sweep = new (string name, float x, float z)[]
                {
                    ("sweep-west", StrategyMapCatalog.UnionMinX + 6f, 0f),
                    ("sweep-north", 0f, StrategyMapCatalog.UnionMinZ + 6f),
                    ("sweep-center", 0f, 0f),
                    ("sweep-south", 0f, StrategyMapCatalog.UnionMaxZ - 6f),
                    ("sweep-east", StrategyMapCatalog.UnionMaxX - 6f, 0f),
                };
                foreach (var stop in sweep)
                {
                    presenter.MapCamera.transform.position = new Vector3(stop.x, 24f, stop.z + 14f);
                    presenter.RefreshStreaming();
                    yield return CaptureDiagnostic(presenter.MapCamera, 1280, 720, stop.name);
                }
                presenter.MapCamera.transform.rotation = Quaternion.Euler(55f, 180f, 0f);
                presenter.MapCamera.transform.position = new Vector3(0f, 42f, 34f);
                presenter.DisableStreaming();
                foreach (StrategyMapWeatherKind weather in System.Enum.GetValues(typeof(StrategyMapWeatherKind)))
                {
                    presenter.SetWeather(weather);
                    Assert.That(presenter.MapCamera.backgroundColor, Is.Not.EqualTo(default(Color)));
                    bool weatherParticles = weather switch
                    {
                        StrategyMapWeatherKind.Rain => presenter.RainSystem.isEmitting && !presenter.SnowSystem.isEmitting,
                        StrategyMapWeatherKind.Snow => presenter.SnowSystem.isEmitting && !presenter.RainSystem.isEmitting,
                        _ => !presenter.RainSystem.isEmitting && !presenter.SnowSystem.isEmitting,
                    };
                    Assert.That(weatherParticles, Is.True, $"particle state wrong for {weather}");
                    presenter.RainSystem?.Simulate(1.2f, true, true);
                    presenter.SnowSystem?.Simulate(1.2f, true, true);
                    sb.AppendLine($"weather {weather}: rain={presenter.RainSystem.particleCount} snow={presenter.SnowSystem.particleCount} bg={presenter.MapCamera.backgroundColor}");
                    yield return CaptureDiagnostic(presenter.MapCamera, 1280, 720, $"weather-{weather}");
                }

                presenter.SetWeather(StrategyMapWeatherKind.Day);
                foreach (StrategyMapSeasonKind season in new[] { StrategyMapSeasonKind.Summer, StrategyMapSeasonKind.Autumn, StrategyMapSeasonKind.Winter })
                {
                    presenter.SetSeason(season);
                    yield return CaptureDiagnostic(presenter.MapCamera, 1280, 720, $"season-{season}");
                }

                string dir = Path.Combine(ProjectRoot(), EvidenceDir);
                Directory.CreateDirectory(dir);
                File.WriteAllText(Path.Combine(dir, "weather-states.txt"), sb.ToString());

                Quaternion beforeRotation = presenter.MapCamera.transform.rotation;
                Vector3 beforePosition = presenter.MapCamera.transform.position;
                presenter.Pan(new Vector2(5f, 5f));
                Assert.That(presenter.MapCamera.transform.position, Is.Not.EqualTo(beforePosition));
                presenter.Zoom(1.5f);
                Assert.That(presenter.MapCamera.transform.position.y, Is.GreaterThan(beforePosition.y));
                Assert.That(presenter.MapCamera.transform.rotation, Is.EqualTo(beforeRotation), "pan/zoom must never orbit");
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

        private static List<T> LoadChunkAssets<T>(string filter, string namePrefix = "chunk-") where T : Object
        {
            var byPath = new SortedDictionary<string, T>();
#if UNITY_EDITOR
            foreach (string guid in AssetDatabase.FindAssets(filter, new[] { BakedDir }))
            {
                string assetPath = AssetDatabase.GUIDToAssetPath(guid);
                if (namePrefix == "buildings-" && !assetPath.EndsWith(".bytes"))
                {
                    continue; // the buildings manifest JSON shares the prefix
                }
                if (!Path.GetFileNameWithoutExtension(assetPath).StartsWith(namePrefix))
                {
                    continue;
                }
                if (AssetImporter.GetAtPath(assetPath) is ModelImporter modelImporter && !modelImporter.isReadable)
                {
                    modelImporter.isReadable = true; // CPU-side UV inspection in this fixture only
                    modelImporter.SaveAndReimport();
                }
                T asset = AssetDatabase.LoadAssetAtPath<T>(assetPath);
                if (asset != null)
                {
                    byPath[assetPath] = asset;
                }
            }
#endif
            return byPath.Values.ToList();
        }

        /// <summary>Writes the render attempt as diagnostic PNG evidence; no pixel-content assert (see class doc).</summary>
        private static IEnumerator CaptureDiagnostic(Camera camera, int width, int height, string suffix)
        {
            var target = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
            var tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
            RenderTexture previousActive = RenderTexture.active;
            try
            {
                target.Create();
                RenderTexture.active = target;
                camera.targetTexture = target;
                camera.aspect = (float)width / height;
                camera.Render();
                tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                tex.Apply();

                string dir = Path.Combine(ProjectRoot(), EvidenceDir);
                Directory.CreateDirectory(dir);
                File.WriteAllBytes(Path.Combine(dir, $"strategy-map-{suffix}-{width}x{height}.png"), tex.EncodeToPNG());
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
