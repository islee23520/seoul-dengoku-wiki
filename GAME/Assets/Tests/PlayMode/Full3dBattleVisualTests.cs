#if UNITY_EDITOR
using System;
using System.Collections;
using System.IO;
using Janseon.Foundation.Battle;
using NUnit.Framework;
using UnityEditor;
using UnityEngine;
using UnityEngine.TestTools;

namespace Janseon.Foundation.Tests
{
    public sealed class Full3dBattleVisualTests
    {
        const string CatalogPath = "Assets/Janseon/Data/Authoring/TemporaryBattleVisualCatalog.asset";

        [Test]
        public void TemporaryHeroAndSoldierMeshesAreDistinct()
        {
            TemporaryBattleVisualCatalog catalog = AssetDatabase.LoadAssetAtPath<TemporaryBattleVisualCatalog>(CatalogPath);
            Assert.IsNotNull(catalog, "Task13 requires the serialized temporary battle visual catalog");
            var serialized = new SerializedObject(catalog);
            SerializedProperty prefabs = serialized.FindProperty("prefabs");
            SerializedProperty entries = serialized.FindProperty("entries");
            Assert.IsNotNull(prefabs);
            Assert.AreEqual(4, prefabs.arraySize);
            Assert.AreEqual(4, entries.arraySize);
            Assert.AreEqual(4, catalog.Entries.Length);
            var resolvedKinds = new System.Collections.Generic.HashSet<TemporaryCombatantKind>();
            foreach (TemporaryBattleVisualEntry entry in catalog.Entries)
            {
                Assert.IsNotNull(entry.Prefab, $"{entry.Kind} serialized entry must resolve a prefab");
                Assert.IsTrue(resolvedKinds.Add(entry.Kind), $"duplicate serialized entry: {entry.Kind}");
            }
            CollectionAssert.AreEquivalent(Enum.GetValues(typeof(TemporaryCombatantKind)), resolvedKinds);

            var seen = new System.Collections.Generic.HashSet<GameObject>();
            float heroHeight = 0f;
            float soldierHeight = 0f;
            foreach (TemporaryCombatantKind kind in Enum.GetValues(typeof(TemporaryCombatantKind)))
            {
                GameObject instance = catalog.Instantiate(kind);
                try
                {
                    GameObject serializedPrefab = null;
                    foreach (TemporaryBattleVisualEntry entry in catalog.Entries)
                        if (entry.Kind == kind) serializedPrefab = entry.Prefab;
                    Assert.IsNotNull(serializedPrefab);
                    Assert.IsTrue(seen.Add(serializedPrefab), $"{kind} must have a distinct serialized prefab");
                    Assert.AreEqual(serializedPrefab.name + "(Clone)", instance.name);
                    Assert.Greater(instance.GetComponentsInChildren<MeshRenderer>().Length, 3, $"{kind} needs a readable compound silhouette");
                    Assert.IsNotNull(instance.GetComponent<Collider>(), $"{kind} must have a root collider");
                    Assert.IsNotNull(instance.transform.Find("VisualRoot/Facing"), $"{kind} needs an authored facing cue");
                    bool ranged = kind == TemporaryCombatantKind.HeroRanged || kind == TemporaryCombatantKind.SoldierRanged;
                    bool hero = kind == TemporaryCombatantKind.HeroMelee || kind == TemporaryCombatantKind.HeroRanged;
                    Assert.AreEqual(ranged, instance.transform.Find("VisualRoot/RangedBow") != null, $"{kind} ranged silhouette");
                    Assert.AreEqual(!ranged, instance.transform.Find("VisualRoot/MeleeWeapon") != null, $"{kind} melee silhouette");
                    Assert.AreEqual(hero, instance.transform.Find("VisualRoot/HeroShoulders") != null, $"{kind} hero silhouette");
                    float hierarchyHeight = RendererBoundsHeight(instance);
                    if (hero) heroHeight = Mathf.Max(heroHeight, hierarchyHeight); else soldierHeight = Mathf.Max(soldierHeight, hierarchyHeight);
                    Assert.GreaterOrEqual(instance.GetComponentsInChildren<MeshFilter>().Length, ranged ? 5 : 4, $"{kind} authored mesh hierarchy");

                    TemporaryBattleCombatantVisual visual = instance.GetComponent<TemporaryBattleCombatantVisual>();
                    Assert.IsNotNull(visual);
                    visual.SetSelected(true);
                    Assert.IsTrue(visual.IsSelected);
                    Transform visualRoot = instance.transform.Find("VisualRoot");
                    Vector3 idlePosition = visualRoot.localPosition;
                    Quaternion idleRotation = visualRoot.localRotation;
                    Vector3 idleScale = visualRoot.localScale;
                    Color idleColor = ReadColor(instance.GetComponentInChildren<MeshRenderer>());

                    visual.SetPose(TemporaryCombatantPose.Moving);
                    Quaternion movingRotation = visualRoot.localRotation;
                    Assert.AreNotEqual(idleRotation, movingRotation, "moving transform cue");
                    visual.SetPose(TemporaryCombatantPose.Attacking);
                    Vector3 attackPosition = visualRoot.localPosition;
                    Quaternion attackRotation = visualRoot.localRotation;
                    Assert.AreNotEqual(idlePosition, attackPosition, "attack transform cue");
                    Assert.AreNotEqual(movingRotation, attackRotation, "moving and attacking transforms must differ");
                    visual.SetPose(TemporaryCombatantPose.Hit);
                    Color wounded = ReadColor(instance.GetComponentInChildren<MeshRenderer>());
                    Quaternion hitRotation = visualRoot.localRotation;
                    Assert.AreNotEqual(attackRotation, hitRotation, "attack and hit transforms must differ");
                    visual.SetPose(TemporaryCombatantPose.Dead);
                    Color dead = ReadColor(instance.GetComponentInChildren<MeshRenderer>());
                    Vector3 deadScale = visualRoot.localScale;
                    Assert.AreNotEqual(idleScale, deadScale, "dead scale cue");
                    Assert.AreNotEqual(wounded, dead, "wounded and dead state colors must differ");
                    Assert.AreNotEqual(idleRotation, visualRoot.localRotation, "death transform cue");
                    visual.SetPose(TemporaryCombatantPose.Idle);
                    Color alive = ReadColor(instance.GetComponentInChildren<MeshRenderer>());
                    Assert.AreEqual(idleColor, alive, "idle state must restore the alive color");
                    Assert.AreNotEqual(alive, wounded, "alive and wounded state colors must differ");
                    Assert.AreNotEqual(alive, dead, "alive and dead state colors must differ");
                }
                finally { UnityEngine.Object.DestroyImmediate(instance); }
            }
            Assert.Greater(heroHeight, soldierHeight + 0.25f, "hero and soldier prefab hierarchy/scale must be observably distinct");
        }

