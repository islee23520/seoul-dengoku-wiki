using System;
using System.Collections;
using System.IO;
using System.Text;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Foundation.AppFlow;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine.TestTools;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;
using VContainer;

public sealed class UiToolkitCapturePlayModeTests
{
    const string CapturesRel = "../../.omo/evidence/poc-ugui-v4-runtime/captures";
    const int Seed = 90421;
    static string testedHead;
    static string testedFingerprint;
    static RectTransform canvasRoot;
    static RectTransform mainTitleCanvasRoot;
    static IPocCoreLoopSession session;

    [SetUp]
    public void PinTestedSource()
    {
        testedHead = RunGit("rev-parse HEAD").Trim();
        Assert.That(testedHead, Does.Match("^[0-9a-f]{40}$"));
        string repoRoot = Directory.GetParent(Application.dataPath)!.Parent!.FullName;
        testedFingerprint = UiSourceFingerprint.Compute(repoRoot);
    }

    static readonly (string Kind, int Width, int Height)[] Matrix =
    {
        ("main-title", 1280, 720),
        ("main-title", 1920, 1080),
        ("campaign-route-stage", 1280, 720),
        ("campaign-route-stage", 1920, 1080),
        ("encounter-choices", 1280, 720),
        ("encounter-choices", 1920, 1080),
        ("battle-state", 1280, 720),
        ("battle-state", 1920, 1080),
        ("settlement-return", 1280, 720),
        ("settlement-return", 1920, 1080),
    };

    [UnityTest]
    public IEnumerator Capture_C1_To_C10_Matrix_FromProductionCanvas()
    {
        Assert.That(Application.isPlaying, Is.True, "is_playing=true required");
        Directory.CreateDirectory(CaptureDir());
        yield return LoadBootstrapAndBind();

        canvasRoot = mainTitleCanvasRoot;
        yield return Capture(1280, 720, "main-title", "idle");
        yield return Capture(1920, 1080, "main-title", "idle");

        yield return LoadFoundationFromMainTitle();
        var gameplayHost = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
        Assert.That(gameplayHost, Is.Not.Null);
        yield return new TaskYield(gameplayHost.Ready, 10f, "Gameplay ready after Foundation load");
        yield return new TaskYield(gameplayHost.CoreLoopReady, 10f, "Core loop ready after Foundation load");
        Assert.That(gameplayHost.IsReady, Is.True, "GameplayUiHost readiness task completed without ready state");
        canvasRoot = gameplayHost.CanvasRoot;
        session = gameplayHost.CoreLoop;
        Assert.That(session, Is.Not.Null, "core loop session required");

        Assert.That(session.Campaign.Stage, Is.EqualTo(CampaignStage.BasePreparation));
        Assert.That(session.Campaign.Node, Is.EqualTo(StationId.Yeongdeungpo));
        yield return Capture(1280, 720, "campaign-route-stage", "route-stage");
        yield return Capture(1920, 1080, "campaign-route-stage", "route-stage");

        yield return ClickAwait(UiElementNames.ActionDepart, s => s.Campaign.Stage == CampaignStage.ExpeditionTravel);
        yield return ClickAwait(UiElementNames.StationSindorim, s => s.Campaign.Node.Equals(StationId.Sindorim));
        yield return ClickAwait(UiElementNames.ActionFaceEncounter, s => s.Campaign.Stage == CampaignStage.Encounter);
        yield return ClickAwait(UiElementNames.ActionEnterResolution, s => s.Campaign.Stage == CampaignStage.Resolution);
        yield return Capture(1280, 720, "encounter-choices", "encounter");
        yield return Capture(1920, 1080, "encounter-choices", "encounter");

        yield return ClickAwait(UiElementNames.ChoiceCombat, s => s.Battle != null && s.BattlePaused);
        yield return ClickAwait(UiElementNames.FormationSwapFront, s => s.LastClickedAction == UiElementNames.FormationSwapFront);
        yield return ClickAwait(UiElementNames.EditFormation, s => s.Battle.Deployed);
        yield return ClickAwait(UiElementNames.CardGeneralUse, s =>
            Array.Find(s.Battle.Cards, card => card.Id == "encourage-morale").RechargeTicksLeft == 600);
        yield return Capture(1280, 720, "battle-state", "battle-paused-card-recharging");
        yield return Capture(1920, 1080, "battle-state", "battle-paused-card-recharging");
        yield return ClickAwait(UiElementNames.BattlePlayPause, s => !s.BattlePaused);
        yield return WaitBattleTerminal();

        yield return ClickAwait(UiElementNames.ActionSettle, s => s.Campaign.SettlementApplied && s.LastReceipt != null);
        yield return Capture(1280, 720, "settlement-return", "settlement");
        yield return Capture(1920, 1080, "settlement-return", "settlement");
    }

