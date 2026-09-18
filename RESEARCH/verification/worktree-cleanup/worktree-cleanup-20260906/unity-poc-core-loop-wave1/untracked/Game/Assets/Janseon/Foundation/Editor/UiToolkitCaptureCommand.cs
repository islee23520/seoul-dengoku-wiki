using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UIElements;
using Debug = UnityEngine.Debug;
using Object = UnityEngine.Object;

namespace Janseon.Foundation.Editor
{
    /// <summary>
    /// PlayMode capture via a dedicated runtime UIDocument (no VContainer scene host).
    /// EnterPlayMode on an empty unsaved scene, instantiate UXML+PanelSettings, apply presenters,
    /// wait frames for panel geometry, capture opaque full-frame PNG with is_playing=true.
    /// Invoke without -quit; calls EditorApplication.Exit.
    /// </summary>
    public static class UiToolkitCaptureCommand
    {
        const string EvidenceRoot =
            "../.omo/evidence/unity-poc-core-loop/task-11-ui-toolkit/captures";

        static readonly (string stem, int w, int h, CaptureKind kind)[] Matrix =
        {
            ("main-title-1280x720", 1280, 720, CaptureKind.MainTitle),
            ("main-title-1920x1080", 1920, 1080, CaptureKind.MainTitle),
            ("campaign-route-stage-1280x720", 1280, 720, CaptureKind.RouteStage),
            ("campaign-route-stage-1920x1080", 1920, 1080, CaptureKind.RouteStage),
            ("encounter-choices-1280x720", 1280, 720, CaptureKind.Encounter),
            ("encounter-choices-1920x1080", 1920, 1080, CaptureKind.Encounter),
            ("battle-state-1280x720", 1280, 720, CaptureKind.Battle),
            ("battle-state-1920x1080", 1920, 1080, CaptureKind.Battle),
            ("settlement-return-1280x720", 1280, 720, CaptureKind.Settlement),
            ("settlement-return-1920x1080", 1920, 1080, CaptureKind.Settlement),
        };

        enum CaptureKind
        {
            MainTitle,
            RouteStage,
            Encounter,
            Battle,
            Settlement,
        }

        static int s_index;
        static int s_endExclusive;
        static bool s_running;
        static bool s_waitingPlay;
        static bool s_waitingEdit;
        static bool s_captureArmed;
        static int s_frameWait;
        static string s_lastError;
        static bool s_singleOnly;
        static GameObject s_captureGo;
        static UIDocument s_doc;
        static RenderTexture s_rt;
        static PanelSettings s_panel;
        static Vector2Int s_prevRes;
        static RenderTexture s_prevTarget;
        static bool s_prevClear;
        static Color s_prevClearColor;
        static PanelScaleMode s_prevScale;
        static float s_prevScaleValue;

        public static void CaptureMainTitleProof1280()
        {
            s_singleOnly = true;
            StartMatrixFrom(0, 1);
        }

        public static void CaptureUiToolkitMatrix()
        {
            s_singleOnly = false;
            StartMatrixFrom(0, Matrix.Length);
        }

        static void StartMatrixFrom(int start, int count)
        {
            if (s_running)
            {
                throw new InvalidOperationException("capture already running");
            }

            string outDir = ResolveOutDir();
            Directory.CreateDirectory(outDir);
            s_index = start;
            s_endExclusive = Math.Min(start + count, Matrix.Length);
            for (int i = s_index; i < s_endExclusive; i++)
            {
                var entry = Matrix[i];
                string png = Path.Combine(outDir, entry.stem + ".png");
                string receipt = Path.Combine(outDir, entry.stem + ".receipt.json");
                if (File.Exists(png)) File.Delete(png);
                if (File.Exists(receipt)) File.Delete(receipt);
            }

            s_running = true;
            s_lastError = null;
            s_waitingPlay = false;
            s_waitingEdit = false;
            s_captureArmed = false;
            s_frameWait = 0;

            EditorApplication.playModeStateChanged += OnPlayModeStateChanged;
            EditorApplication.update += OnEditorUpdate;
            Debug.Log("UI_CAPTURE_MATRIX_BEGIN method=dedicated-playmode-uidocument from="
                + s_index + " end=" + s_endExclusive + " dir=" + outDir);
            BeginCurrentEntry();
        }