        [Test]
        public void OddlandAndSpineAreNotBattleCombatants()
        {
            TemporaryBattleVisualCatalog catalog = AssetDatabase.LoadAssetAtPath<TemporaryBattleVisualCatalog>(CatalogPath);
            Assert.IsNotNull(catalog, "Task13 requires a separately authored generated-combatant catalog");
            var serialized = new SerializedObject(catalog);
            Assert.AreEqual("unity-generated-blockout", serialized.FindProperty("source").stringValue);
            Assert.AreEqual("temporary-gameplay-mesh", serialized.FindProperty("use").stringValue);
            foreach (string path in AssetDatabase.GetDependencies(CatalogPath, true))
            {
                string lower = path.ToLowerInvariant();
                Assert.IsFalse(lower.Contains("oddland") || lower.Contains("spine") || lower.Contains("character"), path);
            }

            string runtimeCatalogSource = File.ReadAllText(Path.Combine(Application.dataPath, "Janseon/Foundation/Battle/TemporaryBattleVisualCatalog.cs"));
            Assert.IsFalse(runtimeCatalogSource.Contains("AssetDatabase"), "runtime catalog cannot search the editor database");
            Assert.IsFalse(runtimeCatalogSource.Contains("Resources.Load"), "runtime catalog cannot search paths");
            Assert.IsFalse(runtimeCatalogSource.Contains("CreatePrimitive"), "runtime catalog must instantiate bounded serialized prefabs");
            Assert.IsFalse(runtimeCatalogSource.IndexOf("final-art", StringComparison.OrdinalIgnoreCase) >= 0, "temporary visual cannot be promoted to final art");
        }

