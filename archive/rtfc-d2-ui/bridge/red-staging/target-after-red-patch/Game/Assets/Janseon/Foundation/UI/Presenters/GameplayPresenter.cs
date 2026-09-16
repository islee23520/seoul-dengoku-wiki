using System;
using System.Collections.Generic;
using System.Globalization;
using Janseon.Core;
using Janseon.Foundation.UI;
using UnityEngine;
using UnityEngine.UI;

namespace Janseon.Foundation.Composition
{
    /// <summary>
    /// Foundation gameplay UI presenter: applies deterministic snapshots to stable names.
    /// Public action seams fire events only — domain orchestration is PocCoreLoopController.
    /// </summary>
    public sealed class GameplayPresenter
    {
        RectTransform root;
        readonly List<string> focusOrder = new List<string>();

        Button actionDepart;
        Button actionFace;
        Button actionEnter;
        Button actionSettle;
        Button battleAdvance;
        Button battleMoveN;
        Button battleMoveE;
        Button battleMoveS;
        Button battleMoveW;
        Button battleMelee;
        Button battleRanged;
        Button battleEndTurn;
        Button battleWait;
        Button mobilityRegroup;
        Button choiceNegotiate;
        Button choiceBypass;
        Button choiceCombat;
        Button returnAction;
        Button stationYeongdeungpo;
        Button stationSindorim;
        Button stationGuro;
        readonly Toggle[] deployToggles = new Toggle[DeploymentApi.DeployCap + 1];

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
        public event Action<int, int> BattleMoveChosen;
        public event Action BattleMeleeChosen;
        public event Action BattleRangedChosen;
        public event Action BattleEndTurnChosen;
        public event Action BattleWaitChosen;
        public event Action MobilityRegroupChosen;
        public event Action NegotiateChosen;
        public event Action BypassChosen;
        public event Action CombatChosen;
        public event Action ReturnChosen;
        public event Action<StationId> TravelChosen;
        public event Action<int, bool> DeploymentParticipationChosen;

        public bool BindForTest(RectTransform visualRoot) => Bind(visualRoot);

        public bool Bind(RectTransform visualRoot)
        {
            Unwire();
            root = null;
            IsReady = false;
            focusOrder.Clear();

            if (visualRoot == null)
            {
                return false;
            }

            RectTransform gameplayRoot = visualRoot.name == UiElementNames.GameplayRoot
                ? visualRoot
                : UguiHudBuilder.Find(visualRoot, UiElementNames.GameplayRoot) as RectTransform;
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

                if (UguiHudBuilder.Find(gameplayRoot, name) == null)
                {
                    return false;
                }
            }

