using System;
using System.Collections.Generic;
using System.Globalization;
using Janseon.Core;
using Janseon.Foundation.UI;
using UnityEngine;
using UnityEngine.UIElements;

namespace Janseon.Foundation.Composition
{
    /// <summary>
    /// Foundation gameplay UI presenter: applies deterministic snapshots to stable names.
    /// Public action seams fire events only — domain orchestration is PocCoreLoopController.
    /// </summary>
    public sealed class GameplayPresenter
    {
        VisualElement root;
        readonly List<string> focusOrder = new List<string>();

        Button actionDepart;
        Button actionFace;
        Button actionEnter;
        Button actionSettle;
        Button battleAdvance;
        Button choiceNegotiate;
        Button choiceBypass;
        Button choiceCombat;
        Button returnAction;
        Button stationYeongdeungpo;
        Button stationSindorim;
        Button stationGuro;

        static readonly string[] StageNames =
        {
            UiElementNames.StageBasePrep,
            UiElementNames.StageExpedition,
            UiElementNames.StageEncounter,
            UiElementNames.StageResolution,
            UiElementNames.StageSettlement,
            UiElementNames.StageBaseReady,
        };

        static readonly string[] StationNames =
        {
            UiElementNames.StationYeongdeungpo,
            UiElementNames.StationSindorim,
            UiElementNames.StationGuro,
        };

        public bool IsReady { get; private set; }

        public IReadOnlyList<string> FocusOrderNames => focusOrder;

        public event Action DepartChosen;
        public event Action FaceEncounterChosen;
        public event Action EnterResolutionChosen;
        public event Action SettleChosen;
        public event Action BattleAdvanceChosen;
        public event Action NegotiateChosen;
        public event Action BypassChosen;
        public event Action CombatChosen;
        public event Action ReturnChosen;
        public event Action<StationId> TravelChosen;

        public bool BindForTest(VisualElement visualRoot) => Bind(visualRoot);

        public bool Bind(VisualElement visualRoot)
        {
            Unwire();
            root = null;
            IsReady = false;
            focusOrder.Clear();

            if (visualRoot == null)
            {
                return false;
            }

            VisualElement gameplayRoot = visualRoot.name == UiElementNames.GameplayRoot
                ? visualRoot
                : visualRoot.Q(UiElementNames.GameplayRoot);
            if (gameplayRoot == null)
            {
                return false;
            }

            foreach (string name in UiElementNames.GameplayRequired)
            {
                if (name == UiElementNames.GameplayRoot)
                {
                    continue;
                }

                if (gameplayRoot.Q(name) == null)
                {
                    return false;
                }
            }

            actionDepart = gameplayRoot.Q<Button>(UiElementNames.ActionDepart);
            actionFace = gameplayRoot.Q<Button>(UiElementNames.ActionFaceEncounter);
            actionEnter = gameplayRoot.Q<Button>(UiElementNames.ActionEnterResolution);
            actionSettle = gameplayRoot.Q<Button>(UiElementNames.ActionSettle);
            battleAdvance = gameplayRoot.Q<Button>(UiElementNames.BattleAdvance);
            choiceNegotiate = gameplayRoot.Q<Button>(UiElementNames.ChoiceNegotiate);
            choiceBypass = gameplayRoot.Q<Button>(UiElementNames.ChoiceBypass);
            choiceCombat = gameplayRoot.Q<Button>(UiElementNames.ChoiceCombat);
            returnAction = gameplayRoot.Q<Button>(UiElementNames.ReturnAction);
            stationYeongdeungpo = gameplayRoot.Q<Button>(UiElementNames.StationYeongdeungpo);
            stationSindorim = gameplayRoot.Q<Button>(UiElementNames.StationSindorim);
            stationGuro = gameplayRoot.Q<Button>(UiElementNames.StationGuro);

            if (actionDepart == null || actionFace == null || actionEnter == null || actionSettle == null
                || battleAdvance == null || choiceNegotiate == null || choiceBypass == null
                || choiceCombat == null || returnAction == null
                || stationYeongdeungpo == null || stationSindorim == null || stationGuro == null)
            {
                return false;
            }

            actionDepart.clicked += OnDepartClicked;
            actionFace.clicked += OnFaceClicked;
            actionEnter.clicked += OnEnterClicked;
            actionSettle.clicked += OnSettleClicked;
            battleAdvance.clicked += OnBattleAdvanceClicked;
            choiceNegotiate.clicked += OnNegotiateClicked;
            choiceBypass.clicked += OnBypassClicked;
            choiceCombat.clicked += OnCombatClicked;
            returnAction.clicked += OnReturnClicked;
            stationYeongdeungpo.clicked += OnYeongdeungpoClicked;
            stationSindorim.clicked += OnSindorimClicked;
            stationGuro.clicked += OnGuroClicked;

            root = gameplayRoot;
            for (var i = 0; i < UiElementNames.GameplayFocusOrder.Length; i++)
            {
                focusOrder.Add(UiElementNames.GameplayFocusOrder[i]);
            }

            IsReady = true;
            return true;
        }

