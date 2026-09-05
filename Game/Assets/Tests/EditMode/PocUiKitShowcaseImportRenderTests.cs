using System;
using System.Reflection;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    public sealed class PocUiKitShowcaseImportRenderTests
    {
        const string ShowcaseTypeName = "Janseon.Art.Editor.PocUiKitShowcase";
        const string IconTalkPath = "Assets/Janseon/Art/UI/icon-talk.png";

        [Test]
        public void EvidenceDir_TargetsGatewayUiQualityShowcase_NotTodo13ReviewFixes()
        {
            MethodInfo build = RequireMethod("BuildEvidenceDir");
            string dest = (string)build.Invoke(null, new object[] { "/repo" });
            string normalized = dest.Replace('\\', '/');

            Assert.That(normalized, Does.Contain(".omo/evidence/gateway-ui-quality/showcase"));
            Assert.That(normalized, Does.Not.Contain("unity-poc-core-loop"));
            Assert.That(normalized, Does.Not.Contain("task-13-review-fixes"));
        }

        [Test]
        public void LoadPng_UsesImportedTextureSettings_NotRawFileBypass()
        {
            MethodInfo load = RequireMethod("LoadPng");
            var importer = (TextureImporter)AssetImporter.GetAtPath(IconTalkPath);
            Assert.That(importer, Is.Not.Null, IconTalkPath);
            int originalMax = importer.maxTextureSize;
            Texture2D loaded = null;
            try
            {
                importer.maxTextureSize = 32;
                importer.SaveAndReimport();
                loaded = (Texture2D)load.Invoke(null, new object[] { IconTalkPath });
                Assert.That(loaded, Is.Not.Null);
                Assert.That(loaded.width, Is.EqualTo(32), "must observe imported maxTextureSize, not raw PNG 64");
                Assert.That(loaded.height, Is.EqualTo(32), "must observe imported maxTextureSize, not raw PNG 64");
            }
            finally
            {
                DestroyTransient(loaded);
                importer.maxTextureSize = originalMax;
                importer.SaveAndReimport();
            }
        }

        [Test]
        public void Blit_CompositesTransparentSourceOverOpaqueDestination()
        {
            MethodInfo blit = RequireMethod("Blit");
            var dest = new Texture2D(4, 4, TextureFormat.RGBA32, false);
            var src = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            var backdrop = new Color32(18, 28, 42, 255);
            try
            {
                Fill32(dest, backdrop);
                Fill32(src, new Color32(255, 0, 0, 0));
                blit.Invoke(null, new object[] { dest, src, 1, 1, 2, 2 });
                src = null;

                Assert.That(Pixel32(dest, 0, 0), Is.EqualTo(backdrop));
                Assert.That(Pixel32(dest, 1, 1), Is.EqualTo(backdrop), "transparent source must not punch destination alpha");

                var half = new Texture2D(1, 1, TextureFormat.RGBA32, false);
                Fill32(half, new Color32(255, 0, 0, 128));
                blit.Invoke(null, new object[] { dest, half, 0, 0, 1, 1 });
                Assert.That(Pixel32(dest, 0, dest.height - 1), Is.EqualTo(new Color32(137, 14, 21, 255)));
            }
            finally
            {
                DestroyTransient(dest);
                DestroyTransient(src);
            }
        }

        [Test]
        public void BlitNineSlice_CompositesTransparentAndSemitransparentOverOpaqueDestination()
        {
            MethodInfo blit = RequireMethod("BlitNineSlice");
            var dest = new Texture2D(8, 8, TextureFormat.RGBA32, false);
            var src = new Texture2D(4, 4, TextureFormat.RGBA32, false);
            var backdrop = new Color32(18, 28, 42, 255);
            try
            {
                Fill32(dest, backdrop);
                Fill32(src, new Color32(255, 0, 0, 0));
                blit.Invoke(null, new object[] { dest, src, 2, 2, 4, 4, 1 });
                src = null;

                Assert.That(Pixel32(dest, 0, 0), Is.EqualTo(backdrop));
                Assert.That(Pixel32(dest, 3, 3), Is.EqualTo(backdrop), "nine-slice transparent source must not punch destination alpha");

                var half = new Texture2D(4, 4, TextureFormat.RGBA32, false);
                Fill32(half, new Color32(255, 0, 0, 128));
                blit.Invoke(null, new object[] { dest, half, 2, 2, 4, 4, 1 });
                Assert.That(Pixel32(dest, 3, 3), Is.EqualTo(new Color32(137, 14, 21, 255)));
            }
            finally
            {
                DestroyTransient(dest);
                DestroyTransient(src);
            }
        }

        static MethodInfo RequireMethod(string name)
        {
            Type type = Type.GetType(ShowcaseTypeName + ", Assembly-CSharp-Editor");
            Assert.That(type, Is.Not.Null, "missing " + ShowcaseTypeName);
            MethodInfo method = type.GetMethod(name, BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic);
            Assert.That(method, Is.Not.Null, "missing method " + name);
            return method;
        }

        static void Fill32(Texture2D texture, Color32 color)
        {
            var pixels = new Color32[texture.width * texture.height];
            for (var i = 0; i < pixels.Length; i++) pixels[i] = color;
            texture.SetPixels32(pixels);
            texture.Apply();
        }

        static Color32 Pixel32(Texture2D texture, int x, int y)
        {
            return texture.GetPixels32()[y * texture.width + x];
        }

        static void DestroyTransient(Texture2D texture)
        {
            if (texture == null) return;
            if (!string.IsNullOrEmpty(AssetDatabase.GetAssetPath(texture))) return;
            UnityEngine.Object.DestroyImmediate(texture);
        }
    }
}
