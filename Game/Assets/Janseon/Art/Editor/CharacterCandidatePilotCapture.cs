using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using UnityEditor;
using UnityEngine;

namespace Janseon.Art.Editor
{
    public static class CharacterCandidatePilotCapture
    {
        public const string CandidateRoot = "Assets/Janseon/ArtCandidates/Characters/Pilot";
        public static readonly string[] Roles =
        {
            "idle-N", "idle-E", "idle-S", "idle-W",
            "attack-windup", "attack-contact", "hit", "down",
        };

        public static void ConfigureTexture(string path)
        {
            string normalized = path.Replace('\\', '/');
            if (!normalized.StartsWith("Assets/Janseon/ArtCandidates/", StringComparison.Ordinal)
                || !normalized.StartsWith(CandidateRoot + "/", StringComparison.Ordinal)
                || normalized.Contains(".."))
                throw new ArgumentException("Only isolated character candidates may be imported", nameof(path));
            var importer = (TextureImporter)AssetImporter.GetAtPath(normalized);
            if (importer == null) throw new FileNotFoundException(normalized);
            importer.textureType = TextureImporterType.Sprite;
            importer.spriteImportMode = SpriteImportMode.Single;
            importer.spritePixelsPerUnit = 128f / 1.5f;
            var settings = new TextureImporterSettings();
            importer.ReadTextureSettings(settings);
            settings.spriteAlignment = (int)SpriteAlignment.Custom;
            settings.spritePivot = new Vector2(0.5f, 8f / 128f);
            settings.spriteMeshType = SpriteMeshType.FullRect;
            importer.SetTextureSettings(settings);
            importer.maxTextureSize = 4096;
            importer.npotScale = TextureImporterNPOTScale.None;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.mipmapEnabled = false;
            importer.isReadable = true;
            importer.alphaSource = TextureImporterAlphaSource.FromInput;
            importer.alphaIsTransparency = false;
            importer.filterMode = FilterMode.Point;
            importer.wrapMode = TextureWrapMode.Clamp;
            importer.SaveAndReimport();
        }

        public static void Import()
        {
            if (!Application.isBatchMode) throw new InvalidOperationException("Batchmode required");
            string repo = Directory.GetParent(Application.dataPath).Parent.FullName;
            string evidence = Path.Combine(repo, ".omo/evidence/gateway-character-candidates");
            string source = Path.Combine(evidence, "explorer-pilot-v3");
            string captureDir = Path.Combine(evidence, "pilot-capture");
            Directory.CreateDirectory(CandidateRoot);
            Directory.CreateDirectory(captureDir);
            var imported = new List<ImportedFile>();
            foreach (string role in Roles)
            {
                string fileName = role + ".png";
                string from = Path.Combine(source, fileName);
                string assetPath = CandidateRoot + "/" + fileName;
                if (!File.Exists(from)) throw new FileNotFoundException(from);
                File.Copy(from, assetPath, true);
                AssetDatabase.ImportAsset(assetPath, ImportAssetOptions.ForceSynchronousImport);
                ConfigureTexture(assetPath);
                CheckPixels(from, assetPath, role, imported);
            }
            AssetDatabase.SaveAssets();
            var receipt = new ImportReceipt
            {
                unity = Application.unityVersion,
                project = Directory.GetParent(Application.dataPath).FullName,
                batchmode = Application.isBatchMode,
                candidateRoot = CandidateRoot,
                frames = imported.Count,
                files = imported.ToArray(),
            };
            File.WriteAllText(Path.Combine(captureDir, "import-receipt.json"), JsonUtility.ToJson(receipt, true));
            Debug.Log("CHARACTER_PILOT_IMPORT_OK frames=" + receipt.frames);
        }

        static void CheckPixels(string source, string path, string role, List<ImportedFile> files)
        {
            var raw = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            try
            {
                byte[] bytes = File.ReadAllBytes(source);
                if (!raw.LoadImage(bytes)) throw new InvalidDataException(source);
                if (raw.width != 96 || raw.height != 128)
                    throw new InvalidDataException("Source is not 96x128: " + source);
                var texture = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
                if (texture == null) throw new InvalidDataException("Missing imported texture " + path);
                if (texture.width != 96 || texture.height != 128
                    || !texture.GetPixels32().SequenceEqual(raw.GetPixels32()))
                    throw new InvalidDataException("Imported RGBA differs from source: " + path);
                var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(path);
                if (sprite == null) throw new InvalidDataException("Missing imported sprite " + path);
                using (var sha = SHA256.Create())
                    files.Add(new ImportedFile
                    {
                        role = role,
                        source = source,
                        path = path,
                        sha256 = BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant(),
                        width = texture.width,
                        height = texture.height,
                        sprite = true,
                        pixelEquality = true,
                    });
            }
            finally { UnityEngine.Object.DestroyImmediate(raw); }
        }

        [Serializable] sealed class ImportReceipt
        {
            public string unity;
            public string project;
            public bool batchmode;
            public string candidateRoot;
            public int frames;
            public ImportedFile[] files;
        }

        [Serializable] sealed class ImportedFile
        {
            public string role;
            public string source;
            public string path;
            public string sha256;
            public int width;
            public int height;
            public bool sprite;
            public bool pixelEquality;
        }
    }
}
