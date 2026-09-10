using System;
using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using Janseon.Foundation.UI;
using UnityEngine;

namespace Janseon.Foundation.Battle
{
    /// <summary>Read-only Core projection. All positions, including gizmos, use the same 1.5m grid.</summary>
    public sealed class FoundationBattleView : MonoBehaviour
    {
        public static readonly Color Cyan = new Color32(0x86, 0xbe, 0xd0, 0xff);
        public static readonly Color HoverGold = new Color32(0xff, 0xe4, 0x9b, 0xff);
        public static readonly Color IllegalRed = new Color32(0xcf, 0x62, 0x58, 0xff);
        readonly Dictionary<UnitId, Transform> units = new Dictionary<UnitId, Transform>();
        readonly List<UnityEngine.Object> owned = new List<UnityEngine.Object>();
        readonly Transform[] arrows = new Transform[4];
        readonly bool[] legalDirections = new bool[4];
        BattleSimState battle;
        OwnerCardTargetingMachine targeting;
        Material allyMaterial, enemyMaterial, goldMaterial, groundMaterial;
        Transform selectionRing, targetRing, hoverRing;
        UnitId? hoveredUnit;
        int hoveredDirection = -1;

        public IReadOnlyDictionary<UnitId, Transform> Units => units;
        public Transform SelectionRing => selectionRing;
        public Transform TargetRing => targetRing;
        public IReadOnlyList<Transform> Arrows => arrows;
        public Camera ViewCamera { get; private set; }
        public int VisibleArrowCount
        {
            get { int count = 0; foreach (var arrow in arrows) if (arrow.gameObject.activeSelf) count++; return count; }
        }

        public static FoundationBattleView Create(Transform parent, BattleSimState state, OwnerCardTargetingMachine machine)
        {
            var root = new GameObject("FoundationBattleView");
            root.transform.SetParent(parent, false);
            // Isolate the tactical stage from the campaign's heightmap without changing its camera or layers.
            root.transform.localPosition = new Vector3(1000f, 0f, 1000f);
            var view = root.AddComponent<FoundationBattleView>();
            view.battle = state ?? throw new ArgumentNullException(nameof(state));
            view.targeting = machine ?? throw new ArgumentNullException(nameof(machine));
            view.Build();
            view.Refresh();
            return view;
        }

        public Vector3 CellWorld(GridCoord cell) => transform.TransformPoint(
            new Vector3(cell.X * GenreContract.TileUnityUnits, 0f, cell.Y * GenreContract.TileUnityUnits));

        void Build()
        {
            allyMaterial = Material(Cyan);
            enemyMaterial = Material(IllegalRed);
            goldMaterial = Material(HoverGold);
            groundMaterial = Material(new Color32(0x25, 0x35, 0x40, 0xff));
            var ground = Box(transform, "Arena", groundMaterial,
                new Vector3((battle.Arena.Width - 1) * 0.75f, -0.16f, (battle.Arena.Height - 1) * 0.75f),
                new Vector3(battle.Arena.Width * 1.5f, 0.3f, battle.Arena.Height * 1.5f));
            // World-space seams describe the full Core arena, not a HUD occupancy field.
            var seam = Material(new Color32(0x34, 0x49, 0x54, 0xff));
            for (int x = 0; x <= battle.Arena.Width; x++)
                Box(transform, "GridX", seam, new Vector3(x * 1.5f - 0.75f, 0.002f, ground.localPosition.z),
                    new Vector3(0.018f, 0.01f, battle.Arena.Height * 1.5f));
            for (int y = 0; y <= battle.Arena.Height; y++)
                Box(transform, "GridY", seam, new Vector3(ground.localPosition.x, 0.002f, y * 1.5f - 0.75f),
                    new Vector3(battle.Arena.Width * 1.5f, 0.01f, 0.018f));
            selectionRing = Ring("SelectionRing", 0.57f, allyMaterial);
            targetRing = Ring("TargetRing", 0.69f, allyMaterial);
            hoverRing = Ring("HoverRing", 0.62f, goldMaterial);
            for (int i = 0; i < arrows.Length; i++)
            {
                arrows[i] = Graphic("Direction_" + (CardinalDirection)i, new[]
                {
                    new Vector3(-0.12f, 0, -0.25f), new Vector3(0.12f, 0, -0.25f),
                    new Vector3(0.12f, 0, 0.02f), new Vector3(0.29f, 0, 0.02f),
                    new Vector3(0, 0, 0.36f), new Vector3(-0.29f, 0, 0.02f), new Vector3(-0.12f, 0, 0.02f),
                }, new[] { 0, 2, 1, 0, 6, 2, 6, 4, 2, 2, 4, 3, 6, 5, 4 }, allyMaterial);
                Vector3 direction = Direction((CardinalDirection)i);
                arrows[i].localRotation = Quaternion.LookRotation(direction);
            }
            var cameraObject = new GameObject("BattleCamera");
            cameraObject.transform.SetParent(transform, false);
            ViewCamera = cameraObject.AddComponent<Camera>();
            ViewCamera.enabled = false;
            ViewCamera.orthographic = true;
            ViewCamera.clearFlags = CameraClearFlags.SolidColor;
            ViewCamera.backgroundColor = new Color32(0x0b, 0x14, 0x21, 0xff);
            ViewCamera.nearClipPlane = 0.1f;
            ViewCamera.farClipPlane = 100f;
            ViewCamera.allowHDR = false;
            ViewCamera.allowMSAA = false;
            ViewCamera.transform.rotation = Quaternion.Euler(GenreContract.CameraPitchDegrees, GenreContract.CameraYawDegrees, 0);
            ViewCamera.transform.position = CellWorld(new GridCoord(0, 0))
                + new Vector3((battle.Arena.Width - 1) * 0.75f, 0.3f, (battle.Arena.Height - 1) * 0.75f)
                - ViewCamera.transform.forward * 35f;
            FrameCamera(16f / 9f);
        }

