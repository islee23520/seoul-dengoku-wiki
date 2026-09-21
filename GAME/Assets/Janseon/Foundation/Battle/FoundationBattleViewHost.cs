using System;
using System.Collections.Generic;
using Janseon.Core.Battle.Sim;
using Janseon.Data.Authoring;
using Janseon.Foundation.UI;
using UnityEngine;

namespace Janseon.Foundation.Battle
{
    /// <summary>Connects the current battle state to its continuous world-space view.</summary>
    public sealed class FoundationBattleViewHost : MonoBehaviour
    {
        [Serializable]
        sealed class RoleVisualMapping
        {
            [SerializeField] string visualKindId;
            [SerializeField] TemporaryCombatantKind kind;

            public string VisualKindId => visualKindId;
            public TemporaryCombatantKind Kind => kind;

            public bool Matches(UnitState unit)
            {
                return !string.IsNullOrWhiteSpace(visualKindId) && string.Equals(unit.VisualKindId, visualKindId.Trim(), StringComparison.Ordinal);
            }
        }

        [SerializeField] TemporaryBattleVisualCatalog visualCatalog;
        [SerializeField] RoleVisualMapping[] roleVisualMappings = Array.Empty<RoleVisualMapping>();

        GameplayUiHost host;
        PocCoreLoopController controller;
        BattleSimState displayedState;

        public FoundationBattleView View { get; private set; }
        public event Action Presented;

        async void Start()
        {
            host = GetComponent<GameplayUiHost>();
            try
            {
                await host.CoreLoopReady;
                if (this == null)
                {
                    return;
                }

                controller = (PocCoreLoopController)host.CoreLoop;
                controller.StateChanged += Synchronize;
                Synchronize();
            }
            catch (Exception exception)
            {
                Debug.LogException(exception, this);
            }
        }

        public void Synchronize()
        {
            if (controller == null)
            {
                return;
            }

            BattleSimState currentState = controller.Battle;
            if (!ReferenceEquals(displayedState, currentState))
            {
                ReleaseView();
                displayedState = currentState;
                if (displayedState != null)
                {
                    View = FoundationBattleView.Create(
                        transform,
                        displayedState,
                        visualCatalog,
                        ResolveCombatantKind);
                }
            }
            else if (View != null)
            {
                View.Refresh();
            }

            Presented?.Invoke();
        }

        TemporaryCombatantKind ResolveCombatantKind(UnitState unit)
        {
            HashSet<string> visualKindIds = new HashSet<string>(StringComparer.Ordinal);
            for (int index = 0; index < roleVisualMappings.Length; index++)
            {
                RoleVisualMapping mapping = roleVisualMappings[index];
                if (mapping == null)
                {
                    throw new InvalidOperationException(
                        "Battle visual kind mapping at index " + index + " is null.");
                }

                string visualKindId = mapping.VisualKindId;
                if (string.IsNullOrWhiteSpace(visualKindId))
                {
                    throw new InvalidOperationException(
                        "Battle visual kind mapping at index " + index + " has no visual kind ID.");
                }

                if (!visualKindIds.Add(visualKindId.Trim()))
                {
                    throw new InvalidOperationException(
                        "Duplicate battle visual kind mapping for visual kind ID " + visualKindId.Trim() + ".");
                }
            }

            foreach (RoleVisualMapping mapping in roleVisualMappings)
            {
                if (mapping.Matches(unit))
                {
                    return mapping.Kind;
                }
            }

            throw new InvalidOperationException(
                "No authored visual kind mapping matches battle unit " + unit.Id.Value + ".");
        }

        void ReleaseView()
        {
            if (View == null)
            {
                return;
            }

            View.gameObject.SetActive(false);
            Destroy(View.gameObject);
            View = null;
        }

        void OnDestroy()
        {
            if (controller != null)
            {
                controller.StateChanged -= Synchronize;
            }

            ReleaseView();
        }
    }
}
