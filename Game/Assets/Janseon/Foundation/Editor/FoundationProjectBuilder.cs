using System.IO;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Janseon.Foundation.Editor
{
    public static class FoundationProjectBuilder
    {
        private const string ScenePath = "Assets/Scenes/Foundation.unity";

        [MenuItem("Janseon/Build Foundation Scene")]
        public static void BuildFoundationScene()
        {
            Directory.CreateDirectory("Assets/Scenes");

            Scene scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
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

            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };

            PlayerSettings.companyName = "Janseon Studio";
            PlayerSettings.productName = "잔선: 서울";
            PlayerSettings.bundleVersion = "0.1.0";
            PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Standalone, "com.janseon.seoul");

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Debug.Log($"Foundation scene created: {ScenePath}");
        }
    }
}
