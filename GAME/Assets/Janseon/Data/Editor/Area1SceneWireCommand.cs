using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Janseon.Data.Authoring;
using Janseon.Foundation.Battle;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Janseon.Data.Editor
{
    public static class Area1SceneWireCommand
    {
        const string CatalogGuidEnvironmentVariable = "JANSEON_GAME_DATA_CATALOG_GUID";
        const string FoundationSceneGuidEnvironmentVariable = "JANSEON_FOUNDATION_SCENE_GUID";
        const string CatalogPropertyName = "gameDataCatalog";

        [MenuItem("Janseon/Data/Wire Selected Catalog Into Selected Foundation Scene")]
        public static void WireFoundationScene()
        {
            string requestedCatalogGuid = RequireEnvironmentVariable(CatalogGuidEnvironmentVariable);
            string requestedSceneGuid = RequireEnvironmentVariable(FoundationSceneGuidEnvironmentVariable);
            if (!GUID.TryParse(requestedSceneGuid, out GUID sceneGuid))
            {
                throw new InvalidOperationException("The requested Foundation scene GUID is invalid.");
            }

            SceneAsset foundationScene = AssetDatabase.LoadAssetByGUID<SceneAsset>(sceneGuid);
            if (foundationScene == null)
            {
                throw new InvalidOperationException("The requested Foundation scene GUID does not identify a scene asset.");
            }

            string scenePath = AssetDatabase.GetAssetPath(foundationScene);
            if (string.IsNullOrEmpty(scenePath))
            {
                throw new InvalidOperationException("The requested Foundation scene asset does not have an editor path.");
            }

            if (!GUID.TryParse(requestedCatalogGuid, out GUID catalogGuid))
            {
                throw new InvalidOperationException("The requested catalog GUID is invalid.");
            }

            GameDataCatalogAsset catalog = AssetDatabase.LoadAssetByGUID<GameDataCatalogAsset>(catalogGuid);
            if (catalog == null)
            {
                throw new InvalidOperationException("The requested catalog GUID does not identify a GameDataCatalogAsset.");
            }

            Scene scene = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
            FoundationLifetimeScope scope = FindSingleComponentInScene<FoundationLifetimeScope>(scene, "FoundationLifetimeScope");
            GameplayUiHost gameplayHost = FindSingleComponentInScene<GameplayUiHost>(scene, "GameplayUiHost");
            EnsureExactlyOneComponent<BattleSessionDriverHost>(gameplayHost.gameObject);
            EnsureExactlyOneComponent<FoundationBattleViewHost>(gameplayHost.gameObject);

            Undo.RecordObject(scope, "Wire Foundation game data catalog");
            SerializedObject serializedScope = new SerializedObject(scope);
            serializedScope.Update();
            SerializedProperty catalogProperty = serializedScope.FindProperty(CatalogPropertyName);
            if (catalogProperty == null)
            {
                throw new InvalidOperationException(CatalogPropertyName + " serialized property is missing.");
            }

            Debug.Log(
                "TASK35_DIAGNOSTIC before propertyType=" + catalogProperty.propertyType
                + " serializedType=" + catalogProperty.type
                + " sourceEntityId=" + catalog.GetEntityId()
                + " sourcePath=" + AssetDatabase.GetAssetPath(catalog)
                + " sourceGuid=" + ReferenceGuid(catalog)
                + " referencePath=" + AssetDatabase.GetAssetPath(catalogProperty.objectReferenceValue)
                + " referenceGuid=" + ReferenceGuid(catalogProperty.objectReferenceValue));

            catalogProperty.objectReferenceEntityIdValue = catalog.GetEntityId();
            bool applied = serializedScope.ApplyModifiedProperties();
            serializedScope.Update();
            Debug.Log(
                "TASK35_DIAGNOSTIC applied=" + applied
                + " afterApplyPath=" + AssetDatabase.GetAssetPath(catalogProperty.objectReferenceValue)
                + " afterApplyGuid=" + ReferenceGuid(catalogProperty.objectReferenceValue));

            if (PrefabUtility.IsPartOfPrefabInstance(scope))
            {
                PrefabUtility.RecordPrefabInstancePropertyModifications(scope);
            }

            EditorUtility.SetDirty(scope);
            EditorUtility.SetDirty(gameplayHost.gameObject);
            EditorSceneManager.MarkSceneDirty(scene);
            bool saved = EditorSceneManager.SaveOpenScenes();
            Debug.Log("TASK35_DIAGNOSTIC saveOpenScenes=" + saved + " sceneDirtyAfterSave=" + scene.isDirty);
            if (!saved)
            {
                throw new InvalidOperationException("Failed to save the requested Foundation scene.");
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            string sceneFilePath = Path.GetFullPath(Path.Combine(Application.dataPath, "..", scenePath));
            string sceneYaml = File.ReadAllText(sceneFilePath);
            string expectedYamlReference = "gameDataCatalog: {fileID: 11400000, guid: " + requestedCatalogGuid + ", type: 2}";
            bool yamlContainsReference = sceneYaml.Contains(expectedYamlReference);
            Debug.Log(
                "TASK35_DIAGNOSTIC yamlSha256=" + Sha256(sceneYaml)
                + " yamlContainsRequestedReference=" + yamlContainsReference);
            if (!yamlContainsReference)
            {
                throw new InvalidOperationException("Foundation scene YAML did not persist the requested catalog GUID before close.");
            }

            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            if (scene.isLoaded)
            {
                throw new InvalidOperationException("Failed to unload the requested Foundation scene after saving.");
            }

            Scene reopened = EditorSceneManager.OpenScene(scenePath, OpenSceneMode.Single);
            FoundationLifetimeScope reopenedScope = FindSingleComponentInScene<FoundationLifetimeScope>(reopened, "FoundationLifetimeScope");
            GameplayUiHost reopenedGameplayHost = FindSingleComponentInScene<GameplayUiHost>(reopened, "GameplayUiHost");
            RequireExactlyOneComponent<BattleSessionDriverHost>(reopenedGameplayHost.gameObject);
            RequireExactlyOneComponent<FoundationBattleViewHost>(reopenedGameplayHost.gameObject);

            SerializedObject reopenedSerializedScope = new SerializedObject(reopenedScope);
            reopenedSerializedScope.Update();
            SerializedProperty reopenedProperty = reopenedSerializedScope.FindProperty(CatalogPropertyName);
            GameDataCatalogAsset reopenedCatalog = reopenedProperty.objectReferenceValue as GameDataCatalogAsset;
            string persistedGuid = ReferenceGuid(reopenedCatalog);
            if (string.IsNullOrEmpty(persistedGuid) || persistedGuid != requestedCatalogGuid)
            {
                throw new InvalidOperationException("Foundation scene did not persist the requested catalog GUID.");
            }

            Debug.Log(
                "TASK35_FOUNDATION_SCENE_AUTHORED catalogGuid=" + persistedGuid
                + " gameplayHost=" + reopenedGameplayHost.name
                + " battleSessionDriverHosts=1 foundationBattleViewHosts=1");
            Debug.Log("TASK35_HOSTS_WIRED");
        }

        static void EnsureExactlyOneComponent<T>(GameObject target) where T : Component
        {
            T[] components = target.GetComponents<T>();
            if (components.Length == 0)
            {
                Undo.AddComponent<T>(target);
                EditorUtility.SetDirty(target);
                return;
            }

            if (components.Length != 1)
            {
                throw new InvalidOperationException(
                    target.name + " must contain exactly one " + typeof(T).Name + "; found " + components.Length + ".");
            }
        }

        static void RequireExactlyOneComponent<T>(GameObject target) where T : Component
        {
            int count = target.GetComponents<T>().Length;
            if (count != 1)
            {
                throw new InvalidOperationException(
                    target.name + " must contain exactly one " + typeof(T).Name + " after scene reopen; found " + count + ".");
            }
        }

        static T FindSingleComponentInScene<T>(Scene scene, string label) where T : Component
        {
            if (typeof(T) == typeof(GameplayUiHost))
            {
                T[] candidates = UnityEngine.Object.FindObjectsByType<T>(FindObjectsInactive.Include, FindObjectsSortMode.None);
                T foundInScene = null;
                foreach (T candidate in candidates)
                {
                    if (candidate.gameObject.scene != scene)
                    {
                        continue;
                    }

                    if (foundInScene != null)
                    {
                        throw new InvalidOperationException("The requested scene contains more than one " + label + ".");
                    }

                    foundInScene = candidate;
                }

                if (foundInScene == null)
                {
                    throw new InvalidOperationException("The requested scene does not contain a " + label + ".");
                }

                return foundInScene;
            }

            T found = null;
            foreach (GameObject root in scene.GetRootGameObjects())
            {
                foreach (T candidate in root.GetComponentsInChildren<T>(true))
                {
                    if (found != null)
                    {
                        throw new InvalidOperationException("The requested scene contains more than one " + label + ".");
                    }

                    found = candidate;
                }
            }

            if (found == null)
            {
                throw new InvalidOperationException("The requested scene does not contain a " + label + ".");
            }

            return found;
        }

        static string RequireEnvironmentVariable(string name)
        {
            string value = Environment.GetEnvironmentVariable(name);
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new InvalidOperationException(name + " is required.");
            }

            return value;
        }

        static string ReferenceGuid(UnityEngine.Object reference)
        {
            return reference == null
                ? string.Empty
                : AssetDatabase.AssetPathToGUID(AssetDatabase.GetAssetPath(reference));
        }

        static string Sha256(string value)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(value));
                return BitConverter.ToString(hash).Replace("-", string.Empty).ToLowerInvariant();
            }
        }
    }
}
