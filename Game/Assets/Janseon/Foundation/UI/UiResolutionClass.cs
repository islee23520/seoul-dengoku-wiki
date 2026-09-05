using UnityEngine;
using UnityEngine.UIElements;

namespace Janseon.Foundation.UI
{
    /// <summary>
    /// Dual-resolution class helper. Applies exactly one of jk-res-720 / jk-res-1080
    /// to the named UXML screen root (never a parent container). Deterministic on bind/geometry.
    /// </summary>
    public static class UiResolutionClass
    {
        /// <summary>Widths at or above this use 1080 tokens (covers 1920 and intermediate).</summary>
        public const int WidthThreshold1080 = 1600;

        public static bool Is1080(int width) => width >= WidthThreshold1080;

        public static bool Is1080(Vector2Int referenceResolution)
            => Is1080(referenceResolution.x);

        public static VisualElement FindScreenRoot(VisualElement treeOrRoot, string screenRootName)
        {
            if (treeOrRoot == null || string.IsNullOrEmpty(screenRootName))
            {
                return null;
            }

            if (treeOrRoot.name == screenRootName)
            {
                return treeOrRoot;
            }

            return treeOrRoot.Q(screenRootName);
        }

        /// <summary>
        /// Sets exactly one resolution class on the named screen root. Removes the opposing class.
        /// No-op when the named root is missing.
        /// </summary>
        public static VisualElement Apply(VisualElement treeOrRoot, string screenRootName, int width)
        {
            VisualElement screenRoot = FindScreenRoot(treeOrRoot, screenRootName);
            if (screenRoot == null)
            {
                return null;
            }

            bool hi = Is1080(width);
            screenRoot.EnableInClassList(UiElementNames.Res720Class, !hi);
            screenRoot.EnableInClassList(UiElementNames.Res1080Class, hi);
            return screenRoot;
        }

        public static VisualElement Apply(
            VisualElement treeOrRoot,
            string screenRootName,
            Vector2Int referenceResolution)
            => Apply(treeOrRoot, screenRootName, referenceResolution.x);

        public static VisualElement ApplyFromPanel(
            VisualElement treeOrRoot,
            string screenRootName,
            PanelSettings panel)
        {
            int width = panel != null ? panel.referenceResolution.x : 1280;
            return Apply(treeOrRoot, screenRootName, width);
        }

        /// <summary>
        /// True when the named root carries exactly one of the two resolution classes.
        /// </summary>
        public static bool HasExclusiveResolutionClass(VisualElement treeOrRoot, string screenRootName)
        {
            VisualElement screenRoot = FindScreenRoot(treeOrRoot, screenRootName);
            if (screenRoot == null)
            {
                return false;
            }

            bool c720 = screenRoot.ClassListContains(UiElementNames.Res720Class);
            bool c1080 = screenRoot.ClassListContains(UiElementNames.Res1080Class);
            return c720 != c1080;
        }
    }
}
