using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;

namespace AvatarGen.Editor
{
    public static class AvatarViewerImportVerifier
    {
        private const string ImportedRoot = "Assets/AvatarGen/Imported";
        private const string ContractAssetPath = ImportedRoot + "/female-underwear-avatar-contract.json";
        private const string ModelAssetPath = ImportedRoot + "/female-underwear.fbx";

        public static void ImportAndVerify()
        {
            var projectRoot = Directory.GetParent(Application.dataPath).FullName;
            var repositoryRoot = Directory.GetParent(projectRoot).FullName;
            var sourceRoot = Path.Combine(repositoryRoot, "ART-ASSETS/avatar-gen");
            var contractSource = Path.Combine(sourceRoot, "runtime/female-underwear/avatar-contract.json");
            var modelSource = Path.Combine(sourceRoot, "deliverables/female-underwear.fbx");
            if (!File.Exists(contractSource) || !File.Exists(modelSource))
                throw new FileNotFoundException("Canonical avatar contract or FBX is missing.");

            var importedAbsolute = Path.Combine(Application.dataPath, "AvatarGen/Imported");
            Directory.CreateDirectory(importedAbsolute);
            File.Copy(contractSource, Path.Combine(importedAbsolute, "female-underwear-avatar-contract.json"), true);
            File.Copy(modelSource, Path.Combine(importedAbsolute, "female-underwear.fbx"), true);
            AssetDatabase.ImportAsset(ContractAssetPath, ImportAssetOptions.ForceSynchronousImport);
            AssetDatabase.ImportAsset(ModelAssetPath, ImportAssetOptions.ForceSynchronousImport);

            var contract = AvatarViewerContract.Parse(File.ReadAllText(contractSource));
            var model = AssetDatabase.LoadAssetAtPath<GameObject>(ModelAssetPath)
                ?? throw new InvalidOperationException("Unity failed to import avatar FBX.");
            var instance = PrefabUtility.InstantiatePrefab(model) as GameObject
                ?? throw new InvalidOperationException("Unity failed to instantiate avatar FBX.");
            try
            {
                var visibility = new AvatarElementVisibility(instance, contract);
                if (visibility.ElementIds.Count != contract.elements.Length)
                    throw new InvalidOperationException("Unity element inventory does not match the shared contract.");
                foreach (var element in contract.elements)
                {
                    if (!visibility.SetVisible(element.id, false) || visibility.IsVisible(element.id))
                        throw new InvalidOperationException("Unity visibility toggle failed: " + element.id);
                    visibility.SetVisible(element.id, true);
                }
                var names = instance.GetComponentsInChildren<Renderer>(true).Select(renderer => renderer.gameObject.name).ToArray();
                var missing = contract.elements.Where(element => !names.Contains(element.objectName, StringComparer.Ordinal)).Select(element => element.objectName).ToArray();
                if (missing.Length > 0) throw new InvalidOperationException("Unity import is missing contract elements: " + string.Join(", ", missing));
                Debug.Log("AVATAR_UNITY_IMPORT_OK elements=" + contract.elements.Length + " model=" + ModelAssetPath);
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(instance);
            }
            AssetDatabase.SaveAssets();
        }
    }
}