            actionDepart = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.ActionDepart);
            actionFace = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.ActionFaceEncounter);
            actionEnter = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.ActionEnterResolution);
            actionSettle = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.ActionSettle);
            battleAdvance = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.BattleAdvance);
            battleMoveN = UguiHudBuilder.ButtonNamed(gameplayRoot, "battle-move-n");
            battleMoveE = UguiHudBuilder.ButtonNamed(gameplayRoot, "battle-move-e");
            battleMoveS = UguiHudBuilder.ButtonNamed(gameplayRoot, "battle-move-s");
            battleMoveW = UguiHudBuilder.ButtonNamed(gameplayRoot, "battle-move-w");
            battleMelee = UguiHudBuilder.ButtonNamed(gameplayRoot, "battle-melee");
            battleRanged = UguiHudBuilder.ButtonNamed(gameplayRoot, "battle-ranged");
            battleWait = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.BattleWait);
            mobilityRegroup = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.MobilityRegroup);
            battleEndTurn = UguiHudBuilder.ButtonNamed(gameplayRoot, "battle-end-turn");
            choiceNegotiate = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.ChoiceNegotiate);
            choiceBypass = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.ChoiceBypass);
            choiceCombat = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.ChoiceCombat);
            returnAction = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.ReturnAction);
            stationYeongdeungpo = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.StationYeongdeungpo);
            stationSindorim = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.StationSindorim);
            stationGuro = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.StationGuro);
            for (var i = 0; i < deployToggles.Length; i++)
            {
                deployToggles[i] = UguiHudBuilder.ToggleNamed(gameplayRoot, UiElementNames.DeployToggle(i));
            }

            if (actionDepart == null || actionFace == null || actionEnter == null || actionSettle == null
                || battleAdvance == null || choiceNegotiate == null || choiceBypass == null
                || choiceCombat == null || returnAction == null
                || stationYeongdeungpo == null || stationSindorim == null || stationGuro == null)
            {
                return false;
            }

            actionDepart.onClick.AddListener(OnDepartClicked);
            actionFace.onClick.AddListener(OnFaceClicked);
            actionEnter.onClick.AddListener(OnEnterClicked);
            actionSettle.onClick.AddListener(OnSettleClicked);
            battleAdvance.onClick.AddListener(OnBattleAdvanceClicked);
            if (battleMoveN != null) battleMoveN.onClick.AddListener(OnBattleMoveNClicked);
            if (battleMoveE != null) battleMoveE.onClick.AddListener(OnBattleMoveEClicked);
            if (battleMoveS != null) battleMoveS.onClick.AddListener(OnBattleMoveSClicked);
            if (battleMoveW != null) battleMoveW.onClick.AddListener(OnBattleMoveWClicked);
            if (battleMelee != null) battleMelee.onClick.AddListener(OnBattleMeleeClicked);
            if (battleRanged != null) battleRanged.onClick.AddListener(OnBattleRangedClicked);
            if (battleWait != null) battleWait.onClick.AddListener(OnBattleWaitClicked);
            if (mobilityRegroup != null) mobilityRegroup.onClick.AddListener(OnMobilityRegroupClicked);
            if (battleEndTurn != null) battleEndTurn.onClick.AddListener(OnBattleEndTurnClicked);
            choiceNegotiate.onClick.AddListener(OnNegotiateClicked);
            choiceBypass.onClick.AddListener(OnBypassClicked);
            choiceCombat.onClick.AddListener(OnCombatClicked);
            returnAction.onClick.AddListener(OnReturnClicked);
            stationYeongdeungpo.onClick.AddListener(OnYeongdeungpoClicked);
            stationSindorim.onClick.AddListener(OnSindorimClicked);
            stationGuro.onClick.AddListener(OnGuroClicked);
            if (deployToggles[0] != null) deployToggles[0].onValueChanged.AddListener(OnDeploy0Changed);
            if (deployToggles[1] != null) deployToggles[1].onValueChanged.AddListener(OnDeploy1Changed);
            if (deployToggles[2] != null) deployToggles[2].onValueChanged.AddListener(OnDeploy2Changed);
            if (deployToggles[3] != null) deployToggles[3].onValueChanged.AddListener(OnDeploy3Changed);

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
            // uGUI contract: CanvasScaler (1280x720 reference) owns resolution.
            // Retained as a no-op for existing callers until task 13 removes the UITK path.
        }

        public void TriggerDepartForTest() => OnDepartClicked();
        public void TriggerFaceEncounterForTest() => OnFaceClicked();
        public void TriggerEnterResolutionForTest() => OnEnterClicked();
        public void TriggerSettleForTest() => OnSettleClicked();
        public void TriggerBattleAdvanceForTest() => OnBattleAdvanceClicked();
        public void TriggerBattleMoveNForTest() => OnBattleMoveNClicked();
        public void TriggerBattleMoveEForTest() => OnBattleMoveEClicked();
        public void TriggerBattleMoveSForTest() => OnBattleMoveSClicked();
        public void TriggerBattleMoveWForTest() => OnBattleMoveWClicked();
        public void TriggerBattleMeleeForTest() => OnBattleMeleeClicked();
        public void TriggerBattleRangedForTest() => OnBattleRangedClicked();
        public void TriggerBattleWaitForTest() => OnBattleWaitClicked();
        public void TriggerMobilityRegroupForTest() => OnMobilityRegroupClicked();
        public void TriggerBattleEndTurnForTest() => OnBattleEndTurnClicked();
        public void TriggerNegotiateForTest() => OnNegotiateClicked();
        public void TriggerBypassForTest() => OnBypassClicked();
        public void TriggerCombatForTest() => OnCombatClicked();
        public void TriggerReturnForTest() => OnReturnClicked();
        public void TriggerDeploymentForTest(int rosterIndex, bool participating)
            => DeploymentParticipationChosen?.Invoke(rosterIndex, participating);

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
                Transform chip = UguiHudBuilder.Find(root, StageNames[i]);
                if (chip == null)
                {
                    continue;
                }

                SetStateColor(chip, StageNames[i] == snapshot.CurrentStageElement);
            }

            for (var i = 0; i < StationNames.Length; i++)
            {
                Transform node = UguiHudBuilder.Find(root, StationNames[i]);
                if (node == null)
                {
                    continue;
                }

                bool current = StationNames[i] == snapshot.CurrentStationElement;
                SetStateColor(node, current);

            }

            SetVisible(UiElementNames.EncounterChoices, snapshot.VisiblePanel == GameplayPanelId.Encounter);
            bool battle = snapshot.VisiblePanel == GameplayPanelId.Battle;
            SetVisible(UiElementNames.RouteRail, !battle);
            SetVisible(UiElementNames.BattleHud, battle);
            SetVisible(UiElementNames.BattleGrid, battle);
            SetVisible(UiElementNames.BattleLog, battle);
            Transform battleRow = UguiHudBuilder.Find(root, "battle-row");
            if (battleRow != null)
            {
                battleRow.gameObject.SetActive(battle);
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
            ApplyParty(snapshot);
            ApplyDeployment(snapshot);
            ApplyBattleLog(snapshot);
            ApplySettlement(snapshot);
            ApplyContext(snapshot);
            ApplyClock(snapshot);

            for (var y = 0; y < 5; y++)
            {
                for (var x = 0; x < 5; x++)
                {
                    string cellName = UiElementNames.BattleCell(x, y);
                    Transform cell = UguiHudBuilder.Find(root, cellName);
                    if (cell == null)
                    {
                        continue;
                    }

                    var cellImage = cell.GetComponent<Image>();
                    bool hasSide = snapshot.BattleCellOccupancy.TryGetValue(cellName, out string side);
                    if (cellImage != null)
                    {
                        cellImage.color = !hasSide
                            ? new Color(0.09f, 0.13f, 0.14f, 0.45f)
                            : side == "ally"
                                ? new Color(0.208f, 0.349f, 0.412f, 0.8f)
                                : new Color(0.42f, 0.18f, 0.18f, 0.8f);
                    }
                    if (hasSide)
                    {
                        SetStateColor(cell, side == "ally");
                    }
                }
            }
        }

        void ApplyMeters(GameplayUiSnapshot snapshot)
        {
            Text hp = FindText(root, UiElementNames.BattleHp);
            Text ap = FindText(root, UiElementNames.BattleAp);
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

        void ApplyParty(GameplayUiSnapshot snapshot)
        {
            string[] fallback = { "탐험가", "의무병", "순찰대" };
            for (var i = 0; i < 3; i++)
            {
                Text name = FindText(root, "party-slot-" + i + "-name");
                Text hp = FindText(root, "party-slot-" + i + "-hp");
                if (i < snapshot.PartyNames.Count)
                {
                    if (name != null)
                    {
                        name.text = fallback[i];
                    }

                    if (hp != null)
                    {
                        hp.text = "HP "
                            + snapshot.PartyHp[i].ToString(CultureInfo.InvariantCulture)
                            + "/"
                            + snapshot.PartyMaxHp[i].ToString(CultureInfo.InvariantCulture);
                    }
                }
                else
                {
                    if (name != null)
                    {
                        name.text = fallback[i];
                    }

                    if (hp != null)
                    {
                        hp.text = "HP";
                    }
                }
            }

            Text layer = FindText(root, "layer-chip");
            if (layer != null)
            {
                bool sindorim = snapshot.CurrentStationElement == UiElementNames.StationSindorim;
                layer.text = sindorim ? "B2" : "B1";
            }
        }

        void ApplyDeployment(GameplayUiSnapshot snapshot)
        {
            Text heading = FindText(root, UiElementNames.DeployHeading);
            var participating = 0;
            for (var i = 0; i < snapshot.DeployParticipating.Count; i++)
            {
                if (snapshot.DeployParticipating[i])
                {
                    participating++;
                }
            }

            if (heading != null)
            {
                heading.text = "참가 "
                    + participating.ToString(CultureInfo.InvariantCulture)
                    + "/"
                    + snapshot.DeployUnitIds.Count.ToString(CultureInfo.InvariantCulture)
                    + " · 배치 상한 "
                    + DeploymentApi.DeployCap.ToString(CultureInfo.InvariantCulture);
            }

            for (var i = 0; i <= DeploymentApi.DeployCap; i++)
            {
                Toggle toggle = UguiHudBuilder.ToggleNamed(root, UiElementNames.DeployToggle(i));
                if (toggle == null)
                {
                    continue;
                }

                bool exists = i < snapshot.DeployUnitIds.Count;
                toggle.gameObject.SetActive(exists);
                if (!exists)
                {
                    continue;
                }

                toggle.SetIsOnWithoutNotify(snapshot.DeployParticipating[i]);
                Text label = toggle.GetComponentInChildren<Text>(true);
                if (label != null)
                {
                    label.text = snapshot.DeployUnitIds[i]
                        + " · HP "
                        + snapshot.DeployHp[i].ToString(CultureInfo.InvariantCulture)
                        + "/"
                        + Janseon.Core.Battle.Contracts.RealtimeBattleApi.PersistentMaxHp.ToString(CultureInfo.InvariantCulture)
                        + " · "
                        + (snapshot.DeployParticipating[i]
                            ? "참가"
                            : snapshot.DeployWounded[i] ? "미참가 — 휴식" : "미참가");
                }
            }
        }

        void SetFill(string fillName, float fill01)
        {
            Transform fill = UguiHudBuilder.Find(root, fillName);
            if (fill == null)
            {
                return;
            }

            var rect = fill as RectTransform;
            if (rect != null)
            {
                float pct = Mathf.Clamp01(fill01);
                rect.anchorMax = new Vector2(pct, 1f);
                rect.offsetMax = new Vector2(0f, rect.offsetMax.y);
            }
        }

        void ApplyBattleLog(GameplayUiSnapshot snapshot)
        {
            Text log = FindText(root, UiElementNames.BattleLog);
            if (log == null)
            {
                return;
            }

            log.text = string.Join("\n", snapshot.BattleLogEntries);
        }

        void ApplySettlement(GameplayUiSnapshot snapshot)
        {
            Text outcome = FindText(root, UiElementNames.SettlementOutcome);
            if (outcome == null)
            {
                return;
            }

            outcome.text = snapshot.SettlementOutcomeText ?? string.Empty;
            // Outcome code is carried by the snapshot hash contract, not UI.
        }

        void ApplyClock(GameplayUiSnapshot snapshot)
        {
            Text clock = FindText(root, UiElementNames.ClockLabel);
            if (clock != null)
            {
                clock.text = snapshot.ClockText ?? string.Empty;
            }
        }

        void ApplyContext(GameplayUiSnapshot snapshot)
        {
            Text context = FindText(root, "encounter-context");
            if (context != null)
            {
                context.text = snapshot.EncounterContext ?? string.Empty;
            }

            Text forecast = FindText(root, "battle-forecast");
            if (forecast != null)
            {
                forecast.text = snapshot.BattleForecast ?? string.Empty;
            }

            Text why = FindText(root, "why-tooltip");
            if (why != null)
            {
                why.text = snapshot.WhyText ?? string.Empty;
            }
        }

        public void ApplyWhy(string why)
        {
            if (root == null)
            {
                return;
            }

            Text label = FindText(root, "why-tooltip");
            if (label != null)
            {
                label.text = why ?? string.Empty;
            }
        }

        void SetVisible(string name, bool visible)
        {
            Transform el = UguiHudBuilder.Find(root, name);
            if (el == null)
            {
                return;
            }

            el.gameObject.SetActive(visible);
        }

        void SetActionVisible(string name, bool visible)
        {
            Transform el = UguiHudBuilder.Find(root, name);
            if (el == null)
            {
                return;
            }

            el.gameObject.SetActive(visible);
            var button = el.GetComponent<Button>();
            if (button != null)
            {
                button.interactable = visible;
            }
        }

        void SetStationTravelEnabled(string name, bool travelEnabled)
        {
            Transform el = UguiHudBuilder.Find(root, name);
            if (el == null)
            {
                return;
            }

            // uGUI contract: labels stay bright (capture textLum guard). Non-adjacent
            // travel is rejected by Core with a why-tooltip (task 12), not by muted buttons.
            _ = travelEnabled;
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

                Transform el = UguiHudBuilder.Find(root, elementName);
                if (el == null)
                {
                    continue;
                }

                el.gameObject.SetActive(pair.Value);
            }
        }

        void OnDepartClicked() => DepartChosen?.Invoke();
        void OnFaceClicked() => FaceEncounterChosen?.Invoke();
        void OnEnterClicked() => EnterResolutionChosen?.Invoke();
        void OnSettleClicked() => SettleChosen?.Invoke();
        void OnBattleAdvanceClicked() => BattleAdvanceChosen?.Invoke();
        void OnBattleMoveNClicked() => BattleMoveChosen?.Invoke(0, 1);
        void OnBattleMoveEClicked() => BattleMoveChosen?.Invoke(1, 0);
        void OnBattleMoveSClicked() => BattleMoveChosen?.Invoke(0, -1);
        void OnBattleMoveWClicked() => BattleMoveChosen?.Invoke(-1, 0);
        void OnBattleMeleeClicked() => BattleMeleeChosen?.Invoke();
        void OnBattleRangedClicked() => BattleRangedChosen?.Invoke();
        void OnBattleWaitClicked() => BattleWaitChosen?.Invoke();
        void OnMobilityRegroupClicked() => MobilityRegroupChosen?.Invoke();
        void OnBattleEndTurnClicked() => BattleEndTurnChosen?.Invoke();
        void OnNegotiateClicked() => NegotiateChosen?.Invoke();
        void OnBypassClicked() => BypassChosen?.Invoke();
        void OnCombatClicked() => CombatChosen?.Invoke();
        void OnReturnClicked() => ReturnChosen?.Invoke();
        void OnYeongdeungpoClicked() => TravelChosen?.Invoke(StationId.Yeongdeungpo);
        void OnSindorimClicked() => TravelChosen?.Invoke(StationId.Sindorim);
        void OnGuroClicked() => TravelChosen?.Invoke(StationId.Guro);
        void OnDeploy0Changed(bool participating) => DeploymentParticipationChosen?.Invoke(0, participating);
        void OnDeploy1Changed(bool participating) => DeploymentParticipationChosen?.Invoke(1, participating);
        void OnDeploy2Changed(bool participating) => DeploymentParticipationChosen?.Invoke(2, participating);
        void OnDeploy3Changed(bool participating) => DeploymentParticipationChosen?.Invoke(3, participating);

        static Text FindText(Transform root, string name)
        {
            Transform el = UguiHudBuilder.Find(root, name);
            if (el == null)
            {
                return null;
            }

            var own = el.GetComponent<Text>();
            return own != null ? own : el.GetComponentInChildren<Text>(true);
        }

        static void SetStateColor(Transform el, bool positive)
        {
            var image = el.GetComponent<Image>();
            if (image != null)
            {
                image.color = positive
                    ? new Color(0.835f, 0.929f, 0.765f, 1f)
                    : new Color(0.149f, 0.212f, 0.227f, 1f);
            }

            var text = el.GetComponentInChildren<Text>();
            if (text != null)
            {
                text.color = positive
                    ? new Color(0.835f, 0.929f, 0.765f, 1f)
                    : new Color(0.604f, 0.651f, 0.698f, 1f);
            }
        }

        void Unwire()
        {
            if (actionDepart != null) actionDepart.onClick.RemoveListener(OnDepartClicked);
            if (actionFace != null) actionFace.onClick.RemoveListener(OnFaceClicked);
            if (actionEnter != null) actionEnter.onClick.RemoveListener(OnEnterClicked);
            if (actionSettle != null) actionSettle.onClick.RemoveListener(OnSettleClicked);
            if (battleAdvance != null) battleAdvance.onClick.RemoveListener(OnBattleAdvanceClicked);
            if (battleMoveN != null) battleMoveN.onClick.RemoveListener(OnBattleMoveNClicked);
            if (battleMoveE != null) battleMoveE.onClick.RemoveListener(OnBattleMoveEClicked);
            if (battleMoveS != null) battleMoveS.onClick.RemoveListener(OnBattleMoveSClicked);
            if (battleMoveW != null) battleMoveW.onClick.RemoveListener(OnBattleMoveWClicked);
            if (battleMelee != null) battleMelee.onClick.RemoveListener(OnBattleMeleeClicked);
            if (battleRanged != null) battleRanged.onClick.RemoveListener(OnBattleRangedClicked);
            if (battleWait != null) battleWait.onClick.RemoveListener(OnBattleWaitClicked);
            if (mobilityRegroup != null) mobilityRegroup.onClick.RemoveListener(OnMobilityRegroupClicked);
            if (battleEndTurn != null) battleEndTurn.onClick.RemoveListener(OnBattleEndTurnClicked);
            if (choiceNegotiate != null) choiceNegotiate.onClick.RemoveListener(OnNegotiateClicked);
            if (choiceBypass != null) choiceBypass.onClick.RemoveListener(OnBypassClicked);
            if (choiceCombat != null) choiceCombat.onClick.RemoveListener(OnCombatClicked);
            if (returnAction != null) returnAction.onClick.RemoveListener(OnReturnClicked);
            if (stationYeongdeungpo != null) stationYeongdeungpo.onClick.RemoveListener(OnYeongdeungpoClicked);
            if (stationSindorim != null) stationSindorim.onClick.RemoveListener(OnSindorimClicked);
            if (stationGuro != null) stationGuro.onClick.RemoveListener(OnGuroClicked);
            if (deployToggles[0] != null) deployToggles[0].onValueChanged.RemoveListener(OnDeploy0Changed);
            if (deployToggles[1] != null) deployToggles[1].onValueChanged.RemoveListener(OnDeploy1Changed);
            if (deployToggles[2] != null) deployToggles[2].onValueChanged.RemoveListener(OnDeploy2Changed);
            if (deployToggles[3] != null) deployToggles[3].onValueChanged.RemoveListener(OnDeploy3Changed);

            actionDepart = null;
            actionFace = null;
            actionEnter = null;
            actionSettle = null;
            battleAdvance = null;
            battleMoveN = null;
            battleMoveE = null;
            battleMoveS = null;
            battleMoveW = null;
            battleMelee = null;
            battleRanged = null;
            battleWait = null;
            mobilityRegroup = null;
            battleEndTurn = null;
            choiceNegotiate = null;
            choiceBypass = null;
            choiceCombat = null;
            returnAction = null;
            stationYeongdeungpo = null;
            stationSindorim = null;
            stationGuro = null;
            for (var i = 0; i < deployToggles.Length; i++)
            {
                deployToggles[i] = null;
            }
        }
    }
}
