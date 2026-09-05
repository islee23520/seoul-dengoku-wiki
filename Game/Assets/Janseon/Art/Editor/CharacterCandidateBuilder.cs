using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using UnityEditor;
using UnityEngine;

namespace Janseon.Art.Editor
{
    public static class CharacterCandidateBuilder
    {
        public const string CandidateRoot = "Assets/Janseon/ArtCandidates/Characters";
        static readonly string[] Roles = { "poc-explorer", "poc-medic", "poc-patrol" };
        static readonly string[] Facings = { "N", "E", "S", "W" };
        static readonly string[] Actions = { "idle", "walk", "attack", "hit", "down" };
        static readonly int[] Counts = { 4, 6, 6, 3, 4 };

        public static void ConfigureTexture(string path, bool sprite)
        {
            if (!path.StartsWith(CandidateRoot + "/", StringComparison.Ordinal) || path.Contains(".."))
                throw new ArgumentException("Only isolated character candidates may be imported", nameof(path));
            var importer = (TextureImporter)AssetImporter.GetAtPath(path);
            if (importer == null) throw new FileNotFoundException(path);
            importer.textureType = sprite ? TextureImporterType.Sprite : TextureImporterType.Default;
            if (sprite)
            {
                importer.spriteImportMode = SpriteImportMode.Single;
                importer.spritePixelsPerUnit = 128f / 1.5f;
                var settings = new TextureImporterSettings();
                importer.ReadTextureSettings(settings);
                settings.spriteAlignment = (int)SpriteAlignment.Custom;
                settings.spritePivot = new Vector2(0.5f, 8f / 128f);
                settings.spriteMeshType = SpriteMeshType.FullRect;
                importer.SetTextureSettings(settings);
            }
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
            string source = Path.Combine(evidence, "candidate-v2");
            var imported = new List<ImportedFile>();
            foreach (string role in Roles)
            {
                string dest = CandidateRoot + "/" + role;
                Directory.CreateDirectory(dest + "/Sprites");
                Directory.CreateDirectory(dest + "/Clips");
                string atlas = dest + "/" + role + "-atlas.png";
                File.Copy(Path.Combine(source, role, role + "-atlas.png"), atlas, true);
                foreach (string frame in Directory.GetFiles(Path.Combine(source, role, "sprites"), "*.png").OrderBy(p => p))
                    File.Copy(frame, dest + "/Sprites/" + Path.GetFileName(frame), true);
                AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
                ConfigureTexture(atlas, false);
                CheckPixels(Path.Combine(source, role, role + "-atlas.png"), atlas, imported);
                foreach (string facing in Facings)
                for (int action = 0; action < Actions.Length; action++)
                {
                    string clipName = role + "_" + facing + "_" + Actions[action];
                    var keys = new ObjectReferenceKeyframe[Counts[action]];
                    for (int i = 0; i < Counts[action]; i++)
                    {
                        string name = clipName + "_" + i.ToString("00") + ".png";
                        string path = dest + "/Sprites/" + name;
                        ConfigureTexture(path, true);
                        CheckPixels(Path.Combine(source, role, "sprites", name), path, imported);
                        keys[i] = new ObjectReferenceKeyframe
                        {
                            time = i / 12f,
                            value = AssetDatabase.LoadAssetAtPath<Sprite>(path),
                        };
                        if (keys[i].value == null) throw new InvalidDataException("Missing imported sprite " + path);
                    }
                    string clipPath = dest + "/Clips/" + clipName + ".anim";
                    var clip = AssetDatabase.LoadAssetAtPath<AnimationClip>(clipPath);
                    if (clip == null)
                    {
                        clip = new AnimationClip();
                        AssetDatabase.CreateAsset(clip, clipPath);
                    }
                    clip.name = clipName;
                    clip.legacy = false;
                    clip.frameRate = 12;
                    clip.wrapMode = Actions[action] == "idle" || Actions[action] == "walk" ? WrapMode.Loop : WrapMode.ClampForever;
                    AnimationUtility.SetObjectReferenceCurve(clip,
                        EditorCurveBinding.PPtrCurve("", typeof(SpriteRenderer), "m_Sprite"), keys);
                    EditorUtility.SetDirty(clip);
                }
            }
            AssetDatabase.SaveAssets();
            var receipt = new ImportReceipt
            {
                unity = Application.unityVersion,
                project = Directory.GetParent(Application.dataPath).FullName,
                batchmode = Application.isBatchMode,
                frames = imported.Count(i => i.sprite),
                clips = Roles.Length * Facings.Length * Actions.Length,
                files = imported.ToArray(),
            };
            File.WriteAllText(Path.Combine(evidence, "import-receipt.json"), JsonUtility.ToJson(receipt, true));
            Debug.Log("CHARACTER_IMPORT_OK frames=" + receipt.frames + " clips=" + receipt.clips);
        }

        static void CheckPixels(string source, string path, List<ImportedFile> files)
        {
            var raw = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            try
            {
                byte[] bytes = File.ReadAllBytes(source);
                if (!raw.LoadImage(bytes)) throw new InvalidDataException(source);
                var texture = AssetDatabase.LoadAssetAtPath<Texture2D>(path);
                if (texture.width != raw.width || texture.height != raw.height || !texture.GetPixels32().SequenceEqual(raw.GetPixels32()))
                    throw new InvalidDataException("Imported RGBA differs from source: " + path);
                using (var sha = SHA256.Create())
                    files.Add(new ImportedFile
                    {
                        source = source, path = path,
                        sha256 = BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant(),
                        width = texture.width, height = texture.height,
                        sprite = AssetDatabase.LoadAssetAtPath<Sprite>(path) != null,
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
            public int frames;
            public int clips;
            public ImportedFile[] files;
        }
        [Serializable] sealed class ImportedFile
        {
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
