using System;
using System.IO;
using Janseon.Foundation.Battle;
using UnityEditor;
using UnityEngine;

namespace Janseon.Foundation.Editor
{
    public static class TemporaryBattleVisualCatalogBuilder
    {
        public const string Root = "Assets/Janseon/Data/Authoring/TemporaryBattleVisuals";
        public const string CatalogPath = "Assets/Janseon/Data/Authoring/TemporaryBattleVisualCatalog.asset";

        public static void BuildFromCommandLine()
        {
            Build();
            Debug.Log("TEMPORARY_BATTLE_VISUAL_CATALOG_OK");
        }

        public static TemporaryBattleVisualCatalog Build()
        {
            EnsureFolder("Assets/Janseon/Data/Authoring");
            EnsureFolder(Root);

            Material bodyMaterial = CreateMaterial($"{Root}/TemporaryCombatantBody.mat", new Color(0.16f, 0.58f, 0.92f));
            Material accentMaterial = CreateMaterial($"{Root}/TemporaryCombatantAccent.mat", new Color(0.93f, 0.78f, 0.22f));
            Material selectionMaterial = CreateMaterial($"{Root}/TemporaryCombatantSelection.mat", new Color(0.2f, 1f, 0.55f));

            var entries = new[]
            {
                new TemporaryBattleVisualEntry(TemporaryCombatantKind.HeroMelee, BuildPrefab(TemporaryCombatantKind.HeroMelee, bodyMaterial, accentMaterial, selectionMaterial)),
                new TemporaryBattleVisualEntry(TemporaryCombatantKind.HeroRanged, BuildPrefab(TemporaryCombatantKind.HeroRanged, bodyMaterial, accentMaterial, selectionMaterial)),
                new TemporaryBattleVisualEntry(TemporaryCombatantKind.SoldierMelee, BuildPrefab(TemporaryCombatantKind.SoldierMelee, bodyMaterial, accentMaterial, selectionMaterial)),
                new TemporaryBattleVisualEntry(TemporaryCombatantKind.SoldierRanged, BuildPrefab(TemporaryCombatantKind.SoldierRanged, bodyMaterial, accentMaterial, selectionMaterial)),
            };

            TemporaryBattleVisualCatalog catalog = AssetDatabase.LoadAssetAtPath<TemporaryBattleVisualCatalog>(CatalogPath);
            if (catalog == null)
            {
                catalog = ScriptableObject.CreateInstance<TemporaryBattleVisualCatalog>();
                AssetDatabase.CreateAsset(catalog, CatalogPath);
            }
            catalog.SetGeneratedEntries(entries);
            EditorUtility.SetDirty(catalog);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            return catalog;
        }