        public void ApplyResolutionClass(int width)
        {
            if (root == null)
            {
                return;
            }

            UiResolutionClass.Apply(root, UiElementNames.GameplayRoot, width);
        }

        public void TriggerDepartForTest() => OnDepartClicked();
        public void TriggerFaceEncounterForTest() => OnFaceClicked();
        public void TriggerEnterResolutionForTest() => OnEnterClicked();
        public void TriggerSettleForTest() => OnSettleClicked();
        public void TriggerBattleAdvanceForTest() => OnBattleAdvanceClicked();
        public void TriggerNegotiateForTest() => OnNegotiateClicked();
        public void TriggerBypassForTest() => OnBypassClicked();
        public void TriggerCombatForTest() => OnCombatClicked();
        public void TriggerReturnForTest() => OnReturnClicked();
        public void TriggerTravelForTest(StationId station)
        {
            if (station.Equals(StationId.Yeongdeungpo))
            {
                OnYeongdeungpoClicked();
            }
            else if (station.Equals(StationId.Sindorim))
            {
                OnSindorimClicked();
            }
            else if (station.Equals(StationId.Guro))
            {
                OnGuroClicked();
            }
        }

        public void ApplySnapshot(GameplayUiSnapshot snapshot)
        {
            if (root == null || snapshot == null)
            {
                return;
            }

            for (var i = 0; i < StageNames.Length; i++)
            {
                VisualElement chip = root.Q(StageNames[i]);
                if (chip == null)
                {
                    continue;
                }

                chip.EnableInClassList("jk-chip--current", StageNames[i] == snapshot.CurrentStageElement);
            }

            for (var i = 0; i < StationNames.Length; i++)
            {
                VisualElement node = root.Q(StationNames[i]);
                if (node == null)
                {
                    continue;
                }

                bool current = StationNames[i] == snapshot.CurrentStationElement;
                node.EnableInClassList("jk-route-node--current", current);
                node.EnableInClassList("jk-route-node--dim", !current);
            }

            SetVisible(UiElementNames.EncounterChoices, snapshot.VisiblePanel == GameplayPanelId.Encounter);
            bool battle = snapshot.VisiblePanel == GameplayPanelId.Battle;
            SetVisible(UiElementNames.RouteRail, !battle);
            SetVisible(UiElementNames.BattleHud, battle);
            SetVisible(UiElementNames.BattleGrid, battle);
            SetVisible(UiElementNames.BattleLog, battle);
            VisualElement battleRow = root.Q("battle-row");
            if (battleRow != null)
            {
                battleRow.EnableInClassList("jk-hidden", !battle);
            }

            SetVisible(
                UiElementNames.SettlementPanel,
                snapshot.VisiblePanel == GameplayPanelId.Settlement
                || snapshot.ShowSettleAction
                || snapshot.ShowReturnAction);

            SetActionVisible(UiElementNames.ActionDepart, snapshot.ShowDepartAction);
            SetActionVisible(UiElementNames.ActionFaceEncounter, snapshot.ShowFaceAction);
            SetActionVisible(UiElementNames.ActionEnterResolution, snapshot.ShowEnterResolutionAction);
            SetActionVisible(UiElementNames.ActionSettle, snapshot.ShowSettleAction);
            SetActionVisible(UiElementNames.BattleAdvance, snapshot.ShowBattleAdvanceAction);
            SetActionVisible(UiElementNames.ReturnAction, snapshot.ShowReturnAction);

            // Station nodes are route-map labels: keep painted; interactivity follows travel stage.
            SetStationTravelEnabled(UiElementNames.StationYeongdeungpo, snapshot.ShowTravelActions);
            SetStationTravelEnabled(UiElementNames.StationSindorim, snapshot.ShowTravelActions);
            SetStationTravelEnabled(UiElementNames.StationGuro, snapshot.ShowTravelActions);

            ApplyNamedVisibleFlags(snapshot);

            ApplyMeters(snapshot);
            ApplyBattleLog(snapshot);
            ApplySettlement(snapshot);

            for (var y = 0; y < 5; y++)
            {
                for (var x = 0; x < 5; x++)
                {
                    string cellName = UiElementNames.BattleCell(x, y);
                    VisualElement cell = root.Q(cellName);
                    if (cell == null)
                    {
                        continue;
                    }

                    cell.EnableInClassList("jk-grid-cell--ally", false);
                    cell.EnableInClassList("jk-grid-cell--foe", false);
                    cell.Clear();
                    if (snapshot.BattleCellOccupancy.TryGetValue(cellName, out string side))
                    {
                        if (side == "ally")
                        {
                            cell.EnableInClassList("jk-grid-cell--ally", true);
                        }
                        else if (side == "foe")
                        {
                            cell.EnableInClassList("jk-grid-cell--foe", true);
                        }
                    }
                }
            }
        }

