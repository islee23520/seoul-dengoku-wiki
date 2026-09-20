using System;
using System.Collections.Generic;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;
using UnityEngine;

namespace Janseon.Foundation.Battle
{
    /// <summary>Projects the latest battle simulation frame onto authored combatant prefabs.</summary>
    public sealed class FoundationBattleView : MonoBehaviour
    {
        const float MillimetersToMeters = 0.001f;
        const float MilliDegreesToDegrees = 0.001f;

        readonly Dictionary<UnitId, TemporaryBattleCombatantVisual> visualsByUnitId =
            new Dictionary<UnitId, TemporaryBattleCombatantVisual>();

        BattleSimState state;
        TemporaryBattleVisualCatalog catalog;
        Func<UnitState, TemporaryCombatantKind> kindResolver;
        UnitId selectedUnitId;
        bool hasSelection;

        public BattleSimState State => state;
        public TemporaryBattleVisualCatalog Catalog => catalog;
        public IReadOnlyDictionary<UnitId, TemporaryBattleCombatantVisual> Units => visualsByUnitId;

        public static FoundationBattleView Create(
            Transform parent,
            BattleSimState state,
            TemporaryBattleVisualCatalog catalog,
            Func<UnitState, TemporaryCombatantKind> kindResolver)
        {
            if (state == null)
            {
                throw new ArgumentNullException(nameof(state));
            }

            if (catalog == null)
            {
                throw new ArgumentNullException(nameof(catalog));
            }

            if (kindResolver == null)
            {
                throw new ArgumentNullException(nameof(kindResolver));
            }

            var viewObject = new GameObject(nameof(FoundationBattleView));
            viewObject.transform.SetParent(parent, false);

            var view = viewObject.AddComponent<FoundationBattleView>();
            view.state = state;
            view.catalog = catalog;
            view.kindResolver = kindResolver;
            view.Refresh();
            return view;
        }

        /// <summary>Synchronizes authored combatant visuals with the latest published simulation state.</summary>
        public void Refresh()
        {
            UnitState[] currentUnits = state.Frame == null ? state.Units : state.Frame.Units;
            currentUnits = currentUnits ?? Array.Empty<UnitState>();

            var currentUnitIds = new HashSet<UnitId>();
            foreach (UnitState unit in currentUnits)
            {
                if (unit == null)
                {
                    continue;
                }

                currentUnitIds.Add(unit.Id);
                if (!visualsByUnitId.TryGetValue(unit.Id, out TemporaryBattleCombatantVisual visual))
                {
                    visual = CreateVisual(unit);
                    visualsByUnitId.Add(unit.Id, visual);
                }

                ApplyUnitState(visual, unit);
            }

            RemoveMissingVisuals(currentUnitIds);
            ApplySelection();
        }

        /// <summary>Selects one combatant visual by its simulation unit identifier.</summary>
        public bool Select(UnitId unitId)
        {
            if (!visualsByUnitId.ContainsKey(unitId))
            {
                return false;
            }

            selectedUnitId = unitId;
            hasSelection = true;
            ApplySelection();
            return true;
        }

        public void ClearSelection()
        {
            hasSelection = false;
            ApplySelection();
        }

        TemporaryBattleCombatantVisual CreateVisual(UnitState unit)
        {
            TemporaryCombatantKind kind = kindResolver(unit);
            TemporaryBattleVisualEntry entry = FindCatalogEntry(kind);
            GameObject instance = Instantiate(entry.Prefab, transform);
            instance.name = "Unit_" + unit.Id.Value;

            TemporaryBattleCombatantVisual visual = instance.GetComponent<TemporaryBattleCombatantVisual>();
            if (visual != null)
            {
                return visual;
            }

            Release(instance);
            throw new InvalidOperationException(
                "Temporary combatant prefab for " + kind
                + " requires a TemporaryBattleCombatantVisual component.");
        }

        TemporaryBattleVisualEntry FindCatalogEntry(TemporaryCombatantKind kind)
        {
            foreach (TemporaryBattleVisualEntry entry in catalog.Entries)
            {
                if (entry != null && entry.Kind == kind && entry.Prefab != null)
                {
                    return entry;
                }
            }

            throw new InvalidOperationException("Temporary combatant prefab is not serialized for " + kind + ".");
        }

        static void ApplyUnitState(TemporaryBattleCombatantVisual visual, UnitState unit)
        {
            Transform visualTransform = visual.transform;
            visualTransform.localPosition = new Vector3(
                unit.Position.X * MillimetersToMeters,
                unit.Position.Y * MillimetersToMeters,
                unit.Position.Z * MillimetersToMeters);
            visualTransform.localRotation = Quaternion.Euler(
                0f,
                unit.Facing.YawMilliDegrees * MilliDegreesToDegrees,
                0f);
            visual.SetPose(ResolvePose(unit));
        }

        void RemoveMissingVisuals(HashSet<UnitId> currentUnitIds)
        {
            var removedUnitIds = new List<UnitId>();
            foreach (KeyValuePair<UnitId, TemporaryBattleCombatantVisual> pair in visualsByUnitId)
            {
                if (!currentUnitIds.Contains(pair.Key))
                {
                    removedUnitIds.Add(pair.Key);
                }
            }

            foreach (UnitId unitId in removedUnitIds)
            {
                Release(visualsByUnitId[unitId].gameObject);
                visualsByUnitId.Remove(unitId);
            }
        }

        void ApplySelection()
        {
            foreach (KeyValuePair<UnitId, TemporaryBattleCombatantVisual> pair in visualsByUnitId)
            {
                pair.Value.SetSelected(hasSelection && pair.Key.Equals(selectedUnitId));
            }
        }

        static TemporaryCombatantPose ResolvePose(UnitState unit)
        {
            switch (unit.Status)
            {
                case BattleUnitStatus.Active:
                    return unit.OrderKind == BattleOrderKind.Move
                        ? TemporaryCombatantPose.Moving
                        : TemporaryCombatantPose.Idle;
                case BattleUnitStatus.Hit:
                    return TemporaryCombatantPose.Hit;
                case BattleUnitStatus.Down:
                case BattleUnitStatus.Dead:
                    return TemporaryCombatantPose.Dead;
                case BattleUnitStatus.Routing:
                    return TemporaryCombatantPose.Moving;
                default:
                    throw new ArgumentOutOfRangeException(nameof(unit.Status), unit.Status, "Unsupported battle unit status.");
            }
        }

        static void Release(UnityEngine.Object value)
        {
            if (Application.isPlaying)
            {
                Destroy(value);
            }
            else
            {
                DestroyImmediate(value);
            }
        }
    }
}
