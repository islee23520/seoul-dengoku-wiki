using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Janseon.Foundation.UI;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;
using Debug = UnityEngine.Debug;
using Object = UnityEngine.Object;
#if UNITY_EDITOR
using UnityEditor;
#endif

namespace Janseon.Foundation.Tests
{
    /// <summary>
    /// 격리된 UI 후보(ArtCandidates/UI)를 실제 PlayMode 카메라로 1280x720 / 1920x1080에 렌더한다.
    /// imported Texture2D/Sprite만 사용하며(raw 파일 bypass 없음) 32px 아이콘 행과 2x2 타일 반복을 같은 장면에 담는다.
    /// </summary>
    public sealed class UiCandidateRenderPlayModeTests
    {
        const string CandidateRoot = "Assets/Janseon/ArtCandidates/UI";
        const string EvidenceRel = ".omo/evidence/gateway-ui-candidates/unity-render";
        static readonly string[] IconNames = { "talk", "detour", "battle", "heal", "party", "station", "crate", "alert" };
        static readonly string[] TileKinds = { "floor", "wall", "platform" };
        static readonly string[] ButtonStates = { "normal", "hover", "pressed" };
        static readonly Color32 Void = new Color32(11, 17, 28, 255);

        [UnityTest]
        public IEnumerator RendersImportedCandidatesAtBothResolutions()
        {
            Assert.That(Application.isPlaying, Is.True, "must run inside real PlayMode");
            Assert.That(Application.isBatchMode, Is.True, "batchmode only");
            string repoRoot = Directory.GetParent(Application.dataPath)!.Parent!.FullName;
            string outDir = Path.Combine(repoRoot, EvidenceRel);
            Directory.CreateDirectory(outDir);
            string head = RunGit(repoRoot, "rev-parse HEAD").Trim();
            Assert.That(head, Does.Match("^[0-9a-f]{40}$"));
            string fingerprintBefore = UiSourceFingerprint.Compute(repoRoot);

            var assets = new CandidateAssets();
            assets.Load();

            var shots = new List<string>();
            foreach (var resolution in new[] { (1280, 720), (1920, 1080) })
            {
                IEnumerator kit = RenderKit(assets, resolution.Item1, resolution.Item2, outDir, head, fingerprintBefore, shots);
                while (kit.MoveNext()) yield return kit.Current;
                IEnumerator title = RenderTitle(assets, resolution.Item1, resolution.Item2, outDir, head, fingerprintBefore, shots);
                while (title.MoveNext()) yield return title.Current;
            }

            Assert.That(UiSourceFingerprint.Compute(repoRoot), Is.EqualTo(fingerprintBefore), "source changed during render");
            var summary = new StringBuilder();
            summary.Append("{\n  \"schema\": \"janseon-ui-candidate-render/1\",\n");
            summary.Append("  \"unity\": \"").Append(Application.unityVersion).Append("\",\n");
            summary.Append("  \"is_playing\": true,\n  \"is_batchmode\": true,\n");
            summary.Append("  \"head\": \"").Append(head).Append("\",\n");
            summary.Append("  \"dirty_tree_fingerprint\": \"").Append(fingerprintBefore).Append("\",\n");
            summary.Append("  \"sprite_shader\": \"").Append(assets.SpriteShader.name).Append("\",\n");
            summary.Append("  \"tile_shader\": \"").Append(assets.TileShader.name).Append("\",\n");
            summary.Append("  \"candidate_root\": \"").Append(CandidateRoot).Append("\",\n");
            summary.Append("  \"imported\": [\n").Append(string.Join(",\n", assets.Descriptions)).Append("\n  ],\n");
            summary.Append("  \"shots\": [\n").Append(string.Join(",\n", shots)).Append("\n  ]\n}\n");
            File.WriteAllText(Path.Combine(outDir, "render-receipt.json"), summary.ToString());
            assets.Dispose();
        }

