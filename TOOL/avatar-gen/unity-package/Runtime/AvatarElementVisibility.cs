using System;
using System.Collections.Generic;
using UnityEngine;

namespace AvatarGen
{
    public sealed class AvatarElementVisibility
    {
        private readonly Dictionary<string, Renderer[]> renderersById;

        public AvatarElementVisibility(GameObject avatarRoot, AvatarViewerContract contract)
        {
            if (avatarRoot == null) throw new ArgumentNullException(nameof(avatarRoot));
            if (contract == null) throw new ArgumentNullException(nameof(contract));
            var renderersByName = new Dictionary<string, List<Renderer>>(StringComparer.Ordinal);
            foreach (var renderer in avatarRoot.GetComponentsInChildren<Renderer>(true))
            {
                List<Renderer> renderers;
                if (!renderersByName.TryGetValue(renderer.gameObject.name, out renderers))
                {
                    renderers = new List<Renderer>();
                    renderersByName.Add(renderer.gameObject.name, renderers);
                }
                renderers.Add(renderer);
            }
            renderersById = new Dictionary<string, Renderer[]>(StringComparer.Ordinal);
            foreach (var element in contract.elements)
            {
                List<Renderer> renderers;
                if (!renderersByName.TryGetValue(element.objectName, out renderers) || renderers.Count == 0)
                    throw new InvalidOperationException("Avatar object is missing: " + element.objectName);
                renderersById.Add(element.id, renderers.ToArray());
                SetVisible(element.id, element.defaultVisible);
            }
        }

        public ICollection<string> ElementIds => renderersById.Keys;

        public bool SetVisible(string elementId, bool visible)
        {
            Renderer[] renderers;
            if (!renderersById.TryGetValue(elementId, out renderers)) return false;
            foreach (var renderer in renderers) renderer.enabled = visible;
            return true;
        }

        public bool IsVisible(string elementId)
        {
            Renderer[] renderers;
            return renderersById.TryGetValue(elementId, out renderers)
                && Array.TrueForAll(renderers, renderer => renderer.enabled);
        }
    }
}
