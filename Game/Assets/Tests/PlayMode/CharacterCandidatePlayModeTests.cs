#if UNITY_EDITOR
using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.TestTools;
using UnityEngine.Animations;
using UnityEngine.Playables;
using Object = UnityEngine.Object;

namespace Janseon.Foundation.Tests
{
    public sealed class CharacterCandidatePlayModeTests
    {
        const string Root = "Assets/Janseon/ArtCandidates/Characters";
        static readonly string[] Roles = { "poc-explorer", "poc-medic", "poc-patrol" };
        static readonly string[] Facings = { "N", "E", "S", "W" };
        static readonly string[] Actions = { "idle", "walk", "attack", "hit", "down" };
        static readonly int[] Counts = { 4, 6, 6, 3, 4 };

        [UnityTest]
        public IEnumerator CaptureEveryImportedClipThroughRuntimeAnimation()
        {
            Assert.That(Application.isPlaying, Is.True);
            Assert.That(Application.isBatchMode, Is.True);
            Assert.That(Application.unityVersion, Is.EqualTo("6000.7.0a5"));
            string repo = Directory.GetParent(Application.dataPath).Parent.FullName;
            string evidence = Path.Combine(repo, ".omo/evidence/gateway-character-candidates/playmode-v2");
            Directory.CreateDirectory(evidence);
            string sourceRoot = Path.Combine(repo, ".omo/evidence/gateway-character-candidates/candidate-v2");
            string fingerprint = SourceFingerprint(repo);
            var frames = new List<FrameReceipt>();
            var root = new GameObject("CharacterCandidateCapture");
            var cameraObject = new GameObject("CharacterCandidateCamera");
            var target = new RenderTexture(256, 320, 24, RenderTextureFormat.ARGB32);
            var pixels = new Texture2D(256, 320, TextureFormat.RGBA32, false);
            var material = new Material(Shader.Find("Sprites/Default"));
            var camera = cameraObject.AddComponent<Camera>();
            camera.enabled = false;
            camera.orthographic = true;
            camera.orthographicSize = 1.875f / 2;
            camera.aspect = 256f / 320;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.12f, 0.16f, 0.20f, 1);
            camera.cullingMask = 1 << 30;
            camera.allowHDR = false;
            camera.allowMSAA = false;
            camera.transform.rotation = Quaternion.Euler(35.264f, 45f, 0);
            camera.transform.position = camera.transform.up * (56f / (128f / 1.5f)) - camera.transform.forward * 10;
            camera.targetTexture = target;
            root.layer = 30;
            root.transform.rotation = camera.transform.rotation;
            var renderer = root.AddComponent<SpriteRenderer>();
            renderer.sharedMaterial = material;
            var animator = root.AddComponent<Animator>();
            animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
            var graph = PlayableGraph.Create("CharacterCandidateAnimation");
            graph.SetTimeUpdateMode(DirectorUpdateMode.Manual);
            var output = AnimationPlayableOutput.Create(graph, "Sprite", animator);
            var previousTarget = RenderTexture.active;
            try
            {
                foreach (string role in Roles)
                for (int direction = 0; direction < Facings.Length; direction++)
                for (int action = 0; action < Actions.Length; action++)
                {
                    string clipName = role + "_" + Facings[direction] + "_" + Actions[action];
                    string clipPath = Root + "/" + role + "/Clips/" + clipName + ".anim";
                    var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(clipPath);
                    Assert.That(clip, Is.Not.Null, clipPath);
                    Assert.That(clip.frameRate, Is.EqualTo(12));
                    Assert.That(clip.length, Is.EqualTo(Counts[action] / 12f).Within(0.001));
                    var playable = AnimationClipPlayable.Create(graph, clip);
                    output.SetSourcePlayable(playable);
                    graph.Play();
                    var hashes = new HashSet<string>();
                    for (int frame = 0; frame < Counts[action]; frame++)
                    {
                        // Runtime animation timeline is deterministic: no wall-clock sleeps or skipped keys.
                        double sampleTime = (frame + 0.25) / 12;
                        playable.SetTime(sampleTime);
                        graph.Evaluate(0);
                        yield return null;
                        string expectedPath = Root + "/" + role + "/Sprites/" + clipName + "_" + frame.ToString("00") + ".png";
                        Assert.That(AssetDatabase.GetAssetPath(renderer.sprite), Is.EqualTo(expectedPath));
                        Assert.That(renderer.sprite.rect.size, Is.EqualTo(new Vector2(96, 128)));
                        Assert.That(renderer.sprite.bounds.size.x, Is.LessThanOrEqualTo(1.5f));
                        Bounds bounds = renderer.sprite.bounds;
                        foreach (float x in new[] { bounds.min.x, bounds.max.x })
                        foreach (float y in new[] { bounds.min.y, bounds.max.y })
                        {
                            Vector3 viewport = camera.WorldToViewportPoint(root.transform.TransformPoint(new Vector3(x, y, 0)));
                            Assert.That(viewport.x, Is.InRange(0.01f, 0.99f), "horizontal clipping " + expectedPath);
                            Assert.That(viewport.y, Is.InRange(0.01f, 0.99f), "vertical clipping " + expectedPath);
                        }
                        camera.Render();
                        RenderTexture.active = target;
                        pixels.ReadPixels(new Rect(0, 0, 256, 320), 0, 0);
                        pixels.Apply();
                        Color32[] colors = pixels.GetPixels32();
                        Color32 background = colors[0];
                        int visible = colors.Count(color => !color.Equals(background));
                        Assert.That(visible, Is.GreaterThan(500), "actual sprite render must be visible");
                        for (int x = 0; x < 256; x++)
                        {
                            Assert.That(colors[x], Is.EqualTo(background));
                            Assert.That(colors[319 * 256 + x], Is.EqualTo(background));
                        }
                        for (int y = 0; y < 320; y++)
                        {
                            Assert.That(colors[y * 256], Is.EqualTo(background));
                            Assert.That(colors[y * 256 + 255], Is.EqualTo(background));
                        }
                        byte[] png = pixels.EncodeToPNG();
                        string capture = Path.Combine(evidence, clipName + "_" + frame.ToString("00") + ".png");
                        File.WriteAllBytes(capture, png);
                        string hash = Hash(png);
                        hashes.Add(hash);
                        string source = Path.Combine(sourceRoot, role, "sprites", Path.GetFileName(expectedPath));
                        frames.Add(new FrameReceipt
                        {
                            role = role, facing = Facings[direction], action = Actions[action], frame = frame,
                            clip = clipPath, clipSha256 = Hash(File.ReadAllBytes(clipPath)),
                            sprite = expectedPath, source = source, sourceSha256 = Hash(File.ReadAllBytes(source)),
                            atlas = Path.Combine(sourceRoot, role, role + "-atlas.png"),
                            atlasX = frame * 96, atlasYTop = (direction * 5 + action) * 128,
                            path = capture, sha256 = hash, isPlaying = Application.isPlaying,
                            unityFrame = Time.frameCount, animationTime = (float)sampleTime, visiblePixels = visible,
                        });
                    }
                    Assert.That(hashes.Count, Is.GreaterThan(1), "clip must visibly progress: " + clipName);
                    graph.Stop();
                    playable.Destroy();
                }
                Assert.That(frames.Count, Is.EqualTo(276));
                Assert.That(frames.Select(f => f.clip).Distinct().Count(), Is.EqualTo(60));
                Assert.That(SourceFingerprint(repo), Is.EqualTo(fingerprint), "source changed during capture");
                var receipt = new CaptureReceipt
                {
                    unity = Application.unityVersion, project = Directory.GetParent(Application.dataPath).FullName,
                    isPlaying = Application.isPlaying, batchmode = Application.isBatchMode,
                    pitch = camera.transform.eulerAngles.x, yaw = camera.transform.eulerAngles.y,
                    orthographic = camera.orthographic, sourceFingerprint = fingerprint,
                    driver = "PlayMode Animator / AnimationClipPlayable.SetTime / PlayableGraph.Evaluate / yield frame / Camera.Render",
                    frames = frames.ToArray(),
                };
                File.WriteAllText(Path.Combine(evidence, "receipt.json"), JsonUtility.ToJson(receipt, true));
                Debug.Log("CHARACTER_PLAYMODE_MATRIX_OK frames=276 clips=60 isPlaying=" + Application.isPlaying);
            }
            finally
            {
                graph.Destroy();
                RenderTexture.active = previousTarget;
                camera.targetTexture = null;
                target.Release();
                Object.DestroyImmediate(target);
                Object.DestroyImmediate(pixels);
                Object.DestroyImmediate(material);
                Object.DestroyImmediate(root);
                Object.DestroyImmediate(cameraObject);
                File.WriteAllText(Path.Combine(evidence, "cleanup.json"), "{\"objectsDestroyed\":true,\"renderTextureReleased\":true}");
            }
        }

