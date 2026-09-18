using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEditor;
using UnityEngine;

namespace Janseon.Art.Editor
{
    /// <summary>
    /// UI 수정 후보를 격리 경로 Assets/Janseon/Art/Staging/UI 로만 Unity API import한다.
    /// 승격/런타임 연결이 아니며 playable scene은 건드리지 않는다.
    /// </summary>
    public static class UiCandidateShowcase
    {
        public const string CandidateRoot = "Assets/Janseon/Art/Staging/UI";
        const string SourceRel = ".omo/evidence/gateway-ui-candidates/candidate-v1";
        static readonly string[] IconNames = { "talk", "detour", "battle", "heal", "party", "station", "crate", "alert" };
        static readonly string[] TileKinds = { "floor", "wall", "platform" };
        static readonly string[] ButtonStates = { "normal", "hover", "pressed" };

        public static void Import()
        {
            if (!Application.isBatchMode) throw new InvalidOperationException("Batchmode required");
            string repo = Directory.GetParent(Application.dataPath)!.Parent!.FullName;
            string source = Path.Combine(repo, SourceRel);
            if (!Directory.Exists(source)) throw new DirectoryNotFoundException(source);
            var entries = new StringBuilder();

            void Copy(string relativeSource, string assetPath, string role)
            {
                string from = Path.Combine(source, relativeSource);
                if (!File.Exists(from)) throw new FileNotFoundException(from);
                Directory.CreateDirectory(Path.GetDirectoryName(assetPath)!);
                File.Copy(from, assetPath, true);
                AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceSynchronousImport);
                ConfigureTexture(assetPath, role);
                var imported = AssetDatabase.LoadAssetAtPath<Texture2D>(assetPath);
                if (imported == null) throw new InvalidDataException("import failed: " + assetPath);
                var importer = (TextureImporter)AssetImporter.GetAtPath(assetPath);
                if (entries.Length > 0) entries.Append(",\n");
                entries.Append("    {\"asset_path\": \"").Append(assetPath).Append("\", \"role\": \"").Append(role)
                    .Append("\", \"source\": \"").Append(relativeSource).Append("\", \"sha256\": \"").Append(Sha256Hex(File.ReadAllBytes(assetPath)))
                    .Append("\", \"width\": ").Append(imported.width).Append(", \"height\": ").Append(imported.height)
                    .Append(", \"texture_type\": \"").Append(importer.textureType).Append("\", \"filter\": \"").Append(importer.filterMode)
                    .Append("\", \"wrap\": \"").Append(importer.wrapMode).Append("\", \"mipmaps\": ").Append(importer.mipmapEnabled ? "true" : "false")
                    .Append(", \"alpha_is_transparency\": ").Append(importer.alphaIsTransparency ? "true" : "false")
                    .Append(", \"readable\": ").Append(importer.isReadable ? "true" : "false")
                    .Append(", \"compression\": \"").Append(importer.textureCompression).Append("\", \"sprite_border\": \"").Append(importer.spriteBorder)
                    .Append("\", \"max_size\": ").Append(importer.maxTextureSize).Append("}");
            }

            Copy("title/poc-title-art.png", CandidateRoot + "/Title/poc-title-art.png", "title_art");
            foreach (string name in IconNames) Copy("ui/icon-" + name + ".png", CandidateRoot + "/icon-" + name + ".png", "ui_icon");
            Copy("ui/poc-ui-icons.png", CandidateRoot + "/poc-ui-icons.png", "ui_icon_atlas");
            Copy("ui/poc-ui-panel-9slice.png", CandidateRoot + "/poc-ui-panel-9slice.png", "ui_panel");
            foreach (string state in ButtonStates) Copy("ui/poc-ui-button-" + state + ".png", CandidateRoot + "/poc-ui-button-" + state + ".png", "ui_button");
            foreach (string kind in TileKinds) Copy("tiles/poc-tile-" + kind + ".png", CandidateRoot + "/Tiles/poc-tile-" + kind + ".png", "history_texture");
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            string evidenceDir = Path.Combine(repo, ".omo/evidence/gateway-ui-candidates/unity");
            Directory.CreateDirectory(evidenceDir);
            string receipt = "{\n  \"schema\": \"janseon-ui-candidate-import/1\",\n  \"recorded_at\": \"" + DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
                + "\",\n  \"unity_version\": \"" + Application.unityVersion + "\",\n  \"batchmode\": true,\n  \"execute_method\": \"Janseon.Art.Editor.UiCandidateShowcase.Import\",\n  \"candidate_root\": \""
                + CandidateRoot + "\",\n  \"source\": \"" + SourceRel + "\",\n  \"promotion\": false,\n  \"runtime_activated\": false,\n  \"entries\": [\n" + entries + "\n  ]\n}\n";
            File.WriteAllText(Path.Combine(evidenceDir, "import-receipt.json"), receipt);
            Debug.Log("ui candidate import wrote " + Path.Combine(evidenceDir, "import-receipt.json"));
        }

        /// <summary>격리 경로의 후보 PNG에만 역할별 import 설정을 적용한다.</summary>
        public static void ConfigureTexture(string assetPath, string role)
        {
            string normalized = assetPath.Replace('\\', '/');
            if (!normalized.StartsWith(CandidateRoot + "/", StringComparison.Ordinal) || normalized.Contains(".."))
                throw new ArgumentException("Only isolated UI candidates may be configured: " + assetPath, nameof(assetPath));
            var importer = (TextureImporter)AssetImporter.GetAtPath(normalized);
            if (importer == null) throw new FileNotFoundException(normalized);

            importer.maxTextureSize = 2048;
            importer.npotScale = TextureImporterNPOTScale.None;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.isReadable = true;
            importer.alphaSource = TextureImporterAlphaSource.FromInput;
            importer.sRGBTexture = true;
            switch (role)
            {
                case "history_texture":
                    importer.textureType = TextureImporterType.Default;
                    importer.mipmapEnabled = true;
                    importer.filterMode = FilterMode.Bilinear;
                    importer.wrapMode = TextureWrapMode.Repeat;
                    importer.alphaIsTransparency = false;
                    break;
                case "title_art":
                    ConfigureSprite(importer, FilterMode.Bilinear, Vector4.zero, false);
                    break;
                case "ui_panel":
                    ConfigureSprite(importer, FilterMode.Bilinear, new Vector4(48f, 48f, 48f, 48f), true);
                    break;
                case "ui_button":
                    ConfigureSprite(importer, FilterMode.Bilinear, new Vector4(8f, 8f, 8f, 8f), true);
                    break;
                case "ui_icon":
                case "ui_icon_atlas":
                    ConfigureSprite(importer, FilterMode.Point, Vector4.zero, true);
                    break;
                default:
                    throw new ArgumentException("unknown candidate role " + role, nameof(role));
            }

            importer.SaveAndReimport();
        }

        static void ConfigureSprite(TextureImporter importer, FilterMode filter, Vector4 border, bool alphaIsTransparency)
        {
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.spritePixelsPerUnit = 100f;
            importer.spriteBorder = border;
            importer.mipmapEnabled = false;
            importer.filterMode = filter;
            importer.wrapMode = TextureWrapMode.Clamp;
            importer.alphaIsTransparency = alphaIsTransparency;
            var settings = new TextureImporterSettings();
            importer.ReadTextureSettings(settings);
            settings.spriteMeshType = SpriteMeshType.FullRect;
            settings.spriteExtrude = 0;
            settings.spriteGenerateFallbackPhysicsShape = false;
            importer.SetTextureSettings(settings);
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
