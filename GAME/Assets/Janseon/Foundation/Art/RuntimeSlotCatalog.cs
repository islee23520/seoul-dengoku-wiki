using System;
using UnityEngine;

namespace Janseon.Foundation.Art
{
    public interface IRuntimeSlotCatalog
    {
        bool IsBound(string slot);
        T Get<T>(string slot, string key) where T : UnityEngine.Object;
    }

    [Serializable]
    public sealed class RuntimeSlotFile
    {
        public string key;
        public UnityEngine.Object asset;
    }

    [Serializable]
    public sealed class RuntimeSlotEntry
    {
        public string slot;
        public bool bound;
        public string sourceBindingHash;
        public RuntimeSlotFile[] files = Array.Empty<RuntimeSlotFile>();
    }

    public sealed class RuntimeSlotCatalog : ScriptableObject, IRuntimeSlotCatalog
    {
        [SerializeField] RuntimeSlotEntry[] entries = Array.Empty<RuntimeSlotEntry>();

        public void SetEntries(RuntimeSlotEntry[] value) => entries = value;
        public bool IsBound(string slot)
        {
            foreach (RuntimeSlotEntry entry in entries)
                if (entry.slot == slot) return entry.bound;
            return false;
        }

        public T Get<T>(string slot, string key) where T : UnityEngine.Object
        {
            foreach (RuntimeSlotEntry entry in entries)
            {
                if (entry.slot != slot || !entry.bound) continue;
                foreach (RuntimeSlotFile file in entry.files)
                    if (file.key == key) return file.asset as T;
            }
            return null;
        }
    }
}