        static IEnumerator RenderKit(CandidateAssets assets, int width, int height, string outDir, string head, string fingerprint, List<string> shots)
        {
            float s = width / 1280f;
            var stage = new Stage(width, height, assets);
            try
            {
                stage.Sprite(assets.Title, 24 * s, 24 * s, 640 * s, 360 * s);
                stage.Sliced(assets.Panel, 688 * s, 24 * s, 360 * s, 360 * s);
                for (int i = 0; i < IconNames.Length; i++)
                {
                    stage.Sprite(assets.Icons[i], (24 + i * 72) * s, 400 * s, 64 * s, 64 * s);
                    stage.Sprite(assets.Icons[i], (24 + i * 72) * s, 472 * s, 32 * s, 32 * s);
                }

                for (int i = 0; i < ButtonStates.Length; i++)
                {
                    stage.Sliced(assets.Buttons[i], 688 * s, (400 + i * 76) * s, 320 * s, 64 * s);
                }

                for (int i = 0; i < TileKinds.Length; i++)
                {
                    stage.TiledQuad(assets.Tiles[i], (24 + i * 200) * s, 516 * s, 180 * s, 180 * s, 2, 2);
                }

                Texture2D frame = stage.Capture();
                Color32[] px = frame.GetPixels32();
                int w = frame.width, h = frame.height;
                Assert.That(CountMagenta(px), Is.EqualTo(0), "shader failure (magenta) in kit render");
                int nonVoid = CountNonVoid(px);
                Assert.That(nonVoid, Is.GreaterThan(w * h / 5), "kit render must contain the candidates, not just background");

                for (int i = 0; i < IconNames.Length; i++)
                {
                    int cell = CountNonVoid(px, w, h, (24 + i * 72) * s, 472 * s, 32 * s, 32 * s);
                    Assert.That(cell, Is.GreaterThanOrEqualTo(60 * s * s), "32px icon " + IconNames[i] + " must remain visible");
                }

                for (int i = 0; i < TileKinds.Length; i++)
                {
                    float x0 = (24 + i * 200) * s, y0 = 516 * s, size = 180 * s;
                    float half = size / 2f;
                    double lr = MeanAbsDiff(px, w, h, x0, y0, half, size, x0 + half, y0, half, size);
                    double tb = MeanAbsDiff(px, w, h, x0, y0, size, half, x0, y0 + half, size, half);
                    Assert.That(lr, Is.LessThan(4.0), TileKinds[i] + " 2x2 repeat left/right halves must match (wrap Repeat)");
                    Assert.That(tb, Is.LessThan(4.0), TileKinds[i] + " 2x2 repeat top/bottom halves must match (wrap Repeat)");
                    Assert.That(CountNonVoid(px, w, h, x0, y0, size, size), Is.GreaterThan(size * size * 0.9), TileKinds[i] + " quad must be textured");
                }

                int panelCenter = CountNonVoid(px, w, h, (688 + 120) * s, (24 + 120) * s, 120 * s, 120 * s);
                Assert.That(panelCenter, Is.EqualTo(0), "9-slice panel centre must stay hollow over the void background");
                int panelRing = CountNonVoid(px, w, h, 688 * s, 24 * s, 360 * s, 12 * s);
                Assert.That(panelRing, Is.GreaterThan(300 * s * s), "panel top band must be drawn");

                shots.Add(WriteShot(frame, outDir, "kit", width, height, head, fingerprint, nonVoid));
                Object.Destroy(frame);
            }
            finally
            {
                stage.Dispose();
            }
            yield break;
        }

        static IEnumerator RenderTitle(CandidateAssets assets, int width, int height, string outDir, string head, string fingerprint, List<string> shots)
        {
            var stage = new Stage(width, height, assets);
            try
            {
                stage.Sprite(assets.Title, 0, 0, width, height);
                Texture2D frame = stage.Capture();
                Color32[] px = frame.GetPixels32();
                Assert.That(CountMagenta(px), Is.EqualTo(0), "shader failure (magenta) in title render");
                double lum = 0;
                int neon = 0;
                for (int i = 0; i < px.Length; i++)
                {
                    lum += 0.2126 * px[i].r + 0.7152 * px[i].g + 0.0722 * px[i].b;
                    if (IsNeonCyan(px[i])) neon++;
                }

                lum /= px.Length;
                Assert.That(lum, Is.InRange(30.0, 120.0), "title must read as a lit but quiet concourse");
                Assert.That(neon / (double)px.Length, Is.LessThanOrEqualTo(0.005), "title must not carry decorative neon cyan");
                shots.Add(WriteShot(frame, outDir, "title", width, height, head, fingerprint, CountNonVoid(px)));
                Object.Destroy(frame);
            }
            finally
            {
                stage.Dispose();
            }
            yield break;
        }

        sealed class CandidateAssets : IDisposable
        {
            public Sprite Title;
            public Sprite Panel;
            public readonly Sprite[] Icons = new Sprite[IconNames.Length];
            public readonly Sprite[] Buttons = new Sprite[ButtonStates.Length];
            public readonly Texture2D[] Tiles = new Texture2D[TileKinds.Length];
            public Shader SpriteShader;
            public Shader TileShader;
            public readonly List<string> Descriptions = new List<string>();
            readonly List<Material> materials = new List<Material>();