        static void BeginCurrentEntry()
        {
            if (s_index >= s_endExclusive)
            {
                Finish(0);
                return;
            }

            if (EditorApplication.isPlaying)
            {
                s_waitingEdit = true;
                EditorApplication.isPlaying = false;
                return;
            }

            // Empty unsaved scene avoids VContainer LifetimeScope DI failures.
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            s_waitingPlay = true;
            s_captureArmed = false;
            s_frameWait = 0;
            EditorApplication.isPlaying = true;
        }

        static void OnPlayModeStateChanged(PlayModeStateChange state)
        {
            if (!s_running)
            {
                return;
            }

            if (state == PlayModeStateChange.EnteredPlayMode && s_waitingPlay)
            {
                s_waitingPlay = false;
                try
                {
                    BuildDedicatedDocument(Matrix[s_index]);
                    s_captureArmed = true;
                    s_frameWait = 0;
                }
                catch (Exception ex)
                {
                    s_lastError = ex.ToString();
                    Debug.LogError("UI_CAPTURE_FAIL build " + ex);
                    Finish(1);
                }
            }
            else if (state == PlayModeStateChange.EnteredEditMode && s_waitingEdit)
            {
                s_waitingEdit = false;
                CleanupCaptureGo();
                BeginCurrentEntry();
            }
        }

        static void OnEditorUpdate()
        {
            if (!s_running || !s_captureArmed || !EditorApplication.isPlaying)
            {
                return;
            }

            s_frameWait++;
            if (s_frameWait < 5)
            {
                return;
            }

            // Require root geometry before capture.
            if (s_doc == null || s_doc.rootVisualElement == null)
            {
                if (s_frameWait < 30)
                {
                    return;
                }

                s_captureArmed = false;
                s_lastError = "UIDocument root never materialized";
                Debug.LogError("UI_CAPTURE_FAIL " + s_lastError);
                Finish(1);
                return;
            }

            VisualElement root = s_doc.rootVisualElement;
            var entry = Matrix[s_index];
            if (root.worldBound.width < entry.w * 0.5f && s_frameWait < 20)
            {
                root.MarkDirtyRepaint();
                return;
            }

            s_captureArmed = false;
            try
            {
                CaptureCurrentInPlayMode();
                s_index++;
                s_waitingEdit = true;
                EditorApplication.isPlaying = false;
            }
            catch (Exception ex)
            {
                s_lastError = ex.ToString();
                Debug.LogError("UI_CAPTURE_FAIL " + ex);
                Finish(1);
            }
        }

        static void BuildDedicatedDocument((string stem, int w, int h, CaptureKind kind) entry)
        {
            CleanupCaptureGo();

            var panel = AssetDatabase.LoadAssetAtPath<PanelSettings>(UiScreenPaths.PanelSettings);
            if (panel == null)
            {
                throw new InvalidOperationException("PanelSettings missing at " + UiScreenPaths.PanelSettings);
            }

            string uxmlPath = entry.kind == CaptureKind.MainTitle
                ? UiScreenPaths.MainTitleUxml
                : UiScreenPaths.GameplayUxml;
            var tree = AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(uxmlPath);
            if (tree == null)
            {
                throw new InvalidOperationException("UXML missing " + uxmlPath);
            }

            s_panel = panel;
            s_prevRes = panel.referenceResolution;
            s_prevTarget = panel.targetTexture;
            s_prevClear = panel.clearColor;
            s_prevClearColor = panel.colorClearValue;
            s_prevScale = panel.scaleMode;
            s_prevScaleValue = panel.scale;

            panel.referenceResolution = new Vector2Int(entry.w, entry.h);
            panel.scaleMode = PanelScaleMode.ConstantPixelSize;
            panel.scale = 1f;
            panel.clearColor = true;
            panel.colorClearValue = new Color(0.043f, 0.067f, 0.118f, 1f);

            s_rt = new RenderTexture(entry.w, entry.h, 24, RenderTextureFormat.ARGB32);
            s_rt.antiAliasing = 1;
            s_rt.Create();
            panel.targetTexture = s_rt;

            s_captureGo = new GameObject("UiToolkitCaptureDocument");
            s_doc = s_captureGo.AddComponent<UIDocument>();
            s_doc.panelSettings = panel;
            s_doc.visualTreeAsset = tree;

            Debug.Log("UI_CAPTURE_DOC_BUILT stem=" + entry.stem
                + " uxml=" + uxmlPath
                + " is_playing=" + Application.isPlaying);
        }

