using System.IO;
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
            var dest = ResolveEvidencePath();
            RenderShowcase(dest);
            Debug.Log($"poc ui kit showcase wrote {dest}");
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

            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.spritePixelsPerUnit = 100f;
            importer.spriteBorder = border;
            importer.mipmapEnabled = false;
            importer.alphaIsTransparency = pointAlpha;
            importer.filterMode = filter;
            importer.wrapMode = TextureWrapMode.Clamp;
            importer.npotScale = TextureImporterNPOTScale.None;
            importer.SaveAndReimport();
        }

        static void SetTile(string path)
        {
            var importer = (TextureImporter)AssetImporter.GetAtPath(path);
            if (importer == null)
            {
                throw new FileNotFoundException(path);
            }

            importer.textureType = TextureImporterType.Default;
            importer.mipmapEnabled = true;
            importer.filterMode = FilterMode.Bilinear;
            importer.wrapMode = TextureWrapMode.Repeat;
            importer.alphaIsTransparency = false;
            importer.SaveAndReimport();
        }

        static string ResolveEvidencePath()
        {
            var project = Directory.GetParent(Application.dataPath)?.FullName;
            var repo = Directory.GetParent(project ?? ".")?.FullName;
            var destDir = Path.Combine(repo ?? ".", ".omo", "evidence", "unity-poc-core-loop", "task-13-artsource", "green");
            Directory.CreateDirectory(destDir);
            return Path.Combine(destDir, "unity-kit-showcase.png");
        }

        static void RenderShowcase(string dest)
        {
            const int width = 1280;
            const int height = 720;
            var surface = new Texture2D(width, height, TextureFormat.RGBA32, false);
            Fill(surface, new Color32(18, 28, 42, 255));
            Blit(surface, LoadPng($"{ArtRoot}/Title/poc-title-art.png"), 24, 24, 640, 360);
            BlitNineSlice(surface, LoadPng($"{ArtRoot}/UI/poc-ui-panel-9slice.png"), 688, 24, 360, 360, 48);
            Blit(surface, LoadPng($"{ArtRoot}/UI/poc-ui-button-normal.png"), 688, 400, 256, 64);
            Blit(surface, LoadPng($"{ArtRoot}/UI/poc-ui-button-hover.png"), 688, 476, 256, 64);
            Blit(surface, LoadPng($"{ArtRoot}/UI/poc-ui-button-pressed.png"), 688, 552, 256, 64);
            var icons = new[] { "talk", "detour", "battle", "heal", "party", "station", "crate", "alert" };
            for (var i = 0; i < icons.Length; i++)
            {
                Blit(surface, LoadPng($"{ArtRoot}/UI/icon-{icons[i]}.png"), 24 + i * 72, 400, 64, 64);
            }

            Blit(surface, LoadPng($"{ArtRoot}/Tiles/poc-tile-floor.png"), 24, 500, 160, 160);
            Blit(surface, LoadPng($"{ArtRoot}/Tiles/poc-tile-wall.png"), 200, 500, 160, 160);
            Blit(surface, LoadPng($"{ArtRoot}/Tiles/poc-tile-platform.png"), 376, 500, 160, 160);
            File.WriteAllBytes(dest, surface.EncodeToPNG());
            Object.DestroyImmediate(surface);
        }

        static Texture2D LoadPng(string assetPath)
        {
            var absolute = Path.Combine(Application.dataPath, assetPath.Substring("Assets/".Length));
            if (!File.Exists(absolute))
            {
                throw new FileNotFoundException(absolute);
            }

            var texture = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            if (!texture.LoadImage(File.ReadAllBytes(absolute)))
            {
                throw new InvalidDataException(absolute);
            }

            return texture;
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
            dest.SetPixels(x, dest.height - y - height, width, height, scaled.GetPixels());
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
            dest.SetPixels(x, dest.height - y - height, width, height, scaled.GetPixels());
            Object.DestroyImmediate(src);
            Object.DestroyImmediate(scaled);
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