    static string CaptureDir()
    {
        string env = Environment.GetEnvironmentVariable("JANSEON_CAPTURE_DIR");
        return string.IsNullOrEmpty(env)
            ? Path.GetFullPath(Path.Combine(Application.dataPath, CapturesRel))
            : env;
    }

    static IEnumerator LoadBootstrapAndBind()
    {
        var mainTitleLoaded = new SceneLoadedYield(FoundationScenes.MainTitle, 15f);
        AsyncOperation bootstrapLoad = SceneManager.LoadSceneAsync(
            FoundationScenes.Bootstrap,
            LoadSceneMode.Single);
        Assert.That(bootstrapLoad, Is.Not.Null, "Bootstrap scene load operation required");
        yield return new AsyncOperationYield(bootstrapLoad, 15f);
        yield return mainTitleLoaded;

        MainTitleUiHost title = UnityEngine.Object.FindAnyObjectByType<MainTitleUiHost>();
        Assert.That(title, Is.Not.Null, "MainTitleUiHost required");
        yield return new TaskYield(title.Ready, 10f, "MainTitle ready");

        AppLifetimeScope appScope = UnityEngine.Object.FindAnyObjectByType<AppLifetimeScope>();
        Assert.That(appScope, Is.Not.Null, "AppLifetimeScope required");
        ApplicationFlowCoordinator coordinator = appScope.Container.Resolve<ApplicationFlowCoordinator>();
        Assert.That(coordinator.CurrentTransition, Is.Not.Null);
        yield return new TaskYield(coordinator.CurrentTransition, 15f, "MainTitle commit");
        Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));
        mainTitleCanvasRoot = title.CanvasRoot;
    }

    static IEnumerator LoadFoundationFromMainTitle()
    {
        var foundationLoaded = new SceneLoadedYield(FoundationScenes.Foundation, 15f);
        Button start = UguiHudBuilder.ButtonNamed(mainTitleCanvasRoot, UiElementNames.MainTitleStart);
        Assert.That(start, Is.Not.Null, "main-title-start missing");
        start.onClick.Invoke();
        yield return foundationLoaded;

        GameplayUiHost gameplay = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
        Assert.That(gameplay, Is.Not.Null, "GameplayUiHost missing after Foundation load");
        yield return new TaskYield(gameplay.Ready, 10f, "Gameplay ready");
        yield return new TaskYield(gameplay.CoreLoopReady, 10f, "Core loop ready");
    }

    static ClickYield ClickAwait(string name, Func<IPocCoreLoopSession, bool> done)
    {
        var button = UguiHudBuilder.ButtonNamed(canvasRoot, name);
        Assert.That(button, Is.Not.Null, "missing " + name);
        var completion = new ClickYield(session, done);
        button.onClick.Invoke();
        return completion;
    }

    static IEnumerator WaitBattleTerminal()
    {
        var completion = new BattleTerminalYield(session);
        yield return completion;
    }

    static IEnumerator Capture(int width, int height, string kind, string state)
    {
        Camera camera = Camera.main != null
            ? Camera.main
            : (Camera.current != null ? Camera.current : UnityEngine.Object.FindAnyObjectByType<Camera>());
        GameObject temporaryCamera = null;
        if (camera == null)
        {
            temporaryCamera = new GameObject("UiCaptureCamera");
            camera = temporaryCamera.AddComponent<Camera>();
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = Color.black;
        }

        Canvas canvas = canvasRoot.GetComponentInParent<Canvas>();
        Assert.That(canvas, Is.Not.Null, "production Canvas required for " + kind);

        var target = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
        var tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
        RenderTexture previousActive = RenderTexture.active;
        RenderTexture previousTarget = camera.targetTexture;
        RenderMode previousRenderMode = canvas.renderMode;
        Camera previousWorldCamera = canvas.worldCamera;
        float previousPlaneDistance = canvas.planeDistance;
        try
        {
            target.Create();
            camera.targetTexture = target;
            canvas.renderMode = RenderMode.ScreenSpaceCamera;
            canvas.worldCamera = camera;
            canvas.planeDistance = Mathf.Max(camera.nearClipPlane + 0.1f, 1f);
            Canvas.ForceUpdateCanvases();
            camera.Render();
            RenderTexture.active = target;
            tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            tex.Apply();

            Color32[] pixels = tex.GetPixels32();
            Color32 first = pixels[0];
            int nonDark = 0, varied = 0, textLum = 0;
            foreach (Color32 p in pixels)
            {
                float lum = 0.2126f * p.r + 0.7152f * p.g + 0.0722f * p.b;
                if (lum > 20f) { nonDark++; }
                if (lum >= 140f) { textLum++; }
                if (Mathf.Abs(p.r - first.r) > 4
                    || Mathf.Abs(p.g - first.g) > 4
                    || Mathf.Abs(p.b - first.b) > 4)
                {
                    varied++;
                }
            }

            Assert.That(nonDark, Is.GreaterThan(0), kind + " capture has no non-dark pixels");
            Assert.That(varied, Is.GreaterThan(0), kind + " capture is a flat frame");

            string stem = kind + "-" + width + "x" + height;
            byte[] png = ImageConversion.EncodeToPNG(tex);
            string dir = CaptureDir();
            string pngPath = Path.Combine(dir, stem + ".png");
            File.WriteAllBytes(pngPath, png);

            string sha;
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                sha = BitConverter.ToString(sha256.ComputeHash(png)).Replace("-", "").ToLowerInvariant();
            }
            var sb = new StringBuilder();
            sb.Append('{');
            sb.Append("\"stem\": \"").Append(stem).Append("\", ");
            sb.Append("\"kind\": \"").Append(kind).Append("\", ");
            sb.Append("\"unity\": \"").Append(Application.unityVersion).Append("\", ");
            sb.Append("\"width\": ").Append(width).Append(", ");
            sb.Append("\"height\": ").Append(height).Append(", ");
            sb.Append("\"seed\": ").Append(Seed).Append(", ");
            sb.Append("\"state\": \"").Append(state).Append("\", ");
            sb.Append("\"state_hash\": \"").Append(ComputeStateHash(state)).Append("\", ");
            sb.Append("\"head\": \"").Append(testedHead).Append("\", ");
            sb.Append("\"dirty_tree_fingerprint\": \"").Append(testedFingerprint).Append("\", ");
            sb.Append("\"active_scene\": \"").Append(SceneManager.GetActiveScene().path.Replace("\\", "/")).Append("\", ");
            sb.Append("\"uidocument_root_names\": [\"").Append(canvasRoot.name).Append("\"], ");
            sb.Append("\"capture_api\": \"PlayMode Camera.targetTexture+Camera.Render+ReadPixels\", ");
            sb.Append("\"is_playing\": true, ");
            sb.Append("\"png\": \"").Append(stem).Append(".png\", ");
            sb.Append("\"tested_route\": \"").Append(TestedRoute(state)).Append("\", ");
            sb.Append("\"captured_at_utc\": \"").Append(DateTime.UtcNow.ToString("o")).Append("\", ");
            sb.Append("\"png_sha256\": \"").Append(sha).Append("\"");
            sb.Append(" }");
            File.WriteAllText(Path.Combine(dir, stem + ".receipt.json"), sb.ToString());

            Debug.Log("CAPTURE_OK " + stem + " nonDark=" + nonDark + " varied=" + varied
                + " textLum=" + textLum + " sha=" + sha.Substring(0, 16));
        }
        finally
        {
            canvas.renderMode = previousRenderMode;
            canvas.worldCamera = previousWorldCamera;
            canvas.planeDistance = previousPlaneDistance;
            camera.targetTexture = previousTarget;
            RenderTexture.active = previousActive;
            target.Release();
            UnityEngine.Object.Destroy(target);
            UnityEngine.Object.Destroy(tex);
            if (temporaryCamera != null)
            {
                UnityEngine.Object.Destroy(temporaryCamera);
            }
        }
        yield break;
    }

    static string ComputeStateHash(string state)
    {
        string scene = SceneManager.GetActiveScene().path.Replace("\\", "/");
        string machineState = session == null
            ? "title|" + state + "|" + scene + "|" + (mainTitleCanvasRoot?.name ?? string.Empty)
            : "gameplay|" + state + "|" + scene + "|" + session.CampaignHash + "|"
                + session.BattleHash + "|paused=" + session.BattlePaused;
        using var sha256 = System.Security.Cryptography.SHA256.Create();
        byte[] hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(machineState));
        return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
    }

    static string TestedRoute(string state)
    {
        return state switch
        {
            "idle" => "Bootstrap>MainTitle",
            "route-stage" => "Bootstrap>MainTitle>Start>Foundation:BasePreparation@Yeongdeungpo",
            "encounter" => "Depart>Travel:Sindorim>FaceEncounter>EnterResolution",
            "battle-paused-card-recharging" => "ChooseCombat>SwapFormation>Deploy>PlayGeneralCard:Paused",
            "settlement" => "Resume>Terminal>Settle",
            _ => state,
        };
    }

    static string RunGit(string args)
    {
        string repoRoot = Directory.GetParent(Application.dataPath)!.Parent!.FullName;
        var psi = new System.Diagnostics.ProcessStartInfo("git", args)
        {
            WorkingDirectory = repoRoot,
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        using var proc = System.Diagnostics.Process.Start(psi);
        string output = proc.StandardOutput.ReadToEnd();
        proc.WaitForExit();
        return output;
    }
}

