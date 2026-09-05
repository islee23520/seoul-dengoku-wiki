using System.IO;
using System.Reflection;
using Janseon.Foundation.Composition;
using Janseon.Foundation.UI;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UIElements;

namespace Janseon.Foundation.Editor
{
    public static class FoundationProjectBuilder
    {
        public static void WireRuntimeSlotCatalog() => RuntimeSlotCatalogBuilder.Wire();

        [System.Serializable]
        sealed class PropCopyManifest { public PropCopyFile[] files; }
        [System.Serializable]
        sealed class PropCopyFile { public string source; public string path; public string sha256; }

        public static void ImportVerifiedStationCandidates()
        {
            string manifestPath = System.Environment.GetEnvironmentVariable("JANSEON_PROP_COPY_MANIFEST");
            var manifest = JsonUtility.FromJson<PropCopyManifest>(File.ReadAllText(manifestPath));
            foreach (var file in manifest.files)
            {
                byte[] bytes = File.ReadAllBytes(file.source);
                using var sha = System.Security.Cryptography.SHA256.Create();
                string actual = System.BitConverter.ToString(sha.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant();
                if (actual != file.sha256) throw new System.InvalidOperationException("Prop source hash mismatch: " + file.source);
                Directory.CreateDirectory(Path.GetDirectoryName(file.path));
                if (File.Exists(file.path) && !System.Linq.Enumerable.SequenceEqual(File.ReadAllBytes(file.path), bytes))
                    throw new System.InvalidOperationException("Refusing to replace different prop bytes: " + file.path);
                if (!File.Exists(file.path)) File.Copy(file.source, file.path, false);
            }
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
            Scene scene = EditorSceneManager.OpenScene(FoundationScenes.Foundation, OpenSceneMode.Single);
            GameObject root = GameObject.Find("Station Props");
            if (root == null) root = new GameObject("Station Props");
            string[] names = { "ticket-gate", "pump-crate", "shutter", "pillar", "bench", "cabinet" };
            for (int i = 0; i < names.Length; i++)
            {
                string id = "poc-prop-" + names[i];
                string path = "Assets/Janseon/Art/Props/" + id + "/" + id + ".prefab";
                if (root.transform.Find(id) != null) continue;
                var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(path);
                if (prefab == null) throw new System.InvalidOperationException("Prop prefab import failed: " + path);
                var instance = (GameObject)PrefabUtility.InstantiatePrefab(prefab, scene);
                instance.name = id;
                instance.transform.SetParent(root.transform);
                instance.transform.localPosition = new Vector3((i % 3 - 1) * 2.4f, 0f, (i / 3 - 0.5f) * 2.4f);
            }
            Camera camera = Object.FindFirstObjectByType<Camera>();
            camera.orthographicSize = 3f;
            camera.transform.position = new Vector3(-9f, 9f, -9f);
            camera.transform.rotation = Quaternion.Euler(GenreContract.CameraPitchDegrees, GenreContract.CameraYawDegrees, 0f);
            GameplayUiHost host = Object.FindFirstObjectByType<GameplayUiHost>();
            SetSerializedField(host, "stationCamera", camera);
            EditorUtility.SetDirty(host);
            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene);
            AssetDatabase.SaveAssets();
            Debug.Log("STATION_PROP_IMPORT_OK count=6 sourceHashes=verified");
        }

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