        static string Hash(byte[] bytes)
        {
            using (var sha = SHA256.Create())
                return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant();
        }

        static string SourceFingerprint(string repo)
        {
            var paths = new List<string>
            {
                "tools/art/build-poc-character-sprites.py",
                "Game/Assets/Janseon/Art/Editor/CharacterCandidateBuilder.cs",
                "Game/Assets/Tests/PlayMode/CharacterCandidatePlayModeTests.cs",
            };
            paths.AddRange(Directory.GetFiles(Path.Combine(repo, "Game", Root), "*", SearchOption.AllDirectories)
                .Select(p => p.Substring(repo.Length + 1)));
            return Hash(System.Text.Encoding.UTF8.GetBytes(string.Join("\n", paths.OrderBy(p => p, StringComparer.Ordinal)
                .Select(p => p + ":" + Hash(File.ReadAllBytes(Path.Combine(repo, p)))))));
        }

        [Serializable] sealed class CaptureReceipt
        {
            public string unity, project, sourceFingerprint, driver;
            public bool isPlaying, batchmode, orthographic;
            public float pitch, yaw;
            public FrameReceipt[] frames;
        }
        [Serializable] sealed class FrameReceipt
        {
            public string role, facing, action, clip, clipSha256, sprite, source, sourceSha256, atlas, path, sha256;
            public int frame, atlasX, atlasYTop, unityFrame, visiblePixels;
            public bool isPlaying;
            public float animationTime;
        }
    }
}
#endif