        static GameObject BuildPrefab(TemporaryCombatantKind kind, Material body, Material accent, Material selection)
        {
            string path = $"{Root}/{kind}.prefab";
            var root = new GameObject(kind.ToString());
            try
            {
                bool hero = kind == TemporaryCombatantKind.HeroMelee || kind == TemporaryCombatantKind.HeroRanged;
                bool ranged = kind == TemporaryCombatantKind.HeroRanged || kind == TemporaryCombatantKind.SoldierRanged;
                float scale = hero ? 1.18f : 0.92f;
                var collider = root.AddComponent<CapsuleCollider>();
                collider.center = new Vector3(0f, 0.95f * scale, 0f);
                collider.height = 1.9f * scale;
                collider.radius = 0.34f * scale;

                var visualRoot = new GameObject("VisualRoot").transform;
                visualRoot.SetParent(root.transform, false);
                AddPart(visualRoot, "Torso", PrimitiveType.Capsule, new Vector3(0f, 0.92f, 0f) * scale, new Vector3(0.58f, 0.78f, 0.48f) * scale, body);
                AddPart(visualRoot, "Head", PrimitiveType.Sphere, new Vector3(0f, 1.58f, 0f) * scale, Vector3.one * 0.38f * scale, accent);
                AddPart(visualRoot, "Facing", PrimitiveType.Cube, new Vector3(0f, 1.02f, 0.35f) * scale, new Vector3(0.12f, 0.12f, 0.42f) * scale, accent);

                if (hero)
                {
                    AddPart(visualRoot, "HeroShoulders", PrimitiveType.Cube, new Vector3(0f, 1.25f, 0f) * scale, new Vector3(0.95f, 0.18f, 0.34f) * scale, accent);
                    AddPart(visualRoot, "HeroCrest", PrimitiveType.Cylinder, new Vector3(0f, 1.94f, 0f) * scale, new Vector3(0.22f, 0.18f, 0.22f) * scale, accent);
                }

                if (ranged)
                {
                    Transform bow = AddPart(visualRoot, "RangedBow", PrimitiveType.Cube, new Vector3(0.48f, 1.05f, 0.1f) * scale, new Vector3(0.1f, 1.05f, 0.1f) * scale, accent);
                    bow.localRotation = Quaternion.Euler(0f, 0f, -18f);
                    AddPart(visualRoot, "Quiver", PrimitiveType.Cylinder, new Vector3(-0.34f, 1.08f, -0.18f) * scale, new Vector3(0.16f, 0.55f, 0.16f) * scale, accent).localRotation = Quaternion.Euler(58f, 0f, 0f);
                }
                else
                {
                    Transform weapon = AddPart(visualRoot, "MeleeWeapon", PrimitiveType.Cube, new Vector3(0.48f, 1.02f, 0.18f) * scale, new Vector3(0.11f, 1.18f, 0.13f) * scale, accent);
                    weapon.localRotation = Quaternion.Euler(18f, 0f, -12f);
                }

                Transform marker = AddPart(root.transform, "SelectionMarker", PrimitiveType.Cylinder, new Vector3(0f, 0.035f, 0f), new Vector3(1.05f, 0.035f, 1.05f) * scale, selection);
                Renderer[] renderers = visualRoot.GetComponentsInChildren<Renderer>(true);
                var visual = root.AddComponent<TemporaryBattleCombatantVisual>();
                visual.Configure(visualRoot, renderers, marker.gameObject,
                    hero ? new Color(0.12f, 0.5f, 0.95f) : new Color(0.18f, 0.68f, 0.88f),
                    new Color(0.95f, 0.38f, 0.08f), new Color(0.18f, 0.2f, 0.23f));

                GameObject prefab = PrefabUtility.SaveAsPrefabAsset(root, path);
                if (prefab == null) throw new IOException("Failed to save temporary battle prefab: " + path);
                return prefab;
            }
            finally
            {
                UnityEngine.Object.DestroyImmediate(root);
            }
        }

        static Transform AddPart(Transform parent, string name, PrimitiveType primitive, Vector3 position, Vector3 scale, Material material)
        {
            GameObject part = GameObject.CreatePrimitive(primitive);
            part.name = name;
            part.transform.SetParent(parent, false);
            part.transform.localPosition = position;
            part.transform.localScale = scale;
            UnityEngine.Object.DestroyImmediate(part.GetComponent<Collider>());
            part.GetComponent<Renderer>().sharedMaterial = material;
            return part.transform;
        }

        static Material CreateMaterial(string path, Color color)
        {
            Material material = AssetDatabase.LoadAssetAtPath<Material>(path);
            Shader shader = Shader.Find("Janseon/TemporaryBattleBlockout");
            if (shader == null) throw new InvalidOperationException("Temporary battle blockout shader is unavailable");
            if (material == null)
            {
                material = new Material(shader) { name = Path.GetFileNameWithoutExtension(path) };
                AssetDatabase.CreateAsset(material, path);
            }
            else if (material.shader != shader)
            {
                material.shader = shader;
            }
            if (material.HasProperty("_BaseColor")) material.SetColor("_BaseColor", color);
            if (material.HasProperty("_Color")) material.SetColor("_Color", color);
            EditorUtility.SetDirty(material);
            return material;
        }

        static void EnsureFolder(string path)
        {
            string parent = Path.GetDirectoryName(path)?.Replace('\\', '/');
            string name = Path.GetFileName(path);
            if (!AssetDatabase.IsValidFolder(path)) AssetDatabase.CreateFolder(parent, name);
        }
    }
}