            public void Load()
            {
                Title = LoadSprite(CandidateRoot + "/Title/poc-title-art.png", FilterMode.Bilinear);
                Panel = LoadSprite(CandidateRoot + "/poc-ui-panel-9slice.png", FilterMode.Bilinear);
                Assert.That(Panel.border, Is.EqualTo(new Vector4(48f, 48f, 48f, 48f)), "panel sprite border must come from the importer");
                for (int i = 0; i < IconNames.Length; i++) Icons[i] = LoadSprite(CandidateRoot + "/icon-" + IconNames[i] + ".png", FilterMode.Point);
                for (int i = 0; i < ButtonStates.Length; i++)
                {
                    Buttons[i] = LoadSprite(CandidateRoot + "/poc-ui-button-" + ButtonStates[i] + ".png", FilterMode.Bilinear);
                    Assert.That(Buttons[i].border, Is.EqualTo(new Vector4(8f, 8f, 8f, 8f)), ButtonStates[i] + " button border must come from the importer");
                }

                for (int i = 0; i < TileKinds.Length; i++)
                {
                    string path = CandidateRoot + "/Tiles/poc-tile-" + TileKinds[i] + ".png";
                    Texture2D tile = LoadTexture(path);
                    Assert.That(tile.wrapMode, Is.EqualTo(TextureWrapMode.Repeat), path + " must import with Repeat wrap");
                    Assert.That(tile.mipmapCount, Is.GreaterThan(1), path + " must import with mipmaps");
                    Tiles[i] = tile;
                    Describe(path, tile);
                }

                SpriteShader = Shader.Find("Sprites/Default");
                TileShader = Shader.Find("Unlit/Texture");
                Assert.That(SpriteShader, Is.Not.Null, "sprite shader");
                Assert.That(TileShader, Is.Not.Null, "unlit texture shader");
            }

            public Material NewMaterial(Shader shader)
            {
                var material = new Material(shader);
                materials.Add(material);
                return material;
            }

            Sprite LoadSprite(string path, FilterMode expectedFilter)
            {
                Texture2D texture = LoadTexture(path);
                Assert.That(texture.filterMode, Is.EqualTo(expectedFilter), path + " filter must come from the importer");
                Assert.That(texture.wrapMode, Is.EqualTo(TextureWrapMode.Clamp), path + " wrap must be Clamp");
                Describe(path, texture);
#if UNITY_EDITOR
                var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(path);
#else
                Sprite sprite = null;
#endif
                Assert.That(sprite, Is.Not.Null, path + " must import as a Sprite");
                return sprite;
            }

            static Texture2D LoadTexture(string path)
            {
#if UNITY_EDITOR
                var texture = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
#else
                Texture2D texture = null;
#endif
                Assert.That(texture, Is.Not.Null, "imported candidate missing: " + path);
                return texture;
            }

            void Describe(string path, Texture2D texture)
            {
                string sha = "unknown";
                if (File.Exists(path)) sha = Sha256Hex(File.ReadAllBytes(path));
                Descriptions.Add("    {\"path\": \"" + path + "\", \"sha256\": \"" + sha + "\", \"width\": " + texture.width
                    + ", \"height\": " + texture.height + ", \"filter\": \"" + texture.filterMode + "\", \"wrap\": \"" + texture.wrapMode
                    + "\", \"mipmaps\": " + texture.mipmapCount + ", \"format\": \"" + texture.format + "\"}");
            }

            public void Dispose()
            {
                foreach (Material material in materials) Object.Destroy(material);
                materials.Clear();
            }
        }

        /// <summary>1 world unit = 1 pixel인 직교 카메라 무대. y는 위에서 아래로 픽셀 좌표.</summary>
        sealed class Stage : IDisposable
        {
            readonly int width;
            readonly int height;
            readonly CandidateAssets assets;
            readonly GameObject root;
            readonly Camera camera;
            readonly RenderTexture target;
            int order;

