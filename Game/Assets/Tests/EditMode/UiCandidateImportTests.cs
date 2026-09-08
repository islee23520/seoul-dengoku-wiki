using System;
using System.IO;
using System.Linq;
using System.Reflection;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// UI 수정 후보는 격리된 ArtCandidates/UI 아래에서만 Unity API로 import되고 playable scene에서 도달할 수 없다.
    /// </summary>
    public sealed class UiCandidateImportTests
    {
        const string ShowcaseTypeName = "Janseon.Art.Editor.UiCandidateShowcase";
        const string CandidateRoot = "Assets/Janseon/ArtCandidates/UI";

        static readonly string[] PlayableScenes =
        {
            "Assets/Scenes/Bootstrap.unity",
            "Assets/Scenes/MainTitle.unity",
            "Assets/Scenes/Foundation.unity",
        };

        [Test]
        public void ConfigureTexture_ImportsIconAsReadablePointSpriteWithExactPixels()
        {
            MethodInfo configure = RequireConfigure();
            string folder = CandidateRoot + "/ImportProbe-" + Guid.NewGuid().ToString("N");
            string path = folder + "/icon.png";
            var pixels = new Color32[64 * 64];
            for (int i = 0; i < pixels.Length; i++)
            {
                pixels[i] = new Color32((byte)(i % 251), (byte)(i % 197), (byte)(i % 173), (byte)(i % 256));
            }

            try
            {
                WriteProbePng(path, 64, 64, pixels);
                AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceSynchronousImport);
                configure.Invoke(null, new object[] { path, "ui_icon" });

                var importer = (TextureImporter)AssetImporter.GetAtPath(path);
                Assert.That(importer.textureType, Is.EqualTo(TextureImporterType.Sprite));
                Assert.That(importer.filterMode, Is.EqualTo(FilterMode.Point));
                Assert.That(importer.wrapMode, Is.EqualTo(TextureWrapMode.Clamp));
                Assert.That(importer.alphaIsTransparency, Is.True);
                Assert.That(importer.mipmapEnabled, Is.False);
                Assert.That(importer.textureCompression, Is.EqualTo(TextureImporterCompression.Uncompressed));

                var imported = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
                Assert.That(imported, Is.Not.Null);
                Assert.That(imported.width, Is.EqualTo(64));
                Assert.That(imported.height, Is.EqualTo(64));
                Assert.That(imported.isReadable, Is.True);
                Color32[] actual = imported.GetPixels32();
                for (int i = 0; i < pixels.Length; i++)
                {
                    Assert.That(actual[i].a, Is.EqualTo(pixels[i].a), "alpha byte " + i);
                    if (pixels[i].a == 255)
                    {
                        Assert.That(actual[i], Is.EqualTo(pixels[i]), "opaque rgb byte " + i);
                    }
                }

                Assert.That(AssetDatabase.LoadAssetAtPath<Sprite>(path), Is.Not.Null, "single sprite must be generated");
            }
            finally
            {
                AssetDatabase.DeleteAsset(folder);
                Assert.That(Directory.Exists(folder), Is.False, "owned import probe cleanup");
            }
        }

        [Test]
        public void ConfigureTexture_ImportsHistoryTextureAsRepeatingMipmappedTexture()
        {
            MethodInfo configure = RequireConfigure();
            string folder = CandidateRoot + "/ImportProbe-" + Guid.NewGuid().ToString("N");
            string path = folder + "/tile.png";
            var pixels = new Color32[256 * 256];
            for (int i = 0; i < pixels.Length; i++)
            {
                pixels[i] = new Color32((byte)(i % 211), (byte)(i % 199), (byte)(i % 193), 255);
            }

            try
            {
                WriteProbePng(path, 256, 256, pixels);
                AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceSynchronousImport);
                configure.Invoke(null, new object[] { path, "history_texture" });

                var importer = (TextureImporter)AssetImporter.GetAtPath(path);
                Assert.That(importer.textureType, Is.EqualTo(TextureImporterType.Default));
                Assert.That(importer.wrapMode, Is.EqualTo(TextureWrapMode.Repeat));
                Assert.That(importer.filterMode, Is.EqualTo(FilterMode.Bilinear));
                Assert.That(importer.mipmapEnabled, Is.True);
                Assert.That(importer.alphaIsTransparency, Is.False);

                var imported = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
                Assert.That(imported.wrapMode, Is.EqualTo(TextureWrapMode.Repeat));
                Assert.That(imported.mipmapCount, Is.GreaterThan(1));
                Assert.That(imported.GetPixels32(0), Is.EqualTo(pixels), "mip0 bytes must equal source");
            }
            finally
            {
                AssetDatabase.DeleteAsset(folder);
                Assert.That(Directory.Exists(folder), Is.False, "owned import probe cleanup");
            }
        }

        [Test]
        public void ConfigureTexture_RejectsPromotedRuntimeArtPaths()
        {
            MethodInfo configure = RequireConfigure();
            foreach (string forbidden in new[]
            {
                "Assets/Janseon/Art/UI/icon-talk.png",
                "Assets/Janseon/ArtSource/UI/poc-ui-icons/icon-talk.png",
                CandidateRoot + "/../Art/UI/icon-talk.png",
            })
            {
                var error = Assert.Throws<TargetInvocationException>(
                    () => configure.Invoke(null, new object[] { forbidden, "ui_icon" }), forbidden);
                Assert.That(error.InnerException, Is.TypeOf<ArgumentException>(), forbidden);
            }
        }

        [Test]
        public void Candidates_AreUnreachableFromPlayableScenesAndContainOnlyPng()
        {
            Assert.That(Type.GetType(ShowcaseTypeName + ", Assembly-CSharp-Editor"), Is.Not.Null, "candidate importer must exist");
            foreach (string scene in PlayableScenes)
            {
                string[] leaks = AssetDatabase.GetDependencies(scene, true)
                    .Where(dependency => dependency.Replace('\\', '/').StartsWith("Assets/Janseon/ArtCandidates/", StringComparison.Ordinal))
                    .ToArray();
                Assert.That(leaks, Is.Empty, scene + " must not depend on candidates");
            }

            foreach (string uiAsset in new[]
            {
                "Assets/Janseon/Foundation/UI/UguiHudBuilder.cs",
                "Assets/Janseon/Foundation/UI/Presenters/MainTitleUiHost.cs",
                "Assets/Janseon/Foundation/UI/Presenters/GameplayUiHost.cs",
            })
            {
                Assert.That(File.ReadAllText(uiAsset), Does.Not.Contain("ArtCandidates"), uiAsset);
            }

            if (Directory.Exists(CandidateRoot))
            {
                string[] unexpected = Directory.GetFiles(CandidateRoot, "*", SearchOption.AllDirectories)
                    .Select(file => file.Replace('\\', '/'))
                    .Where(file => !file.EndsWith(".png", StringComparison.OrdinalIgnoreCase)
                        && !file.EndsWith(".png.meta", StringComparison.OrdinalIgnoreCase)
                        && !file.EndsWith(".meta", StringComparison.OrdinalIgnoreCase))
                    .ToArray();
                Assert.That(unexpected, Is.Empty, "candidate root may hold PNG drafts and metas only");
                Assert.That(Directory.GetDirectories(CandidateRoot, "Resources", SearchOption.AllDirectories), Is.Empty,
                    "candidates must never be loadable through Resources");
            }
        }

        static MethodInfo RequireConfigure()
        {
            Type type = Type.GetType(ShowcaseTypeName + ", Assembly-CSharp-Editor");
            Assert.That(type, Is.Not.Null, "missing " + ShowcaseTypeName);
            MethodInfo method = type.GetMethod("ConfigureTexture", BindingFlags.Public | BindingFlags.Static);
            Assert.That(method, Is.Not.Null, "missing ConfigureTexture(string path, string role)");
            return method;
        }

        static void WriteProbePng(string assetPath, int width, int height, Color32[] pixels)
        {
            var source = new Texture2D(width, height, TextureFormat.RGBA32, false);
            try
            {
                source.SetPixels32(pixels);
                source.Apply();
                Directory.CreateDirectory(Path.GetDirectoryName(assetPath));
                File.WriteAllBytes(assetPath, source.EncodeToPNG());
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(source);
            }
        }
    }
}
