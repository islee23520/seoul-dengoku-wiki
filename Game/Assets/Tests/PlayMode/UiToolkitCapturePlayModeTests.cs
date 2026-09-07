using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Janseon.Core;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine.TestTools;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

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
        yield return SceneManager.LoadSceneAsync("Bootstrap", LoadSceneMode.Single);
        int guard = 0;
        MainTitleUiHost title = null;
        while (title == null && guard < 600)
        {
            title = UnityEngine.Object.FindFirstObjectByType<MainTitleUiHost>();
            if (title == null || !title.IsReady) { guard++; yield return null; }
        }
        Assert.That(title, Is.Not.Null);
        Assert.That(title.IsReady, Is.True, "MainTitle must become ready");

        var start = UguiHudBuilder.ButtonNamed(title.CanvasRoot, UiElementNames.MainTitleStart);
        Assert.That(start, Is.Not.Null);
        start.onClick.Invoke();
        guard = 0;
        GameplayUiHost gameplay = null;
        while (gameplay == null && guard < 600)
        {
            gameplay = UnityEngine.Object.FindFirstObjectByType<GameplayUiHost>();
            if (gameplay == null || !gameplay.IsReady) { guard++; yield return null; }
        }
        Assert.That(gameplay, Is.Not.Null);
        Assert.That(gameplay.IsReady, Is.True, "gameplay must become ready");
        canvasRoot = gameplay.CanvasRoot;
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
