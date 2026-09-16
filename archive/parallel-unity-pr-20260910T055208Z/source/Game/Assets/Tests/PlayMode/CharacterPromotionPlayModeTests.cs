using System.Collections;
using System.Collections.Generic;
using System.IO;
using Janseon.Art;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.TestTools;

namespace Janseon.Foundation.Tests
{
    public sealed class CharacterPromotionPlayModeTests
    {
        static readonly string[] AssetIds = { "poc-explorer", "poc-medic", "poc-patrol" };
        static readonly string[] Facings = { "N", "E", "S", "W" };
        const string ArtRoot = "Assets/Janseon/Art/Characters";

        [UnityTest]
        public IEnumerator PromotedCharactersRenderAllFourFacingsInPlayMode()
        {
            string evidenceDirectory = Path.GetFullPath(Path.Combine(
                Application.dataPath,
                "../../.omo/evidence/unity-poc-core-loop/task-15-characters/playmode"));
            Directory.CreateDirectory(evidenceDirectory);

            var cameraObject = new GameObject("Todo15 PlayMode Camera");
            var camera = cameraObject.AddComponent<Camera>();
            cameraObject.tag = "MainCamera";
            camera.orthographic = true;
            camera.orthographicSize = 2.25f;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.055f, 0.067f, 0.075f, 1f);
            camera.transform.position = new Vector3(0f, 0.2f, -10f);

            var instances = new List<GameObject>();
            try
            {
                for (int index = 0; index < AssetIds.Length; index++)
                {
                    string assetId = AssetIds[index];
                    string prefabPath = $"{ArtRoot}/{assetId}/{Pascal(assetId)}.prefab";
                    GameObject prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
                    Assert.That(prefab, Is.Not.Null, prefabPath);

                    GameObject instance = Object.Instantiate(prefab);
                    instance.name = assetId;
                    instance.transform.position = new Vector3((index - 1) * 1.65f, 0f, 0f);
                    instances.Add(instance);
                }

                foreach (string facing in Facings)
                {
                    foreach (GameObject instance in instances)
                    {
                        var player = instance.GetComponent<CharacterFourDirPlayer>();
                        Assert.That(player, Is.Not.Null, instance.name);
                        player.BindCamera(camera);
                        player.Play(facing, "idle", LoadIdleFrames(player.AssetId, facing));
                    }

                    yield return null;
                    yield return null;

                    string capturePath = Path.Combine(evidenceDirectory, $"todo15-{facing}-idle.png");
                    Capture(camera, capturePath, 1280, 720);
                    Assert.That(new FileInfo(capturePath).Length, Is.GreaterThan(10_000), capturePath);
                    Assert.That(HasVisibleCharacters(capturePath), Is.True, capturePath);
                }

                File.WriteAllText(
                    Path.Combine(evidenceDirectory, "receipt.json"),
                    "{\n"
                    + "  \"ok\": true,\n"
                    + "  \"mode\": \"unity-playmode-test\",\n"
                    + "  \"characters\": 3,\n"
                    + "  \"facings\": 4,\n"
                    + "  \"captures\": 4\n"
                    + "}\n");
            }
            finally
            {
                foreach (GameObject instance in instances)
                {
                    Object.Destroy(instance);
                }

                Object.Destroy(cameraObject);
            }
        }

        static Sprite[] LoadIdleFrames(string assetId, string facing)
        {
            var frames = new Sprite[4];
            for (int index = 0; index < frames.Length; index++)
            {
                string path = $"{ArtRoot}/{assetId}/Sprites/{assetId}_{facing}_idle_{index:00}.png";
                frames[index] = AssetDatabase.LoadAssetAtPath<Sprite>(path);
                Assert.That(frames[index], Is.Not.Null, path);
            }

            return frames;
        }

        static void Capture(Camera camera, string path, int width, int height)
        {
            var target = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32);
            var image = new Texture2D(width, height, TextureFormat.RGBA32, false);
            RenderTexture previous = RenderTexture.active;
            try
            {
                camera.targetTexture = target;
                camera.Render();
                RenderTexture.active = target;
                image.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                image.Apply();
                File.WriteAllBytes(path, image.EncodeToPNG());
            }
            finally
            {
                camera.targetTexture = null;
                RenderTexture.active = previous;
                Object.Destroy(target);
                Object.Destroy(image);
            }
        }

        static bool HasVisibleCharacters(string path)
        {
            byte[] bytes = File.ReadAllBytes(path);
            var image = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            try
            {
                Assert.That(image.LoadImage(bytes), Is.True, path);
                Color32 background = image.GetPixel(0, 0);
                int different = 0;
                int errorShaderPixels = 0;
                Color32[] pixels = image.GetPixels32();
                for (int index = 0; index < pixels.Length; index += 29)
                {
                    Color32 pixel = pixels[index];
                    if (pixel.r > 240 && pixel.g < 30 && pixel.b > 240)
                    {
                        errorShaderPixels++;
                    }

                    if (Mathf.Abs(pixel.r - background.r) > 8
                        || Mathf.Abs(pixel.g - background.g) > 8
                        || Mathf.Abs(pixel.b - background.b) > 8)
                    {
                        different++;
                    }
                }

                return different > 200 && errorShaderPixels < 20;
            }
            finally
            {
                Object.Destroy(image);
            }
        }

        static string Pascal(string assetId)
        {
            string[] parts = assetId.Split('-');
            for (int index = 0; index < parts.Length; index++)
            {
                parts[index] = char.ToUpperInvariant(parts[index][0]) + parts[index].Substring(1);
            }

            return string.Concat(parts);
        }
    }
}
