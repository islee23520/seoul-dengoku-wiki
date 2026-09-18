using System.Collections.Generic;
using Janseon.Core;
using UnityEngine;

namespace Janseon.Foundation.Presentation
{
    /// <summary>
    /// Heightmap voxel mesh (top face + exposed cliff sides) with unlit materials.
    /// Replaces the three-cube placeholder while keeping station tokens.
    /// </summary>
    public sealed class HeightmapVoxelWorld : MonoBehaviour
    {
        Transform actor;
        Camera viewCamera;
        Transform stationPropsRoot;
        Heightmap map;
        readonly Dictionary<HeightMaterial, Material> materials = new Dictionary<HeightMaterial, Material>();

        public int StationCubeCount { get; private set; }
        public Heightmap Map => map;
        public LayerId Layer { get; private set; }

        public static HeightmapVoxelWorld Create(Transform parent, Camera camera, int seed, LayerId layer)
        {
            GameObject root = new GameObject("HeightmapVoxelWorld");
            if (parent != null)
            {
                root.transform.SetParent(parent, false);
            }

            HeightmapVoxelWorld world = root.AddComponent<HeightmapVoxelWorld>();
            world.Layer = layer;
            world.viewCamera = camera != null ? camera : world.EnsureCamera();
            world.map = HeightmapApi.Generate(seed, layer);
            world.BuildMaterials();
            world.BuildTerrain();
            world.BuildStations();
            world.BuildActor();
            world.FrameCamera();
            return world;
        }

        public void SyncActor(StationId station)
        {
            if (actor == null || map == null)
            {
                return;
            }

            LayerId wanted = station.Equals(StationId.Sindorim) ? LayerId.B2 : LayerId.B1;
            if (map != null && Layer != wanted)
            {
                SetLayer(map.Seed, wanted);
            }

            Vector3 ground = StationGround(station);
            actor.position = ground + Vector3.up * (PlaceholderVoxelLayout.TileSize * 0.35f);
            PlaceStationProps(stationPropsRoot);
        }

        public void PlaceStationProps(Transform props)
        {
            if (props != null)
            {
                stationPropsRoot = props;
            }

            if (stationPropsRoot == null || map == null)
            {
                return;
            }

            StationId[] ids = PlaceholderVoxelLayout.StationIds;
            int childCount = props.transform.childCount;
            for (var i = 0; i < childCount; i++)
            {
                Transform child = props.transform.GetChild(i);
                StationId station = ids[i % ids.Length];
                Vector3 ground = StationGround(station);
                float ring = 1.1f + (i / ids.Length) * 0.8f;
                float angle = i * 2.2f;
                child.position = new Vector3(
                    ground.x + Mathf.Cos(angle) * ring,
                    ground.y,
                    ground.z + Mathf.Sin(angle) * ring);
            }
        }

        public void SetLayer(int seed, LayerId layer)
        {
            if (map != null && map.Seed == seed && Layer == layer)
            {
                return;
            }

            Layer = layer;
            map = HeightmapApi.Generate(seed, layer);
            Transform terrain = transform.Find("Terrain");
            if (terrain != null)
            {
                Destroy(terrain.gameObject);
            }

            BuildTerrain();
        }

        Vector3 StationGround(StationId station)
        {
            Vector3 xz = PlaceholderVoxelLayout.StationWorld(station);
            int gx = Mathf.Clamp(Mathf.RoundToInt(xz.x / PlaceholderVoxelLayout.TileSize), 0, map.Width - 1);
            int gz = Mathf.Clamp(Mathf.RoundToInt(xz.z / PlaceholderVoxelLayout.TileSize), 0, map.Height - 1);
            float y = map.Get(gx, gz) * (PlaceholderVoxelLayout.TileSize * 0.5f);
            return new Vector3(xz.x, y, xz.z);
        }

