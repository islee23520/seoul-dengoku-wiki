using Janseon.Foundation.Composition;
using UnityEngine;
using UnityEngine.UI;

namespace Janseon.Foundation.UI
{
    public sealed class UguiHudView
    {
        Transform root;
        GameplayPresenter presenter;

        public bool Bind(Transform hudRoot, GameplayPresenter owner)
        {
            Unwire();
            root = hudRoot;
            presenter = owner;
            if (root == null || presenter == null) return false;
            Wire(UiElementNames.ActionDepart, presenter.TriggerDepartForTest);
            Wire(UiElementNames.ActionFaceEncounter, presenter.TriggerFaceEncounterForTest);
            Wire(UiElementNames.ActionEnterResolution, presenter.TriggerEnterResolutionForTest);
            Wire(UiElementNames.ActionSettle, presenter.TriggerSettleForTest);
            Wire(UiElementNames.BattlePlayPause, presenter.TriggerBattlePlayPauseForTest);
            Wire(UiElementNames.BattleReset, presenter.TriggerBattleResetForTest);
            Wire(UiElementNames.ChoiceNegotiate, presenter.TriggerNegotiateForTest);
            Wire(UiElementNames.ChoiceBypass, presenter.TriggerBypassForTest);
            Wire(UiElementNames.ChoiceCombat, presenter.TriggerCombatForTest);
            Wire(UiElementNames.ReturnAction, presenter.TriggerReturnForTest);
            Wire(UiElementNames.StationYeongdeungpo, () => presenter.TriggerTravelForTest(Janseon.Core.StationId.Yeongdeungpo));
            Wire(UiElementNames.StationSindorim, () => presenter.TriggerTravelForTest(Janseon.Core.StationId.Sindorim));
            Wire(UiElementNames.StationGuro, () => presenter.TriggerTravelForTest(Janseon.Core.StationId.Guro));
            return true;
        }

        public void Apply(GameplayUiSnapshot snapshot)
        {
            presenter?.ApplySnapshot(snapshot);
        }

        public void ApplyWhy(string why)
        {
            presenter?.ApplyWhy(why);
        }

        public void Unwire()
        {
            root = null;
            presenter = null;
        }

        void Wire(string name, UnityEngine.Events.UnityAction action)
        {
            Button button = UguiHudBuilder.ButtonNamed(root, name);
            if (button == null) return;
            button.onClick.RemoveAllListeners();
            button.onClick.AddListener(action);
        }
    }
}