        static void CaptureCurrentInPlayMode()
        {
            var entry = Matrix[s_index];
            string outDir = ResolveOutDir();
            string pngPath = Path.Combine(outDir, entry.stem + ".png");
            string receiptPath = Path.Combine(outDir, entry.stem + ".receipt.json");

            if (!Application.isPlaying)
            {
                throw new InvalidOperationException("Capture requires PlayMode is_playing=true");
            }

            if (s_doc == null || s_rt == null || s_panel == null)
            {
                throw new InvalidOperationException("Dedicated UIDocument not built");
            }

            VisualElement root = s_doc.rootVisualElement;
            if (root == null)
            {
                throw new InvalidOperationException("rootVisualElement null");
            }

            root.style.position = Position.Absolute;
            root.style.left = 0;
            root.style.top = 0;
            root.style.right = 0;
            root.style.bottom = 0;
            root.style.width = entry.w;
            root.style.height = entry.h;
            root.style.backgroundColor = new Color(0.043f, 0.067f, 0.118f, 1f);

            ApplyLiveState(entry.kind, root, entry.w, 90421, out string stateLabel, out string stateHash);

            root.MarkDirtyRepaint();
            for (int i = 0; i < 8; i++)
            {
                root.MarkDirtyRepaint();
            }

            var prev = RenderTexture.active;
            RenderTexture.active = s_rt;
            GL.Clear(true, true, s_panel.colorClearValue);
            RenderTexture.active = prev;

            bool captured = VisualElementCaptureExtensions.TryCaptureIntoRenderTexture(root, s_rt);
            string captureApi = "PlayMode+dedicatedUIDocument+TryCaptureIntoRenderTexture";
            if (!captured && root.panel != null && root.panel.visualTree != null)
            {
                captured = VisualElementCaptureExtensions.TryCaptureIntoRenderTexture(root.panel.visualTree, s_rt);
                captureApi = "PlayMode+dedicatedUIDocument+panel.visualTree";
            }

            if (!captured)
            {
                throw new InvalidOperationException("TryCaptureIntoRenderTexture failed for " + entry.stem);
            }

            RenderTexture.active = s_rt;
            var tex = new Texture2D(entry.w, entry.h, TextureFormat.RGBA32, false);
            tex.ReadPixels(new Rect(0, 0, entry.w, entry.h), 0, 0);
            tex.Apply();
            RenderTexture.active = null;

            Color32[] pixels = tex.GetPixels32();
            Color32 voidC = new Color32(11, 17, 28, 255);
            int alpha0 = 0;
            int textLum = 0;
            int nonDark = 0;
            for (int i = 0; i < pixels.Length; i++)
            {
                Color32 p = pixels[i];
                if (p.a < 250)
                {
                    float a = p.a / 255f;
                    pixels[i] = new Color32(
                        (byte)(p.r * a + voidC.r * (1f - a)),
                        (byte)(p.g * a + voidC.g * (1f - a)),
                        (byte)(p.b * a + voidC.b * (1f - a)),
                        255);
                    if (p.a == 0)
                    {
                        alpha0++;
                    }

                    p = pixels[i];
                }

                float lum = 0.2126f * p.r + 0.7152f * p.g + 0.0722f * p.b;
                if (lum > 20f)
                {
                    nonDark++;
                }

                if (lum >= 140f)
                {
                    textLum++;
                }
            }

            tex.SetPixels32(pixels);
            tex.Apply();

            if (nonDark < pixels.Length / 50)
            {
                Object.DestroyImmediate(tex);
                throw new InvalidOperationException(
                    "Capture too blank for " + entry.stem + " nonDark=" + nonDark + " textLum=" + textLum);
            }

            CollectRootNames(root, out string rootNames);
            string head = RunGit("rev-parse HEAD").Trim();
            string dirtyFp = Sha256Hex(RunGit("status --porcelain").Trim());
            byte[] pngBytes = tex.EncodeToPNG();
            // Atomic write
            string tmpPng = pngPath + ".tmp";
            File.WriteAllBytes(tmpPng, pngBytes);
            if (File.Exists(pngPath)) File.Delete(pngPath);
            File.Move(tmpPng, pngPath);

            bool isPlaying = Application.isPlaying;
            string receipt = BuildReceipt(
                entry.stem, entry.kind.ToString(), entry.w, entry.h, 90421, stateLabel, stateHash,
                head, dirtyFp, SceneManager.GetActiveScene().path, rootNames, captureApi,
                true, nonDark > 0, pngPath, isPlaying, alpha0, nonDark, textLum,
                Sha256HexBytes(pngBytes));
            string tmpRec = receiptPath + ".tmp";
            File.WriteAllText(tmpRec, receipt);
            if (File.Exists(receiptPath)) File.Delete(receiptPath);
            File.Move(tmpRec, receiptPath);

            Object.DestroyImmediate(tex);

            Debug.Log("UI_CAPTURE_OK " + entry.stem
                + " is_playing=" + isPlaying
                + " nonDark=" + nonDark
                + " textLum=" + textLum
                + " alpha0pre=" + alpha0
                + " roots=" + rootNames
                + " -> " + pngPath);
        }

