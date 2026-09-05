using System;
using System.IO;
using Janseon.Foundation.Art;
using Janseon.Foundation.Composition;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Janseon.Foundation.Editor
{
    public static class RuntimeSlotCatalogBuilder
    {
        public const string CatalogPath = "Assets/Janseon/Foundation/Art/RuntimeSlotCatalog.asset";
        [Serializable] sealed class Packet { public Entry[] entries; }
        [Serializable] sealed class Entry
        {
            public string slot;
            public bool bound;
            public string sourceBindingHash;
            public FileEntry[] files;
        }
        [Serializable] sealed class FileEntry { public string key; public string path; }

        public static RuntimeSlotCatalog Build()
        {
            if (!Application.isBatchMode) throw new InvalidOperationException("Batchmode required");
            string repo = Path.GetFullPath(Path.Combine(Application.dataPath, "../.."));
            var info = new System.Diagnostics.ProcessStartInfo("node")
            {
                WorkingDirectory = repo, UseShellExecute = false, CreateNoWindow = true,
                RedirectStandardOutput = true, RedirectStandardError = true,
            };
            info.ArgumentList.Add("tools/art/export-runtime-slots.mjs");
            using var process = System.Diagnostics.Process.Start(info);
            var stdout = process.StandardOutput.ReadToEndAsync();
            var stderr = process.StandardError.ReadToEndAsync();
            if (!process.WaitForExit(15000))
            {
                process.Kill();
                throw new InvalidOperationException("Slot provenance process timed out");
            }
            if (process.ExitCode != 0) throw new InvalidOperationException(stderr.GetAwaiter().GetResult());
            Packet packet = JsonUtility.FromJson<Packet>(stdout.GetAwaiter().GetResult());
            var entries = new RuntimeSlotEntry[packet.entries.Length];
            for (int i = 0; i < entries.Length; i++)
            {
                Entry source = packet.entries[i];
                var files = new RuntimeSlotFile[source.files.Length];
                for (int f = 0; f < files.Length; f++)
                {
                    FileEntry file = source.files[f];
                    UnityEngine.Object asset = file.path.EndsWith(".anim", StringComparison.Ordinal)
                        ? AssetDatabase.LoadAssetAtPath<AnimationClip>(file.path)
                        : source.slot.StartsWith("character-", StringComparison.Ordinal) && file.key != "atlas"
                            || source.slot == "ui-icon-set" && file.key != "atlas"
                            ? AssetDatabase.LoadAssetAtPath<Sprite>(file.path)
                            : AssetDatabase.LoadAssetAtPath<Texture2D>(file.path);
                    if (asset == null) throw new InvalidDataException("Missing imported slot asset: " + file.path);
                    files[f] = new RuntimeSlotFile { key = file.key, asset = asset };
                }
                entries[i] = new RuntimeSlotEntry
                {
                    slot = source.slot, bound = source.bound,
                    sourceBindingHash = source.sourceBindingHash, files = files,
                };
            }
            RuntimeSlotCatalog catalog = AssetDatabase.LoadAssetAtPath<RuntimeSlotCatalog>(CatalogPath);
            if (catalog == null)
            {
                catalog = ScriptableObject.CreateInstance<RuntimeSlotCatalog>();
                AssetDatabase.CreateAsset(catalog, CatalogPath);
            }
            catalog.SetEntries(entries);
            EditorUtility.SetDirty(catalog);
            AssetDatabase.SaveAssets();
            return catalog;
        }

        public static void Wire()
        {
            Build();
            foreach (string path in new[] { FoundationScenes.MainTitle, FoundationScenes.Foundation })
            {
                Scene scene = EditorSceneManager.OpenScene(path, OpenSceneMode.Single);
                RuntimeSlotCatalog catalog = AssetDatabase.LoadAssetAtPath<RuntimeSlotCatalog>(CatalogPath);
                if (catalog == null) throw new InvalidDataException("Runtime slot catalog not imported");
                int wired = 0;
                foreach (GameObject root in scene.GetRootGameObjects())
                foreach (var scope in root.GetComponentsInChildren<VContainer.Unity.LifetimeScope>(true))
                {
                    if (!(scope is MainTitleLifetimeScope) && !(scope is FoundationLifetimeScope)) continue;
                    var serialized = new SerializedObject(scope);
                    serialized.FindProperty("runtimeSlots").objectReferenceValue = catalog;
                    serialized.ApplyModifiedPropertiesWithoutUndo();
                    wired++;
                }
                if (wired != 1) throw new InvalidDataException("Expected one content scope: " + path);
                EditorSceneManager.MarkSceneDirty(scene);
                if (!EditorSceneManager.SaveScene(scene)) throw new IOException("Scene save failed: " + path);
            }
            Debug.Log("RUNTIME_SLOT_WIRING_OK");
        }
    }
}