        /// <summary>
        /// Batchmode entry: force-import MainTitle lease architecture sources and flow tests.
        /// Invoked via -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.ImportMainTitleLeaseAssets
        /// </summary>
        public static void ImportMainTitleLeaseAssets()
        {
            AssetDatabase.ImportAsset(
                "Assets/Janseon/Foundation",
                ImportAssetOptions.ImportRecursive | ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/ApplicationFlowTests.cs",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/PlayMode/FoundationSceneFlowTests.cs",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
            Debug.Log("MAIN_TITLE_IMPORT_OK paths=Assets/Janseon/Foundation,Assets/Tests/EditMode/ApplicationFlowTests.cs,Assets/Tests/PlayMode/FoundationSceneFlowTests.cs");
        }

        /// <summary>
        /// Batchmode entry: force-import UI Toolkit screens/tests for Todo 11.
        /// Invoked via -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.ImportUiToolkitAssets
        /// </summary>
        public static void ImportUiToolkitAssets()
        {
            AssetDatabase.ImportAsset(
                "Assets/Janseon/Foundation",
                ImportAssetOptions.ImportRecursive | ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/UiToolkitScreenTests.cs",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.ImportAsset(
                "Assets/Tests/EditMode/Janseon.Foundation.EditModeTests.asmdef",
                ImportAssetOptions.ForceUpdate);
            AssetDatabase.Refresh(ImportAssetOptions.ForceUpdate);
            Debug.Log("UI_TOOLKIT_IMPORT_OK paths=Assets/Janseon/Foundation/UI,Assets/Tests/EditMode/UiToolkitScreenTests.cs");
        }

        /// <summary>
        /// Batchmode: create PanelSettings, wire UIDocuments into MainTitle/Foundation scenes.
        /// Invoked via -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.BuildUiToolkitScreens
        /// </summary>
        public static void BuildUiToolkitScreens()
        {
            Directory.CreateDirectory("Assets/Janseon/Foundation/UI/Screens");
            Directory.CreateDirectory("Assets/Janseon/Foundation/UI/Styles");

            AssetDatabase.ImportAsset(
                UiScreenPaths.RootFolder,
                ImportAssetOptions.ImportRecursive | ImportAssetOptions.ForceUpdate);

            PanelSettings panel = EnsurePanelSettings();
            VisualTreeAsset mainTree = AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(UiScreenPaths.MainTitleUxml);
            StyleSheet mainUss = AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.MainTitleUss);
            StyleSheet sharedUss = AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.SharedUss);
            VisualTreeAsset gameplayTree = AssetDatabase.LoadAssetAtPath<VisualTreeAsset>(UiScreenPaths.GameplayUxml);
            StyleSheet gameplayUss = AssetDatabase.LoadAssetAtPath<StyleSheet>(UiScreenPaths.GameplayUss);

            if (mainTree == null || mainUss == null || sharedUss == null || gameplayTree == null || gameplayUss == null || panel == null)
            {
                throw new System.InvalidOperationException(
                    "BuildUiToolkitScreens missing UXML/USS/PanelSettings under " + UiScreenPaths.RootFolder);
            }

            WireMainTitleScene(panel, mainTree, mainUss, sharedUss);
            WireFoundationScene(panel, gameplayTree, gameplayUss, sharedUss);

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("UI_TOOLKIT_SCENES_OK PanelSettings + MainTitle/Foundation UIDocuments wired.");
        }

        static PanelSettings EnsurePanelSettings()
        {
            PanelSettings existing = AssetDatabase.LoadAssetAtPath<PanelSettings>(UiScreenPaths.PanelSettings);
            if (existing != null)
            {
                existing.scaleMode = PanelScaleMode.ScaleWithScreenSize;
                existing.referenceResolution = new Vector2Int(1280, 720);
                existing.screenMatchMode = PanelScreenMatchMode.MatchWidthOrHeight;
                existing.match = 0.5f;
                EditorUtility.SetDirty(existing);
                return existing;
            }

            var panel = ScriptableObject.CreateInstance<PanelSettings>();
            panel.scaleMode = PanelScaleMode.ScaleWithScreenSize;
            panel.referenceResolution = new Vector2Int(1280, 720);
            panel.screenMatchMode = PanelScreenMatchMode.MatchWidthOrHeight;
            panel.match = 0.5f;
            AssetDatabase.CreateAsset(panel, UiScreenPaths.PanelSettings);
            return panel;
        }

        static void WireMainTitleScene(
            PanelSettings panel,
            VisualTreeAsset tree,
            StyleSheet mainUss,
            StyleSheet sharedUss)
        {
            Scene scene = EditorSceneManager.OpenScene(FoundationScenes.MainTitle, OpenSceneMode.Single);
            MainTitleLifetimeScope scope = Object.FindFirstObjectByType<MainTitleLifetimeScope>();
            if (scope == null)
            {
                GameObject scopeObject = new("MainTitle Lifetime Scope");
                scope = scopeObject.AddComponent<MainTitleLifetimeScope>();
            }

            GameObject go = scope.gameObject;
            UIDocument doc = go.GetComponent<UIDocument>();
            if (doc == null)
            {
                doc = go.AddComponent<UIDocument>();
            }

            doc.panelSettings = panel;
            doc.visualTreeAsset = tree;

            MainTitleUiHost existingHost = go.GetComponent<MainTitleUiHost>();
            if (existingHost != null)
            {
                Object.DestroyImmediate(existingHost);
            }

            MainTitleUiHost host = go.AddComponent<MainTitleUiHost>();
            SetSerializedField(host, "document", doc);
            SetSerializedField(host, "visualTree", tree);
            SetSerializedField(host, "mainStyle", mainUss);
            SetSerializedField(host, "sharedStyle", sharedUss);
            SetSerializedField(host, "panelSettings", panel);
            EditorUtility.SetDirty(host);
            EditorUtility.SetDirty(go);

            EditorSceneManager.MarkSceneDirty(scene);
            if (!EditorSceneManager.SaveScene(scene, FoundationScenes.MainTitle))
            {
                throw new System.InvalidOperationException("Failed to save MainTitle scene with UI host refs.");
            }
        }

