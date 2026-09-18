using System.Collections.Generic;
using System.IO;
using System.Text;
using UnityEngine;

namespace Janseon.Foundation.Presentation
{
    /// <summary>
    /// Instanced 3D buildings for the Seoul strategy map (decision 10, adapted
    /// from the Seoul 3D Atlas white paper): hundreds of thousands of OSM
    /// footprint boxes rendered with Graphics.DrawMeshInstanced, following the
    /// terrain chunk streaming visibility. Binary contract per chunk file:
    /// 16-byte header (magic "SBLD", version, count) then count records of
    /// 7 float32 (cx, cz, baseY, w, d, rotRadians, h) in world units, so the
    /// file length must equal 16 + 28 * count.
    /// </summary>
    public sealed class StrategyMapBuildings : MonoBehaviour
    {
        private const int BatchSize = 1023;
        private const uint Magic = 0x444C4253; // "SBLD" little-endian
        private const uint FormatVersion = 1;

        private static readonly Vector3[] CubeCorners =
        {
            // x, y(base 0..1), z — 8 corners of a unit box centered in X/Z
            new(-0.5f, 0f, -0.5f), new(0.5f, 0f, -0.5f), new(0.5f, 0f, 0.5f), new(-0.5f, 0f, 0.5f),
            new(-0.5f, 1f, -0.5f), new(0.5f, 1f, -0.5f), new(0.5f, 1f, 0.5f), new(-0.5f, 1f, 0.5f),
        };

        // Six faces as corner indices (quad a,b,c,d -> triangles a,b,c a,c,d), clockwise from outside.
        private static readonly int[,] CubeFaces =
        {
            { 4, 5, 6, 7 }, // top
            { 0, 3, 2, 1 }, // bottom
            { 0, 1, 5, 4 }, // -z side
            { 2, 3, 7, 6 }, // +z side
            { 1, 2, 6, 5 }, // +x side
            { 3, 0, 4, 7 }, // -x side
        };

        private Mesh box;
        private Material material;
        private readonly List<List<Matrix4x4[]>> batchesPerChunk = new();
        private Transform terrainRoot;

        public int TotalInstances { get; private set; }

        public int ChunkCount => batchesPerChunk.Count;

        public int RenderedChunkCount { get; private set; }

        public int RenderedInstances { get; private set; }

        public static StrategyMapBuildings Build(
            Component host,
            IReadOnlyList<TextAsset> binaries,
            Transform terrainChunksRoot = null)
        {
            if (host == null) throw new System.ArgumentNullException(nameof(host));
            if (binaries == null) throw new System.ArgumentNullException(nameof(binaries));

            var go = new GameObject("strategy-map-buildings");
            go.transform.SetParent(host.transform, false);
            var renderer = go.AddComponent<StrategyMapBuildings>();
            renderer.terrainRoot = terrainChunksRoot;
            renderer.Load(binaries);
            return renderer;
        }

        public bool IsChunkActive(int chunkIndex)
        {
            if (terrainRoot == null || chunkIndex < 0 || chunkIndex >= terrainRoot.childCount) return false;
            return terrainRoot.GetChild(chunkIndex).gameObject.activeInHierarchy;
        }

        private void Load(IReadOnlyList<TextAsset> binaries)
        {
            box = BuildUnitCube();
            Shader shader = Shader.Find("Sprites/Default");
            material = new Material(shader) { enableInstancing = true, color = new Color(0.62f, 0.60f, 0.58f) };

            TotalInstances = 0;
            foreach (TextAsset asset in binaries)
            {
                byte[] data = asset.bytes;
                if (data.Length < 16) throw new System.IO.InvalidDataException($"{asset.name}: too short");
                using var reader = new BinaryReader(new MemoryStream(data), Encoding.ASCII);
                uint magic = reader.ReadUInt32();
                uint version = reader.ReadUInt32();
                uint count = reader.ReadUInt32();
                if (magic != Magic || version != FormatVersion)
                {
                    throw new System.IO.InvalidDataException($"bad building binary header: {asset.name}");
                }
                if (data.Length != 16 + 28 * count)
                {
                    throw new System.IO.InvalidDataException(
                        $"{asset.name}: length {data.Length} != {16 + 28 * count} (count {count})");
                }

                var matrices = new List<Matrix4x4>((int)count);
                for (int i = 0; i < count; i++)
                {
                    float cx = reader.ReadSingle();
                    float cz = reader.ReadSingle();
                    float baseY = reader.ReadSingle();
                    float w = reader.ReadSingle();
                    float d = reader.ReadSingle();
                    float rot = reader.ReadSingle();
                    float h = reader.ReadSingle();
                    matrices.Add(Matrix4x4.TRS(
                        new Vector3(cx, baseY, cz),
                        Quaternion.Euler(0f, -rot * Mathf.Rad2Deg, 0f),
                        new Vector3(Mathf.Max(w, 0.02f), Mathf.Max(h, 0.02f), Mathf.Max(d, 0.02f))));
                }

                TotalInstances += matrices.Count;
                var batches = new List<Matrix4x4[]>();
                for (int start = 0; start < matrices.Count; start += BatchSize)
                {
                    int take = Mathf.Min(BatchSize, matrices.Count - start);
                    var batch = new Matrix4x4[take];
                    for (int i = 0; i < take; i++) batch[i] = matrices[start + i];
                    batches.Add(batch);
                }
                batchesPerChunk.Add(batches);
            }
        }

        private void LateUpdate()
        {
            if (material == null || box == null) return;
            RenderedChunkCount = 0;
            RenderedInstances = 0;
            for (int chunk = 0; chunk < batchesPerChunk.Count; chunk++)
            {
                if (!IsChunkActive(chunk)) continue;
                foreach (Matrix4x4[] batch in batchesPerChunk[chunk])
                {
                    Graphics.DrawMeshInstanced(box, 0, material, batch);
                    RenderedInstances += batch.Length;
                }
                RenderedChunkCount++;
            }
        }

        private static Mesh BuildUnitCube()
        {
            var mesh = new Mesh { name = "strategy-map-building-box" };
            var vertices = new List<Vector3>(24);
            var triangles = new List<int>(36);
            for (int f = 0; f < CubeFaces.GetLength(0); f++)
            {
                int a = CubeFaces[f, 0], b = CubeFaces[f, 1], c = CubeFaces[f, 2], d = CubeFaces[f, 3];
                int baseIndex = vertices.Count;
                vertices.Add(CubeCorners[a]);
                vertices.Add(CubeCorners[b]);
                vertices.Add(CubeCorners[c]);
                vertices.Add(CubeCorners[d]);
                triangles.Add(baseIndex);
                triangles.Add(baseIndex + 1);
                triangles.Add(baseIndex + 2);
                triangles.Add(baseIndex);
                triangles.Add(baseIndex + 2);
                triangles.Add(baseIndex + 3);
            }
            mesh.SetVertices(vertices);
            mesh.SetTriangles(triangles, 0);
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            return mesh;
        }
    }
}