        void ApplyMeters(GameplayUiSnapshot snapshot)
        {
            Label hp = root.Q<Label>(UiElementNames.BattleHp);
            Label ap = root.Q<Label>(UiElementNames.BattleAp);
            if (hp != null)
            {
                hp.text = "HP "
                    + snapshot.BattleHp.ToString(CultureInfo.InvariantCulture)
                    + "/"
                    + snapshot.BattleMaxHp.ToString(CultureInfo.InvariantCulture);
            }

            if (ap != null)
            {
                ap.text = "AP "
                    + snapshot.BattleAp.ToString(CultureInfo.InvariantCulture)
                    + "/"
                    + snapshot.BattleMaxAp.ToString(CultureInfo.InvariantCulture);
            }

            SetFill(UiElementNames.BattleHpFill, snapshot.HpFill01);
            SetFill(UiElementNames.BattleApFill, snapshot.ApFill01);
        }

        void SetFill(string fillName, float fill01)
        {
            VisualElement fill = root.Q(fillName);
            if (fill == null)
            {
                return;
            }

            float pct = Mathf.Clamp01(fill01) * 100f;
            fill.style.width = new Length(pct, LengthUnit.Percent);
            fill.EnableInClassList("jk-meter__fill--empty", fill01 <= 0.0001f);
            fill.EnableInClassList("jk-meter__fill--full", fill01 >= 0.999f);
        }

        void ApplyBattleLog(GameplayUiSnapshot snapshot)
        {
            VisualElement log = root.Q(UiElementNames.BattleLog);
            if (log == null)
            {
                return;
            }

            VisualElement content = log.contentContainer ?? log;
            var toRemove = new List<VisualElement>();
            for (var i = 0; i < content.childCount; i++)
            {
                VisualElement child = content[i];
                if (child.ClassListContains("jk-log-entry"))
                {
                    toRemove.Add(child);
                }
            }

            for (var i = 0; i < toRemove.Count; i++)
            {
                toRemove[i].RemoveFromHierarchy();
            }

            for (var i = 0; i < snapshot.BattleLogEntries.Count; i++)
            {
                var entry = new Label(snapshot.BattleLogEntries[i]);
                entry.AddToClassList("jk-log-entry");
                entry.name = "battle-log-entry-" + i.ToString(CultureInfo.InvariantCulture);
                content.Add(entry);
            }
        }

        void ApplySettlement(GameplayUiSnapshot snapshot)
        {
            Label outcome = root.Q<Label>(UiElementNames.SettlementOutcome);
            if (outcome == null)
            {
                return;
            }

            outcome.text = snapshot.SettlementOutcomeText ?? string.Empty;
            if (!string.IsNullOrEmpty(snapshot.SettlementOutcomeCode))
            {
                outcome.viewDataKey = snapshot.SettlementOutcomeCode;
            }
        }

        void SetVisible(string name, bool visible)
        {
            VisualElement el = root.Q(name);
            if (el == null)
            {
                return;
            }

            el.EnableInClassList("jk-hidden", !visible);
        }

