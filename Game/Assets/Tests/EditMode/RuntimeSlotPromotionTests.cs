using System;
using System.IO;
using System.Reflection;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    public sealed class RuntimeSlotPromotionTests
    {
        string id;
        string repo;
        string candidate;
        string destination;
        string evidence;
        bool hadCandidateRoot;
        bool hadCharactersRoot;
        bool hadExplorerRoot;

        [SetUp]
        public void SetUp()
        {
            id = Guid.NewGuid().ToString("N");
            repo = Path.GetFullPath(Path.Combine(Application.dataPath, "../.."));
            candidate = "Assets/Janseon/ArtCandidates/TestPromotion-" + id;
            destination = "Assets/Janseon/Art/Title/TestPromotion-" + id;
            evidence = Path.Combine(repo, ".omo/evidence/gateway-slot-wiring/fixtures", id);
            hadCandidateRoot = AssetDatabase.IsValidFolder("Assets/Janseon/ArtCandidates");
            hadCharactersRoot = AssetDatabase.IsValidFolder("Assets/Janseon/Art/Characters");
            hadExplorerRoot = AssetDatabase.IsValidFolder("Assets/Janseon/Art/Characters/poc-explorer");
            Directory.CreateDirectory(candidate);
            var texture = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            try
            {
                texture.SetPixels(new[] { Color.red, Color.green, Color.blue, Color.white });
                texture.Apply();
                File.WriteAllBytes(candidate + "/fixture.png", texture.EncodeToPNG());
            }
            finally { UnityEngine.Object.DestroyImmediate(texture); }
        }

        [TearDown]
        public void TearDown()
        {
            AssetDatabase.DeleteAsset(candidate);
            AssetDatabase.DeleteAsset(destination);
            if (Directory.Exists(candidate)) Directory.Delete(candidate, true);
            if (Directory.Exists(destination)) Directory.Delete(destination, true);
            if (Directory.Exists(evidence)) Directory.Delete(evidence, true);
            DeleteOwnedEmptyFolder("Assets/Janseon/Art/Characters/poc-explorer", hadExplorerRoot);
            DeleteOwnedEmptyFolder("Assets/Janseon/Art/Characters", hadCharactersRoot);
            DeleteOwnedEmptyFolder("Assets/Janseon/ArtCandidates", hadCandidateRoot);
        }

        static void DeleteOwnedEmptyFolder(string path, bool existed)
        {
            if (!existed && Directory.Exists(path) && Directory.GetFileSystemEntries(path).Length == 0)
                AssetDatabase.DeleteAsset(path);
        }

        [Test]
        public void SyntheticCandidate_PromotesThroughUnityWithBomAndMeta()
        {
            string request = MakeRequest("none");
            Promote(request);
            Assert.That(File.Exists(destination + "/fixture.png"), Is.True);
            Assert.That(File.Exists(destination + "/fixture.png.meta"), Is.True);
            Assert.That(AssetDatabase.LoadAssetAtPath<Texture2D>(destination + "/fixture.png"), Is.Not.Null);
            Assert.That(File.Exists(Path.Combine(evidence, "bom.json")), Is.True);
            Assert.That(File.ReadAllBytes(destination + "/fixture.png"), Is.EqualTo(File.ReadAllBytes(candidate + "/fixture.png")));
        }

        [TestCase("missing-rights")]
        [TestCase("tampered-output")]
        [TestCase("unbound-review")]
        [TestCase("non-candidate")]
        [TestCase("empty-reviews")]
        [TestCase("missing-binding")]
        public void InvalidPacket_RefusesBeforeDestinationWrite(string mutation)
        {
            string request = MakeRequest(mutation);
            Assert.Throws<InvalidOperationException>(() => Promote(request));
            Assert.That(Directory.Exists(destination), Is.False);
            Assert.That(File.Exists(Path.Combine(evidence, "bom.json")), Is.False);
        }

        [Test]
        public void CharacterClips_RetargetRuntimeSpritesWithoutChangingReviewedPacket()
        {
            destination = "Assets/Janseon/Art/Characters/poc-explorer/TestPromotion-" + id;
            byte[] png = File.ReadAllBytes(candidate + "/fixture.png");
            File.WriteAllBytes(candidate + "/atlas.png", png);
            string[] actions = { "idle", "walk", "attack", "hit", "down" };
            int[] counts = { 4, 6, 6, 3, 4 };
            foreach (string facing in new[] { "N", "E", "S", "W" })
            for (int a = 0; a < actions.Length; a++)
            {
                string stem = facing + "-" + actions[a] + "-";
                var keys = new ObjectReferenceKeyframe[counts[a] + 1];
                for (int i = 0; i < counts[a]; i++)
                {
                    string path = candidate + "/" + stem + i + ".png";
                    File.WriteAllBytes(path, png);
                    AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceSynchronousImport);
                    var importer = (TextureImporter)AssetImporter.GetAtPath(path);
                    importer.textureType = TextureImporterType.Sprite;
                    importer.spriteImportMode = SpriteImportMode.Single;
                    importer.SaveAndReimport();
                    keys[i] = new ObjectReferenceKeyframe { time = i / 12f, value = AssetDatabase.LoadAssetAtPath<Sprite>(path) };
                }
                keys[counts[a]] = new ObjectReferenceKeyframe { time = counts[a] / 12f, value = keys[counts[a] - 1].value };
                var clip = new AnimationClip
                {
                    name = stem + "clip", legacy = true, frameRate = 12,
                    wrapMode = a < 2 ? WrapMode.Loop : WrapMode.ClampForever,
                };
                AnimationUtility.SetObjectReferenceCurve(clip,
                    EditorCurveBinding.PPtrCurve("", typeof(SpriteRenderer), "m_Sprite"), keys);
                AssetDatabase.CreateAsset(clip, candidate + "/" + stem + "clip.anim");
            }
            AssetDatabase.SaveAssets();
            string request = MakeRequest("character");
            byte[] binding = File.ReadAllBytes(Path.Combine(evidence, "binding.json"));
            byte[] review = File.ReadAllBytes(Path.Combine(evidence, "review.json"));
            Promote(request);
            Assert.That(File.ReadAllBytes(Path.Combine(evidence, "binding.json")), Is.EqualTo(binding));
            Assert.That(File.ReadAllBytes(Path.Combine(evidence, "review.json")), Is.EqualTo(review));
            foreach (string facing in new[] { "N", "E", "S", "W" })
            for (int a = 0; a < actions.Length; a++)
            {
                string stem = facing + "-" + actions[a] + "-";
                var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(destination + "/" + stem + "clip.anim");
                Assert.That(clip, Is.Not.Null);
                var keys = AnimationUtility.GetObjectReferenceCurve(clip,
                    EditorCurveBinding.PPtrCurve("", typeof(SpriteRenderer), "m_Sprite"));
                Assert.That(keys.Length, Is.EqualTo(counts[a] + 1));
                for (int i = 0; i < keys.Length; i++)
                {
                    Assert.That(keys[i].time, Is.EqualTo(i / 12f).Within(0.00001f));
                    Assert.That(AssetDatabase.GetAssetPath(keys[i].value),
                        Is.EqualTo(destination + "/" + stem + Math.Min(i, counts[a] - 1) + ".png"));
                }
                Assert.That(File.ReadAllBytes(destination + "/" + stem + "clip.anim"),
                    Is.Not.EqualTo(File.ReadAllBytes(candidate + "/" + stem + "clip.anim")));
            }
        }

        string MakeRequest(string mutation)
        {
            var info = new System.Diagnostics.ProcessStartInfo("node")
            {
                WorkingDirectory = repo, RedirectStandardOutput = true, RedirectStandardError = true,
                UseShellExecute = false, CreateNoWindow = true,
            };
            info.ArgumentList.Add("tools/art/runtime-slot-promotion-fixture.mjs");
            info.ArgumentList.Add(repo);
            info.ArgumentList.Add(id);
            info.ArgumentList.Add(mutation);
            using var process = System.Diagnostics.Process.Start(info);
            var stdout = process.StandardOutput.ReadToEndAsync();
            var stderr = process.StandardError.ReadToEndAsync();
            if (!process.WaitForExit(15000)) { process.Kill(); Assert.Fail("Fixture process timed out"); }
            Assert.That(process.ExitCode, Is.Zero, stderr.GetAwaiter().GetResult());
            stdout.GetAwaiter().GetResult();
            return Path.Combine(evidence, "request.json");
        }

        static void Promote(string request)
        {
            Type type = Type.GetType("Janseon.Foundation.Editor.RuntimeSlotPromoter, Janseon.Foundation.Editor", true);
            try { type.GetMethod("Promote", BindingFlags.Public | BindingFlags.Static).Invoke(null, new object[] { request }); }
            catch (TargetInvocationException exception) when (exception.InnerException != null)
            { System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(exception.InnerException).Throw(); }
        }
    }
}