            public Stage(int width, int height, CandidateAssets assets)
            {
                this.width = width;
                this.height = height;
                this.assets = assets;
                root = new GameObject("ui-candidate-stage-" + width + "x" + height);
                var cameraObject = new GameObject("camera");
                cameraObject.transform.SetParent(root.transform, false);
                camera = cameraObject.AddComponent<Camera>();
                camera.orthographic = true;
                camera.orthographicSize = height / 2f;
                camera.aspect = width / (float)height;
                camera.nearClipPlane = 0.1f;
                camera.farClipPlane = 100f;
                camera.clearFlags = CameraClearFlags.SolidColor;
                camera.backgroundColor = Void;
                camera.transform.position = new Vector3(width / 2f, height / 2f, -10f);
                target = new RenderTexture(width, height, 24, RenderTextureFormat.ARGB32) { antiAliasing = 1, filterMode = FilterMode.Point };
                target.Create();
                camera.targetTexture = target;
            }

            Vector3 Center(float x, float y, float w, float h) => new Vector3(x + w / 2f, height - (y + h / 2f), 0f);

            public void Sprite(Sprite sprite, float x, float y, float w, float h)
            {
                var go = new GameObject(sprite.name);
                go.transform.SetParent(root.transform, false);
                var renderer = go.AddComponent<SpriteRenderer>();
                renderer.sprite = sprite;
                renderer.sharedMaterial = assets.NewMaterial(assets.SpriteShader);
                renderer.sortingOrder = order++;
                float ppu = sprite.pixelsPerUnit;
                go.transform.localScale = new Vector3(w / sprite.rect.width * ppu, h / sprite.rect.height * ppu, 1f);
                go.transform.position = Center(x, y, w, h);
            }

            public void Sliced(Sprite sprite, float x, float y, float w, float h)
            {
                var go = new GameObject(sprite.name + "-sliced");
                go.transform.SetParent(root.transform, false);
                var renderer = go.AddComponent<SpriteRenderer>();
                renderer.sprite = sprite;
                renderer.sharedMaterial = assets.NewMaterial(assets.SpriteShader);
                renderer.sortingOrder = order++;
                renderer.drawMode = SpriteDrawMode.Sliced;
                float ppu = sprite.pixelsPerUnit;
                renderer.size = new Vector2(w / ppu, h / ppu);
                go.transform.localScale = new Vector3(ppu, ppu, 1f);
                go.transform.position = Center(x, y, w, h);
            }

            public void TiledQuad(Texture2D texture, float x, float y, float w, float h, int repeatX, int repeatY)
            {
                GameObject quad = GameObject.CreatePrimitive(PrimitiveType.Quad);
                Object.Destroy(quad.GetComponent<Collider>());
                quad.name = texture.name + "-2x2";
                quad.transform.SetParent(root.transform, false);
                Material material = assets.NewMaterial(assets.TileShader);
                material.mainTexture = texture;
                material.mainTextureScale = new Vector2(repeatX, repeatY);
                quad.GetComponent<MeshRenderer>().sharedMaterial = material;
                quad.transform.localScale = new Vector3(w, h, 1f);
                quad.transform.position = Center(x, y, w, h) + new Vector3(0f, 0f, 1f);
            }

            public Texture2D Capture()
            {
                camera.Render();
                RenderTexture previous = RenderTexture.active;
                RenderTexture.active = target;
                var frame = new Texture2D(width, height, TextureFormat.RGBA32, false);
                frame.ReadPixels(new Rect(0, 0, width, height), 0, 0);
                frame.Apply();
                RenderTexture.active = previous;
                return frame;
            }

            public void Dispose()
            {
                root.SetActive(false);
                camera.targetTexture = null;
                target.Release();
                Object.Destroy(target);
                Object.Destroy(root);
            }
        }

        static string WriteShot(Texture2D frame, string outDir, string stem, int width, int height, string head, string fingerprint, int nonVoid)
        {
            byte[] png = frame.EncodeToPNG();
            string name = stem + "-" + width + "x" + height + ".png";
            string pngPath = Path.Combine(outDir, name);
            File.WriteAllBytes(pngPath, png);
            string sha = Sha256Hex(png);
            string receipt = "{\n  \"stem\": \"" + stem + "\",\n  \"unity\": \"" + Application.unityVersion + "\",\n  \"is_playing\": " + (Application.isPlaying ? "true" : "false")
                + ",\n  \"is_batchmode\": " + (Application.isBatchMode ? "true" : "false") + ",\n  \"width\": " + width + ",\n  \"height\": " + height
                + ",\n  \"head\": \"" + head + "\",\n  \"dirty_tree_fingerprint\": \"" + fingerprint + "\",\n  \"png\": \"" + pngPath.Replace("\\", "/")
                + "\",\n  \"png_sha256\": \"" + sha + "\",\n  \"non_void_pixels\": " + nonVoid + ",\n  \"capture_api\": \"PlayMode Camera.targetTexture+Camera.Render+ReadPixels\",\n  \"recorded_at\": \""
                + DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ") + "\"\n}\n";
            File.WriteAllText(Path.Combine(outDir, stem + "-" + width + "x" + height + ".receipt.json"), receipt);
            Debug.Log("ui candidate render wrote " + pngPath + " sha256=" + sha);
            return "    {\"stem\": \"" + stem + "\", \"width\": " + width + ", \"height\": " + height + ", \"png\": \"" + pngPath.Replace("\\", "/") + "\", \"sha256\": \"" + sha + "\"}";
        }