        public void FrameCamera(float aspect)
        {
            float width = battle.Arena.Width * GenreContract.TileUnityUnits;
            float depth = battle.Arena.Height * GenreContract.TileUnityUnits;
            ViewCamera.aspect = aspect;
            ViewCamera.orthographicSize = Mathf.Max((width + depth) * 0.205f + 1f,
                (width + depth) * 0.354f / aspect + 1f);
        }

        public void Refresh()
        {
            foreach (UnitState unit in battle.Units)
            {
                if (!units.TryGetValue(unit.Id, out Transform token))
                {
                    token = new GameObject("Unit_" + unit.Id.Value).transform;
                    token.SetParent(transform, false);
                    var material = unit.Side == 0 ? allyMaterial : enemyMaterial;
                    Box(token, "Body", material, new Vector3(0, 0.48f, 0), new Vector3(0.48f, 0.66f, 0.34f));
                    Box(token, "Head", goldMaterial, new Vector3(0, 1f, 0), Vector3.one * 0.4f);
                    Box(token, "Facing", material, new Vector3(0, 0.72f, 0.28f), new Vector3(0.16f, 0.15f, 0.3f));
                    units.Add(unit.Id, token);
                }
                token.position = CellWorld(unit.Cell);
                token.rotation = Quaternion.LookRotation(Direction(unit.Facing));
                token.gameObject.SetActive(unit.Hp > 0 && unit.State != "Down");
            }
            var currentIds = new HashSet<UnitId>();
            foreach (var unit in battle.Units) currentIds.Add(unit.Id);
            var removed = new List<UnitId>();
            foreach (var pair in units) if (!currentIds.Contains(pair.Key)) removed.Add(pair.Key);
            foreach (var id in removed) { Release(units[id].gameObject); units.Remove(id); }
            Anchor(selectionRing, targeting.SelectedOwner);
            Anchor(targetRing, targeting.SelectedTarget);
            targetRing.GetComponent<Renderer>().sharedMaterial = targeting.LastRejection == null ? allyMaterial : enemyMaterial;
            bool choosing = targeting.Stage == CardTargetingStage.ChoosingDirection && targeting.CardId == "mobility-regroup";
            for (int i = 0; i < arrows.Length; i++)
            {
                arrows[i].gameObject.SetActive(choosing && targetRing.gameObject.activeSelf);
                if (!arrows[i].gameObject.activeSelf) continue;
                arrows[i].position = targetRing.position + Direction((CardinalDirection)i) * 1.03f;
                legalDirections[i] = BattleSim.PreviewCard(battle, new BattleTickCommand
                {
                    At = new Tick(battle.Tick), Kind = BattleTickCommandKind.PlayCard, CardId = targeting.CardId,
                    OwnerUnitId = targeting.SelectedOwner, TargetUnitId = targeting.SelectedTarget, Facing = (CardinalDirection)i,
                }) == null;
                arrows[i].GetComponent<Renderer>().sharedMaterial = !legalDirections[i] ? enemyMaterial
                    : hoveredDirection == i ? goldMaterial : allyMaterial;
            }
            hoverRing.gameObject.SetActive(hoveredUnit.HasValue && Anchor(hoverRing, hoveredUnit.GetValueOrDefault()));
            if (hoveredUnit.HasValue)
            {
                var unit = Array.Find(battle.Units, u => u.Id.Equals(hoveredUnit.Value));
                bool legal = unit != null && unit.Side == 0 && unit.Hp > 0 && unit.State != "Down";
                if (legal && targeting.Stage == CardTargetingStage.ChoosingAlly)
                {
                    var rejection = BattleSim.PreviewCard(battle, new BattleTickCommand
                    {
                        At = new Tick(battle.Tick), Kind = BattleTickCommandKind.PlayCard, CardId = targeting.CardId,
                        OwnerUnitId = targeting.SelectedOwner, TargetUnitId = unit.Id,
                    });
                    legal = rejection == null || (targeting.RequiresDirection && rejection is BattleRejection r
                        && (r.Reason == BattleRejectReason.CardDestinationBlocked || r.Reason == BattleRejectReason.CardDestinationOutOfBounds));
                }
                hoverRing.GetComponent<Renderer>().sharedMaterial = legal ? goldMaterial : enemyMaterial;
            }
        }