        void BuildMaterials()
        {
            Shader shader = Shader.Find("Janseon/UnlitVoxel")
                            ?? Shader.Find("Universal Render Pipeline/Unlit")
                            ?? Shader.Find("Unlit/Color");
            materials[HeightMaterial.Water] = MakeMat(shader, new Color(0.18f, 0.44f, 0.66f));
            materials[HeightMaterial.Sand] = MakeMat(shader, new Color(0.60f, 0.52f, 0.38f));
            materials[HeightMaterial.Grass] = MakeMat(shader, new Color(0.29f, 0.42f, 0.33f));
            materials[HeightMaterial.Dirt] = MakeMat(shader, new Color(0.36f, 0.29f, 0.21f));
            materials[HeightMaterial.Rock] = MakeMat(shader, new Color(0.34f, 0.35f, 0.38f));
            materials[HeightMaterial.Snow] = MakeMat(shader, new Color(0.78f, 0.82f, 0.86f));
        }

        static Material MakeMat(Shader shader, Color color)
        {
            if (shader == null)
            {
                return new Material(Shader.Find("Sprites/Default")) { color = color };
            }

            var mat = new Material(shader);
            if (mat.HasProperty("_Color"))
            {
                mat.SetColor("_Color", color);
            }
            else if (mat.HasProperty("_BaseColor"))
            {
                mat.SetColor("_BaseColor", color);
            }
            else
            {
                mat.color = color;
            }

            return mat;
        }

        void BuildTerrain()
        {
            float tile = PlaceholderVoxelLayout.TileSize;
            float step = tile * 0.5f;
            var buckets = new Dictionary<HeightMaterial, List<CombineInstance>>();
            foreach (HeightMaterial key in System.Enum.GetValues(typeof(HeightMaterial)))
            {
                buckets[key] = new List<CombineInstance>();
            }

            for (var y = 0; y < map.Height; y++)
            {
                for (var x = 0; x < map.Width; x++)
                {
                    int h = map.Get(x, y);
                    int surf = h <= map.WaterLevel ? map.WaterLevel : h;
                    HeightMaterial mat = map.MaterialAt(x, y);
                    float wx = x * tile;
                    float wz = y * tile;
                    float top = surf * step;
                    AppendBox(buckets[mat], new Vector3(wx, top - step * 0.5f, wz), new Vector3(tile, Mathf.Max(step, surf * step), tile));

                    int nL = (y + 1 < map.Height) ? Surface(x, y + 1) : surf - 1;
                    int nR = (x + 1 < map.Width) ? Surface(x + 1, y) : surf - 1;
                    int dropL = surf - nL;
                    int dropR = surf - nR;
                    if (dropL > 0)
                    {
                        AppendBox(
                            buckets[mat],
                            new Vector3(wx, (nL * step) + dropL * step * 0.5f, wz + tile * 0.5f),
                            new Vector3(tile, dropL * step, 0.08f));
                    }

                    if (dropR > 0)
                    {
                        AppendBox(
                            buckets[mat],
                            new Vector3(wx + tile * 0.5f, (nR * step) + dropR * step * 0.5f, wz),
                            new Vector3(0.08f, dropR * step, tile));
                    }
                }
            }

            GameObject terrain = new GameObject("Terrain");
            terrain.transform.SetParent(transform, false);
            foreach (KeyValuePair<HeightMaterial, List<CombineInstance>> pair in buckets)
            {
                if (pair.Value.Count == 0)
                {
                    continue;
                }

                var mesh = new Mesh { name = "Heightmap_" + pair.Key };
                mesh.CombineMeshes(pair.Value.ToArray(), true, true, false);
                mesh.RecalculateBounds();
                GameObject go = new GameObject(pair.Key.ToString());
                go.transform.SetParent(terrain.transform, false);
                MeshFilter filter = go.AddComponent<MeshFilter>();
                filter.sharedMesh = mesh;
                MeshRenderer renderer = go.AddComponent<MeshRenderer>();
                renderer.sharedMaterial = materials[pair.Key];
                renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                renderer.receiveShadows = false;
            }
        }

        int Surface(int x, int y)
        {
            int h = map.Get(x, y);
            return h <= map.WaterLevel ? map.WaterLevel : h;
        }

        static void AppendBox(List<CombineInstance> list, Vector3 center, Vector3 size)
        {
            Mesh cube = CreateCubeMesh();
            var ci = new CombineInstance
            {
                mesh = cube,
                transform = Matrix4x4.TRS(center, Quaternion.identity, size)
            };
            list.Add(ci);
        }

        static Mesh unitCube;