        static bool IsVoid(Color32 p) => Math.Abs(p.r - Void.r) <= 2 && Math.Abs(p.g - Void.g) <= 2 && Math.Abs(p.b - Void.b) <= 2;

        static bool IsNeonCyan(Color32 p)
        {
            float r = p.r / 255f, g = p.g / 255f, b = p.b / 255f;
            float max = Mathf.Max(r, g, b), min = Mathf.Min(r, g, b);
            if (max < 0.45f) return false;
            float sat = max > 0 ? (max - min) / max : 0f;
            if (sat < 0.30f) return false;
            float d = max - min + 1e-6f;
            float hue = max == r ? (60f * ((g - b) / d) + 360f) % 360f : max == g ? 60f * ((b - r) / d) + 120f : 60f * ((r - g) / d) + 240f;
            return hue >= 165f && hue <= 195f;
        }

        static int CountMagenta(Color32[] px)
        {
            int count = 0;
            for (int i = 0; i < px.Length; i++) if (px[i].r > 240 && px[i].g < 20 && px[i].b > 240) count++;
            return count;
        }

        static int CountNonVoid(Color32[] px)
        {
            int count = 0;
            for (int i = 0; i < px.Length; i++) if (!IsVoid(px[i])) count++;
            return count;
        }

        // 픽셀 좌표(위에서 아래)를 텍스처 좌표(아래에서 위)로 바꿔 센다.
        static int CountNonVoid(Color32[] px, int w, int h, float x, float yTop, float rw, float rh)
        {
            int count = 0;
            int x0 = Mathf.RoundToInt(x), x1 = Mathf.RoundToInt(x + rw);
            int y0 = h - Mathf.RoundToInt(yTop + rh), y1 = h - Mathf.RoundToInt(yTop);
            for (int y = Mathf.Max(0, y0); y < Mathf.Min(h, y1); y++)
            for (int cx = Mathf.Max(0, x0); cx < Mathf.Min(w, x1); cx++)
                if (!IsVoid(px[y * w + cx])) count++;
            return count;
        }

        static double MeanAbsDiff(Color32[] px, int w, int h, float ax, float ayTop, float aw, float ah, float bx, float byTop, float bw, float bh)
        {
            int cols = Mathf.RoundToInt(Mathf.Min(aw, bw)), rows = Mathf.RoundToInt(Mathf.Min(ah, bh));
            int ax0 = Mathf.RoundToInt(ax), bx0 = Mathf.RoundToInt(bx);
            int ay0 = h - Mathf.RoundToInt(ayTop + ah), by0 = h - Mathf.RoundToInt(byTop + bh);
            double total = 0;
            long n = 0;
            for (int y = 0; y < rows; y++)
            for (int x = 0; x < cols; x++)
            {
                Color32 a = px[(ay0 + y) * w + ax0 + x];
                Color32 b = px[(by0 + y) * w + bx0 + x];
                total += (Math.Abs(a.r - b.r) + Math.Abs(a.g - b.g) + Math.Abs(a.b - b.b)) / 3.0;
                n++;
            }

            return n == 0 ? 0 : total / n;
        }

        static string RunGit(string repo, string args)
        {
            var psi = new ProcessStartInfo("git", args)
            {
                WorkingDirectory = repo,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            using var process = Process.Start(psi);
            string output = process!.StandardOutput.ReadToEnd();
            process.WaitForExit(30_000);
            return output;
        }

        static string Sha256Hex(byte[] bytes)
        {
            using var sha = SHA256.Create();
            byte[] hash = sha.ComputeHash(bytes);
            var sb = new StringBuilder(hash.Length * 2);
            foreach (byte b in hash) sb.Append(b.ToString("x2"));
            return sb.ToString();
        }
    }
}
