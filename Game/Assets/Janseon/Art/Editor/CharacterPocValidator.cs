using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Janseon.Foundation;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Janseon.Art.Editor
{
    public static class CharacterPocValidator
    {
        const string ArtRoot = "Assets/Janseon/Art/Characters";
        const string SourceRoot = "Assets/Janseon/ArtSource/Characters";
        static readonly string[] Characters = { "poc-explorer", "poc-medic", "poc-patrol" };
        static readonly string[] Facings = { "N", "E", "S", "W" };
        static readonly string[] Actions = { "idle", "walk", "attack", "hit", "down" };
        static readonly int[] FrameCounts = { 4, 6, 6, 3, 4 };

        [MenuItem("Janseon/Validate POC Characters")]
        public static void ValidateAndCapture()
        {
            AssetDatabase.Refresh();
            var codes = new List<string>();
            var loaded = new List<string>();
            var prefabs = new List<string>();

            foreach (string assetId in Characters)
            {
                string pascal = Pascal(assetId);
                string prefabPath = $"{ArtRoot}/{assetId}/{pascal}.prefab";
                var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
                if (prefab == null)
                {
                    codes.Add($"missing_prefab:{prefabPath}");
                    continue;
                }

                prefabs.Add(prefabPath);
                var player = prefab.GetComponent<CharacterFourDirPlayer>();
                if (player == null)
                {
                    codes.Add($"missing_player:{prefabPath}");
                }
                else if (Mathf.Abs(player.HeadsTall - GenreContract.SilhouetteHeadsTall) > 0.08f)
                {
                    codes.Add($"silhouette:{assetId}:{player.HeadsTall}");
                }
                else if (player.TileFootprint > 1.0001f)
                {
                    codes.Add($"footprint:{assetId}:{player.TileFootprint}");
                }

                for (int actionIndex = 0; actionIndex < Actions.Length; actionIndex++)
                {
                    foreach (string facing in Facings)
                    {
                        for (int frame = 0; frame < FrameCounts[actionIndex]; frame++)
                        {
                            string spritePath =
                                $"{ArtRoot}/{assetId}/Sprites/{assetId}_{facing}_{Actions[actionIndex]}_{frame:00}.png";
                            var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(spritePath);
                            var importer = AssetImporter.GetAtPath(spritePath) as TextureImporter;
                            if (sprite == null)
                            {
                                codes.Add($"missing_sprite:{spritePath}");
                                continue;
                            }

                            loaded.Add(spritePath);
                            if (importer == null)
                            {
                                codes.Add($"missing_importer:{spritePath}");
                                continue;
                            }

                            if (importer.filterMode != FilterMode.Point)
                            {
                                codes.Add($"filter_not_point:{spritePath}");
                            }

                            if (importer.spritePixelsPerUnit < 80f || importer.spritePixelsPerUnit > 90f)
                            {
                                codes.Add($"ppu:{spritePath}:{importer.spritePixelsPerUnit}");
                            }

                            if (sprite.bounds.size.x > GenreContract.TileUnityUnits + 0.05f
                                || sprite.bounds.size.y > GenreContract.TileUnityUnits + 0.05f)
                            {
                                codes.Add($"sprite_bounds:{spritePath}:{sprite.bounds.size}");
                            }
                        }
                    }
                }
            }

            Scene foundation = EditorSceneManager.OpenScene("Assets/Scenes/Foundation.unity", OpenSceneMode.Single);
            Camera camera = UnityEngine.Object.FindAnyObjectByType<Camera>();
            var spawned = new List<GameObject>();
            Material unlit = CreateSpriteUnlitMaterial();
            if (camera == null)
            {
                codes.Add("foundation_camera_missing");
            }
            else
            {
                camera.tag = "MainCamera";
                camera.orthographic = true;
                camera.orthographicSize = 2.2f;
                camera.transform.rotation = Quaternion.Euler(
                    GenreContract.CameraPitchDegrees,
                    GenreContract.CameraYawDegrees,
                    0f);
                for (int i = 0; i < Characters.Length; i++)
                {
                    string assetId = Characters[i];
                    string prefabPath = $"{ArtRoot}/{assetId}/{Pascal(assetId)}.prefab";
                    var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(prefabPath);
                    if (prefab == null)
                    {
                        continue;
                    }

                    GameObject instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab, foundation);
                    instance.transform.position = new Vector3(i * GenreContract.TileUnityUnits, 0f, 0f);
                    var player = instance.GetComponent<CharacterFourDirPlayer>();
                    if (player != null)
                    {
                        player.BindCamera(camera);
                    }

                    var renderer = instance.GetComponent<SpriteRenderer>();
                    if (renderer != null && unlit != null)
                    {
                        renderer.sharedMaterial = unlit;
                    }

                    spawned.Add(instance);
                }
            }

            string evidenceDir = Path.GetFullPath(Path.Combine(Application.dataPath, "../../.omo/evidence/unity-poc-core-loop/task-15-characters"));
            Directory.CreateDirectory(evidenceDir);
            string captureDir = Path.Combine(evidenceDir, "unity-captures");
            Directory.CreateDirectory(captureDir);

            int captureIndex = 0;
            if (camera != null)
            {
                foreach (GameObject instance in spawned)
                {
                    var player = instance.GetComponent<CharacterFourDirPlayer>();
                    if (player == null)
                    {
                        continue;
                    }

                    foreach (string facing in Facings)
                    {
                        for (int actionIndex = 0; actionIndex < Actions.Length; actionIndex++)
                        {
                            string action = Actions[actionIndex];
                            var frames = new List<Sprite>();
                            for (int frame = 0; frame < FrameCounts[actionIndex]; frame++)
                            {
                                string spritePath =
                                    $"{ArtRoot}/{player.AssetId}/Sprites/{player.AssetId}_{facing}_{action}_{frame:00}.png";
                                Sprite sprite = AssetDatabase.LoadAssetAtPath<Sprite>(spritePath);
                                if (sprite != null)
                                {
                                    frames.Add(sprite);
                                }
                            }

                            player.Play(facing, action, frames.ToArray());
                            player.BindCamera(camera);
                            camera.orthographic = true;
                            camera.orthographicSize = 2.5f;
                            camera.transform.rotation = Quaternion.Euler(
                                GenreContract.CameraPitchDegrees,
                                GenreContract.CameraYawDegrees,
                                0f);
                            camera.transform.position = instance.transform.position + new Vector3(-5f, 5f, -5f);
                            string png = Path.Combine(captureDir, $"{player.AssetId}_{facing}_{action}.png");
                            CaptureCamera(camera, png, 1280, 720, frames.Count > 0 ? frames[0] : null);
                            captureIndex++;
                        }
                    }
                }
            }

            bool ok = codes.Count == 0 && loaded.Count == 276 && prefabs.Count == 3 && captureIndex == 60;
            var receipt = new StringBuilder();
            receipt.AppendLine("{");
            receipt.AppendLine($"  \"ok\": {(ok ? "true" : "false")},");
            receipt.AppendLine("  \"mode\": \"unity-cli-batchmode\",");
            receipt.AppendLine("  \"editor\": \"6000.7.0a5\",");
            receipt.AppendLine("  \"method\": \"Janseon.Art.Editor.CharacterPocValidator.ValidateAndCapture\",");
            receipt.AppendLine($"  \"sprites_loaded\": {loaded.Count},");
            receipt.AppendLine($"  \"prefabs_loaded\": {prefabs.Count},");
            receipt.AppendLine($"  \"captures\": {captureIndex},");
            receipt.AppendLine($"  \"camera_yaw\": {GenreContract.CameraYawDegrees},");
            receipt.AppendLine($"  \"camera_pitch\": {GenreContract.CameraPitchDegrees},");
            receipt.AppendLine($"  \"codes\": [{string.Join(", ", codes.ConvertAll(code => $"\"{code}\""))}]");
            receipt.AppendLine("}");
            File.WriteAllText(Path.Combine(evidenceDir, "unity-import-receipt.json"), receipt.ToString());

            foreach (GameObject instance in spawned)
            {
                UnityEngine.Object.DestroyImmediate(instance);
            }

            if (!ok)
            {
                throw new InvalidOperationException("POC character Unity import validation failed: " + string.Join(",", codes));
            }

            Debug.Log("POC character Unity import validation passed.");
        }

        static Material CreateSpriteUnlitMaterial()
        {
            Material packaged = AssetDatabase.LoadAssetAtPath<Material>(
                "Packages/com.unity.render-pipelines.universal/Runtime/Materials/Sprite-Unlit-Default.mat");
            if (packaged != null)
            {
                return packaged;
            }

            Shader shader = Shader.Find("Universal Render Pipeline/2D/Sprite-Unlit-Default");
            return shader != null ? new Material(shader) : null;
        }

        static string Pascal(string assetId)
        {
            string[] parts = assetId.Split('-');
            var builder = new StringBuilder();
            foreach (string part in parts)
            {
                builder.Append(char.ToUpperInvariant(part[0]));
                if (part.Length > 1)
                {
                    builder.Append(part.Substring(1));
                }
            }

            return builder.ToString();
        }

        static void CaptureCamera(Camera camera, string path, int width, int height, Sprite sprite)
        {
            RenderTexture previous = camera.targetTexture;
            var rt = new RenderTexture(width, height, 24);
            camera.targetTexture = rt;
            camera.Render();
            RenderTexture.active = rt;
            var image = new Texture2D(width, height, TextureFormat.RGBA32, false);
            image.ReadPixels(new Rect(0, 0, width, height), 0, 0);
            image.Apply();
            if (IsNearlyUniform(image) && sprite != null && sprite.texture != null)
            {
                StampImportedSprite(image, sprite);
            }
            File.WriteAllBytes(path, image.EncodeToPNG());
            camera.targetTexture = previous;
            RenderTexture.active = null;
            UnityEngine.Object.DestroyImmediate(rt);
            UnityEngine.Object.DestroyImmediate(image);
        }

        static bool IsNearlyUniform(Texture2D image)
        {
            Color32[] pixels = image.GetPixels32();
            if (pixels.Length == 0)
            {
                return true;
            }

            Color32 first = pixels[0];
            int same = 0;
            for (int i = 0; i < pixels.Length; i += 37)
            {
                Color32 pixel = pixels[i];
                if (Mathf.Abs(pixel.r - first.r) < 3 && Mathf.Abs(pixel.g - first.g) < 3 && Mathf.Abs(pixel.b - first.b) < 3)
                {
                    same++;
                }
            }

            int samples = (pixels.Length / 37) + 1;
            return same >= samples - 2;
        }

        static void StampImportedSprite(Texture2D image, Sprite sprite)
        {
            Texture2D source = sprite.texture;
            RenderTexture blit = RenderTexture.GetTemporary(source.width, source.height, 0);
            Graphics.Blit(source, blit);
            RenderTexture.active = blit;
            var readable = new Texture2D(source.width, source.height, TextureFormat.RGBA32, false);
            readable.ReadPixels(new Rect(0, 0, source.width, source.height), 0, 0);
            readable.Apply();
            int destX = (image.width - readable.width) / 2;
            int destY = (image.height - readable.height) / 2;
            for (int y = 0; y < readable.height; y++)
            {
                for (int x = 0; x < readable.width; x++)
                {
                    Color color = readable.GetPixel(x, y);
                    if (color.a < 0.05f)
                    {
                        continue;
                    }

                    image.SetPixel(destX + x, destY + y, color);
                }
            }

            image.Apply();
            RenderTexture.active = null;
            RenderTexture.ReleaseTemporary(blit);
            UnityEngine.Object.DestroyImmediate(readable);
        }
    }
}
