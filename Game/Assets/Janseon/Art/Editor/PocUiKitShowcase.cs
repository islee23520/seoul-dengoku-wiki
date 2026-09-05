using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace Janseon.Art.Editor
{
    public static class PocUiKitShowcase
    {
        const string ArtRoot = "Assets/Janseon/Art";

        public static void Run()
        {
            ApplyImportSettings();
            AssetDatabase.Refresh();
            var destDir = ResolveEvidenceDir();
            var receiptPath = RenderShowcase(destDir);
            WriteImporterSnapshot(destDir);
            Debug.Log($"poc ui kit showcase wrote {receiptPath}");
        }

        static void ApplyImportSettings()
        {
            SetSprite($"{ArtRoot}/Title/poc-title-art.png", FilterMode.Bilinear, Vector4.zero, false);
            SetSprite($"{ArtRoot}/UI/poc-ui-concept.png", FilterMode.Bilinear, Vector4.zero, false);
            SetSprite($"{ArtRoot}/UI/poc-ui-kit.png", FilterMode.Bilinear, Vector4.zero, false);
            SetSprite($"{ArtRoot}/UI/poc-ui-panel-9slice.png", FilterMode.Point, new Vector4(48f, 48f, 48f, 48f), true);
            SetSprite($"{ArtRoot}/UI/poc-ui-button-normal.png", FilterMode.Point, new Vector4(8f, 8f, 8f, 8f), true);
            SetSprite($"{ArtRoot}/UI/poc-ui-button-hover.png", FilterMode.Point, new Vector4(8f, 8f, 8f, 8f), true);
            SetSprite($"{ArtRoot}/UI/poc-ui-button-pressed.png", FilterMode.Point, new Vector4(8f, 8f, 8f, 8f), true);
            SetSprite($"{ArtRoot}/UI/poc-ui-icons.png", FilterMode.Point, Vector4.zero, true);
            foreach (var name in new[] { "talk", "detour", "battle", "heal", "party", "station", "crate", "alert" })
            {
                SetSprite($"{ArtRoot}/UI/icon-{name}.png", FilterMode.Point, Vector4.zero, true);
            }

            SetTile($"{ArtRoot}/Tiles/poc-tile-floor.png");
            SetTile($"{ArtRoot}/Tiles/poc-tile-wall.png");
            SetTile($"{ArtRoot}/Tiles/poc-tile-platform.png");
            AssetDatabase.SaveAssets();
        }

        static void SetSprite(string path, FilterMode filter, Vector4 border, bool pointAlpha)
        {
            var importer = (TextureImporter)AssetImporter.GetAtPath(path);
            if (importer == null)
            {
                throw new FileNotFoundException(path);
            }

            var dirty = false;
            if (importer.textureType != TextureImporterType.Sprite) { importer.textureType = TextureImporterType.Sprite; dirty = true; }
            if (importer.spriteImportMode != SpriteImportMode.Single) { importer.spriteImportMode = SpriteImportMode.Single; dirty = true; }
            if (!Mathf.Approximately(importer.spritePixelsPerUnit, 100f)) { importer.spritePixelsPerUnit = 100f; dirty = true; }
            if (importer.spriteBorder != border) { importer.spriteBorder = border; dirty = true; }
            if (importer.mipmapEnabled) { importer.mipmapEnabled = false; dirty = true; }
            if (importer.alphaIsTransparency != pointAlpha) { importer.alphaIsTransparency = pointAlpha; dirty = true; }
            if (importer.filterMode != filter) { importer.filterMode = filter; dirty = true; }
            if (importer.wrapMode != TextureWrapMode.Clamp) { importer.wrapMode = TextureWrapMode.Clamp; dirty = true; }
            if (importer.npotScale != TextureImporterNPOTScale.None) { importer.npotScale = TextureImporterNPOTScale.None; dirty = true; }
            if (dirty) importer.SaveAndReimport();
        }

        static void SetTile(string path)
        {
            var importer = (TextureImporter)AssetImporter.GetAtPath(path);
            if (importer == null)
            {
                throw new FileNotFoundException(path);
            }

            var dirty = false;
            if (importer.textureType != TextureImporterType.Default) { importer.textureType = TextureImporterType.Default; dirty = true; }
            if (!importer.mipmapEnabled) { importer.mipmapEnabled = true; dirty = true; }
            if (importer.filterMode != FilterMode.Bilinear) { importer.filterMode = FilterMode.Bilinear; dirty = true; }
            if (importer.wrapMode != TextureWrapMode.Repeat) { importer.wrapMode = TextureWrapMode.Repeat; dirty = true; }
            if (importer.alphaIsTransparency) { importer.alphaIsTransparency = false; dirty = true; }
            if (dirty) importer.SaveAndReimport();
        }

        internal static string BuildEvidenceDir(string repoRoot)
        {
            return Path.Combine(repoRoot, ".omo", "evidence", "gateway-ui-quality", "showcase");
        }

        static string ResolveEvidenceDir()
        {
            var project = Directory.GetParent(Application.dataPath)?.FullName;
            var repo = Directory.GetParent(project ?? ".")?.FullName;
            var destDir = BuildEvidenceDir(repo ?? ".");
            Directory.CreateDirectory(destDir);
            return destDir;
        }

        static string RenderShowcase(string destDir)
        {
            var shots = new[]
            {
                WriteShot(destDir, 1280, 720),
                WriteShot(destDir, 1920, 1080),
            };
            var receipt = new DualResolutionReceipt
            {
                schema = "janseon-gateway-ui-quality-showcase-dual-res/1",
                recorded_at = System.DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                unity_version = Application.unityVersion,
                execute_method = "Janseon.Art.Editor.PocUiKitShowcase.Run",
                batchmode = true,
                load_path = "AssetDatabase imported Texture2D",
                shots = shots,
            };
            var receiptPath = Path.Combine(destDir, "showcase-receipt.json");
            File.WriteAllText(receiptPath, JsonUtility.ToJson(receipt, true));
            return receiptPath;
        }

        static DualResolutionShot WriteShot(string destDir, int width, int height)
        {
            var scale = width / 1280f;
            var surface = new Texture2D(width, height, TextureFormat.RGBA32, false);
            Fill(surface, new Color32(18, 28, 42, 255));
            Blit(surface, LoadPng($"{ArtRoot}/Title/poc-title-art.png"), Px(24, scale), Px(24, scale), Px(640, scale), Px(360, scale));
            BlitNineSlice(surface, LoadPng($"{ArtRoot}/UI/poc-ui-panel-9slice.png"), Px(688, scale), Px(24, scale), Px(360, scale), Px(360, scale), Px(48, scale));
            Blit(surface, LoadPng($"{ArtRoot}/UI/poc-ui-button-normal.png"), Px(688, scale), Px(400, scale), Px(256, scale), Px(64, scale));
            Blit(surface, LoadPng($"{ArtRoot}/UI/poc-ui-button-hover.png"), Px(688, scale), Px(476, scale), Px(256, scale), Px(64, scale));
            Blit(surface, LoadPng($"{ArtRoot}/UI/poc-ui-button-pressed.png"), Px(688, scale), Px(552, scale), Px(256, scale), Px(64, scale));
            var icons = new[] { "talk", "detour", "battle", "heal", "party", "station", "crate", "alert" };
            for (var i = 0; i < icons.Length; i++)
            {
                Blit(surface, LoadPng($"{ArtRoot}/UI/icon-{icons[i]}.png"), Px(24, scale) + i * Px(72, scale), Px(400, scale), Px(64, scale), Px(64, scale));
            }

            Blit(surface, LoadPng($"{ArtRoot}/Tiles/poc-tile-floor.png"), Px(24, scale), Px(500, scale), Px(160, scale), Px(160, scale));
            Blit(surface, LoadPng($"{ArtRoot}/Tiles/poc-tile-wall.png"), Px(200, scale), Px(500, scale), Px(160, scale), Px(160, scale));
            Blit(surface, LoadPng($"{ArtRoot}/Tiles/poc-tile-platform.png"), Px(376, scale), Px(500, scale), Px(160, scale), Px(160, scale));
            var png = surface.EncodeToPNG();
            Object.DestroyImmediate(surface);
            var dest = Path.Combine(destDir, $"unity-kit-showcase-{width}x{height}.png");
            File.WriteAllBytes(dest, png);
            return new DualResolutionShot
            {
                width = width,
                height = height,
                path = dest,
                sha256 = Sha256Hex(png),
            };
        }

        static int Px(int value, float scale) => Mathf.RoundToInt(value * scale);

        static string Sha256Hex(byte[] bytes)
        {
            using (var sha = SHA256.Create())
            {
                var hash = sha.ComputeHash(bytes);
                var sb = new StringBuilder(hash.Length * 2);
                for (var i = 0; i < hash.Length; i++) sb.Append(hash[i].ToString("x2"));
                return sb.ToString();
            }
        }

        [System.Serializable]
        class DualResolutionReceipt
        {
            public string schema;
            public string recorded_at;
            public string unity_version;
            public string execute_method;
            public bool batchmode;
            public string load_path;
            public DualResolutionShot[] shots;
        }

        [System.Serializable]
        class DualResolutionShot
        {
            public int width;
            public int height;
            public string path;
            public string sha256;
        }

        static Texture2D LoadPng(string assetPath)
        {
            var imported = AssetDatabase.LoadAssetAtPath<Texture2D>(assetPath);
            if (imported == null)
            {
                throw new FileNotFoundException(assetPath);
            }

            var copy = new Texture2D(imported.width, imported.height, TextureFormat.RGBA32, false);
            copy.filterMode = imported.filterMode;
            copy.wrapMode = imported.wrapMode;
            if (imported.isReadable)
            {
                copy.SetPixels(imported.GetPixels());
                copy.Apply();
                return copy;
            }

            var rt = RenderTexture.GetTemporary(imported.width, imported.height, 0, RenderTextureFormat.ARGB32);
            var previous = RenderTexture.active;
            try
            {
                Graphics.Blit(imported, rt);
                RenderTexture.active = rt;
                copy.ReadPixels(new Rect(0, 0, imported.width, imported.height), 0, 0);
                copy.Apply();
                return copy;
            }
            finally
            {
                RenderTexture.active = previous;
                RenderTexture.ReleaseTemporary(rt);
            }
        }

        static void Fill(Texture2D surface, Color32 color)
        {
            var pixels = new Color32[surface.width * surface.height];
            for (var i = 0; i < pixels.Length; i++) pixels[i] = color;
            surface.SetPixels32(pixels);
        }

        static void Blit(Texture2D dest, Texture2D src, int x, int y, int width, int height)
        {
            var scaled = Scale(src, width, height);
            Composite(dest, scaled, x, y);
            Object.DestroyImmediate(src);
            Object.DestroyImmediate(scaled);
        }

        static Texture2D Scale(Texture2D src, int width, int height)
        {
            var copy = new Texture2D(width, height, TextureFormat.RGBA32, false);
            for (var y = 0; y < height; y++)
            {
                var v = (y + 0.5f) / height;
                var sy = Mathf.Clamp(Mathf.FloorToInt(v * src.height), 0, src.height - 1);
                for (var x = 0; x < width; x++)
                {
                    var u = (x + 0.5f) / width;
                    var sx = Mathf.Clamp(Mathf.FloorToInt(u * src.width), 0, src.width - 1);
                    copy.SetPixel(x, y, src.GetPixel(sx, sy));
                }
            }

            copy.Apply();
            return copy;
        }

        static void BlitNineSlice(Texture2D dest, Texture2D src, int x, int y, int width, int height, int border)
        {
            var scaled = NineSlice(src, width, height, border);
            Composite(dest, scaled, x, y);
            Object.DestroyImmediate(src);
            Object.DestroyImmediate(scaled);
        }

        static void Composite(Texture2D dest, Texture2D src, int x, int y)
        {
            var destY = dest.height - y - src.height;
            var destPixels = dest.GetPixels(x, destY, src.width, src.height);
            var srcPixels = src.GetPixels();
            for (var i = 0; i < destPixels.Length; i++)
            {
                destPixels[i] = SourceOver(destPixels[i], srcPixels[i]);
            }

            dest.SetPixels(x, destY, src.width, src.height, destPixels);
            dest.Apply();
        }

        static Color SourceOver(Color dst, Color src)
        {
            var outA = src.a + dst.a * (1f - src.a);
            if (outA <= 0f) return Color.clear;
            var inv = 1f - src.a;
            return new Color(
                (src.r * src.a + dst.r * dst.a * inv) / outA,
                (src.g * src.a + dst.g * dst.a * inv) / outA,
                (src.b * src.a + dst.b * dst.a * inv) / outA,
                outA);
        }

        static void WriteImporterSnapshot(string destDir)
        {
            var paths = new[]
            {
                $"{ArtRoot}/Title/poc-title-art.png",
                $"{ArtRoot}/UI/poc-ui-concept.png",
                $"{ArtRoot}/UI/poc-ui-kit.png",
                $"{ArtRoot}/UI/poc-ui-panel-9slice.png",
                $"{ArtRoot}/UI/poc-ui-button-normal.png",
                $"{ArtRoot}/UI/poc-ui-button-hover.png",
                $"{ArtRoot}/UI/poc-ui-button-pressed.png",
                $"{ArtRoot}/UI/poc-ui-icons.png",
                $"{ArtRoot}/UI/icon-talk.png",
                $"{ArtRoot}/UI/icon-detour.png",
                $"{ArtRoot}/UI/icon-battle.png",
                $"{ArtRoot}/UI/icon-heal.png",
                $"{ArtRoot}/UI/icon-party.png",
                $"{ArtRoot}/UI/icon-station.png",
                $"{ArtRoot}/UI/icon-crate.png",
                $"{ArtRoot}/UI/icon-alert.png",
                $"{ArtRoot}/Tiles/poc-tile-floor.png",
                $"{ArtRoot}/Tiles/poc-tile-wall.png",
                $"{ArtRoot}/Tiles/poc-tile-platform.png",
            };
            var snapshot = new ImporterSnapshot
            {
                schema = "janseon-gateway-ui-quality-importer-snapshot/1",
                recorded_at = System.DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                unity_version = Application.unityVersion,
                entries = new ImporterSnapshotEntry[paths.Length],
            };
            for (var i = 0; i < paths.Length; i++)
            {
                var importer = (TextureImporter)AssetImporter.GetAtPath(paths[i]);
                if (importer == null) throw new FileNotFoundException(paths[i]);
                snapshot.entries[i] = new ImporterSnapshotEntry
                {
                    path = paths[i],
                    textureType = importer.textureType.ToString(),
                    filterMode = importer.filterMode.ToString(),
                    wrapMode = importer.wrapMode.ToString(),
                    mipmapEnabled = importer.mipmapEnabled,
                    alphaIsTransparency = importer.alphaIsTransparency,
                    npotScale = importer.npotScale.ToString(),
                    isReadable = importer.isReadable,
                    maxTextureSize = importer.maxTextureSize,
                    spriteBorder = importer.spriteBorder.ToString(),
                    spritePixelsPerUnit = importer.spritePixelsPerUnit,
                };
            }

            File.WriteAllText(Path.Combine(destDir, "importer-snapshot.json"), JsonUtility.ToJson(snapshot, true));
        }

        [System.Serializable]
        class ImporterSnapshot
        {
            public string schema;
            public string recorded_at;
            public string unity_version;
            public ImporterSnapshotEntry[] entries;
        }

        [System.Serializable]
        class ImporterSnapshotEntry
        {
            public string path;
            public string textureType;
            public string filterMode;
            public string wrapMode;
            public bool mipmapEnabled;
            public bool alphaIsTransparency;
            public string npotScale;
            public bool isReadable;
            public int maxTextureSize;
            public string spriteBorder;
            public float spritePixelsPerUnit;
        }

        static Texture2D NineSlice(Texture2D src, int width, int height, int border)
        {
            var copy = new Texture2D(width, height, TextureFormat.RGBA32, false);
            var sw = src.width;
            var sh = src.height;
            var centerW = Mathf.Max(1, sw - border * 2);
            var centerH = Mathf.Max(1, sh - border * 2);
            var destCenterW = Mathf.Max(1, width - border * 2);
            var destCenterH = Mathf.Max(1, height - border * 2);
            for (var dy = 0; dy < height; dy++)
            {
                int sy;
                if (dy < border) sy = dy;
                else if (dy >= height - border) sy = sh - (height - dy);
                else sy = border + (dy - border) * centerH / destCenterH;
                sy = Mathf.Clamp(sy, 0, sh - 1);
                for (var dx = 0; dx < width; dx++)
                {
                    int sx;
                    if (dx < border) sx = dx;
                    else if (dx >= width - border) sx = sw - (width - dx);
                    else sx = border + (dx - border) * centerW / destCenterW;
                    sx = Mathf.Clamp(sx, 0, sw - 1);
                    copy.SetPixel(dx, dy, src.GetPixel(sx, sy));
                }
            }

            copy.Apply();
            return copy;
        }
    }
}