        void SetActionVisible(string name, bool visible)
        {
            VisualElement el = root.Q(name);
            if (el == null)
            {
                return;
            }

            el.EnableInClassList("jk-hidden", !visible);
            el.SetEnabled(visible);
        }

        void SetStationTravelEnabled(string name, bool travelEnabled)
        {
            VisualElement el = root.Q(name);
            if (el == null)
            {
                return;
            }

            // Keep labels enabled so :disabled muted color does not crush route textLum.
            // Gate interaction via pickingMode; NamedFlags ":visible" owns display.
            el.SetEnabled(true);
            el.pickingMode = travelEnabled ? PickingMode.Position : PickingMode.Ignore;
            el.focusable = travelEnabled;
        }

        /// <summary>
        /// Applies only exact "{elementName}:visible" NamedFlags. Ignores malformed keys
        /// (missing suffix, extra colon segments, empty name) without swallowing unknowns into display.
        /// </summary>
        void ApplyNamedVisibleFlags(GameplayUiSnapshot snapshot)
        {
            if (snapshot?.NamedFlags == null || root == null)
            {
                return;
            }

            const string suffix = ":visible";
            foreach (KeyValuePair<string, bool> pair in snapshot.NamedFlags)
            {
                string key = pair.Key;
                if (string.IsNullOrEmpty(key) || !key.EndsWith(suffix, StringComparison.Ordinal))
                {
                    continue;
                }

                // Reject "a:visible:extra" / ":visible" / "::visible".
                if (key.IndexOf(':') != key.LastIndexOf(':'))
                {
                    continue;
                }

                string elementName = key.Substring(0, key.Length - suffix.Length);
                if (string.IsNullOrEmpty(elementName))
                {
                    continue;
                }

                VisualElement el = root.Q(elementName);
                if (el == null)
                {
                    continue;
                }

                el.EnableInClassList("jk-hidden", !pair.Value);
            }
        }

        void OnDepartClicked() => DepartChosen?.Invoke();
        void OnFaceClicked() => FaceEncounterChosen?.Invoke();
        void OnEnterClicked() => EnterResolutionChosen?.Invoke();
        void OnSettleClicked() => SettleChosen?.Invoke();
        void OnBattleAdvanceClicked() => BattleAdvanceChosen?.Invoke();
        void OnNegotiateClicked() => NegotiateChosen?.Invoke();
        void OnBypassClicked() => BypassChosen?.Invoke();
        void OnCombatClicked() => CombatChosen?.Invoke();
        void OnReturnClicked() => ReturnChosen?.Invoke();
        void OnYeongdeungpoClicked() => TravelChosen?.Invoke(StationId.Yeongdeungpo);
        void OnSindorimClicked() => TravelChosen?.Invoke(StationId.Sindorim);
        void OnGuroClicked() => TravelChosen?.Invoke(StationId.Guro);

        void Unwire()
        {
            if (actionDepart != null) actionDepart.clicked -= OnDepartClicked;
            if (actionFace != null) actionFace.clicked -= OnFaceClicked;
            if (actionEnter != null) actionEnter.clicked -= OnEnterClicked;
            if (actionSettle != null) actionSettle.clicked -= OnSettleClicked;
            if (battleAdvance != null) battleAdvance.clicked -= OnBattleAdvanceClicked;
            if (choiceNegotiate != null) choiceNegotiate.clicked -= OnNegotiateClicked;
            if (choiceBypass != null) choiceBypass.clicked -= OnBypassClicked;
            if (choiceCombat != null) choiceCombat.clicked -= OnCombatClicked;
            if (returnAction != null) returnAction.clicked -= OnReturnClicked;
            if (stationYeongdeungpo != null) stationYeongdeungpo.clicked -= OnYeongdeungpoClicked;
            if (stationSindorim != null) stationSindorim.clicked -= OnSindorimClicked;
            if (stationGuro != null) stationGuro.clicked -= OnGuroClicked;

            actionDepart = null;
            actionFace = null;
            actionEnter = null;
            actionSettle = null;
            battleAdvance = null;
            choiceNegotiate = null;
            choiceBypass = null;
            choiceCombat = null;
            returnAction = null;
            stationYeongdeungpo = null;
            stationSindorim = null;
            stationGuro = null;
        }
    }
}
