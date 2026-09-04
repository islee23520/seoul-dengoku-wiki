using System.IO;
using Janseon.Foundation.Composition;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Janseon.Foundation.Editor
{
    public static class FoundationProjectBuilder
    {
        [MenuItem("Janseon/Open Bootstrap Scene")]
        public static void OpenBootstrapScene()
        {
            EditorSceneManager.OpenScene(FoundationScenes.Bootstrap);
        }

        [MenuItem("Janseon/Play Bootstrap")]
        public static void PlayBootstrap()
        {
            if (EditorApplication.isPlaying)
            {
                return;
            }

            EditorSceneManager.OpenScene(FoundationScenes.Bootstrap);
            EditorApplication.isPlaying = true;
        }

        /// <summary>
        /// Batchmode entry: force-import Core + EditMode determinism tests, then refresh.
        /// Invoked via -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.ImportCoreDeterminismAssets
        /// </summary>
        public static void ImportCoreDeterminismAssets()
        {
            AssetDatabase.ImportAsset(
                "Assets/Janseon/Core",
                ImportAssetOptions.ImportRecursive | ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/CoreDeterminismTests.cs",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/Janseon.Foundation.EditModeTests.asmdef",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
            Debug.Log("CORE_IMPORT_OK paths=Assets/Janseon/Core,Assets/Tests/EditMode/CoreDeterminismTests.cs");
        }

        /// <summary>
        /// Batchmode entry: force-import Core route domain + EditMode route traversal tests.
        /// Invoked via -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.ImportRouteDomainAssets
        /// </summary>
        public static void ImportRouteDomainAssets()
        {
            AssetDatabase.ImportAsset(
                "Assets/Janseon/Core",
                ImportAssetOptions.ImportRecursive | ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/RouteTraversalTests.cs",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/Janseon.Foundation.EditModeTests.asmdef",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
            Debug.Log("ROUTE_IMPORT_OK paths=Assets/Janseon/Core,Assets/Tests/EditMode/RouteTraversalTests.cs");
        }

        /// <summary>
        /// Batchmode entry: force-import Core campaign loop domain + EditMode campaign tests.
        /// Invoked via -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.ImportCampaignDomainAssets
        /// </summary>
        public static void ImportCampaignDomainAssets()
        {
            AssetDatabase.ImportAsset(
                "Assets/Janseon/Core",
                ImportAssetOptions.ImportRecursive | ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/CampaignLoopTests.cs",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/Janseon.Foundation.EditModeTests.asmdef",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
            Debug.Log("CAMPAIGN_IMPORT_OK paths=Assets/Janseon/Core,Assets/Tests/EditMode/CampaignLoopTests.cs");
        }

        /// <summary>
        /// Batchmode entry: force-import Core battle SRPG domain + EditMode battle tests.
        /// Invoked via -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.ImportBattleDomainAssets
        /// </summary>
        public static void ImportBattleDomainAssets()
        {
            AssetDatabase.ImportAsset(
                "Assets/Janseon/Core",
                ImportAssetOptions.ImportRecursive | ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/BattleSrpgTests.cs",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/Janseon.Foundation.EditModeTests.asmdef",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
            Debug.Log("BATTLE_IMPORT_OK paths=Assets/Janseon/Core,Assets/Tests/EditMode/BattleSrpgTests.cs");
        }

        /// <summary>
        /// Batchmode entry: force-import Core settlement domain + EditMode exact-once settlement tests.
        /// Invoked via -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.ImportSettlementDomainAssets
        /// </summary>
        public static void ImportSettlementDomainAssets()
        {
            AssetDatabase.ImportAsset(
                "Assets/Janseon/Core",
                ImportAssetOptions.ImportRecursive | ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/SettlementExactOnceTests.cs",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/Janseon.Foundation.EditModeTests.asmdef",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
            Debug.Log("SETTLEMENT_IMPORT_OK paths=Assets/Janseon/Core,Assets/Tests/EditMode/SettlementExactOnceTests.cs");
        }

        [MenuItem("Janseon/Build Foundation Scene")]
        public static void BuildFoundationScene()
        {
            Directory.CreateDirectory("Assets/Scenes");

            BuildBootstrapScene();
            BuildContentScene();

            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(FoundationScenes.Bootstrap, true),
                new EditorBuildSettingsScene(FoundationScenes.Foundation, true),
            };

            PlayerSettings.companyName = "Janseon Studio";
            PlayerSettings.productName = "잔선: 서울";
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Standalone, "com.janseon.seoul");

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("Foundation architecture scenes created.");
        }

        private static void BuildBootstrapScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject root = new("App Lifetime Scope");
            root.AddComponent<AppLifetimeScope>();
            EditorSceneManager.SaveScene(scene, FoundationScenes.Bootstrap);
        }

        private static void BuildContentScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject scopeObject = new("Foundation Lifetime Scope");
            scopeObject.AddComponent<FoundationLifetimeScope>();

            GameObject cameraObject = new("Isometric Camera");
            Camera camera = cameraObject.AddComponent<Camera>();
            camera.orthographic = true;
            camera.orthographicSize = 8f;
            camera.transform.position = new Vector3(-12f, 12f, -12f);
            camera.transform.rotation = Quaternion.Euler(
                GenreContract.CameraPitchDegrees,
                GenreContract.CameraYawDegrees,
                0f);
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.043f, 0.067f, 0.118f, 1f);

            GameObject lightObject = new("Foundation Light");
            Light light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.2f;
            light.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

            EditorSceneManager.SaveScene(scene, FoundationScenes.Foundation);
        }
    }
}