        public bool SelectUnit(UnitId id)
        {
            bool accepted = targeting.Stage == CardTargetingStage.Idle ? targeting.SelectOwner(id)
                : targeting.Stage == CardTargetingStage.Confirm && targeting.SelectedTarget.Equals(id)
                    ? targeting.Confirm() : targeting.SelectTarget(id);
            Refresh();
            return accepted;
        }

        public bool SelectDirection(CardinalDirection direction)
        {
            if (targeting.Stage != CardTargetingStage.ChoosingDirection) return false;
            bool accepted = targeting.PreviewDirection(direction);
            Refresh();
            return accepted;
        }

        public void Point(Ray ray, bool click)
        {
            hoveredUnit = null;
            hoveredDirection = -1;
            if (new Plane(Vector3.up, transform.position).Raycast(ray, out float distance))
            {
                var point = ray.GetPoint(distance);
                for (int i = 0; i < arrows.Length; i++)
                    if (arrows[i].gameObject.activeSelf && Vector3.Distance(point, arrows[i].position) < 0.42f)
                    { hoveredDirection = i; break; }
                if (hoveredDirection < 0)
                    foreach (var pair in units)
                        if (pair.Value.gameObject.activeSelf && Vector3.Distance(point, pair.Value.position) < 0.72f)
                        { hoveredUnit = pair.Key; break; }
            }
            if (click && hoveredDirection >= 0) SelectDirection((CardinalDirection)hoveredDirection);
            else if (click && hoveredUnit.HasValue) SelectUnit(hoveredUnit.Value);
            Refresh();
        }

        public void ClearHover() { hoveredUnit = null; hoveredDirection = -1; Refresh(); }

        bool Anchor(Transform ring, UnitId id)
        {
            Transform unit = null;
            bool visible = !string.IsNullOrEmpty(id.Value) && units.TryGetValue(id, out unit) && unit.gameObject.activeSelf;
            ring.gameObject.SetActive(visible);
            if (visible) ring.position = unit.position + Vector3.up * 0.035f;
            return visible;
        }

        static Vector3 Direction(CardinalDirection direction)
        {
            GridCoord step = new GridCoord(0, 0).Step(direction);
            return new Vector3(step.X, 0, step.Y);
        }

        Material Material(Color color)
        {
            var material = new Material(Shader.Find("Janseon/UnlitVoxel")) { color = color };
            owned.Add(material);
            return material;
        }

        Transform Box(Transform parent, string name, Material material, Vector3 position, Vector3 scale)
        {
            var box = GameObject.CreatePrimitive(PrimitiveType.Cube);
            box.name = name;
            box.transform.SetParent(parent, false);
            box.transform.localPosition = position;
            box.transform.localScale = scale;
            box.GetComponent<Renderer>().sharedMaterial = material;
            box.GetComponent<Collider>().enabled = false;
            Release(box.GetComponent<Collider>());
            return box.transform;
        }

        Transform Ring(string name, float radius, Material material)
        {
            const int segments = 48;
            var vertices = new Vector3[segments * 2];
            var triangles = new int[segments * 6];
            for (int i = 0; i < segments; i++)
            {
                float angle = i * Mathf.PI * 2 / segments;
                Vector3 radial = new Vector3(Mathf.Cos(angle), 0, Mathf.Sin(angle));
                vertices[i * 2] = radial * radius;
                vertices[i * 2 + 1] = radial * (radius - 0.055f);
                int next = (i + 1) % segments * 2;
                int offset = i * 6;
                triangles[offset] = i * 2; triangles[offset + 1] = i * 2 + 1; triangles[offset + 2] = next;
                triangles[offset + 3] = next; triangles[offset + 4] = i * 2 + 1; triangles[offset + 5] = next + 1;
            }
            return Graphic(name, vertices, triangles, material);
        }

        Transform Graphic(string name, Vector3[] vertices, int[] triangles, Material material)
        {
            var mesh = new Mesh { name = name, vertices = vertices, triangles = triangles };
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();
            owned.Add(mesh);
            var graphic = new GameObject(name, typeof(MeshFilter), typeof(MeshRenderer));
            graphic.transform.SetParent(transform, false);
            graphic.GetComponent<MeshFilter>().sharedMesh = mesh;
            graphic.GetComponent<MeshRenderer>().sharedMaterial = material;
            return graphic.transform;
        }

        static void Release(UnityEngine.Object value)
        {
            if (Application.isPlaying) Destroy(value); else DestroyImmediate(value);
        }

        void OnDestroy() { foreach (var resource in owned) Release(resource); }
    }
}