        static void ApplyLiveState(
            CaptureKind kind,
            VisualElement root,
            int width,
            int seed,
            out string stateLabel,
            out string stateHash)
        {
            if (kind == CaptureKind.MainTitle)
            {
                VisualElement titleRoot = root.name == UiElementNames.MainTitleRoot
                    ? root
                    : root.Q(UiElementNames.MainTitleRoot) ?? root;
                titleRoot.EnableInClassList(UiElementNames.Res720Class, width < 1600);
                titleRoot.EnableInClassList(UiElementNames.Res1080Class, width >= 1600);
                var presenter = new MainTitlePresenter(new ApplicationFlowCoordinator(new CaptureNoopLoader()));
                if (!presenter.Bind(titleRoot))
                {
                    throw new InvalidOperationException("MainTitlePresenter bind failed");
                }

                stateLabel = "MainTitle.idle";
                stateHash = CoreApi.StableHashHex("capture=main-title;seed=" + seed);
                return;
            }

            var presenterGp = new GameplayPresenter();
            if (!presenterGp.Bind(root))
            {
                VisualElement gameplay = root.Q(UiElementNames.GameplayRoot) ?? root;
                if (!presenterGp.Bind(gameplay))
                {
                    throw new InvalidOperationException("GameplayPresenter bind failed in PlayMode");
                }
            }

            presenterGp.ApplyResolutionClass(width);
            CampaignState campaign = BuildCampaign(kind, seed, out BattleState battle, out stateHash);
            presenterGp.ApplySnapshot(GameplayUiSnapshot.FromCampaign(campaign, battle));
            stateLabel = kind + "@" + (campaign.Node.Value ?? string.Empty) + "/stage=" + campaign.Stage;
        }

        static void CleanupCaptureGo()
        {
            RestorePanel();
            if (s_captureGo != null)
            {
                Object.DestroyImmediate(s_captureGo);
                s_captureGo = null;
            }

            s_doc = null;
        }

        static void RestorePanel()
        {
            if (s_panel != null)
            {
                s_panel.referenceResolution = s_prevRes;
                s_panel.targetTexture = s_prevTarget;
                s_panel.clearColor = s_prevClear;
                s_panel.colorClearValue = s_prevClearColor;
                s_panel.scaleMode = s_prevScale;
                s_panel.scale = s_prevScaleValue;
                EditorUtility.SetDirty(s_panel);
            }

            if (s_rt != null)
            {
                s_rt.Release();
                Object.DestroyImmediate(s_rt);
                s_rt = null;
            }

            s_panel = null;
        }

