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
using Object = UnityEngine.Object;

namespace Janseon.Foundation.Tests
{
    public sealed class CharacterCandidatePilotCaptureTests
    {
        const string Root = "Assets/Janseon/ArtCandidates/Characters/Pilot";
        static readonly string[] Roles =
        {
            "idle-N", "idle-E", "idle-S", "idle-W",
            "attack-windup", "attack-contact", "hit", "down",
        };

        [UnityTest]
        public IEnumerator CaptureEachImportedPilotSpriteThroughOrthographicCamera()
        {
            Assert.That(Application.isPlaying, Is.True);
            Assert.That(Application.isBatchMode, Is.True);
            string repo = Directory.GetParent(Application.dataPath).Parent.FullName;
            string evidence = Path.Combine(repo, ".omo/evidence/gateway-character-candidates/pilot-capture");
            Directory.CreateDirectory(evidence);
            var frames = new List<FrameReceipt>();
            var root = new GameObject("CharacterCandidatePilotCapture");
            var cameraObject = new GameObject("CharacterCandidatePilotCamera");
            var target = new RenderTexture(96, 128, 24, RenderTextureFormat.ARGB32);
            var pixels = new Texture2D(96, 128, TextureFormat.RGBA32, false);
            var shader = Shader.Find("Sprites/Default");
            Assert.That(shader, Is.Not.Null, "Sprites/Default");
            var material = new Material(shader);
            var camera = cameraObject.AddComponent<Camera>();
            camera.enabled = false;
            camera.orthographic = true;
            camera.orthographicSize = 1.875f / 2;
            camera.aspect = 96f / 128;
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
            var previousTarget = RenderTexture.active;
            try
            {
                foreach (string role in Roles)
                {
                    string spritePath = Root + "/" + role + ".png";
                    var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(spritePath);
                    Assert.That(sprite, Is.Not.Null, spritePath);
                    Assert.That(sprite.rect.size, Is.EqualTo(new Vector2(96, 128)));
                    renderer.sprite = sprite;
                    yield return null;
                    camera.Render();
                    RenderTexture.active = target;
                    pixels.ReadPixels(new Rect(0, 0, 96, 128), 0, 0);
                    pixels.Apply();
                    Color32[] colors = pixels.GetPixels32();
                    Color32 background = (Color32)camera.backgroundColor;
                    int visible = colors.Count(color => !color.Equals(background));
                    int magenta = colors.Count(color => color.r == 255 && color.g == 0 && color.b == 255);
                    Assert.That(visible, Is.GreaterThan(0), role + " must have non-void readable pixels");
                    Assert.That(magenta, Is.EqualTo(0), role + " must have zero magenta");
                    byte[] png = pixels.EncodeToPNG();
                    string capture = Path.Combine(evidence, role + ".png");
                    File.WriteAllBytes(capture, png);
                    frames.Add(new FrameReceipt
                    {
                        role = role,
                        path = capture,
                        sha256 = Hash(png),
                    });
                }
                Assert.That(frames.Count, Is.EqualTo(8));
                var receipt = new CaptureReceipt
                {
                    unity = Application.unityVersion,
                    project = Directory.GetParent(Application.dataPath).FullName,
                    isPlaying = Application.isPlaying,
                    batchmode = Application.isBatchMode,
                    pitch = camera.transform.eulerAngles.x,
                    yaw = camera.transform.eulerAngles.y,
                    orthographic = camera.orthographic,
                    driver = "PlayMode SpriteRenderer assignment / yield frame / Camera.Render",
                    frames = frames.ToArray(),
                };
                File.WriteAllText(Path.Combine(evidence, "pilot-capture-receipt.json"), JsonUtility.ToJson(receipt, true));
                Debug.Log("CHARACTER_PILOT_CAPTURE_OK frames=8 isPlaying=" + Application.isPlaying);
            }
            finally
            {
                RenderTexture.active = previousTarget;
                camera.targetTexture = null;
                target.Release();
                Object.DestroyImmediate(target);
                Object.DestroyImmediate(pixels);
                Object.DestroyImmediate(material);
                Object.DestroyImmediate(root);
                Object.DestroyImmediate(cameraObject);
            }
        }

        static string Hash(byte[] bytes)
        {
            using (var sha = SHA256.Create())
                return BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant();
        }

        [Serializable] sealed class CaptureReceipt
        {
            public string unity, project, driver;
            public bool isPlaying, batchmode, orthographic;
            public float pitch, yaw;
            public FrameReceipt[] frames;
        }

        [Serializable] sealed class FrameReceipt
        {
            public string role, path, sha256;
        }
    }
}
#endif
