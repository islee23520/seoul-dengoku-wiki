using Janseon.Foundation.Composition;
using UnityEngine;
using UnityEngine.UI;

namespace Janseon.Foundation.UI
{
    /// <summary>
    /// Visible uGUI HUD bound to the same presenter events as the UITK document.
    /// </summary>
    public sealed class UguiHudView
    {
        Transform root;
        GameplayPresenter presenter;

        public bool Bind(Transform hudRoot, GameplayPresenter owner)
        {
            Unwire();
            root = hudRoot;
            presenter = owner;
            if (root == null || presenter == null)
            {
                return false;
            }

            Wire(UiElementNames.ActionDepart, presenter.TriggerDepartForTest);
            Wire(UiElementNames.ActionFaceEncounter, presenter.TriggerFaceEncounterForTest);
            Wire(UiElementNames.ActionEnterResolution, presenter.TriggerEnterResolutionForTest);
            Wire(UiElementNames.ActionSettle, presenter.TriggerSettleForTest);
            Wire(UiElementNames.BattleAdvance, presenter.TriggerBattleAdvanceForTest);
            Wire(UiElementNames.ChoiceNegotiate, presenter.TriggerNegotiateForTest);
            Wire(UiElementNames.ChoiceBypass, presenter.TriggerBypassForTest);
            Wire(UiElementNames.ChoiceCombat, presenter.TriggerCombatForTest);
            Wire(UiElementNames.ReturnAction, presenter.TriggerReturnForTest);
            Wire(UiElementNames.StationYeongdeungpo, () => presenter.TriggerTravelForTest(Janseon.Core.StationId.Yeongdeungpo));
            Wire(UiElementNames.StationSindorim, () => presenter.TriggerTravelForTest(Janseon.Core.StationId.Sindorim));
            Wire(UiElementNames.StationGuro, () => presenter.TriggerTravelForTest(Janseon.Core.StationId.Guro));
            Wire("battle-move-n", presenter.TriggerBattleMoveNForTest);
            Wire("battle-move-e", presenter.TriggerBattleMoveEForTest);
            Wire("battle-move-s", presenter.TriggerBattleMoveSForTest);
            Wire("battle-move-w", presenter.TriggerBattleMoveWForTest);
            Wire("battle-melee", presenter.TriggerBattleMeleeForTest);
            Wire("battle-ranged", presenter.TriggerBattleRangedForTest);
            Wire(UiElementNames.BattleWait, presenter.TriggerBattleWaitForTest);
            Wire("battle-end-turn", presenter.TriggerBattleEndTurnForTest);
            return true;
        }

        public void Apply(GameplayUiSnapshot snapshot)
        {
            if (root == null || snapshot == null)
            {
                return;
            }

            SetActive(UiElementNames.EncounterChoices, snapshot.VisiblePanel == GameplayPanelId.Encounter);
            bool battle = snapshot.VisiblePanel == GameplayPanelId.Battle;
            SetActive(UiElementNames.RouteRail, !battle);
            SetActive(UiElementNames.BattleHud, battle);
            SetActive(
                UiElementNames.SettlementPanel,
                snapshot.VisiblePanel == GameplayPanelId.Settlement
                || snapshot.ShowSettleAction
                || snapshot.ShowReturnAction);
            SetActive(UiElementNames.ActionDepart, snapshot.ShowDepartAction);
            SetActive(UiElementNames.ActionFaceEncounter, snapshot.ShowFaceAction);
            SetActive(UiElementNames.ActionEnterResolution, snapshot.ShowEnterResolutionAction);
            SetActive(UiElementNames.ActionSettle, snapshot.ShowSettleAction);
            SetActive(UiElementNames.BattleAdvance, snapshot.ShowBattleAdvanceAction);
            SetActive(UiElementNames.ReturnAction, snapshot.ShowReturnAction);

            SetText("encounter-context", snapshot.EncounterContext);
            SetText("battle-forecast", snapshot.BattleForecast);
            SetText("why-tooltip", snapshot.WhyText);
            SetText(UiElementNames.SettlementOutcome, snapshot.SettlementOutcomeText);

            string[] fallback = { "탐험가", "의무병", "순찰대" };
            for (var i = 0; i < 3; i++)
            {
                SetText("party-slot-" + i + "-name", fallback[i]);
                if (i < snapshot.PartyHp.Count)
                {
                    SetText(
                        "party-slot-" + i + "-hp",
                        "HP " + snapshot.PartyHp[i] + "/" + snapshot.PartyMaxHp[i]);
                }
                else
                {
                    SetText("party-slot-" + i + "-hp", "HP");
                }
            }

            SetText("layer-chip", snapshot.CurrentStationElement == UiElementNames.StationSindorim ? "B2" : "B1");
        }

        public void ApplyWhy(string why)
        {
            SetText("why-tooltip", why);
        }

        public void Unwire()
        {
            root = null;
            presenter = null;
        }

        void Wire(string name, UnityEngine.Events.UnityAction action)
        {
            Button button = UguiHudBuilder.ButtonNamed(root, name);
            if (button == null)
            {
                return;
            }

            button.onClick.RemoveAllListeners();
            button.onClick.AddListener(action);
        }

        void SetActive(string name, bool active)
        {
            Transform found = UguiHudBuilder.Find(root, name);
            if (found != null)
            {
                found.gameObject.SetActive(active);
            }
        }

        void SetText(string name, string value)
        {
            Text label = UguiHudBuilder.TextNamed(root, name);
            if (label != null)
            {
                label.text = value ?? string.Empty;
            }
        }
    }
}
