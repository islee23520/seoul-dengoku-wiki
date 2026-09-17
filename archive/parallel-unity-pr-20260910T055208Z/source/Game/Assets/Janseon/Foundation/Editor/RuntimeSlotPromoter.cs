using System;
using System.IO;
using System.Collections.Generic;
using System.Security.Cryptography;
using UnityEditor;
using UnityEngine;

namespace Janseon.Foundation.Editor
{
    public static class RuntimeSlotPromoter
    {
        [Serializable] sealed class Packet
        {
            public string slot;
            public string kind;
            public bool fixture;
            public FileEntry[] files;
        }
        [Serializable] sealed class FileEntry
        {
            public string key;
            public string path;
            public string source;
            public string sha256;
        }

        public static void Promote(string requestPath)
        {
            if (!Application.isBatchMode) throw new InvalidOperationException("Batchmode required");
            if (string.IsNullOrEmpty(requestPath)) throw new InvalidOperationException("Promotion request required");
            string repo = Path.GetFullPath(Path.Combine(Application.dataPath, "../.."));
            Packet packet = JsonUtility.FromJson<Packet>(InvokeNode(repo, "prepare", requestPath));
            var created = new List<string>();
            try
            {
                // Verify every source again before the first destination write.
                foreach (FileEntry file in packet.files)
                {
                    byte[] bytes = File.ReadAllBytes(Path.Combine(repo, file.source));
                    using var sha = SHA256.Create();
                    if (BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant() != file.sha256)
                        throw new InvalidOperationException("Source changed after preflight: " + file.source);
                }
                foreach (FileEntry file in packet.files)
                {
                    if (file.key.EndsWith("/clip", StringComparison.Ordinal)) continue;
                    Directory.CreateDirectory(Path.GetDirectoryName(file.path));
                    File.Copy(Path.Combine(repo, file.source), file.path, false);
                    created.Add(file.path);
                    AssetDatabase.ImportAsset(file.path, ImportAssetOptions.ForceSynchronousImport);
                    var importer = AssetImporter.GetAtPath(file.path) as TextureImporter;
                    if (importer == null) throw new InvalidOperationException("PNG import failed: " + file.path);
                    bool sprite = (packet.kind == "character" || packet.kind == "sprite") && file.key != "atlas";
                    importer.textureType = sprite ? TextureImporterType.Sprite : TextureImporterType.Default;
                    if (sprite)
                    {
                        importer.spriteImportMode = SpriteImportMode.Single;
                        importer.spritePixelsPerUnit = 128f / 1.5f;
                        var settings = new TextureImporterSettings();
                        importer.ReadTextureSettings(settings);
                        settings.spriteAlignment = (int)SpriteAlignment.Custom;
                        settings.spritePivot = new Vector2(0.5f, 0.0625f);
                        importer.SetTextureSettings(settings);
                    }
                    importer.npotScale = TextureImporterNPOTScale.None;
                    importer.maxTextureSize = 4096;
                    importer.textureCompression = TextureImporterCompression.Uncompressed;
                    importer.mipmapEnabled = false;
                    importer.alphaIsTransparency = false;
                    importer.filterMode = packet.kind == "character" ? FilterMode.Point : FilterMode.Bilinear;
                    importer.wrapMode = TextureWrapMode.Clamp;
                    importer.SaveAndReimport();
                }
                foreach (FileEntry file in packet.files)
                {
                    if (!file.key.EndsWith("/clip", StringComparison.Ordinal)) continue;
                    string sourcePath = file.source.Substring("Game/".Length);
                    var sourceClip = AssetDatabase.LoadAssetAtPath<AnimationClip>(sourcePath);
                    if (sourceClip == null) throw new InvalidOperationException("Candidate clip missing: " + sourcePath);
                    var clip = UnityEngine.Object.Instantiate(sourceClip);
                    clip.name = sourceClip.name;
                    foreach (EditorCurveBinding curve in AnimationUtility.GetObjectReferenceCurveBindings(clip))
                    {
                        var keys = AnimationUtility.GetObjectReferenceCurve(clip, curve);
                        for (int i = 0; i < keys.Length; i++)
                        {
                            string sourceFrame = "Game/" + AssetDatabase.GetAssetPath(keys[i].value);
                            FileEntry frame = Array.Find(packet.files, f => f.source == sourceFrame);
                            if (frame == null) throw new InvalidOperationException("Unreviewed clip reference: " + sourceFrame);
                            keys[i].value = AssetDatabase.LoadAssetAtPath<Sprite>(frame.path);
                            if (keys[i].value == null) throw new InvalidOperationException("Runtime sprite missing: " + frame.path);
                        }
                        AnimationUtility.SetObjectReferenceCurve(clip, curve, keys);
                    }
                    Directory.CreateDirectory(Path.GetDirectoryName(file.path));
                    AssetDatabase.CreateAsset(clip, file.path);
                    created.Add(file.path);
                }
                AssetDatabase.SaveAssets();
                InvokeNode(repo, "commit", requestPath);
            }
            catch
            {
                foreach (string path in created) AssetDatabase.DeleteAsset(path);
                throw;
            }
            if (!packet.fixture) RuntimeSlotCatalogBuilder.Wire();
            Debug.Log("RUNTIME_SLOT_PROMOTION_OK slot=" + packet.slot + " fixture=" + packet.fixture);
        }

        static string InvokeNode(string repo, string mode, string request)
        {
            var info = new System.Diagnostics.ProcessStartInfo("node")
            {
                WorkingDirectory = repo, UseShellExecute = false, CreateNoWindow = true,
                RedirectStandardOutput = true, RedirectStandardError = true,
            };
            info.ArgumentList.Add("tools/art/runtime-slot-promotion.mjs");
            info.ArgumentList.Add(mode);
            info.ArgumentList.Add(request);
            using var process = System.Diagnostics.Process.Start(info);
            var stdout = process.StandardOutput.ReadToEndAsync();
            var stderr = process.StandardError.ReadToEndAsync();
            if (!process.WaitForExit(15000)) { process.Kill(); throw new InvalidOperationException("Promotion verifier timed out"); }
            if (process.ExitCode != 0) throw new InvalidOperationException(stderr.GetAwaiter().GetResult());
            return stdout.GetAwaiter().GetResult();
        }

        public static void Run()
            => Promote(Environment.GetEnvironmentVariable("JANSEON_SLOT_PROMOTION_REQUEST"));
    }
}
