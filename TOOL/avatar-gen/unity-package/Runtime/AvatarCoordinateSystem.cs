using UnityEngine;

namespace AvatarGen
{
    public static class AvatarCoordinateSystem
    {
        public static Vector3 BlenderToGltf(Vector3 point) => new Vector3(point.x, point.z, -point.y);
        public static Vector3 BlenderToUnity(Vector3 point) => new Vector3(point.x, point.z, point.y);
        public static Vector3 GltfToUnity(Vector3 point) => new Vector3(point.x, point.y, -point.z);
    }
}
