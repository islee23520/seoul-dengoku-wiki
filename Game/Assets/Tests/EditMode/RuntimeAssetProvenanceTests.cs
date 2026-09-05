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
    /// Playable scenes/UI may only reference code-native UI geometry or verified promoted assets.
    /// Provider eligibility never replaces asset provenance.
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
        public void ProviderPolicy_RetainsTrellisWithoutApprovingAssets()
        {
            foreach (string backend in BlockedBackends)
            {
                if (backend == "trellis_v1") continue;
                Assert.That(IsBackendAllowedForRuntime(backend), Is.False, backend + " must fail closed for runtime");
            }

            Assert.That(IsBackendAllowedForRuntime("trellis_v1"), Is.True,
                "retained provider option must not be globally banned");
            Assert.That(IsBackendAllowedForRuntime("grok_imagine"), Is.True);
            Assert.That(IsBackendAllowedForRuntime("nanobanana_gemini"), Is.True);
            Assert.That(IsBackendAllowedForRuntime("openai_image"), Is.True);
            Assert.That(IsBackendAllowedForRuntime("none"), Is.True);
        }

        [Test]
        public void StationPropBom_UnboundReviewCannotApproveRuntime()
        {
            NodeResult result = RunProvenance(
                "evaluatePromotedAsset({asset_id:'poc-prop-bench',asset_class:'prop',"
                + "generation_backend:'trellis_v1',provider:'microsoft',status:'promoted',"
                + "rights_status:'allowed',review_receipts:[{verdict:'pass',receipt_hash:'a'.repeat(64)}]})");
            Assert.That(result.ok, Is.False, "provider and synthetic review hash cannot approve an asset");
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
            const string guid = "71cdea5c20934aa59fdd7265e4fd2cec";
            string fakeScene = "m_SourcePrefab: {fileID: 100100000, guid: " + guid + ", type: 3}";
            var guidToPath = new Dictionary<string, string>
            {
                [guid] = "Assets/Janseon/ArtSource/Props/unreviewed.prefab",
            };
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

        [Serializable]
        sealed class NodeResult
        {
            public bool ok;
        }

        static bool IsBackendAllowedForRuntime(string backend)
            => RunProvenance("classifyBackend('" + backend + "')").ok;

        static NodeResult RunProvenance(string expression)
        {
            var info = new System.Diagnostics.ProcessStartInfo("node")
            {
                WorkingDirectory = Path.GetFullPath(Path.Combine(Application.dataPath, "../..")),
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            info.ArgumentList.Add("--input-type=module");
            info.ArgumentList.Add("-e");
            info.ArgumentList.Add("import {classifyBackend,evaluatePromotedAsset} from './tools/art/runtime-asset-provenance.mjs';"
                + "console.log(JSON.stringify(" + expression + "));");
            using var process = System.Diagnostics.Process.Start(info);
            var stdout = process.StandardOutput.ReadToEndAsync();
            var stderr = process.StandardError.ReadToEndAsync();
            if (!process.WaitForExit(15000))
            {
                process.Kill();
                Assert.Fail("runtime provenance Node process timed out");
            }
            Assert.That(process.ExitCode, Is.Zero, stderr.GetAwaiter().GetResult());
            return JsonUtility.FromJson<NodeResult>(stdout.GetAwaiter().GetResult());
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