        [UnityTest]
        public IEnumerator CatalogPrefabsRenderInGameView1280x720()
        {
            string output = Environment.GetEnvironmentVariable("TASK13_CAPTURE_PATH");
            Assert.IsFalse(string.IsNullOrWhiteSpace(output), "TASK13_CAPTURE_PATH must bind the tracked PNG");
            TemporaryBattleVisualCatalog catalog = AssetDatabase.LoadAssetAtPath<TemporaryBattleVisualCatalog>(CatalogPath);
            Assert.IsNotNull(catalog);

            var cameraObject = new GameObject("Task13GameViewCamera");
            var lightObject = new GameObject("Task13KeyLight");
            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
            var instances = new System.Collections.Generic.List<GameObject>();
            RenderTexture target = null;
            Texture2D pixels = null;
            try
            {
                Screen.SetResolution(1280, 720, false);
                Camera camera = cameraObject.AddComponent<Camera>();
                camera.clearFlags = CameraClearFlags.SolidColor;
                camera.backgroundColor = new Color(0.035f, 0.055f, 0.08f);
                camera.transform.SetPositionAndRotation(new Vector3(0f, 8.8f, -13.5f), Quaternion.Euler(20f, 0f, 0f));
                camera.fieldOfView = 43f;
                Light light = lightObject.AddComponent<Light>();
                light.type = LightType.Directional;
                light.intensity = 1.5f;
                light.transform.rotation = Quaternion.Euler(48f, -28f, 0f);
                ground.name = "Task13BattleGround";
                ground.transform.localScale = new Vector3(2.1f, 1f, 1.25f);
                ground.GetComponent<Renderer>().material.color = new Color(0.12f, 0.16f, 0.2f);

                Array kinds = Enum.GetValues(typeof(TemporaryCombatantKind));
                Array poses = Enum.GetValues(typeof(TemporaryCombatantPose));
                for (int row = 0; row < kinds.Length; row++)
                for (int column = 0; column < poses.Length; column++)
                {
                    var kind = (TemporaryCombatantKind)kinds.GetValue(row);
                    var pose = (TemporaryCombatantPose)poses.GetValue(column);
                    GameObject instance = catalog.Instantiate(kind);
                    instance.name = $"{kind}-{pose}";
                    instance.transform.position = new Vector3((column - 2) * 2.15f, 0f, (row - 1.5f) * 2.2f);
                    TemporaryBattleCombatantVisual visual = instance.GetComponent<TemporaryBattleCombatantVisual>();
                    visual.SetPose(pose);
                    visual.SetSelected(column == 0);
                    instances.Add(instance);
                }

                yield return null;
                target = new RenderTexture(1280, 720, 24, RenderTextureFormat.ARGB32);
                camera.targetTexture = target;
                camera.Render();
                RenderTexture previous = RenderTexture.active;
                RenderTexture.active = target;
                pixels = new Texture2D(1280, 720, TextureFormat.RGB24, false);
                pixels.ReadPixels(new Rect(0, 0, 1280, 720), 0, 0);
                pixels.Apply();
                RenderTexture.active = previous;
                Directory.CreateDirectory(Path.GetDirectoryName(output));
                File.WriteAllBytes(output, pixels.EncodeToPNG());
                Assert.Greater(new FileInfo(output).Length, 10000, "rendered PNG must contain the catalog preview");
            }
            finally
            {
                foreach (GameObject instance in instances) UnityEngine.Object.DestroyImmediate(instance);
                UnityEngine.Object.DestroyImmediate(ground);
                UnityEngine.Object.DestroyImmediate(cameraObject);
                UnityEngine.Object.DestroyImmediate(lightObject);
                if (pixels != null) UnityEngine.Object.DestroyImmediate(pixels);
                if (target != null) UnityEngine.Object.DestroyImmediate(target);
            }
        }

        static float RendererBoundsHeight(GameObject instance)
        {
            Renderer[] renderers = instance.transform.Find("VisualRoot").GetComponentsInChildren<Renderer>();
            Bounds bounds = renderers[0].bounds;
            for (int i = 1; i < renderers.Length; i++) bounds.Encapsulate(renderers[i].bounds);
            return bounds.size.y;
        }

        static Color ReadColor(Renderer renderer)
        {
            var block = new MaterialPropertyBlock();
            renderer.GetPropertyBlock(block);
            return block.GetColor("_BaseColor");
        }
    }
}
#endif