public sealed class SceneLoadedYield : CustomYieldInstruction
{
    readonly string path;
    readonly float deadline;
    bool complete;

    public SceneLoadedYield(string path, float timeoutSeconds)
    {
        this.path = path;
        deadline = Time.realtimeSinceStartup + timeoutSeconds;
        SceneManager.sceneLoaded += OnLoaded;
        if (SceneManager.GetSceneByPath(path).isLoaded) Complete();
    }

    void OnLoaded(Scene scene, LoadSceneMode _)
    {
        if (scene.path == path) Complete();
    }

    void Complete()
    {
        complete = true;
        SceneManager.sceneLoaded -= OnLoaded;
    }

    public override bool keepWaiting
    {
        get
        {
            if (!complete && Time.realtimeSinceStartup >= deadline)
            {
                SceneManager.sceneLoaded -= OnLoaded;
                Assert.Fail("timed out awaiting scene " + path);
            }
            return !complete;
        }
    }
}

public sealed class AsyncOperationYield : CustomYieldInstruction
{
    readonly AsyncOperation operation;
    readonly float deadline;
    bool complete;

    public AsyncOperationYield(AsyncOperation operation, float timeoutSeconds)
    {
        this.operation = operation;
        deadline = Time.realtimeSinceStartup + timeoutSeconds;
        operation.completed += OnCompleted;
        if (operation.isDone) Complete();
    }

