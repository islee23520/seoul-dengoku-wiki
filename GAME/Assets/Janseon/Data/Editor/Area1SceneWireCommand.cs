using System;
using System.Reflection;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using Janseon.Data.Authoring;

namespace Janseon.Data.Editor
{
    public static class Area1SceneWireCommand
    {
        const string ScenePath = "Assets/Scenes/Foundation.unity";
        const string CatalogPath = "Assets/Janseon/Data/Assets/Area1GameDataCatalog.asset";
        const string ScopeTypeName = "Janseon.Foundation.Composition.FoundationLifetimeScope";
        const string FieldName = "gameDataCatalog";

        [MenuItem("Janseon/Data/Wire Area 1 Foundation Scene")]
        public static void WireFoundationScene()
        {
            Scene scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            Debug.Log("[Area1SceneWire] step 1 scene opened: " + ScenePath);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            Debug.Log("[Area1SceneWire] step 2 imports settled");

            GameDataCatalogAsset catalog = AssetDatabase.LoadAssetAtPath<GameDataCatalogAsset>(CatalogPath);
            if (catalog == null)
            {
                throw new InvalidOperationException("Area 1 catalog missing at " + CatalogPath);
            }
            string catalogGuid = AssetDatabase.AssetPathToGUID(CatalogPath);
            Debug.Log("[Area1SceneWire] step 3 catalog loaded: " + catalog.name + " guid=" + catalogGuid);

            Component scope = FindFoundationScope(scene);
            if (scope == null)
            {
                throw new InvalidOperationException("FoundationLifetimeScope missing from " + ScenePath);
            }

            FieldInfo field = scope.GetType().GetField(FieldName, BindingFlags.Instance | BindingFlags.NonPublic);
            if (field == null)
            {
                throw new InvalidOperationException(FieldName + " field missing from " + ScopeTypeName);
            }

            field.SetValue(scope, catalog);
            GameDataCatalogAsset reflectedCatalog = field.GetValue(scope) as GameDataCatalogAsset;
            if (reflectedCatalog == null)
            {
                catalog = AssetDatabase.LoadAssetAtPath<GameDataCatalogAsset>(CatalogPath);
                if (catalog == null)
                {
                    throw new InvalidOperationException("Area 1 catalog was invalidated after reflection write: " + CatalogPath);
                }
                field.SetValue(scope, catalog);
                reflectedCatalog = field.GetValue(scope) as GameDataCatalogAsset;
            }
            if (reflectedCatalog == null)
            {
                throw new InvalidOperationException("Area 1 catalog was invalidated after reflection reload: " + CatalogPath);
            }
            string reflectedPath = AssetDatabase.GetAssetPath(reflectedCatalog);
            if (reflectedPath != CatalogPath)
            {
                throw new InvalidOperationException(FieldName + " reflection write resolved to unexpected asset path: " + reflectedPath);
            }
            Debug.Log("[Area1SceneWire] step 4 scope found and reflection write verified on GameObject " + scope.gameObject.name);

            SerializedObject serializedScope = new SerializedObject(scope);
            SerializedProperty catalogProperty = serializedScope.FindProperty(FieldName);
            if (catalogProperty == null)
            {
                throw new InvalidOperationException(FieldName + " serialized property missing from " + ScopeTypeName);
            }
            catalogProperty.objectReferenceValue = catalog;
            serializedScope.ApplyModifiedPropertiesWithoutUndo();
            Debug.Log("[Area1SceneWire] step 5 SerializedObject write done: " + catalogProperty.objectReferenceValue);

            EditorUtility.SetDirty(scope);
            EditorSceneManager.MarkSceneDirty(scene);
            Debug.Log("[Area1SceneWire] step 6 scope and scene marked dirty");

            if (!EditorSceneManager.SaveScene(scene))
            {
                throw new InvalidOperationException("Failed to save " + ScenePath);
            }
            Debug.Log("[Area1SceneWire] step 7 scene saved");

            Scene reopened = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);
            Component reopenedScope = FindFoundationScope(reopened);
            if (reopenedScope == null)
            {
                throw new InvalidOperationException("FoundationLifetimeScope missing after reopening " + ScenePath);
            }
            FieldInfo reopenedField = reopenedScope.GetType().GetField(FieldName, BindingFlags.Instance | BindingFlags.NonPublic);
            if (reopenedField == null)
            {
                throw new InvalidOperationException(FieldName + " field missing after reopening " + ScenePath);
            }
            var persisted = reopenedField.GetValue(reopenedScope) as GameDataCatalogAsset;
            if (persisted == null)
            {
                throw new InvalidOperationException(FieldName + " is null on disk in " + ScenePath);
            }
            string persistedGuid = AssetDatabase.AssetPathToGUID(AssetDatabase.GetAssetPath(persisted));
            if (persistedGuid != catalogGuid)
            {
                throw new InvalidOperationException(FieldName + " guid mismatch on disk: expected " + catalogGuid + " but was " + persistedGuid);
            }
            Debug.Log("[Area1SceneWire] step 8 verified on disk: " + persisted.name + " guid=" + persistedGuid);
        }

        static Component FindFoundationScope(Scene scene)
        {
            foreach (GameObject root in scene.GetRootGameObjects())
            {
                Component[] components = root.GetComponentsInChildren<Component>(true);
                foreach (Component component in components)
                {
                    if (component != null && component.GetType().FullName == ScopeTypeName)
                    {
                        return component;
                    }
                }
            }

            return null;
        }
    }
}