        static Mesh CreateCubeMesh()
        {
            if (unitCube != null)
            {
                return unitCube;
            }

            GameObject temp = GameObject.CreatePrimitive(PrimitiveType.Cube);
            Mesh src = temp.GetComponent<MeshFilter>().sharedMesh;
            unitCube = new Mesh { name = "VoxelUnitCube" };
            unitCube.vertices = src.vertices;
            unitCube.triangles = src.triangles;
            unitCube.normals = src.normals;
            unitCube.uv = src.uv;
            Object.Destroy(temp);
            return unitCube;
        }

        void BuildStations()
        {
            StationCubeCount = 0;
            foreach (StationId id in PlaceholderVoxelLayout.StationIds)
            {
                CreateCube(
                    "Station_" + id.Value,
                    StationGround(id) + Vector3.up * (PlaceholderVoxelLayout.TileSize * 0.4f),
                    PlaceholderVoxelLayout.TileSize * 0.7f,
                    StationColor(id));
                StationCubeCount++;
            }
        }

        void BuildActor()
        {
            actor = CreateCube(
                "ActorToken",
                StationGround(StationId.Yeongdeungpo) + Vector3.up * (PlaceholderVoxelLayout.TileSize * 0.35f),
                PlaceholderVoxelLayout.TileSize * 0.45f,
                new Color(0.79f, 0.64f, 0.15f));
        }

        static Color StationColor(StationId id)
        {
            if (id.Equals(StationId.Yeongdeungpo))
            {
                return new Color(0.24f, 0.49f, 0.65f);
            }

            if (id.Equals(StationId.Sindorim))
            {
                return new Color(0.25f, 0.42f, 0.33f);
            }

            return new Color(0.55f, 0.29f, 0.23f);
        }

        Camera EnsureCamera()
        {
            if (viewCamera != null)
            {
                ApplyGenreCamera(viewCamera);
                return viewCamera;
            }

            viewCamera = Camera.main;
            if (viewCamera != null)
            {
                ApplyGenreCamera(viewCamera);
                return viewCamera;
            }

            GameObject cameraObject = new GameObject("PlaceholderVoxelCamera");
            viewCamera = cameraObject.AddComponent<Camera>();
            cameraObject.tag = "MainCamera";
            ApplyGenreCamera(viewCamera);
            return viewCamera;
        }

        void FrameCamera()
        {
            if (viewCamera == null)
            {
                return;
            }

            ApplyGenreCamera(viewCamera);
            float tile = PlaceholderVoxelLayout.TileSize;
            Vector3 center = new Vector3((map.Width - 1) * tile * 0.5f, 0f, (map.Height - 1) * tile * 0.5f);
            viewCamera.transform.position = center + viewCamera.transform.rotation * new Vector3(0f, 0f, -28f);
            viewCamera.orthographicSize = 11f;
        }

        static void ApplyGenreCamera(Camera camera)
        {
            // POC presentation camera (Intent 결정 10); replaced by the strategy-map module.
            const float pocPitchDegrees = 35.264f;
            const float pocYawDegrees = 45f;
            camera.orthographic = true;
            camera.transform.rotation = Quaternion.Euler(pocPitchDegrees, pocYawDegrees, 0f);
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.043f, 0.067f, 0.110f);
            camera.allowMSAA = false;
            camera.allowHDR = false;
            if (camera.targetTexture != null)
            {
                camera.targetTexture.filterMode = FilterMode.Point;
            }
        }

        Transform CreateCube(string name, Vector3 position, float size, Color color)
        {
            GameObject cube = GameObject.CreatePrimitive(PrimitiveType.Cube);
            cube.name = name;
            cube.transform.SetParent(transform, false);
            cube.transform.position = position;
            float safe = size > 0.01f ? size : 0.01f;
            cube.transform.localScale = Vector3.one * safe;
            Renderer renderer = cube.GetComponent<Renderer>();
            if (renderer != null)
            {
                Shader shader = Shader.Find("Janseon/UnlitVoxel")
                                ?? Shader.Find("Universal Render Pipeline/Unlit")
                                ?? Shader.Find("Unlit/Color");
                renderer.sharedMaterial = MakeMat(shader, color);
                renderer.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
                renderer.receiveShadows = false;
            }

            return cube.transform;
        }
    }
}
