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
        /// <summary>
        /// uGUI cutover (task 13): scenes no longer carry UIDocument/UXML/PanelSettings.
        /// Both hosts build runtime Canvases via UguiHudBuilder; the builder only owns
        /// camera, lights, station props and serialized references.
        /// </summary>
        const string TmpImportPendingKey = "Janseon.Foundation.TmpImportPending";
        const string TmpPackageName = "TMP Essential Resources";
        const string TmpSettingsPath = "Assets/TextMesh Pro/Resources/TMP Settings.asset";
        const string TmpSourceFontPath = "Assets/Janseon/Foundation/UI/Fonts/NanumGothic-Regular.ttf";
        const string TmpFontAssetPath = "Assets/TextMesh Pro/Resources/Fonts & Materials/NanumGothic SDF.asset";

        public static void PrepareTmpResources()
        {
            try
            {
                if (TryValidateTmpResources(out _))
                {
                    Debug.Log("TMP_PREPARE_OK resources already valid");
                    EditorApplication.Exit(0);
                    return;
                }

                UnityEditor.PackageManager.PackageInfo package =
                    UnityEditor.PackageManager.PackageInfo.FindForAssetPath("Packages/com.unity.ugui");
                if (package == null || string.IsNullOrEmpty(package.resolvedPath))
                {
                    throw new System.InvalidOperationException(
                        "Installed com.unity.ugui package path is unavailable.");
                }

                string archivePath = System.IO.Path.Combine(
                    package.resolvedPath,
                    "Package Resources",
                    "TMP Essential Resources.unitypackage");
                if (!System.IO.File.Exists(archivePath))
                {
                    throw new System.InvalidOperationException(
                        "Installed TMP Essential Resources archive is missing: " + archivePath);
                }

                SessionState.SetBool(TmpImportPendingKey, true);
                RegisterTmpImportCallbacks();
                UnityEditor.AssetPackage.Package.Import(archivePath, false);
            }
            catch (System.Exception ex)
            {
                FailTmpPreparation(ex.Message);
            }
        }

        [InitializeOnLoadMethod]
        static void ResumeTmpPreparationAfterReload()
        {
            if (!SessionState.GetBool(TmpImportPendingKey, false))
            {
                return;
            }

            RegisterTmpImportCallbacks();
            if (Shader.Find("TextMeshPro/Distance Field") != null
                && AssetDatabase.LoadAssetAtPath<TMPro.TMP_Settings>(TmpSettingsPath) != null)
            {
                UnregisterTmpImportCallbacks();
                EditorApplication.delayCall += CompleteTmpPreparation;
            }
        }

        static void RegisterTmpImportCallbacks()
        {
            UnregisterTmpImportCallbacks();
            AssetDatabase.importPackageCompleted += OnTmpImportCompleted;
            AssetDatabase.importPackageCancelled += OnTmpImportCancelled;
            AssetDatabase.importPackageFailed += OnTmpImportFailed;
        }

        static void UnregisterTmpImportCallbacks()
        {
            AssetDatabase.importPackageCompleted -= OnTmpImportCompleted;
            AssetDatabase.importPackageCancelled -= OnTmpImportCancelled;
            AssetDatabase.importPackageFailed -= OnTmpImportFailed;
        }

        static void OnTmpImportCompleted(string packageName)
        {
            if (packageName != TmpPackageName)
            {
                return;
            }

            UnregisterTmpImportCallbacks();
            EditorApplication.delayCall += CompleteTmpPreparation;
        }

        static void OnTmpImportCancelled(string packageName)
        {
            if (packageName == TmpPackageName)
            {
                FailTmpPreparation("TMP Essential Resources import was cancelled.");
            }
        }

        static void OnTmpImportFailed(string packageName, string error)
        {
            if (packageName == TmpPackageName)
            {
                FailTmpPreparation("TMP Essential Resources import failed: " + error);
            }
        }

        static void CompleteTmpPreparation()
        {
            try
            {
                CreateAndWireTmpFont();
                EnsureTmpSettings();
                SessionState.EraseBool(TmpImportPendingKey);
                Debug.Log("TMP_PREPARE_OK " + TmpFontAssetPath);
                EditorApplication.Exit(0);
            }
            catch (System.Exception ex)
            {
                FailTmpPreparation(ex.Message);
            }
        }

        static void FailTmpPreparation(string reason)
        {
            UnregisterTmpImportCallbacks();
            EditorApplication.delayCall -= CompleteTmpPreparation;
            SessionState.EraseBool(TmpImportPendingKey);
            Debug.LogError("TMP_PREPARE_FAILED " + reason);
            EditorApplication.Exit(1);
        }

        public static void BuildUiToolkitScreens()
        {
            EnsureTmpSettings();
            BuildFoundationScene();
            Debug.Log("UGUI_SCENES_OK: hosts build runtime canvases; no UIDocument wiring needed.");
        }

        static void CreateAndWireTmpFont()
        {
            Shader shader = Shader.Find("TextMeshPro/Distance Field");
            if (shader == null)
            {
                throw new System.InvalidOperationException(
                    "TMP Essential Resources did not install TextMeshPro/Distance Field.");
            }

            Font sourceFont = AssetDatabase.LoadAssetAtPath<Font>(TmpSourceFontPath);
            if (sourceFont == null)
            {
                throw new System.InvalidOperationException("Bundled NanumGothic source font missing.");
            }

            TMPro.TMP_FontAsset fontAsset =
                AssetDatabase.LoadAssetAtPath<TMPro.TMP_FontAsset>(TmpFontAssetPath);
            if (fontAsset == null)
            {
                _ = System.IO.Directory.CreateDirectory(
                    System.IO.Path.GetDirectoryName(TmpFontAssetPath));
                fontAsset = TMPro.TMP_FontAsset.CreateFontAsset(sourceFont);
                if (fontAsset == null
                    || fontAsset.sourceFontFile == null
                    || fontAsset.atlasTextures == null
                    || fontAsset.atlasTextures.Length == 0
                    || fontAsset.atlasTexture == null
                    || fontAsset.material == null
                    || fontAsset.material.shader == null)
                {
                    throw new System.InvalidOperationException(
                        "TMP failed to create a complete NanumGothic SDF asset.");
                }

                fontAsset.name = "NanumGothic SDF";
                Texture2D atlas = fontAsset.atlasTexture;
                Material material = fontAsset.material;
                AssetDatabase.CreateAsset(fontAsset, TmpFontAssetPath);
                AssetDatabase.AddObjectToAsset(atlas, fontAsset);
                AssetDatabase.AddObjectToAsset(material, fontAsset);
                EditorUtility.SetDirty(fontAsset);
            }

            TMPro.TMP_Settings settings =
                AssetDatabase.LoadAssetAtPath<TMPro.TMP_Settings>(TmpSettingsPath);
            if (settings == null)
            {
                throw new System.InvalidOperationException(
                    "TMP Essential Resources did not install TMP Settings.");
            }

            var serialized = new SerializedObject(settings);
            serialized.FindProperty("m_defaultFontAsset").objectReferenceValue = fontAsset;
            serialized.ApplyModifiedPropertiesWithoutUndo();
            AssetDatabase.SaveAssets();
        }

        static void EnsureTmpSettings()
        {
            if (!TryValidateTmpResources(out string reason))
            {
                throw new System.InvalidOperationException(
                    reason + " Run FoundationProjectBuilder.PrepareTmpResources first.");
            }
        }

        static bool TryValidateTmpResources(out string reason)
        {
            if (Shader.Find("TextMeshPro/Distance Field") == null)
            {
                reason = "TextMeshPro/Distance Field is missing.";
                return false;
            }

            TMPro.TMP_Settings settings =
                AssetDatabase.LoadAssetAtPath<TMPro.TMP_Settings>(TmpSettingsPath);
            TMPro.TMP_FontAsset fontAsset =
                AssetDatabase.LoadAssetAtPath<TMPro.TMP_FontAsset>(TmpFontAssetPath);
            if (settings == null || fontAsset == null)
            {
                reason = "Prepared TMP settings or NanumGothic SDF is missing.";
                return false;
            }
            if (fontAsset.sourceFontFile == null
                || fontAsset.atlasTextures == null
                || fontAsset.atlasTextures.Length == 0
                || fontAsset.atlasTexture == null
                || fontAsset.material == null
                || fontAsset.material.shader == null)
            {
                reason = "NanumGothic SDF source, atlas, material, or shader is invalid.";
                return false;
            }

            var serialized = new SerializedObject(settings);
            if (serialized.FindProperty("m_defaultFontAsset").objectReferenceValue != fontAsset)
            {
                reason = "TMP Settings does not reference NanumGothic SDF.";
                return false;
            }

            reason = string.Empty;
            return true;
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
            MainTitleLifetimeScope scope = scopeObject.AddComponent<MainTitleLifetimeScope>();
            AssignRuntimeSlotCatalog(scope);

            GameObject hostObject = new("MainTitle UI Host");
            hostObject.AddComponent<MainTitleUiHost>();

            EditorSceneManager.SaveScene(scene, FoundationScenes.MainTitle);
        }

        private static void BuildContentScene()
        {
            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            GameObject scopeObject = new("Foundation Lifetime Scope");
            FoundationLifetimeScope scope = scopeObject.AddComponent<FoundationLifetimeScope>();
            AssignRuntimeSlotCatalog(scope);

            GameObject hostObject = new("Gameplay UI Host");
            GameplayUiHost host = hostObject.AddComponent<GameplayUiHost>();

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
            SetSerializedField(host, "stationCamera", camera);

            GameObject lightObject = new("Foundation Light");
            Light light = lightObject.AddComponent<Light>();
            light.type = LightType.Directional;
            light.intensity = 1.2f;
            light.transform.rotation = Quaternion.Euler(50f, -30f, 0f);

            EditorSceneManager.SaveScene(scene, FoundationScenes.Foundation);
        }

        private static void AssignRuntimeSlotCatalog(MonoBehaviour scope)
        {
            const string catalogPath = "Assets/Janseon/Foundation/Art/RuntimeSlotCatalog.asset";
            Janseon.Foundation.Art.RuntimeSlotCatalog catalog =
                AssetDatabase.LoadAssetAtPath<Janseon.Foundation.Art.RuntimeSlotCatalog>(catalogPath);
            if (catalog == null)
            {
                throw new System.InvalidOperationException("RuntimeSlotCatalog asset missing at " + catalogPath);
            }

            SerializedObject serializedScope = new(scope);
            serializedScope.FindProperty("runtimeSlots").objectReferenceValue = catalog;
            serializedScope.ApplyModifiedPropertiesWithoutUndo();
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
