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
        [Serializable] public sealed class Motion
        {
            public string sourceAvatar;
            public Clip[] clips;
        }
        [Serializable] public sealed class Clip
        {
            public string name, takeName;
            public float firstFrame, lastFrame;
            public bool loopTime, loopPose, lockRootRotation, lockRootHeightY, lockRootPositionXZ;
        }
        [Serializable] public sealed class Manifest { public int version; public string model, kind; public float heightMeters; public bool rigged; public Pbr pbr; public Motion motion; }
        [Serializable] public sealed class MaterialReceipt
        {
            public string name, assetPath, shader, baseColor, metallicSmoothness, occlusion, normal, emission;
            public bool boundToRenderer, colorSrgb, dataLinear, normalMap;
        }
        [Serializable] public sealed class Receipt
        {
            public bool ok, avatarValid, avatarHuman;
            public string error, asset, unityVersion, rigType;
            public int meshes, skinnedMeshes, bones, weightedVertices, blendShapes;
            public float heightMeters, expectedHeightMeters;
            public MaterialReceipt[] materials;
            public string sourceAvatar;
            public string[] clips;
        }

        public static void Run()
        {
            Request request = JsonUtility.FromJson<Request>(File.ReadAllText(Environment.GetEnvironmentVariable("CHARACTER_TOOL_REQUEST")));
            Receipt receipt = Import(request);
            File.WriteAllText(request.receipt, JsonUtility.ToJson(receipt, true));
            if (!receipt.ok) EditorApplication.Exit(2);
        }

        public static Receipt Import(Request request)
        {
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
                bool motionOnly = manifest != null && manifest.kind == "animation";
                if (manifest == null || manifest.version != 1 || (!motionOnly && (!float.IsFinite(manifest.heightMeters) || manifest.heightMeters <= 0)))
                    throw new InvalidDataException("Invalid character manifest");
                Avatar sourceAvatar = null;
                if (motionOnly)
                {
                    if (!manifest.rigged || request.rigType != "humanoid" || manifest.motion == null ||
                        (manifest.pbr != null && (manifest.pbr.materials?.Length > 0 || !string.IsNullOrEmpty(manifest.pbr.textureDirectory))))
                        throw new InvalidDataException("Motion requires a separate Humanoid skeleton without materials");
                    string sourcePath = manifest.motion.sourceAvatar;
                    if (string.IsNullOrEmpty(sourcePath) || !sourcePath.StartsWith("Assets/", StringComparison.Ordinal) ||
                        sourcePath.Contains("\\") || sourcePath.Split('/').Any(p => p == ".." || p == "." || p.Length == 0))
                        throw new InvalidDataException("Explicit canonical Avatar asset path required");
                    sourceAvatar = AssetDatabase.LoadAllAssetsAtPath(sourcePath).OfType<Avatar>().SingleOrDefault();
                    if (sourceAvatar == null || !sourceAvatar.isValid || !sourceAvatar.isHuman)
                        throw new InvalidDataException("Canonical Avatar must be valid and Human");
                    ValidateClips(manifest.motion.clips);
                }
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
                if (manifest.rigged && !motionOnly && !AssetDatabase.LoadAssetAtPath<GameObject>(asset)
                    .GetComponentsInChildren<SkinnedMeshRenderer>(true).Any(s => s.bones.Length > 0))
                    throw new InvalidDataException("Missing skin skeleton");
                importer.globalScale = 1;
                importer.useFileScale = true;
                importer.isReadable = true;
                importer.importBlendShapes = true;
                if (manifest.rigged) importer.preserveHierarchy = true;
                importer.importAnimation = motionOnly;
                importer.materialImportMode = ModelImporterMaterialImportMode.ImportStandard;
                importer.animationType = !manifest.rigged ? ModelImporterAnimationType.None :
                    request.rigType == "humanoid" ? ModelImporterAnimationType.Human : ModelImporterAnimationType.Generic;
                if (manifest.rigged) importer.avatarSetup = ModelImporterAvatarSetup.CreateFromThisModel;
                if (motionOnly)
                {
                    importer.avatarSetup = ModelImporterAvatarSetup.CopyFromOther;
                    importer.sourceAvatar = sourceAvatar;
                    importer.clipAnimations = manifest.motion.clips.Select(c => new ModelImporterClipAnimation {
                        name = c.name, takeName = c.takeName, firstFrame = c.firstFrame, lastFrame = c.lastFrame,
                        loopTime = c.loopTime, loopPose = c.loopPose, lockRootRotation = c.lockRootRotation,
                        lockRootHeightY = c.lockRootHeightY, lockRootPositionXZ = c.lockRootPositionXZ,
                        keepOriginalOrientation = true, keepOriginalPositionY = true, keepOriginalPositionXZ = true
                    }).ToArray();
                }
                importer.SaveAndReimport();
                if (motionOnly)
                {
                    GameObject motion = AssetDatabase.LoadAssetAtPath<GameObject>(asset);
                    if (motion == null || motion.GetComponentsInChildren<Renderer>(true).Length != 0)
                        throw new InvalidDataException("Motion input must be animation-only, not a body");
                    var sourceImporter = AssetImporter.GetAtPath(manifest.motion.sourceAvatar) as ModelImporter;
                    if (sourceImporter == null) throw new InvalidDataException("Canonical Avatar must belong to an imported body");
                    var sourceModel = AssetDatabase.LoadAssetAtPath<GameObject>(manifest.motion.sourceAvatar);
                    ValidateSkeleton(sourceModel, motion);
                    var clips = AssetDatabase.LoadAllAssetsAtPath(asset).OfType<AnimationClip>().Where(c => !c.name.StartsWith("__preview__", StringComparison.Ordinal)).ToArray();
                    if (clips.Length != manifest.motion.clips.Length || clips.Any(c => !c.isHumanMotion || c.length <= 0) ||
                        !clips.Select(c => c.name).OrderBy(n => n).SequenceEqual(manifest.motion.clips.Select(c => c.name).OrderBy(n => n)))
                        throw new InvalidDataException("Missing or invalid Humanoid animation clips");
                    receipt.ok = true; receipt.asset = asset; receipt.avatarValid = sourceAvatar.isValid; receipt.avatarHuman = sourceAvatar.isHuman;
                    receipt.sourceAvatar = manifest.motion.sourceAvatar; receipt.clips = clips.Select(c => c.name).ToArray();
                    AssetDatabase.SaveAssets();
                    return receipt;
                }
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
                        ValidateSkin(skin);
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
                receipt.avatarHuman = avatar != null && avatar.isHuman;
                receipt.expectedHeightMeters = manifest.heightMeters; receipt.materials = materialReceipts.ToArray();
                AssetDatabase.SaveAssets();
                Debug.Log("CHARACTER_TOOL_IMPORT_OK " + asset);
            }
            catch (Exception error)
            {
                receipt.error = error.ToString();
                if (created) AssetDatabase.DeleteAsset(request.destination);
            }
            return receipt;
        }

        static void ValidateClips(Clip[] clips)
        {
            if (clips == null || clips.Length == 0 || clips.Any(c => c == null || string.IsNullOrWhiteSpace(c.name) ||
                string.IsNullOrWhiteSpace(c.takeName) || !float.IsFinite(c.firstFrame) || !float.IsFinite(c.lastFrame) ||
                c.firstFrame < 0 || c.lastFrame <= c.firstFrame) || clips.Select(c => c.name).Distinct().Count() != clips.Length)
                throw new InvalidDataException("Explicit unique clips and finite frame ranges required");
        }

        public static void ValidateSkin(SkinnedMeshRenderer skin)
        {
            Mesh mesh = skin.sharedMesh;
            if (mesh == null || skin.bones.Length == 0 || skin.bones.Any(b => b == null)) throw new InvalidDataException("Missing skin bones");
            if (mesh.bindposes.Length != skin.bones.Length) throw new InvalidDataException("Bindpose count differs from ordered bones");
            for (int i = 0; i < skin.bones.Length; i++)
            {
                Matrix4x4 expected = skin.bones[i].worldToLocalMatrix * skin.transform.localToWorldMatrix;
                Matrix4x4 actual = mesh.bindposes[i];
                for (int j = 0; j < 16; j++)
                    if (!float.IsFinite(actual[j]) || Mathf.Abs(actual[j] - expected[j]) > 0.001f)
                        throw new InvalidDataException("Incompatible bindpose at bone index " + i);
            }
            foreach (BoneWeight weight in mesh.boneWeights)
            {
                int[] indices = { weight.boneIndex0, weight.boneIndex1, weight.boneIndex2, weight.boneIndex3 };
                float[] values = { weight.weight0, weight.weight1, weight.weight2, weight.weight3 };
                if (values.Any(v => !float.IsFinite(v) || v < 0) || Mathf.Abs(values.Sum() - 1) > 0.001f ||
                    indices.Where((index, j) => values[j] > 0).Any(index => index < 0 || index >= skin.bones.Length))
                    throw new InvalidDataException("Invalid ordered bone weights");
            }
        }

        static void ValidateSkeleton(GameObject body, GameObject motion)
        {
            if (body == null) throw new InvalidDataException("Canonical body missing");
            var bones = body.GetComponentsInChildren<SkinnedMeshRenderer>(true).SelectMany(s => s.bones).Distinct().ToArray();
            if (bones.Length == 0) throw new InvalidDataException("Canonical body has no skin skeleton");
            foreach (Transform bone in bones)
            {
                string path = AnimationUtility.CalculateTransformPath(bone, body.transform);
                Transform target = motion.transform.Find(path);
                if (target == null) throw new InvalidDataException("Missing canonical skeleton bone " + path);
                if (Vector3.Distance(bone.localPosition, target.localPosition) > 0.001f ||
                    Quaternion.Angle(bone.localRotation, target.localRotation) > 0.1f || Vector3.Distance(bone.localScale, target.localScale) > 0.001f)
                    throw new InvalidDataException("Incompatible canonical rest pose " + path);
            }
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
