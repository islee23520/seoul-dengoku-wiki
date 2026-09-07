using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Janseon.Core;
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

        yield return Capture(1280, 720, "main-title", "idle");
        yield return Capture(1920, 1080, "main-title", "idle");

        var gameplayHost = UnityEngine.Object.FindFirstObjectByType<GameplayUiHost>();
        Assert.That(gameplayHost, Is.Not.Null);
        Assert.That(gameplayHost.IsReady, Is.True);
        canvasRoot = gameplayHost.CanvasRoot;
        session = gameplayHost.CoreLoop;
        Assert.That(session, Is.Not.Null, "core loop session required");

        yield return ClickAwait(UiElementNames.ActionDepart, s => s.Campaign.Stage == CampaignStage.ExpeditionTravel);
        yield return Capture(1280, 720, "campaign-route-stage", "route");
        yield return Capture(1920, 1080, "campaign-route-stage", "route");

        yield return ClickAwait(UiElementNames.StationSindorim, s => s.Campaign.Node.Equals(StationId.Sindorim));
        yield return ClickAwait(UiElementNames.ActionFaceEncounter, s => s.Campaign.Stage == CampaignStage.Encounter);
        yield return ClickAwait(UiElementNames.ActionEnterResolution, s => s.Campaign.Stage == CampaignStage.Resolution);
        yield return Capture(1280, 720, "encounter-choices", "encounter");
        yield return Capture(1920, 1080, "encounter-choices", "encounter");

        yield return ClickAwait(UiElementNames.ChoiceCombat, s => s.Battle != null);
        int guard = 0;
        while (session.Battle != null && session.Battle.Outcome == BattleOutcomeKind.Ongoing && guard < 80)
        {
            guard++;
            yield return Click(UiElementNames.BattleAdvance);
        }
        yield return Capture(1280, 720, "battle-state", "battle");
        yield return Capture(1920, 1080, "battle-state", "battle");

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
        yield return new TaskYield(LoadBootstrapAndBindAsync());
    }

    static async Task LoadBootstrapAndBindAsync()
    {
        Task mainTitleLoaded = WaitForSceneAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
        await AwaitAsyncOperation(SceneManager.LoadSceneAsync(
            FoundationScenes.Bootstrap,
            LoadSceneMode.Single));
        await mainTitleLoaded;

        MainTitleUiHost title = UnityEngine.Object.FindAnyObjectByType<MainTitleUiHost>();
        Assert.That(title, Is.Not.Null, "MainTitleUiHost required");
        await AwaitTask(title.Ready, TimeSpan.FromSeconds(10), "MainTitle ready");

        AppLifetimeScope appScope = UnityEngine.Object.FindAnyObjectByType<AppLifetimeScope>();
        Assert.That(appScope, Is.Not.Null, "AppLifetimeScope required");
        ApplicationFlowCoordinator coordinator =
            appScope.Container.Resolve<ApplicationFlowCoordinator>();
        TransitionOutcome titleOutcome = await AwaitTaskResult(
            coordinator.CurrentTransition, TimeSpan.FromSeconds(15), "MainTitle commit");
        Assert.That(titleOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
        Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.MainTitle));

        Button start = UguiHudBuilder.ButtonNamed(title.CanvasRoot, UiElementNames.MainTitleStart);
        Assert.That(start, Is.Not.Null, "main-title-start missing");

        Task foundationLoaded = WaitForSceneAsync(FoundationScenes.Foundation, TimeSpan.FromSeconds(15));
        Task titleUnloaded = WaitForSceneUnloadedAsync(FoundationScenes.MainTitle, TimeSpan.FromSeconds(15));
        start.onClick.Invoke();
        Task<TransitionOutcome> foundationCommit = coordinator.CurrentTransition;
        Assert.That(foundationCommit, Is.Not.Null, "Start must begin Foundation transition");

        await foundationLoaded;
        await titleUnloaded;
        TransitionOutcome foundationOutcome = await AwaitTaskResult(
            foundationCommit, TimeSpan.FromSeconds(15), "Foundation commit");
        Assert.That(foundationOutcome.Status, Is.EqualTo(TransitionStatus.Completed));
        Assert.That(coordinator.CurrentState, Is.EqualTo(ApplicationFlowState.Foundation));

        GameplayUiHost gameplay = UnityEngine.Object.FindAnyObjectByType<GameplayUiHost>();
        Assert.That(gameplay, Is.Not.Null, "GameplayUiHost missing after Foundation commit");
        canvasRoot = gameplay.CanvasRoot;
    }

    static Task AwaitAsyncOperation(AsyncOperation operation)
    {
        Assert.That(operation, Is.Not.Null, "scene load operation required");
        var completion = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        operation.completed += _ => completion.TrySetResult(true);
        if (operation.isDone)
        {
            completion.TrySetResult(true);
        }
        return completion.Task;
    }

    static async Task WaitForSceneAsync(string path, TimeSpan timeout)
    {
        var loaded = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        void OnLoaded(Scene scene, LoadSceneMode _)
        {
            if (scene.path == path)
            {
                loaded.TrySetResult(true);
            }
        }

        SceneManager.sceneLoaded += OnLoaded;
        try
        {
            if (SceneManager.GetSceneByPath(path).isLoaded)
            {
                loaded.TrySetResult(true);
            }
            await AwaitTask(loaded.Task, timeout, "scene " + path);
        }
        finally
        {
            SceneManager.sceneLoaded -= OnLoaded;
        }
    }

    static async Task WaitForSceneUnloadedAsync(string path, TimeSpan timeout)
    {
        var unloaded = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        void OnUnloaded(Scene scene)
        {
            if (scene.path == path)
            {
                unloaded.TrySetResult(true);
            }
        }

        SceneManager.sceneUnloaded += OnUnloaded;
        try
        {
            if (!SceneManager.GetSceneByPath(path).isLoaded)
            {
                unloaded.TrySetResult(true);
            }
            await AwaitTask(unloaded.Task, timeout, "unload " + path);
        }
        finally
        {
            SceneManager.sceneUnloaded -= OnUnloaded;
        }
    }

    static async Task AwaitTask(Task task, TimeSpan timeout, string label)
    {
        Assert.That(task, Is.Not.Null, label + " task missing");
        Task winner = await Task.WhenAny(task, Task.Delay(timeout));
        Assert.That(winner, Is.SameAs(task), "Timed out waiting " + label);
        await task;
    }

    static async Task<T> AwaitTaskResult<T>(Task<T> task, TimeSpan timeout, string label)
    {
        Assert.That(task, Is.Not.Null, label + " task missing");
        Task winner = await Task.WhenAny(task, Task.Delay(timeout));
        Assert.That(winner, Is.SameAs(task), "Timed out waiting " + label);
        return await task;
    }


    static ClickYield ClickAwait(string name, Func<IPocCoreLoopSession, bool> done)
    {
        var button = UguiHudBuilder.ButtonNamed(canvasRoot, name);
        Assert.That(button, Is.Not.Null, "missing " + name);
        button.onClick.Invoke();
        return new ClickYield(session, done);
    }

    static IEnumerator Click(string name)
    {
        var button = UguiHudBuilder.ButtonNamed(canvasRoot, name);
        Assert.That(button, Is.Not.Null, "missing " + name);
        button.onClick.Invoke();
        yield return null;
    }

    static IEnumerator Capture(int width, int height, string kind, string state)
    {
        Screen.SetResolution(width, height, FullScreenMode.Windowed);
        yield return null;
        yield return new WaitForEndOfFrame();

        var tex = new Texture2D(width, height, TextureFormat.RGBA32, false);
        tex.ReadPixels(new Rect(0, 0, width, height), 0, 0);
        tex.Apply();

        Color32[] pixels = tex.GetPixels32();
        int nonDark = 0, textLum = 0;
        foreach (Color32 p in pixels)
        {
            float lum = 0.2126f * p.r + 0.7152f * p.g + 0.0722f * p.b;
            if (lum > 20f) { nonDark++; }
            if (lum >= 140f) { textLum++; }
        }

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
        sb.Append("\"is_playing\": true, ");
        sb.Append("\"width\": ").Append(width).Append(", ");
        sb.Append("\"height\": ").Append(height).Append(", ");
        sb.Append("\"head\": \"").Append(testedHead).Append("\", ");
        sb.Append("\"source_fingerprint\": \"").Append(testedFingerprint).Append("\", ");
        sb.Append("\"state\": \"").Append(state).Append("\", ");
        sb.Append("\"state_hash\": \"").Append(sha, 0, 16).Append("\", ");
        sb.Append("\"uidocument_root_names\": [\"").Append(canvasRoot.name).Append("\"], ");
        sb.Append("\"png_sha256\": \"").Append(sha).Append("\"");
        sb.Append(" }");
        File.WriteAllText(Path.Combine(dir, stem + ".receipt.json"), sb.ToString());

        Assert.That(nonDark, Is.GreaterThan(8000), stem + " capture too dark");
        Debug.Log("CAPTURE_OK " + stem + " nonDark=" + nonDark + " textLum=" + textLum + " sha=" + sha.Substring(0, 16));
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

public sealed class TaskYield : CustomYieldInstruction
{
    readonly Task task;

    public TaskYield(Task task)
    {
        this.task = task;
    }

    public override bool keepWaiting
    {
        get
        {
            if (!task.IsCompleted)
            {
                return true;
            }
            task.GetAwaiter().GetResult();
            return false;
        }
    }
}

public sealed class ClickYield : CustomYieldInstruction
{
    readonly Func<IPocCoreLoopSession, bool> done;
    readonly IPocCoreLoopSession session;
    int guard;

    public ClickYield(IPocCoreLoopSession session, Func<IPocCoreLoopSession, bool> done)
    {
        this.session = session;
        this.done = done;
    }

    public override bool keepWaiting
    {
        get
        {
            guard++;
            bool reached = done(session);
            if (reached || guard > 600)
            {
                Assert.That(reached, Is.True, "state not reached after click");
                return false;
            }
            return true;
        }
    }
}
