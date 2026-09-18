using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.UIElements;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// Todo 16 fail-closed runtime asset provenance.
    /// Playable scenes/UI may only reference code-native UI geometry or valid non-TRELLIS
    /// promoted assets. TRELLIS / placeholder / unknown external art always fails.
    /// </summary>
    public sealed class RuntimeAssetProvenanceTests
    {
        static readonly string[] PlayableScenes =
        {
            "Assets/Scenes/Bootstrap.unity",
            "Assets/Scenes/MainTitle.unity",
            "Assets/Scenes/Foundation.unity",
        };

        static readonly string[] CodeNativeUiAssets =
        {
            "Assets/Janseon/Foundation/UI/Screens/MainTitle.uxml",
            "Assets/Janseon/Foundation/UI/Screens/Gameplay.uxml",
            "Assets/Janseon/Foundation/UI/Styles/MainTitle.uss",
            "Assets/Janseon/Foundation/UI/Styles/Gameplay.uss",
            "Assets/Janseon/Foundation/UI/Styles/JanseonShared.uss",
            "Assets/Janseon/Foundation/UI/PanelSettings.asset",
        };

        static readonly Regex GuidRegex = new(@"guid:\s*([0-9a-f]{32})", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        static readonly Regex UssUrlRegex = new(@"url\s*\(\s*['""]?([^)'""]+)['""]?\s*\)", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        static readonly string[] QuarantineMarkers =
        {
            "/ArtSource/",
            "/Art/Props/",
            "poc-prop-",
            "StationPropValidation",
            "trellis",
            "TRELLIS",
        };

        static readonly string[] BlockedBackends =
        {
            "trellis_v1",
            "comfyui_trellis",
            "trellis",
            "tripo",
            "tripo3d",
            "meshygen_plus",
            "meshy",
        };

        [Test]
        public void PlayableBuildSettings_ExcludeTrellisValidationAndArtProps()
        {
            foreach (EditorBuildSettingsScene entry in EditorBuildSettings.scenes)
            {
                if (!entry.enabled)
                {
                    continue;
                }

                Assert.That(IsQuarantinePath(entry.path), Is.False,
                    "enabled build scene must not be quarantine/TRELLIS path: " + entry.path);
            }

            string[] enabled = EditorBuildSettings.scenes
                .Where(s => s.enabled)
                .Select(s => s.path.Replace('\\', '/'))
                .ToArray();
            CollectionAssert.AreEqual(PlayableScenes, enabled, "playable build order must stay Bootstrap→MainTitle→Foundation");
        }

        [Test]
        public void PlayableScenes_DoNotReferenceQuarantineOrTrellisAssets()
        {
            var leaks = new List<string>();
            foreach (string scenePath in PlayableScenes)
            {
                leaks.AddRange(FindQuarantineGuidLeaks(scenePath));
            }

            Assert.That(leaks, Is.Empty, "playable scenes leaked quarantine assets:\n" + string.Join("\n", leaks));
        }

        [Test]
        public void CodeNativeUi_HasNoRasterOrTrellisUrls()
        {
            var leaks = new List<string>();
            foreach (string path in CodeNativeUiAssets)
            {
                string text = File.ReadAllText(ToAbsolute(path));
                foreach (Match match in UssUrlRegex.Matches(text))
                {
                    string url = match.Groups[1].Value.Trim();
                    if (url.EndsWith(".uss", StringComparison.OrdinalIgnoreCase)
                        || url.EndsWith(".uxml", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    if (IsQuarantinePath(url)
                        || Regex.IsMatch(url, @"\.(png|jpg|jpeg|fbx|glb|prefab|mat)$", RegexOptions.IgnoreCase))
                    {
                        leaks.Add(path + " -> " + url);
                    }
                }

                leaks.AddRange(FindQuarantineGuidLeaks(path));
            }

            Assert.That(leaks, Is.Empty, "UI sources must stay code-native / non-TRELLIS:\n" + string.Join("\n", leaks));
        }

        [Test]
        public void CodeNativeUiAssets_LoadAsImportedAssets()
        {
            Assert.That(AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(CodeNativeUiAssets[0]), Is.Not.Null);
            Assert.That(AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(CodeNativeUiAssets[1]), Is.Not.Null);
            Assert.That(AssetDatabase.LoadAssetAtPath<StyleSheet>(CodeNativeUiAssets[2]), Is.Not.Null);
            Assert.That(AssetDatabase.LoadAssetAtPath<StyleSheet>(CodeNativeUiAssets[3]), Is.Not.Null);
            Assert.That(AssetDatabase.LoadAssetAtPath<StyleSheet>(CodeNativeUiAssets[4]), Is.Not.Null);
            Assert.That(AssetDatabase.LoadAssetAtPath<PanelSettings>(CodeNativeUiAssets[5]), Is.Not.Null);
        }

        [Test]
        public void ProviderLock_TrellisTripoMeshyBackends_AlwaysFailRuntimeAllow()
        {
            foreach (string backend in BlockedBackends)
            {
                Assert.That(IsBackendAllowedForRuntime(backend), Is.False, backend + " must fail closed for runtime");
            }

            Assert.That(ClassifyBackendCode("trellis_v1"), Is.EqualTo("trellis_blocked"));
            Assert.That(ClassifyBackendCode("comfyui_trellis"), Is.EqualTo("trellis_blocked"));
            Assert.That(ClassifyBackendCode("tripo3d"), Is.EqualTo("tripo_agent_forbidden"));
            Assert.That(ClassifyBackendCode("tripo"), Is.EqualTo("tripo_agent_forbidden"));
            Assert.That(ClassifyBackendCode("meshygen_plus"), Is.EqualTo("meshygen_unverified"));

            Assert.That(IsBackendAllowedForRuntime("grok_imagine"), Is.True);
            Assert.That(IsBackendAllowedForRuntime("nanobanana_gemini"), Is.True);
            Assert.That(IsBackendAllowedForRuntime("openai_image"), Is.True);
            Assert.That(IsBackendAllowedForRuntime("none"), Is.True);
            Assert.That(ClassifyBackendCode("grok_imagine"), Is.EqualTo("backend_allowlisted"));
        }

        [Test]
        public void StationPropBom_TrellisRows_AreNotRuntimeValid()
        {
            string bomPath = Path.GetFullPath(Path.Combine(Application.dataPath, "../../docs/assets/bom/props/station-prop-bom.json"));
            Assert.That(File.Exists(bomPath), Is.True, "BOM path missing: " + bomPath);
            string json = File.ReadAllText(bomPath);
            Assert.That(json, Does.Contain("trellis_v1"));
            // Fail-closed: any trellis_v1 token in BOM means those rows are invalid for runtime wiring.
            Assert.That(IsBackendAllowedForRuntime("trellis_v1"), Is.False);
            Assert.That(IsQuarantinePath("Assets/Janseon/Art/Props/poc-prop-bench/poc-prop-bench.prefab"), Is.True);
        }

        [Test]
        public void RuntimeScripts_DoNotEmbedTrellisOrArtSourcePaths()
        {
            string root = Path.Combine(Application.dataPath, "Janseon");
            var leaks = new List<string>();
            foreach (string file in Directory.GetFiles(root, "*.cs", SearchOption.AllDirectories))
            {
                string norm = file.Replace('\\', '/');
                if (norm.Contains("/Editor/") || norm.Contains("/Tests/"))
                {
                    continue;
                }

                string text = File.ReadAllText(file);
                if (Regex.IsMatch(text, @"ArtSource|Art/Props|poc-prop-|trellis_v1|StationPropValidation", RegexOptions.IgnoreCase))
                {
                    leaks.Add(norm.Substring(Application.dataPath.Length - "Assets".Length));
                }
            }

            Assert.That(leaks, Is.Empty, "runtime scripts embed quarantine tokens:\n" + string.Join("\n", leaks));
        }

        [Test]
        public void MutationProbe_InjectedTrellisGuid_IsDetectedByScanner()
        {
            // Synthetic text mutation — does not write production scenes.
            string benchMeta = "Assets/Janseon/Art/Props/poc-prop-bench/poc-prop-bench.prefab.meta";
            string absMeta = ToAbsolute(benchMeta);
            Assert.That(File.Exists(absMeta), Is.True, "historical TRELLIS prefab meta must exist for quarantine inventory");
            string metaText = File.ReadAllText(absMeta);
            Match guidMatch = Regex.Match(metaText, @"^guid:\s*([0-9a-f]{32})\s*$", RegexOptions.Multiline);
            Assert.That(guidMatch.Success, Is.True);
            string guid = guidMatch.Groups[1].Value;

            string fakeScene = "m_Name: Leak\n  m_SourcePrefab: {fileID: 100100000, guid: " + guid + ", type: 3}\n";
            var guidToPath = BuildGuidMap(Application.dataPath);
            var leaks = new List<string>();
            foreach (Match m in GuidRegex.Matches(fakeScene))
            {
                string g = m.Groups[1].Value.ToLowerInvariant();
                if (g.StartsWith("0000000000000000", StringComparison.Ordinal))
                {
                    continue;
                }

                if (guidToPath.TryGetValue(g, out string target) && IsQuarantinePath(target))
                {
                    leaks.Add(target);
                }
            }

            Assert.That(leaks, Is.Not.Empty, "scanner must detect injected TRELLIS prefab guid");
        }

        static IEnumerable<string> FindQuarantineGuidLeaks(string assetPath)
        {
            string abs = ToAbsolute(assetPath);
            if (!File.Exists(abs))
            {
                yield return assetPath + " (missing)";
                yield break;
            }

            string text = File.ReadAllText(abs);
            var guidToPath = BuildGuidMap(Application.dataPath);
            foreach (Match m in GuidRegex.Matches(text))
            {
                string g = m.Groups[1].Value.ToLowerInvariant();
                if (g.StartsWith("0000000000000000", StringComparison.Ordinal))
                {
                    continue;
                }

                if (!guidToPath.TryGetValue(g, out string target))
                {
                    continue;
                }

                if (IsQuarantinePath(target))
                {
                    yield return assetPath + " -> " + target + " (" + g + ")";
                }
            }
        }

        static Dictionary<string, string> BuildGuidMap(string assetsRoot)
        {
            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (string meta in Directory.GetFiles(assetsRoot, "*.meta", SearchOption.AllDirectories))
            {
                if (meta.Replace('\\', '/').Contains("/Library/"))
                {
                    continue;
                }

                string text = File.ReadAllText(meta);
                Match m = Regex.Match(text, @"^guid:\s*([0-9a-f]{32})\s*$", RegexOptions.Multiline);
                if (!m.Success)
                {
                    continue;
                }

                string asset = meta.Substring(0, meta.Length - ".meta".Length);
                string rel = "Assets" + asset.Substring(assetsRoot.Length).Replace('\\', '/');
                map[m.Groups[1].Value.ToLowerInvariant()] = rel;
            }

            return map;
        }

        static bool IsQuarantinePath(string path)
        {
            string n = (path ?? string.Empty).Replace('\\', '/');
            for (int i = 0; i < QuarantineMarkers.Length; i++)
            {
                if (n.IndexOf(QuarantineMarkers[i], StringComparison.OrdinalIgnoreCase) >= 0)
                {
                    return true;
                }
            }

            return false;
        }

        /// <summary>
        /// Machine-consumed Phase 0 mirror of tools/art/runtime-asset-provenance classifyBackend codes.
        /// </summary>
        static string ClassifyBackendCode(string backend)
        {
            if (string.IsNullOrEmpty(backend) || backend == "none")
            {
                return "backend_none";
            }

            string b = backend.Trim();
            if (b.IndexOf("trellis", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return "trellis_blocked";
            }

            if (b.IndexOf("tripo", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return "tripo_agent_forbidden";
            }

            if (b.IndexOf("meshy", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return "meshygen_unverified";
            }

            switch (b)
            {
                case "grok_imagine":
                case "nanobanana_gemini":
                case "openai_image":
                    return "backend_allowlisted";
                default:
                    return "unknown_backend";
            }
        }

        static bool IsBackendAllowedForRuntime(string backend)
        {
            string code = ClassifyBackendCode(backend);
            return code == "backend_none" || code == "backend_allowlisted";
        }

        static string ToAbsolute(string assetsRelative)
        {
            string rel = assetsRelative.Replace('\\', '/');
            if (rel.StartsWith("Assets/", StringComparison.Ordinal))
            {
                rel = rel.Substring("Assets/".Length);
            }

            return Path.Combine(Application.dataPath, rel);
        }
    }
}