        static void Finish(int exitCode)
        {
            s_running = false;
            s_captureArmed = false;
            EditorApplication.playModeStateChanged -= OnPlayModeStateChanged;
            EditorApplication.update -= OnEditorUpdate;
            CleanupCaptureGo();
            if (exitCode == 0)
            {
                Debug.Log("UI_CAPTURE_MATRIX_OK count=" + s_endExclusive
                    + " method=dedicated-playmode-uidocument single=" + s_singleOnly
                    + " dir=" + ResolveOutDir());
            }
            else
            {
                Debug.LogError("UI_CAPTURE_MATRIX_FAIL " + s_lastError);
            }

            AssetDatabase.SaveAssets();
            EditorApplication.Exit(exitCode);
        }

        static CampaignState BuildCampaign(
            CaptureKind kind,
            int seed,
            out BattleState battle,
            out string stateHash)
        {
            battle = null;
            var graph = RouteGraph.CreateYeongdeungpoSindorimGuro();
            var ledger = new Ledger();
            CampaignState s = CampaignApi.Start(seed, StationId.Yeongdeungpo, "ui-capture");

            if (kind == CaptureKind.RouteStage)
            {
                stateHash = CampaignApi.ComputeStateHash(s);
                return s;
            }

            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("d"),
                Kind = CampaignCommandKind.Depart,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("t"),
                Kind = CampaignCommandKind.Travel,
                TravelDestination = StationId.Sindorim,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("e"),
                Kind = CampaignCommandKind.FaceEncounter,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("r"),
                Kind = CampaignCommandKind.EnterResolution,
            });

            if (kind == CaptureKind.Encounter)
            {
                stateHash = CampaignApi.ComputeStateHash(s);
                return s;
            }

            if (kind == CaptureKind.Battle)
            {
                object combat = CampaignApi.Apply(graph, s, ledger, new CampaignCommand
                {
                    Id = new CommandId("c"),
                    Kind = CampaignCommandKind.ChooseCombat,
                });
                var ctx = ((BattleRequired)combat).Context;
                battle = BattleApi.Open(ctx);
                s = (CampaignState)CampaignApi.AttachPendingBattle(s, ledger, ctx, new CommandId("a"));
                stateHash = BattleApi.ComputeBattleHash(battle, null);
                return s;
            }

