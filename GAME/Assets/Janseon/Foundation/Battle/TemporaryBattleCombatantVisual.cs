using UnityEngine;

namespace Janseon.Foundation.Battle
{
    public sealed class TemporaryBattleCombatantVisual : MonoBehaviour
    {
        [SerializeField] Transform visualRoot;
        [SerializeField] Renderer[] renderers = System.Array.Empty<Renderer>();
        [SerializeField] GameObject selectionMarker;
        [SerializeField] Color aliveColor = new Color(0.16f, 0.58f, 0.92f, 1f);
        [SerializeField] Color woundedColor = new Color(0.95f, 0.48f, 0.12f, 1f);
        [SerializeField] Color deadColor = new Color(0.2f, 0.22f, 0.25f, 1f);

        Vector3 basePosition;
        Quaternion baseRotation;
        Vector3 baseScale;
        MaterialPropertyBlock properties;

        public TemporaryCombatantPose Pose { get; private set; }
        public bool IsSelected => selectionMarker != null && selectionMarker.activeSelf;

        void Awake()
        {
            if (visualRoot == null) visualRoot = transform;
            basePosition = visualRoot.localPosition;
            baseRotation = visualRoot.localRotation;
            baseScale = visualRoot.localScale;
            properties = new MaterialPropertyBlock();
            SetPose(TemporaryCombatantPose.Idle);
            SetSelected(false);
        }

        public void SetSelected(bool selected)
        {
            if (selectionMarker != null) selectionMarker.SetActive(selected);
        }

        public void SetPose(TemporaryCombatantPose pose)
        {
            Pose = pose;
            if (visualRoot == null) return;
            visualRoot.localPosition = basePosition;
            visualRoot.localRotation = baseRotation;
            visualRoot.localScale = baseScale;
            Color color = aliveColor;
            switch (pose)
            {
                case TemporaryCombatantPose.Moving:
                    visualRoot.localRotation = baseRotation * Quaternion.Euler(8f, 0f, 0f);
                    break;
                case TemporaryCombatantPose.Attacking:
                    visualRoot.localPosition = basePosition + new Vector3(0f, 0f, 0.18f);
                    visualRoot.localRotation = baseRotation * Quaternion.Euler(-12f, 0f, 0f);
                    break;
                case TemporaryCombatantPose.Hit:
                    visualRoot.localRotation = baseRotation * Quaternion.Euler(0f, 0f, 14f);
                    color = woundedColor;
                    break;
                case TemporaryCombatantPose.Dead:
                    visualRoot.localPosition = basePosition + new Vector3(0f, -0.38f, 0f);
                    visualRoot.localRotation = baseRotation * Quaternion.Euler(0f, 0f, 88f);
                    visualRoot.localScale = Vector3.Scale(baseScale, new Vector3(1f, 0.7f, 1f));
                    color = deadColor;
                    break;
            }
            ApplyColor(color);
        }

        void ApplyColor(Color color)
        {
            if (properties == null) properties = new MaterialPropertyBlock();
            properties.SetColor("_BaseColor", color);
            properties.SetColor("_Color", color);
            foreach (Renderer target in renderers)
                if (target != null) target.SetPropertyBlock(properties);
        }

#if UNITY_EDITOR
        public void Configure(Transform root, Renderer[] targets, GameObject marker, Color alive, Color wounded, Color dead)
        {
            visualRoot = root;
            renderers = targets;
            selectionMarker = marker;
            aliveColor = alive;
            woundedColor = wounded;
            deadColor = dead;
        }
#endif
    }
}
