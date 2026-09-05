using System;
using System.IO;
using System.Reflection;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;

namespace Janseon.Foundation.Tests
{
    public sealed class CharacterCandidateImportTests
    {
        [Test]
        public void TallAtlasPreservesResolutionAndFractionalAlpha()
        {
            string folder = "Assets/Janseon/ArtCandidates/Characters/ImportProbe-" + Guid.NewGuid().ToString("N");
            string path = folder + "/atlas.png";
            var source = new Texture2D(96, 2560, TextureFormat.RGBA32, false);
            var pixels = new Color32[96 * 2560];
            for (int i = 0; i < pixels.Length; i++)
                pixels[i] = new Color32((byte)(i % 251), 79, 167, (byte)(i % 256));
            source.SetPixels32(pixels);
            source.Apply();
            try
            {
                Directory.CreateDirectory(folder);
                File.WriteAllBytes(path, source.EncodeToPNG());
                AssetDatabase.ImportAsset(path, ImportAssetOptions.ForceSynchronousImport);
                Type type = Type.GetType("Janseon.Art.Editor.CharacterCandidateBuilder, Assembly-CSharp-Editor");
                Assert.That(type, Is.Not.Null, "candidate importer must exist");
                MethodInfo configure = type.GetMethod("ConfigureTexture", BindingFlags.Public | BindingFlags.Static);
                Assert.That(configure, Is.Not.Null);
                configure.Invoke(null, new object[] { path, false });
                var actual = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
                Assert.That(actual.width, Is.EqualTo(96));
                Assert.That(actual.height, Is.EqualTo(2560), "atlas must not be reduced to 2048");
                Assert.That(actual.GetPixels32(), Is.EqualTo(pixels), "all RGBA bytes including fractional alpha");
                Assert.That(actual.filterMode, Is.EqualTo(FilterMode.Point));
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(source);
                AssetDatabase.DeleteAsset(folder);
                Assert.That(Directory.Exists(folder), Is.False, "owned import probe cleanup");
            }
        }

        [Test]
        public void CandidateImporterRejectsExistingRuntimeDestination()
        {
            Type type = Type.GetType("Janseon.Art.Editor.CharacterCandidateBuilder, Assembly-CSharp-Editor");
            Assert.That(type, Is.Not.Null, "candidate importer must exist");
            MethodInfo configure = type.GetMethod("ConfigureTexture", BindingFlags.Public | BindingFlags.Static);
            var error = Assert.Throws<TargetInvocationException>(() =>
                configure.Invoke(null, new object[] { "Assets/Janseon/Art/UI/icon-talk.png", true }));
            Assert.That(error.InnerException, Is.TypeOf<ArgumentException>());
        }
    }
}