            s = CampaignApi.Start(seed, StationId.Yeongdeungpo, "ui-capture-settle");
            ledger = new Ledger();
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("d2"),
                Kind = CampaignCommandKind.Depart,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("t2"),
                Kind = CampaignCommandKind.Travel,
                TravelDestination = StationId.Sindorim,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("e2"),
                Kind = CampaignCommandKind.FaceEncounter,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("r2"),
                Kind = CampaignCommandKind.EnterResolution,
            });
            s = (CampaignState)CampaignApi.Apply(graph, s, ledger, new CampaignCommand
            {
                Id = new CommandId("n"),
                Kind = CampaignCommandKind.ChooseNegotiate,
            });
            var book = new SettlementBook();
            EncounterResult result = SettlementApi.FromNonCombat(s);
            object settled = SettlementApi.Apply(s, ledger, book, result);
            s = ((SettlementSuccess)settled).State;
            battle = null;
            stateHash = CampaignApi.ComputeStateHash(s);
            return s;
        }

        static void CollectRootNames(VisualElement root, out string joined)
        {
            var names = new List<string>();
            void Walk(VisualElement el, int depth)
            {
                if (el == null || depth > 6)
                {
                    return;
                }

                if (!string.IsNullOrEmpty(el.name))
                {
                    names.Add(el.name);
                }

                for (int i = 0; i < el.childCount; i++)
                {
                    Walk(el[i], depth + 1);
                }
            }

            Walk(root, 0);
            joined = string.Join(",", names);
        }

        static string BuildReceipt(
            string stem,
            string kind,
            int w,
            int h,
            int seed,
            string state,
            string stateHash,
            string head,
            string dirtyFp,
            string scenePath,
            string rootNames,
            string captureApi,
            bool tryOk,
            bool nonEmpty,
            string pngPath,
            bool isPlaying,
            int alpha0Pre,
            int nonDark,
            int textLum,
            string pngSha)
        {
            var sb = new StringBuilder();
            sb.Append("{\n");
            sb.Append("  \"stem\": \"").Append(stem).Append("\",\n");
            sb.Append("  \"kind\": \"").Append(kind).Append("\",\n");
            sb.Append("  \"unity\": \"6000.7.0a5\",\n");
            sb.Append("  \"width\": ").Append(w).Append(",\n");
            sb.Append("  \"height\": ").Append(h).Append(",\n");
            sb.Append("  \"seed\": ").Append(seed).Append(",\n");
            sb.Append("  \"state\": \"").Append(Escape(state)).Append("\",\n");
            sb.Append("  \"state_hash\": \"").Append(stateHash).Append("\",\n");
            sb.Append("  \"head\": \"").Append(head).Append("\",\n");
            sb.Append("  \"dirty_tree_fingerprint\": \"").Append(dirtyFp).Append("\",\n");
            sb.Append("  \"active_scene\": \"").Append(Escape(scenePath)).Append("\",\n");
            sb.Append("  \"uidocument_root_names\": \"").Append(Escape(rootNames)).Append("\",\n");
            sb.Append("  \"capture_api\": \"").Append(captureApi).Append("\",\n");
            sb.Append("  \"try_capture_ok\": ").Append(tryOk ? "true" : "false").Append(",\n");
            sb.Append("  \"non_empty_pixels\": ").Append(nonEmpty ? "true" : "false").Append(",\n");
            sb.Append("  \"is_playing\": ").Append(isPlaying ? "true" : "false").Append(",\n");
            sb.Append("  \"alpha0_pre_composite\": ").Append(alpha0Pre).Append(",\n");
            sb.Append("  \"non_dark_pixels\": ").Append(nonDark).Append(",\n");
            sb.Append("  \"text_luminance_pixels\": ").Append(textLum).Append(",\n");
            sb.Append("  \"png_sha256\": \"").Append(pngSha).Append("\",\n");
            sb.Append("  \"png\": \"").Append(pngPath.Replace("\\", "/")).Append("\",\n");
            sb.Append("  \"captured_at_utc\": \"").Append(DateTime.UtcNow.ToString("o")).Append("\"\n");
            sb.Append("}\n");
            return sb.ToString();
        }

        static string Escape(string s)
            => (s ?? string.Empty).Replace("\\", "\\\\").Replace("\"", "\\\"");

        static string ResolveOutDir()
        {
            string projectRoot = Directory.GetParent(Application.dataPath)!.FullName;
            return Path.GetFullPath(Path.Combine(projectRoot, EvidenceRoot));
        }

        static string RunGit(string args)
        {
            string repoRoot = Directory.GetParent(Application.dataPath)!.Parent!.FullName;
            var psi = new ProcessStartInfo("git", args)
            {
                WorkingDirectory = repoRoot,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var p = Process.Start(psi);
            string output = p!.StandardOutput.ReadToEnd();
            p.WaitForExit(30_000);
            return output;
        }

        static string Sha256Hex(string content)
            => Sha256HexBytes(Encoding.UTF8.GetBytes(content ?? string.Empty));

        static string Sha256HexBytes(byte[] bytes)
        {
            using var sha = SHA256.Create();
            byte[] hash = sha.ComputeHash(bytes ?? Array.Empty<byte>());
            var sb = new StringBuilder(hash.Length * 2);
            for (int i = 0; i < hash.Length; i++)
            {
                sb.Append(hash[i].ToString("x2"));
            }

            return sb.ToString();
        }

        sealed class CaptureNoopLoader : IContentSceneLoader
        {
            public Task<IContentSceneLease> LoadAsync(ContentScreenId screen, CancellationToken cancellationToken)
                => Task.FromResult<IContentSceneLease>(new CaptureNoopLease(screen));
        }

        sealed class CaptureNoopLease : IContentSceneLease
        {
            public CaptureNoopLease(ContentScreenId screen) => Screen = screen;
            public ContentScreenId Screen { get; }
            public Task Ready => Task.CompletedTask;
            public void Dispose() { }
            public Task CleanupAsync() => Task.CompletedTask;
        }
    }
}
