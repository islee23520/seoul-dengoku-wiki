using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEngine;
using UnityEngine.Rendering;

namespace CharacterTool.Editor
{
    public static class CharacterToolImporter
    {
        [Serializable] public sealed class Request { public string input, manifest, destination, receipt, rigType; }
        [Serializable] public sealed class Maps { public string baseColor, normal, emission, metallicSmoothness, occlusion; }
        [Serializable] public sealed class MaterialSpec
        {
            public string name, alphaMode;
            public Maps maps;
            public float[] baseColor, emission;
            public float metallic, smoothness, normalScale, occlusionStrength, alphaCutoff;
            public bool doubleSided;
        }
        [Serializable] public sealed class Pbr { public string textureDirectory, shader; public MaterialSpec[] materials; }
        [Serializable] public sealed class Manifest { public int version; public string model; public float heightMeters; public bool rigged; public Pbr pbr; }
        [Serializable] public sealed class MaterialReceipt
        {
            public string name, assetPath, shader, baseColor, metallicSmoothness, occlusion, normal, emission;
            public bool boundToRenderer, colorSrgb, dataLinear, normalMap;
        }
        [Serializable] public sealed class Receipt
        {
            public bool ok, avatarValid;
            public string error, asset, unityVersion, rigType;
            public int meshes, skinnedMeshes, bones, weightedVertices, blendShapes;
            public float heightMeters, expectedHeightMeters;
            public MaterialReceipt[] materials;
        }

