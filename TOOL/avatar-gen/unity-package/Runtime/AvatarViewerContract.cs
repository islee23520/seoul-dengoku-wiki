using System;
using UnityEngine;

namespace AvatarGen
{
    [Serializable]
    public sealed class AvatarElementContract
    {
        public string id = string.Empty;
        public string objectName = string.Empty;
        public string category = string.Empty;
        public bool defaultVisible = true;
        public int vertexCount;
    }

    [Serializable]
    public sealed class AvatarFormatContract
    {
        public string format = string.Empty;
        public string path = string.Empty;
        public string sha256 = string.Empty;
    }

    [Serializable]
    public sealed class AvatarViewerContract
    {
        public int schemaVersion;
        public string avatarId = string.Empty;
        public string displayName = string.Empty;
        public string productSurface = string.Empty;
        public bool portraitGeneration;
        public AvatarElementContract[] elements = Array.Empty<AvatarElementContract>();
        public AvatarFormatContract web = new AvatarFormatContract();
        public AvatarFormatContract unity = new AvatarFormatContract();

        public static AvatarViewerContract Parse(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
                throw new ArgumentException("Avatar contract JSON is empty.", nameof(json));
            var contract = JsonUtility.FromJson<AvatarViewerContract>(json);
            if (contract == null || contract.schemaVersion != 1 || contract.elements == null || contract.elements.Length == 0)
                throw new InvalidOperationException("Avatar contract is malformed or unsupported.");
            return contract;
        }
    }
}