    void OnCompleted(AsyncOperation _) => Complete();

    void Complete()
    {
        complete = true;
        operation.completed -= OnCompleted;
    }

    public override bool keepWaiting
    {
        get
        {
            if (!complete && Time.realtimeSinceStartup >= deadline)
            {
                operation.completed -= OnCompleted;
                Assert.Fail("timed out awaiting AsyncOperation");
            }
            return !complete;
        }
    }
}

public sealed class TaskYield : CustomYieldInstruction
{
    readonly System.Threading.Tasks.Task task;
    readonly float deadline;
    readonly string label;
    bool complete;

    public TaskYield(System.Threading.Tasks.Task task, float timeoutSeconds, string label)
    {
        this.task = task;
        this.label = label;
        deadline = Time.realtimeSinceStartup + timeoutSeconds;
        task.GetAwaiter().OnCompleted(() => complete = true);
        if (task.IsCompleted) complete = true;
    }

    public override bool keepWaiting
    {
        get
        {
            if (!complete && Time.realtimeSinceStartup >= deadline) Assert.Fail("timed out awaiting " + label);
            if (complete) task.GetAwaiter().GetResult();
            return !complete;
        }
    }
}

public sealed class BattleTerminalYield : CustomYieldInstruction
{
    readonly IPocCoreLoopSession session;
    readonly float deadline;
    bool complete;

    public BattleTerminalYield(IPocCoreLoopSession session)
    {
        this.session = session;
        deadline = Time.realtimeSinceStartup + 60f;
        session.StateChanged += OnChanged;
        OnChanged();
    }

    void OnChanged()
    {
        if (session.Battle == null || session.Battle.Outcome == BattleOutcomeKind.Ongoing) return;
        complete = true;
        session.StateChanged -= OnChanged;
    }

    public override bool keepWaiting
    {
        get
        {
            if (!complete && Time.realtimeSinceStartup >= deadline)
            {
                session.StateChanged -= OnChanged;
                Assert.Fail("timed out awaiting terminal realtime battle");
            }
            return !complete;
        }
    }
}

public sealed class ClickYield : CustomYieldInstruction
{
    readonly Func<IPocCoreLoopSession, bool> done;
    readonly IPocCoreLoopSession session;
    readonly float deadline;
    bool complete;

    public ClickYield(IPocCoreLoopSession session, Func<IPocCoreLoopSession, bool> done)
    {
        this.session = session;
        this.done = done;
        deadline = Time.realtimeSinceStartup + 8f;
        session.StateChanged += OnChanged;
        OnChanged();
    }

    void OnChanged()
    {
        if (!done(session)) return;
        complete = true;
        session.StateChanged -= OnChanged;
    }

    public override bool keepWaiting
    {
        get
        {
            if (!complete && Time.realtimeSinceStartup >= deadline)
            {
                session.StateChanged -= OnChanged;
                Assert.Fail("timed out awaiting state after UI click");
            }
            return !complete;
        }
    }
}