        public static void Run()
        {
            Request request = JsonUtility.FromJson<Request>(File.ReadAllText(Environment.GetEnvironmentVariable("CHARACTER_TOOL_REQUEST")));
            var receipt = new Receipt { unityVersion = Application.unityVersion, rigType = request.rigType };
            bool created = false;
            try
            {
                if (!request.destination.StartsWith("Assets/Art/Staging/", StringComparison.Ordinal) ||
                    request.destination.Split('/').Any(p => p == ".." || p == "." || p.Length == 0) || request.destination.Contains("\\"))
                    throw new InvalidOperationException("Destination must remain below Assets/Art/Staging");
                if (Directory.Exists(request.destination) || File.Exists(request.destination + ".meta"))
                    throw new IOException("Refusing an existing destination");
                Manifest manifest = JsonUtility.FromJson<Manifest>(File.ReadAllText(request.manifest));
                if (manifest.version != 1 || manifest.heightMeters <= 0) throw new InvalidDataException("Invalid character manifest");
                Directory.CreateDirectory(request.destination);
                created = true;
                string asset = request.destination + "/" + Path.GetFileName(request.input);
                File.Copy(request.input, asset, false);
                if (manifest.pbr != null && !string.IsNullOrEmpty(manifest.pbr.textureDirectory))
                {
                    string textureSource = Path.Combine(Path.GetDirectoryName(request.input), manifest.pbr.textureDirectory);
                    if (Path.GetFileName(manifest.pbr.textureDirectory) != manifest.pbr.textureDirectory)
                        throw new InvalidDataException("Texture directory must be a sibling basename");
                    Directory.CreateDirectory(request.destination + "/Textures");
                    foreach (string file in Directory.GetFiles(textureSource))
                        File.Copy(file, request.destination + "/Textures/" + Path.GetFileName(file), false);
                }
                AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);
                var importer = AssetImporter.GetAtPath(asset) as ModelImporter;
                if (importer == null) throw new InvalidDataException("FBX ModelImporter unavailable");
                importer.globalScale = 1;
                importer.useFileScale = true;
                importer.isReadable = true;
                importer.importBlendShapes = true;
                importer.importAnimation = false;
                importer.materialImportMode = ModelImporterMaterialImportMode.ImportStandard;
                importer.animationType = !manifest.rigged ? ModelImporterAnimationType.None :
                    request.rigType == "humanoid" ? ModelImporterAnimationType.Human : ModelImporterAnimationType.Generic;
                if (manifest.rigged) importer.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
                importer.SaveAndReimport();
                var materialReceipts = new System.Collections.Generic.List<MaterialReceipt>();
                if (manifest.pbr != null && manifest.pbr.materials != null)
                {
                    Shader shader = Shader.Find("Universal Render Pipeline/Lit");
                    if (shader == null) throw new InvalidOperationException("URP/Lit shader unavailable in target project");
                    Directory.CreateDirectory(request.destination + "/Materials");
                    for (int index = 0; index < manifest.pbr.materials.Length; index++)
                    {
                        MaterialSpec spec = manifest.pbr.materials[index];
                        var material = new Material(shader) { name = spec.name };
                        ConfigureMaterial(material, spec, request.destination);
                        string materialPath = request.destination + "/Materials/material-" + index + ".mat";
                        AssetDatabase.CreateAsset(material, materialPath);
                        importer.AddRemap(new AssetImporter.SourceAssetIdentifier(typeof(Material), spec.name), material);
                        materialReceipts.Add(new MaterialReceipt { name = spec.name, assetPath = materialPath, shader = material.shader.name,
                            baseColor = TexturePath(material, "_BaseMap"), metallicSmoothness = TexturePath(material, "_MetallicGlossMap"),
                            occlusion = TexturePath(material, "_OcclusionMap"), normal = TexturePath(material, "_BumpMap"), emission = TexturePath(material, "_EmissionMap") });
                    }
                    importer.SaveAndReimport();
                }
                GameObject model = AssetDatabase.LoadAssetAtPath<GameObject>(asset);
                if (model == null) throw new InvalidDataException("Imported model is null");
                Renderer[] renderers = model.GetComponentsInChildren<Renderer>(true);
                if (renderers.Length == 0) throw new InvalidDataException("No renderers imported");
                // Renderer bounds include skinning/animation padding. Measure rest mesh vertices instead.
                var bounds = new Bounds();
                bool hasVertex = false;
                foreach (var renderer in renderers)
                {
                    Mesh mesh = renderer is SkinnedMeshRenderer skinRenderer ? skinRenderer.sharedMesh :
                        renderer.GetComponent<MeshFilter>() != null ? renderer.GetComponent<MeshFilter>().sharedMesh : null;
                    if (mesh == null) continue;
                    foreach (Vector3 vertex in mesh.vertices)
                    {
                        Vector3 point = renderer.transform.TransformPoint(vertex);
                        if (!hasVertex) { bounds = new Bounds(point, Vector3.zero); hasVertex = true; }
                        else bounds.Encapsulate(point);
                    }
                }
                if (!hasVertex) throw new InvalidDataException("No imported mesh vertices");
                foreach (MaterialReceipt materialReceipt in materialReceipts)
                {
                    Material bound = renderers.SelectMany(r => r.sharedMaterials).FirstOrDefault(m => m != null &&
                        m.shader.name == materialReceipt.shader && AssetDatabase.GetAssetPath(m) == materialReceipt.assetPath);
                    if (bound == null) throw new InvalidDataException("Material remap not bound to renderer: " + materialReceipt.name + "; actual=" +
                        string.Join(";", renderers.SelectMany(r => r.sharedMaterials).Select(m => m == null ? "null" :
                        m.name + "|" + m.shader.name + "|" + AssetDatabase.GetAssetPath(m))));
                    materialReceipt.boundToRenderer = true;
                    materialReceipt.colorSrgb = string.IsNullOrEmpty(materialReceipt.baseColor) ||
                        ((TextureImporter)AssetImporter.GetAtPath(materialReceipt.baseColor)).sRGBTexture;
                    materialReceipt.dataLinear = string.IsNullOrEmpty(materialReceipt.metallicSmoothness) ||
                        !((TextureImporter)AssetImporter.GetAtPath(materialReceipt.metallicSmoothness)).sRGBTexture;
                    materialReceipt.normalMap = string.IsNullOrEmpty(materialReceipt.normal) ||
                        ((TextureImporter)AssetImporter.GetAtPath(materialReceipt.normal)).textureType == TextureImporterType.NormalMap;
                    if (!materialReceipt.colorSrgb || !materialReceipt.dataLinear || !materialReceipt.normalMap)
                        throw new InvalidDataException("Incorrect texture import settings");
                }
                var skins = model.GetComponentsInChildren<SkinnedMeshRenderer>(true);
                int weighted = 0, boneCount = 0, blendShapes = 0;
                foreach (var skin in skins)
                {
                    Mesh mesh = skin.sharedMesh;
                    if (mesh == null) throw new InvalidDataException("Missing skinned mesh");
                    blendShapes += mesh.blendShapeCount;
                    boneCount += skin.bones.Length;
                    if (manifest.rigged)
                    {
                        if (skin.bones.Length == 0 || skin.bones.Any(b => b == null)) throw new InvalidDataException("Missing skin bones");
                        var weights = mesh.boneWeights;
                        if (weights.Length != mesh.vertexCount || weights.Any(w => w.weight0 + w.weight1 + w.weight2 + w.weight3 <= 0))
                            throw new InvalidDataException("Unweighted imported vertices");
                        weighted += weights.Length;
                    }
                }
                if (manifest.rigged && skins.Length == 0) throw new InvalidDataException("Rig lost during import");
                var avatar = AssetDatabase.LoadAllAssetsAtPath(asset).OfType<Avatar>().FirstOrDefault();
                if (manifest.rigged && (avatar == null || !avatar.isValid || (request.rigType == "humanoid" && !avatar.isHuman)))
                    throw new InvalidDataException("Invalid imported Avatar");
                if (Mathf.Abs(bounds.size.y - manifest.heightMeters) > Mathf.Max(0.001f, manifest.heightMeters * 0.001f))
                    throw new InvalidDataException("Height mismatch: expected " + manifest.heightMeters + ", actual " + bounds.size.y);
                receipt.ok = true; receipt.asset = asset; receipt.meshes = renderers.Length; receipt.skinnedMeshes = skins.Length;
                receipt.bones = boneCount; receipt.weightedVertices = weighted; receipt.blendShapes = blendShapes;
                receipt.avatarValid = avatar != null && avatar.isValid; receipt.heightMeters = bounds.size.y;
                receipt.expectedHeightMeters = manifest.heightMeters; receipt.materials = materialReceipts.ToArray();
                AssetDatabase.SaveAssets();
                Debug.Log("CHARACTER_TOOL_IMPORT_OK " + asset);
            }
            catch (Exception error)
            {
                receipt.error = error.ToString();
                if (created) AssetDatabase.DeleteAsset(request.destination);
                Debug.LogError(error);
            }
            File.WriteAllText(request.receipt, JsonUtility.ToJson(receipt, true));
            if (!receipt.ok) EditorApplication.Exit(2);
        }