        static void WireFoundationScene(
            PanelSettings panel,
            VisualTreeAsset tree,
            StyleSheet gameplayUss,
            StyleSheet sharedUss)
        {
            Scene scene = EditorSceneManager.OpenScene(FoundationScenes.Foundation, OpenSceneMode.Single);
            FoundationLifetimeScope scope = Object.FindFirstObjectByType<FoundationLifetimeScope>();
            if (scope == null)
            {
                GameObject scopeObject = new("Foundation Lifetime Scope");
                scope = scopeObject.AddComponent<FoundationLifetimeScope>();
            }

            GameObject go = scope.gameObject;
            UIDocument doc = go.GetComponent<UIDocument>();
            if (doc == null)
            {
                doc = go.AddComponent<UIDocument>();
            }

            doc.panelSettings = panel;
            doc.visualTreeAsset = tree;

            GameplayUiHost existingHost = go.GetComponent<GameplayUiHost>();
            if (existingHost != null)
            {
                Object.DestroyImmediate(existingHost);
            }

            GameplayUiHost host = go.AddComponent<GameplayUiHost>();
            SetSerializedField(host, "document", doc);
            SetSerializedField(host, "visualTree", tree);
            SetSerializedField(host, "gameplayStyle", gameplayUss);
            SetSerializedField(host, "sharedStyle", sharedUss);
            SetSerializedField(host, "panelSettings", panel);
            EditorUtility.SetDirty(host);
            EditorUtility.SetDirty(go);

            // Fail closed if reflection assignment did not stick before save.
            var so = new SerializedObject(host);
            so.Update();
            if (so.FindProperty("visualTree").objectReferenceValue == null
                || so.FindProperty("gameplayStyle").objectReferenceValue == null)
            {
                throw new System.InvalidOperationException(
                    "Foundation GameplayUiHost visualTree/gameplayStyle still null after assignment. "
                    + "tree=" + (tree != null) + " uss=" + (gameplayUss != null));
            }

            EditorSceneManager.MarkSceneDirty(scene);
            if (!EditorSceneManager.SaveScene(scene, FoundationScenes.Foundation))
            {
                throw new System.InvalidOperationException("Failed to save Foundation scene with UI host refs.");
            }
        }

