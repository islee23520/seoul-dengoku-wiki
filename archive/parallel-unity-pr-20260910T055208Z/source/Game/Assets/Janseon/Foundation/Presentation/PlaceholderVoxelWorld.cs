using Janseon.Core;
using UnityEngine;

namespace Janseon.Foundation.Presentation
{
    /// <summary>
    /// Runtime placeholder cubes for the POC loop. Primitive cubes only.
    /// </summary>
    public sealed class PlaceholderVoxelWorld : MonoBehaviour
    {
        Transform actor;
        Camera viewCamera;
        readonly System.Collections.Generic.Dictionary<Vector3Int, Transform> extras =
            new System.Collections.Generic.Dictionary<Vector3Int, Transform>();

        public int StationCubeCount { get; private set; }

        public static PlaceholderVoxelWorld Create(Transform parent, Camera camera)
        {
            GameObject root = new GameObject("PlaceholderVoxelWorld");
            if (parent != null)
            {
                root.transform.SetParent(parent, false);
            }

            PlaceholderVoxelWorld world = root.AddComponent<PlaceholderVoxelWorld>();
            world.viewCamera = camera != null ? camera : world.EnsureCamera();
            world.BuildStations();
            world.BuildActor();
            return world;
        }

        public void SyncActor(StationId station)
        {
            if (actor == null)
            {
                return;
            }

            actor.position = PlaceholderVoxelLayout.StationWorld(station) + Vector3.up * (PlaceholderVoxelLayout.TileSize * 0.75f);
        }

        void BuildStations()
        {
            StationCubeCount = 0;
            foreach (StationId id in PlaceholderVoxelLayout.StationIds)
            {
                CreateCube(
                    "Station_" + id.Value,
                    PlaceholderVoxelLayout.StationWorld(id),
                    PlaceholderVoxelLayout.TileSize,
                    StationColor(id));
                StationCubeCount++;
            }
        }

        void BuildActor()
        {
            actor = CreateCube(
                "ActorToken",
                PlaceholderVoxelLayout.StationWorld(StationId.Yeongdeungpo) + Vector3.up * (PlaceholderVoxelLayout.TileSize * 0.75f),
                PlaceholderVoxelLayout.TileSize * 0.6f,
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

        static void ApplyGenreCamera(Camera camera)
        {
            camera.orthographic = true;
            camera.transform.rotation = Quaternion.Euler(
                Janseon.Foundation.GenreContract.CameraPitchDegrees,
                Janseon.Foundation.GenreContract.CameraYawDegrees,
                0f);
            camera.transform.position = new Vector3(-6f, 8f, -6f);
            camera.orthographicSize = 8f;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.043f, 0.067f, 0.110f);
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
                Shader shader = Shader.Find("Universal Render Pipeline/Lit") ?? Shader.Find("Sprites/Default") ?? Shader.Find("Standard");
                if (shader != null)
                {
                    renderer.sharedMaterial = new Material(shader) { color = color };
                }
            }

            return cube.transform;
        }

        void Update()
        {
            if (!Input.GetMouseButtonDown(0) || viewCamera == null)
            {
                return;
            }

            Ray ray = viewCamera.ScreenPointToRay(Input.mousePosition);
            if (!Physics.Raycast(ray, out RaycastHit hit, 200f))
            {
                return;
            }

            Vector3Int cell = PlaceholderVoxelLayout.WorldToGrid(hit.point + hit.normal * 0.1f);
            if (extras.TryGetValue(cell, out Transform existing) && existing != null)
            {
                Destroy(existing.gameObject);
                extras.Remove(cell);
                return;
            }

            Transform placed = CreateCube(
                "Voxel_" + cell.x + "_" + cell.y + "_" + cell.z,
                PlaceholderVoxelLayout.GridToWorld(cell.x, cell.y, cell.z),
                PlaceholderVoxelLayout.TileSize,
                new Color(0.42f, 0.48f, 0.55f));
            extras[cell] = placed;
        }
    }
}