        static string TexturePath(Material material, string property) => AssetDatabase.GetAssetPath(material.GetTexture(property));

        static Texture2D Texture(string directory, string filename, bool srgb, bool normal)
        {
            if (string.IsNullOrEmpty(filename)) return null;
            if (Path.GetFileName(filename) != filename) throw new InvalidDataException("Texture name must be a basename");
            string path = directory + "/Textures/" + filename;
            var importer = AssetImporter.GetAtPath(path) as TextureImporter;
            if (importer == null) throw new InvalidDataException("Texture missing: " + path);
            importer.textureType = normal ? TextureImporterType.NormalMap : TextureImporterType.Default;
            importer.sRGBTexture = srgb;
            importer.alphaSource = TextureImporterAlphaSource.FromInput;
            importer.textureCompression = TextureImporterCompression.Uncompressed;
            importer.SaveAndReimport();
            return AssetDatabase.LoadAssetAtPath<Texture2D>(path);
        }

        static void ConfigureMaterial(Material material, MaterialSpec spec, string directory)
        {
            Maps maps = spec.maps ?? new Maps();
            material.SetColor("_BaseColor", new Color(spec.baseColor[0], spec.baseColor[1], spec.baseColor[2], spec.baseColor[3]));
            material.SetTexture("_BaseMap", Texture(directory, maps.baseColor, true, false));
            material.SetTexture("_BumpMap", Texture(directory, maps.normal, false, true));
            material.SetFloat("_BumpScale", spec.normalScale);
            if (!string.IsNullOrEmpty(maps.normal)) material.EnableKeyword("_NORMALMAP");
            material.SetTexture("_MetallicGlossMap", Texture(directory, maps.metallicSmoothness, false, false));
            material.SetFloat("_Metallic", spec.metallic);
            material.SetFloat("_Smoothness", string.IsNullOrEmpty(maps.metallicSmoothness) ? spec.smoothness : 1);
            if (!string.IsNullOrEmpty(maps.metallicSmoothness)) material.EnableKeyword("_METALLICSPECGLOSSMAP");
            material.SetTexture("_OcclusionMap", Texture(directory, maps.occlusion, false, false));
            material.SetFloat("_OcclusionStrength", spec.occlusionStrength);
            if (!string.IsNullOrEmpty(maps.occlusion)) material.EnableKeyword("_OCCLUSIONMAP");
            material.SetTexture("_EmissionMap", Texture(directory, maps.emission, true, false));
            material.SetColor("_EmissionColor", new Color(spec.emission[0], spec.emission[1], spec.emission[2]));
            if (spec.emission.Any(v => v > 0)) material.EnableKeyword("_EMISSION");
            material.SetFloat("_Cull", spec.doubleSided ? (float)CullMode.Off : (float)CullMode.Back);
            if (spec.alphaMode == "MASK")
            {
                material.SetFloat("_AlphaClip", 1); material.SetFloat("_Cutoff", spec.alphaCutoff);
                material.EnableKeyword("_ALPHATEST_ON"); material.renderQueue = (int)RenderQueue.AlphaTest;
            }
            if (spec.alphaMode == "BLEND")
            {
                material.SetFloat("_Surface", 1); material.SetFloat("_ZWrite", 0);
                material.SetFloat("_SrcBlend", (float)BlendMode.SrcAlpha); material.SetFloat("_DstBlend", (float)BlendMode.OneMinusSrcAlpha);
                material.EnableKeyword("_SURFACE_TYPE_TRANSPARENT"); material.renderQueue = (int)RenderQueue.Transparent;
            }
        }
    }
}
