using System;
using System.Collections.Generic;
using System.Globalization;
using Janseon.Core;
using Janseon.Core.Data;
using Janseon.Foundation.UI;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using VContainer;

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
        readonly IReadOnlyCardCatalog cards;
        readonly IReadOnlyUnitRoleCatalog unitRoles;
        readonly IReadOnlyFormationCatalog formations;
        readonly IReadOnlyStationCatalog stations;
        readonly IContentFingerprint contentFingerprint;

        public GameplayPresenter()
        {
        }

        [Inject]
        public GameplayPresenter(
            IReadOnlyCardCatalog cards,
            IReadOnlyUnitRoleCatalog unitRoles,
            IReadOnlyFormationCatalog formations,
            IReadOnlyStationCatalog stations,
            IContentFingerprint contentFingerprint)
        {
            this.cards = cards ?? throw new ArgumentNullException(nameof(cards));
            this.unitRoles = unitRoles ?? throw new ArgumentNullException(nameof(unitRoles));
            this.formations = formations ?? throw new ArgumentNullException(nameof(formations));
            this.stations = stations ?? throw new ArgumentNullException(nameof(stations));
            this.contentFingerprint = contentFingerprint ?? throw new ArgumentNullException(nameof(contentFingerprint));
        }

        Button actionDepart;
        Button actionFace;
        Button actionEnter;
        Button actionSettle;
        Button battlePlayPause;
        Button battleReset;
        Button cardGeneralUse;
        Button formationSwapFront;
        Button editFormation;
        Button formationEditConfirm;
        Button formationEditCancel;
        Button formationEditReedit;
        Button formationEditReset;
        Button formationEditFacingN;
        Button formationEditFacingE;
        Button formationEditFacingS;
        Button formationEditFacingW;
        readonly Button[] formationEditUnits = new Button[UiElementNames.FormationEditUnitIds.Length];
        readonly Button[] formationEditSlots = new Button[UiElementNames.FormationEditSlotIds.Length];
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
        public event Action BattlePlayPauseChosen;
        public event Action BattleResetChosen;
        public event Action CardGeneralUseChosen;
        public event Action FormationSwapFrontChosen;
        public event Action EditFormationChosen;
        public event Action FormationEditConfirmChosen;
        public event Action FormationEditCancelChosen;
        public event Action FormationEditReeditChosen;
        public event Action FormationEditResetChosen;
        public event Action<string> FormationEditUnitChosen;
        public event Action<string> FormationEditSlotChosen;
        public event Action<CardinalDirection> FormationEditFacingChosen;
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
            battlePlayPause = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.BattlePlayPause);
            battleReset = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.BattleReset);
            cardGeneralUse = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.CardGeneralUse);
            formationSwapFront = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.FormationSwapFront);
            editFormation = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.EditFormation);
            formationEditConfirm = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.FormationEditConfirm);
            formationEditCancel = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.FormationEditCancel);
            formationEditReedit = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.FormationEditReedit);
            formationEditReset = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.FormationEditReset);
            for (var i = 0; i < formationEditUnits.Length; i++)
            {
                formationEditUnits[i] = UguiHudBuilder.ButtonNamed(
                    gameplayRoot, UiElementNames.FormationEditUnit(UiElementNames.FormationEditUnitIds[i]));
            }

            for (var i = 0; i < formationEditSlots.Length; i++)
            {
                formationEditSlots[i] = UguiHudBuilder.ButtonNamed(
                    gameplayRoot, UiElementNames.FormationEditSlot(UiElementNames.FormationEditSlotIds[i]));
            }

            formationEditFacingN = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.FormationEditFacingN);
            formationEditFacingE = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.FormationEditFacingE);
            formationEditFacingS = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.FormationEditFacingS);
            formationEditFacingW = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.FormationEditFacingW);
            mobilityRegroup = UguiHudBuilder.ButtonNamed(gameplayRoot, UiElementNames.MobilityRegroup);
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
                || battlePlayPause == null || battleReset == null || cardGeneralUse == null
                || formationSwapFront == null || editFormation == null
                || formationEditConfirm == null || formationEditCancel == null
                || formationEditReedit == null || formationEditReset == null
                || formationEditFacingN == null || formationEditFacingE == null
                || formationEditFacingS == null || formationEditFacingW == null
                || mobilityRegroup == null || choiceNegotiate == null || choiceBypass == null
                || choiceCombat == null || returnAction == null
                || stationYeongdeungpo == null || stationSindorim == null || stationGuro == null)
            {
                return false;
            }

            for (var i = 0; i < formationEditUnits.Length; i++)
            {
                if (formationEditUnits[i] == null)
                {
                    return false;
                }
            }

            for (var i = 0; i < formationEditSlots.Length; i++)
            {
                if (formationEditSlots[i] == null)
                {
                    return false;
                }
            }

            actionDepart.onClick.AddListener(OnDepartClicked);
            actionFace.onClick.AddListener(OnFaceClicked);
            actionEnter.onClick.AddListener(OnEnterClicked);
            actionSettle.onClick.AddListener(OnSettleClicked);
            battlePlayPause.onClick.AddListener(OnBattlePlayPauseClicked);
            battleReset.onClick.AddListener(OnBattleResetClicked);
            cardGeneralUse.onClick.AddListener(OnCardGeneralUseClicked);
            formationSwapFront.onClick.AddListener(OnFormationSwapFrontClicked);
            editFormation.onClick.AddListener(OnEditFormationClicked);
            formationEditConfirm.onClick.AddListener(OnFormationEditConfirmClicked);
            formationEditCancel.onClick.AddListener(OnFormationEditCancelClicked);
            formationEditReedit.onClick.AddListener(OnFormationEditReeditClicked);
            formationEditReset.onClick.AddListener(OnFormationEditResetClicked);
            if (formationEditUnits[0] != null) formationEditUnits[0].onClick.AddListener(OnFormationEditUnit0Clicked);
            if (formationEditUnits[1] != null) formationEditUnits[1].onClick.AddListener(OnFormationEditUnit1Clicked);
            if (formationEditUnits[2] != null) formationEditUnits[2].onClick.AddListener(OnFormationEditUnit2Clicked);
            if (formationEditUnits[3] != null) formationEditUnits[3].onClick.AddListener(OnFormationEditUnit3Clicked);
            if (formationEditUnits[4] != null) formationEditUnits[4].onClick.AddListener(OnFormationEditUnit4Clicked);
            if (formationEditUnits[5] != null) formationEditUnits[5].onClick.AddListener(OnFormationEditUnit5Clicked);
            if (formationEditSlots[0] != null) formationEditSlots[0].onClick.AddListener(OnFormationEditSlot0Clicked);
            if (formationEditSlots[1] != null) formationEditSlots[1].onClick.AddListener(OnFormationEditSlot1Clicked);
            if (formationEditSlots[2] != null) formationEditSlots[2].onClick.AddListener(OnFormationEditSlot2Clicked);
            if (formationEditSlots[3] != null) formationEditSlots[3].onClick.AddListener(OnFormationEditSlot3Clicked);
            if (formationEditSlots[4] != null) formationEditSlots[4].onClick.AddListener(OnFormationEditSlot4Clicked);
            if (formationEditSlots[5] != null) formationEditSlots[5].onClick.AddListener(OnFormationEditSlot5Clicked);
            if (formationEditSlots[6] != null) formationEditSlots[6].onClick.AddListener(OnFormationEditSlot6Clicked);
            if (formationEditSlots[7] != null) formationEditSlots[7].onClick.AddListener(OnFormationEditSlot7Clicked);
            if (formationEditSlots[8] != null) formationEditSlots[8].onClick.AddListener(OnFormationEditSlot8Clicked);
            formationEditFacingN.onClick.AddListener(OnFormationEditFacingNClicked);
            formationEditFacingE.onClick.AddListener(OnFormationEditFacingEClicked);
            formationEditFacingS.onClick.AddListener(OnFormationEditFacingSClicked);
            formationEditFacingW.onClick.AddListener(OnFormationEditFacingWClicked);
            mobilityRegroup.onClick.AddListener(OnMobilityRegroupClicked);
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
            Transform title = UguiHudBuilder.Find(gameplayRoot, UiElementNames.BattleHudTitle);
            if (title != null)
            {
                TextMeshProUGUI titleTmp = title.GetComponent<TextMeshProUGUI>();
                if (titleTmp != null)
                {
                    titleTmp.enabled = true;
                }
            }
            for (var i = 0; i < UiElementNames.GameplayFocusOrder.Length; i++)
            {
                focusOrder.Add(UiElementNames.GameplayFocusOrder[i]);
            }

            ApplyContentReceipt();
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
        public void TriggerBattlePlayPauseForTest() => OnBattlePlayPauseClicked();
        public void TriggerBattleResetForTest() => OnBattleResetClicked();
        public void TriggerCardGeneralUseForTest() => OnCardGeneralUseClicked();
        public void TriggerFormationSwapFrontForTest() => OnFormationSwapFrontClicked();
        public void TriggerEditFormationForTest() => OnEditFormationClicked();
        public void TriggerFormationEditConfirmForTest() => OnFormationEditConfirmClicked();
        public void TriggerFormationEditCancelForTest() => OnFormationEditCancelClicked();
        public void TriggerFormationEditReeditForTest() => OnFormationEditReeditClicked();
        public void TriggerFormationEditResetForTest() => OnFormationEditResetClicked();
        public void TriggerFormationEditUnitForTest(string unitId) => FormationEditUnitChosen?.Invoke(unitId);
        public void TriggerFormationEditSlotForTest(string slotId) => FormationEditSlotChosen?.Invoke(slotId);
        public void TriggerFormationEditFacingForTest(CardinalDirection facing) => FormationEditFacingChosen?.Invoke(facing);
        public void SetFormationEditVisible(bool visible)
        {
            SetVisible(UiElementNames.FormationEdit, visible);
            SetVisible(UiElementNames.BattleDock, !visible);
        }
        public void TriggerMobilityRegroupForTest() => OnMobilityRegroupClicked();
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

            ApplyContentReceipt();

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
            SetVisible(UiElementNames.DeployPanel, !battle);
            SetVisible("party-strip", !battle);
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
            SetActionVisible(UiElementNames.BattlePlayPause, snapshot.ShowBattlePlayPauseAction);
            SetActionVisible(UiElementNames.BattleReset, snapshot.ShowBattleResetAction);
            SetActionVisible(UiElementNames.FormationSwapFront, snapshot.ShowEditFormationAction);
            SetActionVisible(UiElementNames.EditFormation, snapshot.ShowEditFormationAction);
            SetActionState(UiElementNames.CardGeneralUse, snapshot.ShowCardGeneralUseAction, snapshot.CanUseGeneralCard);
            SetActionState(UiElementNames.MobilityRegroup, snapshot.ShowCardMobilityRegroupAction, snapshot.CanUseMobilityCard);
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
            if (hp != null)
            {
                hp.text = "HP " + snapshot.BattleHp.ToString(CultureInfo.InvariantCulture)
                    + "/" + snapshot.BattleMaxHp.ToString(CultureInfo.InvariantCulture);
            }
            Text formation = FindText(root, UiElementNames.FormationSelection);
            if (formation != null) formation.text = snapshot.FormationSelectionText ?? string.Empty;
            Text morale = FindText(root, UiElementNames.BattleMorale);
            if (morale != null)
            {
                morale.text = "사기 " + snapshot.PlayerMorale.ToString(CultureInfo.InvariantCulture)
                    + " / 적 " + snapshot.EnemyMorale.ToString(CultureInfo.InvariantCulture);
            }
            Text recharge = FindText(root, UiElementNames.CardGeneralRecharge);
            if (recharge != null)
            {
                recharge.text = "재충전 " + snapshot.GeneralRechargeTicksLeft.ToString(CultureInfo.InvariantCulture) + " tick";
            }
            Text flow = FindText(root, UiElementNames.BattlePlayPause);
            if (flow != null) flow.text = snapshot.BattlePaused ? "전투 재개" : "일시정지";
            SetFill(UiElementNames.BattleHpFill, snapshot.HpFill01);
            SetTmpText(UiElementNames.BattleCardOwner, snapshot.ActingCardOwnerText);
            SetTmpText(UiElementNames.BattleCardCooldownText, "재충전 " + snapshot.ActingCardCooldownTicksLeft.ToString(CultureInfo.InvariantCulture));
            SetTmpText(UiElementNames.BattleMoralePlayer, "아군 사기 " + snapshot.PlayerMorale.ToString(CultureInfo.InvariantCulture));
            SetTmpText(UiElementNames.BattleMoraleEnemy, "적 사기 " + snapshot.EnemyMorale.ToString(CultureInfo.InvariantCulture));
            SetTmpText(UiElementNames.BattleReinforcement, snapshot.BattleForecast ?? string.Empty);
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

            Text forecast = FindText(root, UiElementNames.BattleReinforcementForecast);
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

        void SetActionState(string name, bool visible, bool interactable)
        {
            Transform el = UguiHudBuilder.Find(root, name);
            if (el == null) return;
            el.gameObject.SetActive(visible);
            Button button = el.GetComponent<Button>();
            if (button != null) button.interactable = visible && interactable;
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
        void OnBattlePlayPauseClicked() => BattlePlayPauseChosen?.Invoke();
        void OnBattleResetClicked() => BattleResetChosen?.Invoke();
        void OnCardGeneralUseClicked() => CardGeneralUseChosen?.Invoke();
        void OnFormationSwapFrontClicked() => FormationSwapFrontChosen?.Invoke();
        void OnEditFormationClicked() => EditFormationChosen?.Invoke();
        void OnFormationEditConfirmClicked() => FormationEditConfirmChosen?.Invoke();
        void OnFormationEditCancelClicked() => FormationEditCancelChosen?.Invoke();
        void OnFormationEditReeditClicked() => FormationEditReeditChosen?.Invoke();
        void OnFormationEditResetClicked() => FormationEditResetChosen?.Invoke();
        void OnFormationEditUnit0Clicked() => FormationEditUnitChosen?.Invoke(UiElementNames.FormationEditUnitIds[0]);
        void OnFormationEditUnit1Clicked() => FormationEditUnitChosen?.Invoke(UiElementNames.FormationEditUnitIds[1]);
        void OnFormationEditUnit2Clicked() => FormationEditUnitChosen?.Invoke(UiElementNames.FormationEditUnitIds[2]);
        void OnFormationEditUnit3Clicked() => FormationEditUnitChosen?.Invoke(UiElementNames.FormationEditUnitIds[3]);
        void OnFormationEditUnit4Clicked() => FormationEditUnitChosen?.Invoke(UiElementNames.FormationEditUnitIds[4]);
        void OnFormationEditUnit5Clicked() => FormationEditUnitChosen?.Invoke(UiElementNames.FormationEditUnitIds[5]);
        void OnFormationEditSlot0Clicked() => FormationEditSlotChosen?.Invoke(UiElementNames.FormationEditSlotIds[0]);
        void OnFormationEditSlot1Clicked() => FormationEditSlotChosen?.Invoke(UiElementNames.FormationEditSlotIds[1]);
        void OnFormationEditSlot2Clicked() => FormationEditSlotChosen?.Invoke(UiElementNames.FormationEditSlotIds[2]);
        void OnFormationEditSlot3Clicked() => FormationEditSlotChosen?.Invoke(UiElementNames.FormationEditSlotIds[3]);
        void OnFormationEditSlot4Clicked() => FormationEditSlotChosen?.Invoke(UiElementNames.FormationEditSlotIds[4]);
        void OnFormationEditSlot5Clicked() => FormationEditSlotChosen?.Invoke(UiElementNames.FormationEditSlotIds[5]);
        void OnFormationEditSlot6Clicked() => FormationEditSlotChosen?.Invoke(UiElementNames.FormationEditSlotIds[6]);
        void OnFormationEditSlot7Clicked() => FormationEditSlotChosen?.Invoke(UiElementNames.FormationEditSlotIds[7]);
        void OnFormationEditSlot8Clicked() => FormationEditSlotChosen?.Invoke(UiElementNames.FormationEditSlotIds[8]);
        void OnFormationEditFacingNClicked() => FormationEditFacingChosen?.Invoke(CardinalDirection.North);
        void OnFormationEditFacingEClicked() => FormationEditFacingChosen?.Invoke(CardinalDirection.East);
        void OnFormationEditFacingSClicked() => FormationEditFacingChosen?.Invoke(CardinalDirection.South);
        void OnFormationEditFacingWClicked() => FormationEditFacingChosen?.Invoke(CardinalDirection.West);
        void OnMobilityRegroupClicked() => MobilityRegroupChosen?.Invoke();
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

        void ApplyContentReceipt()
        {
            if (cards == null || unitRoles == null || formations == null || stations == null || contentFingerprint == null)
            {
                return;
            }

            SetTmpText(UiElementNames.DataContentVersion,
                "DATA " + contentFingerprint.Version.ContentVersion);
            SetTmpText(UiElementNames.DataContentCounts,
                "cards " + cards.All.Count.ToString(CultureInfo.InvariantCulture)
                + " | roles " + unitRoles.All.Count.ToString(CultureInfo.InvariantCulture)
                + " | formations " + formations.All.Count.ToString(CultureInfo.InvariantCulture)
                + " | stations " + stations.All.Count.ToString(CultureInfo.InvariantCulture));
            SetTmpText(UiElementNames.DataContentFingerprint,
                "SHA-256 " + contentFingerprint.Sha256.Substring(0, 12));
        }

        void SetTmpText(string name, string value)
        {
            Transform element = UguiHudBuilder.Find(root, name);
            if (element == null) return;
            TMP_Text label = element == null ? null : element.GetComponent<TMP_Text>();
            if (label == null && element != null) label = element.GetComponentInChildren<TMP_Text>(true);
            if (label != null) label.text = value ?? string.Empty;
        }

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
            if (battlePlayPause != null) battlePlayPause.onClick.RemoveListener(OnBattlePlayPauseClicked);
            if (battleReset != null) battleReset.onClick.RemoveListener(OnBattleResetClicked);
            if (cardGeneralUse != null) cardGeneralUse.onClick.RemoveListener(OnCardGeneralUseClicked);
            if (formationSwapFront != null) formationSwapFront.onClick.RemoveListener(OnFormationSwapFrontClicked);
            if (editFormation != null) editFormation.onClick.RemoveListener(OnEditFormationClicked);
            if (formationEditConfirm != null) formationEditConfirm.onClick.RemoveListener(OnFormationEditConfirmClicked);
            if (formationEditCancel != null) formationEditCancel.onClick.RemoveListener(OnFormationEditCancelClicked);
            if (formationEditReedit != null) formationEditReedit.onClick.RemoveListener(OnFormationEditReeditClicked);
            if (formationEditReset != null) formationEditReset.onClick.RemoveListener(OnFormationEditResetClicked);
            if (formationEditUnits[0] != null) formationEditUnits[0].onClick.RemoveListener(OnFormationEditUnit0Clicked);
            if (formationEditUnits[1] != null) formationEditUnits[1].onClick.RemoveListener(OnFormationEditUnit1Clicked);
            if (formationEditUnits[2] != null) formationEditUnits[2].onClick.RemoveListener(OnFormationEditUnit2Clicked);
            if (formationEditUnits[3] != null) formationEditUnits[3].onClick.RemoveListener(OnFormationEditUnit3Clicked);
            if (formationEditUnits[4] != null) formationEditUnits[4].onClick.RemoveListener(OnFormationEditUnit4Clicked);
            if (formationEditUnits[5] != null) formationEditUnits[5].onClick.RemoveListener(OnFormationEditUnit5Clicked);
            if (formationEditSlots[0] != null) formationEditSlots[0].onClick.RemoveListener(OnFormationEditSlot0Clicked);
            if (formationEditSlots[1] != null) formationEditSlots[1].onClick.RemoveListener(OnFormationEditSlot1Clicked);
            if (formationEditSlots[2] != null) formationEditSlots[2].onClick.RemoveListener(OnFormationEditSlot2Clicked);
            if (formationEditSlots[3] != null) formationEditSlots[3].onClick.RemoveListener(OnFormationEditSlot3Clicked);
            if (formationEditSlots[4] != null) formationEditSlots[4].onClick.RemoveListener(OnFormationEditSlot4Clicked);
            if (formationEditSlots[5] != null) formationEditSlots[5].onClick.RemoveListener(OnFormationEditSlot5Clicked);
            if (formationEditSlots[6] != null) formationEditSlots[6].onClick.RemoveListener(OnFormationEditSlot6Clicked);
            if (formationEditSlots[7] != null) formationEditSlots[7].onClick.RemoveListener(OnFormationEditSlot7Clicked);
            if (formationEditSlots[8] != null) formationEditSlots[8].onClick.RemoveListener(OnFormationEditSlot8Clicked);
            if (formationEditFacingN != null) formationEditFacingN.onClick.RemoveListener(OnFormationEditFacingNClicked);
            if (formationEditFacingE != null) formationEditFacingE.onClick.RemoveListener(OnFormationEditFacingEClicked);
            if (formationEditFacingS != null) formationEditFacingS.onClick.RemoveListener(OnFormationEditFacingSClicked);
            if (formationEditFacingW != null) formationEditFacingW.onClick.RemoveListener(OnFormationEditFacingWClicked);
            if (mobilityRegroup != null) mobilityRegroup.onClick.RemoveListener(OnMobilityRegroupClicked);
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
            battlePlayPause = null;
            battleReset = null;
            cardGeneralUse = null;
            formationSwapFront = null;
            editFormation = null;
            formationEditConfirm = null;
            formationEditCancel = null;
            formationEditReedit = null;
            formationEditReset = null;
            for (var i = 0; i < formationEditUnits.Length; i++)
            {
                formationEditUnits[i] = null;
            }

            for (var i = 0; i < formationEditSlots.Length; i++)
            {
                formationEditSlots[i] = null;
            }

            formationEditFacingN = null;
            formationEditFacingE = null;
            formationEditFacingS = null;
            formationEditFacingW = null;
            mobilityRegroup = null;
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