        static void SetSerializedField(object target, string fieldName, UnityEngine.Object value)
        {
            FieldInfo field = target.GetType().GetField(
                fieldName,
                BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
            if (field == null)
            {
                throw new System.InvalidOperationException(
                    "Field '" + fieldName + "' not found on " + target.GetType().FullName);
            }

            field.SetValue(target, value);
        }

        /// <summary>
        /// Batchmode: StandaloneOSX Development player using current EditorBuildSettings scenes.
        /// Output from -buildOutput / UNITY_PLAYER_OUTPUT, else default under ../.omo/evidence/.../player/.
        /// Invoked via -executeMethod Janseon.Foundation.Editor.FoundationProjectBuilder.BuildStandaloneOsxDevelopmentPlayer
        /// Required because bare <c>unity build --target StandaloneOSX</c> leaves AllowDebugging/Development false.
        /// </summary>
        public static void BuildStandaloneOsxDevelopmentPlayer()
        {
            string output = ResolvePlayerOutputPath();
            string outputDir = Path.GetDirectoryName(output);
            if (!string.IsNullOrEmpty(outputDir))
            {
                Directory.CreateDirectory(outputDir);
            }

            EditorBuildSettingsScene[] editorScenes = EditorBuildSettings.scenes;
            if (editorScenes == null || editorScenes.Length == 0)
            {
                throw new System.InvalidOperationException("EditorBuildSettings.scenes is empty.");
            }

            var enabledScenes = new System.Collections.Generic.List<string>();
            for (int i = 0; i < editorScenes.Length; i++)
            {
                EditorBuildSettingsScene scene = editorScenes[i];
                if (scene == null || !scene.enabled || string.IsNullOrEmpty(scene.path))
                {
                    continue;
                }

                // Keep TRELLIS / quarantined validation scenes out of the player.
                string pathLower = scene.path.ToLowerInvariant();
                if (pathLower.Contains("trellis") || pathLower.Contains("quarantine") || pathLower.Contains("stationpropvalidation"))
                {
                    Debug.Log("BUILD_OSX_DEV_SKIP_SCENE " + scene.path);
                    continue;
                }

                enabledScenes.Add(scene.path);
            }

            if (enabledScenes.Count == 0)
            {
                throw new System.InvalidOperationException("No enabled EditorBuildSettings scenes remain after filters.");
            }

            var options = new BuildPlayerOptions
            {
                scenes = enabledScenes.ToArray(),
                locationPathName = output,
                target = BuildTarget.StandaloneOSX,
                // Development only: AllowDebugging starts a managed debugger agent that can stall headless smoke.
                options = BuildOptions.Development,
            };

            Debug.Log(
                "BUILD_OSX_DEV_BEGIN output=" + output
                + " scenes=" + string.Join(",", enabledScenes)
                + " development=1 allowDebugging=0");

            BuildReport report = BuildPipeline.BuildPlayer(options);
            BuildSummary summary = report.summary;
            if (summary.result != BuildResult.Succeeded)
            {
                throw new System.InvalidOperationException(
                    "BUILD_OSX_DEV_FAIL result=" + summary.result
                    + " errors=" + summary.totalErrors
                    + " output=" + output);
            }

            Debug.Log(
                "BUILD_OSX_DEV_OK output=" + output
                + " sizeBytes=" + summary.totalSize
                + " timeSec=" + summary.totalTime.TotalSeconds.ToString("0.###")
                + " scenes=" + string.Join(",", enabledScenes));
        }

        static string ResolvePlayerOutputPath()
        {
            string[] args = System.Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++)
            {
                if (args[i] == "-buildOutput" || args[i] == "-output-path" || args[i] == "--output-path")
                {
                    return args[i + 1];
                }
            }

            string env = System.Environment.GetEnvironmentVariable("UNITY_PLAYER_OUTPUT");
            if (!string.IsNullOrEmpty(env))
            {
                return env;
            }

            // Game/ -> repo root -> .omo evidence path
            string root = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), ".."));
            return Path.Combine(
                root,
                ".omo/evidence/unity-poc-core-loop/task-17-final/player/JanseonSeoul.app");
        }

        [MenuItem("Janseon/Build Foundation Scene")]
        public static void BuildFoundationScene()
        {
            Directory.CreateDirectory("Assets/Scenes");

            BuildBootstrapScene();
            BuildMainTitleScene();
            BuildContentScene();

            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene(FoundationScenes.Bootstrap, true),
                new EditorBuildSettingsScene(FoundationScenes.MainTitle, true),
                new EditorBuildSettingsScene(FoundationScenes.Foundation, true),
            };

            PlayerSettings.companyName = "Janseon Studio";
            PlayerSettings.productName = "잔선: 서울";
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Standalone, "com.janseon.seoul");

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log("MAIN_TITLE_SCENES_OK Bootstrap + MainTitle + Foundation architecture scenes created.");
        }

        private static void BuildBootstrapScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject root = new("App Lifetime Scope");
            root.AddComponent<AppLifetimeScope>();
            EditorSceneManager.SaveScene(scene, FoundationScenes.Bootstrap);
        }

        private static void BuildMainTitleScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject scopeObject = new("MainTitle Lifetime Scope");
            scopeObject.AddComponent<MainTitleLifetimeScope>();
            EditorSceneManager.SaveScene(scene, FoundationScenes.MainTitle);
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

        [MenuItem("Janseon/Build WebGL Player")]
        public static void BuildWebGlPlayer()
        {
            string output = Path.GetFullPath(Path.Combine(Application.dataPath, "..", "Builds", "WebGL"));
            Directory.CreateDirectory(output);
            var options = new BuildPlayerOptions
            {
                scenes = new[]
                {
                    FoundationScenes.Bootstrap,
                    FoundationScenes.MainTitle,
                    FoundationScenes.Foundation,
                },
                locationPathName = output,
                target = BuildTarget.WebGL,
                options = BuildOptions.None,
            };
            BuildReport report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result != BuildResult.Succeeded)
            {
                throw new System.InvalidOperationException("WebGL build failed: " + report.summary.result);
            }

            Debug.Log("BUILD_WEBGL_OK output=" + output);
        }
    }
}
