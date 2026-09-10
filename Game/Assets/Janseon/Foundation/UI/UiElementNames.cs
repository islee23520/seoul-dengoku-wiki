namespace Janseon.Foundation.UI
{
    /// <summary>
    /// Machine-stable UI Toolkit element names (Design.md §11 + Todo 12 action seams).
    /// Not user-visible copy.
    /// </summary>
    public static class UiElementNames
    {
        public const string MainTitleRoot = "main-title-root";
        public const string MainTitleMark = "main-title-mark";
        public const string MainTitleStationMasterPreset = "main-title-preset-station-master";
        public const string MainTitleStart = "main-title-start";

        public const string GameplayRoot = "gameplay-root";
        public const string ClockLabel = "clock-label";
        public const string StageRail = "stage-rail";
        public const string StageBasePrep = "stage-base-prep";
        public const string StageExpedition = "stage-expedition";
        public const string StageEncounter = "stage-encounter";
        public const string StageResolution = "stage-resolution";
        public const string StageSettlement = "stage-settlement";
        public const string StageBaseReady = "stage-base-ready";

        public const string RouteRail = "route-rail";
        public const string StationYeongdeungpo = "station-Yeongdeungpo";
        public const string StationSindorim = "station-Sindorim";
        public const string StationGuro = "station-Guro";

        public const string EncounterChoices = "encounter-choices";
        public const string ChoiceNegotiate = "choice-negotiate";
        public const string ChoiceBypass = "choice-bypass";
        public const string ChoiceCombat = "choice-combat";

        public const string BattleHud = "battle-hud";
        public const string BattleHudTitle = "battle-hud-title";
        public const string BattleDock = "battle-dock";
        public const string BattleGrid = "battle-grid";
        public const string BattleHp = "battle-hp";
        public const string BattleHpMeter = "battle-hp-meter";
        public const string BattleHpFill = "battle-hp-fill";
        public const string BattleMorale = "battle-morale";
        public const string BattleMoralePlayer = "battle-morale-player";
        public const string BattleMoraleEnemy = "battle-morale-enemy";
        public const string BattleReinforcementForecast = "battle-reinforcement-forecast";
        public const string BattleReinforcement = "battle-reinforcement";
        public const string BattleCardTray = "battle-card-tray";
        public const string BattleCardOwner = "battle-card-owner";
        public const string BattleCardOwnerPortrait = "battle-card-owner-portrait";
        public const string BattleStrongholdSwitch = "battle-card-stronghold-switch";
        public const string BattleZoomOut = "battle-zoom-out";
        public const string BattleZoomValue = "battle-zoom-value";
        public const string BattleZoomIn = "battle-zoom-in";
        public const string BattleZoomReset = "battle-zoom-reset";
        public const string DataContractDisclosure = "data-contract-disclosure";
        public const string DataContractBody = "data-contract-body";
        public const string BattleCardCooldown = "battle-card-cooldown";
        public const string BattleCardCooldownMask = "battle-card-cooldown-mask";
        public const string BattleCardCooldownText = "battle-card-cooldown-text";
        public const string BattleCardTargetRing = "battle-card-target-ring";
        public const string BattleCardDirectionNorth = "battle-card-direction-n";
        public const string BattleCardDirectionEast = "battle-card-direction-e";
        public const string BattleCardDirectionSouth = "battle-card-direction-s";
        public const string BattleCardDirectionWest = "battle-card-direction-w";
        public const string BattleCardCancel = "battle-card-cancel";
        public const string BattleCardCancelPath = "battle-card-cancel-path";
        public const string BattleLog = "battle-log";

        public const string SettlementPanel = "settlement-panel";
        public const string SettlementOutcome = "settlement-outcome";
        public const string ReturnAction = "return-action";

        // Todo 12 core-loop action seams (Foundation gameplay document).
        public const string ActionDepart = "action-depart";
        public const string ActionFaceEncounter = "action-face-encounter";
        public const string ActionEnterResolution = "action-enter-resolution";
        public const string ActionSettle = "action-settle";
        public const string BattlePlayPause = "battle-play-pause";
        public const string BattleReset = "battle-reset";
        public const string CardGeneralRecharge = "card-general-recharge";
        public const string CardGeneralUse = "card-general-use";
        public const string FormationSwapFront = "formation-swap-front";
        public const string FormationSelection = "formation-selection";
        public const string EditFormation = "edit-formation";
        public const string FormationEdit = "formation-edit";
        public const string FormationEditConfirm = "formation-edit-confirm";
        public const string FormationEditCancel = "formation-edit-cancel";
        public const string FormationEditReedit = "formation-edit-reedit";
        public const string FormationEditReset = "formation-edit-reset";
        public const string FormationEditSelectedName = "formation-edit-selected-name";
        public const string FormationEditSelectedRole = "formation-edit-selected-role";
        public const string FormationEditSelectedCallsign = "formation-edit-selected-callsign";
        public const string FormationEditFacingN = "formation-edit-facing-n";
        public const string FormationEditFacingE = "formation-edit-facing-e";
        public const string FormationEditFacingS = "formation-edit-facing-s";
        public const string FormationEditFacingW = "formation-edit-facing-w";

        public static string FormationEditUnit(string unitId) => "formation-edit-unit-" + unitId;

        public static string FormationEditSlot(string slotId) => "formation-edit-slot-" + slotId;

        public static readonly string[] FormationEditUnitIds =
        {
            "ally-guard-1",
            "ally-guard-2",
            "ally-assault-1",
            "ally-assault-2",
            "ally-archer-1",
            "ally-archer-2",
        };

        public static readonly string[] FormationEditSlotIds =
        {
            "front-left",
            "front-center",
            "front-right",
            "middle-left",
            "middle-center",
            "middle-right",
            "rear-left",
            "rear-center",
            "rear-right",
        };
        public const string MobilityRegroup = "card-mobility-regroup";
        public const string MissionConsole = "mission-console";
        public const string HubOvernightCopy = "hub-overnight-copy";
        public const string HubBulletinPanel = "hub-bulletin-panel";
        public const string DeployPanel = "deploy-panel";
        public const string DeployHeading = "deploy-heading";

        public const string DataContractPanel = "data-contract-panel";
        public const string DataContentVersion = "data-content-version";
        public const string DataContentCounts = "data-content-counts";
        public const string DataContentFingerprint = "data-content-fingerprint";

        public static string DeployToggle(int rosterIndex) => "deploy-toggle-" + rosterIndex;

        public static string BattleCard(string cardId) => "battle-card-" + cardId;

        public const string Res720Class = "jk-res-720";
        public const string Res1080Class = "jk-res-1080";

        public static string BattleCell(int x, int y) => "battle-cell-" + x + "-" + y;

        public static readonly string[] MainTitleRequired =
        {
            MainTitleRoot,
            MainTitleMark,
            MainTitleStationMasterPreset,
            MainTitleStart,
        };

        public static readonly string[] GameplayRequired =
        {
            GameplayRoot,
            ClockLabel,
            StageRail,
            StageBasePrep,
            StageExpedition,
            StageEncounter,
            StageResolution,
            StageSettlement,
            StageBaseReady,
            RouteRail,
            StationYeongdeungpo,
            StationSindorim,
            StationGuro,
            HubOvernightCopy,
            HubBulletinPanel,
            DeployPanel,
            DataContractPanel,
            DataContentVersion,
            DataContentCounts,
            DataContentFingerprint,
            ActionDepart,
            ActionFaceEncounter,
            ActionEnterResolution,
            EncounterChoices,
            ChoiceNegotiate,
            ChoiceBypass,
            ChoiceCombat,
            BattleHud,
            BattleGrid,
            BattleHp,
            BattleHpMeter,
            BattleHpFill,
            BattleMorale,
            BattleMoralePlayer,
            BattleMoraleEnemy,
            BattleReinforcementForecast,
            BattleReinforcement,
            BattleCardTray,
            BattleCardOwner,
            BattleCardOwnerPortrait,
            BattleHudTitle,
            BattleDock,
            BattleStrongholdSwitch,
            BattleZoomOut,
            BattleZoomValue,
            BattleZoomIn,
            BattleZoomReset,
            DataContractDisclosure,
            DataContractBody,
            "battle-card-guard-shieldwall",
            "battle-card-encourage-morale",
            "battle-card-pincer-focus",
            "battle-card-mobility-regroup",
            BattleCardCooldown,
            BattleCardCooldownMask,
            BattleCardCooldownText,
            BattleCardTargetRing,
            BattleCardDirectionNorth,
            BattleCardDirectionEast,
            BattleCardDirectionSouth,
            BattleCardDirectionWest,
            BattleCardCancel,
            BattleCardCancelPath,
            BattleLog,
            BattlePlayPause,
            BattleReset,
            CardGeneralRecharge,
            CardGeneralUse,
            FormationSwapFront,
            FormationSelection,
            EditFormation,
            FormationEdit,
            FormationEditConfirm,
            FormationEditCancel,
            FormationEditReedit,
            FormationEditReset,
            FormationEditSelectedName,
            FormationEditSelectedRole,
            FormationEditSelectedCallsign,
            FormationEditUnit("ally-guard-1"),
            FormationEditUnit("ally-guard-2"),
            FormationEditUnit("ally-assault-1"),
            FormationEditUnit("ally-assault-2"),
            FormationEditUnit("ally-archer-1"),
            FormationEditUnit("ally-archer-2"),
            FormationEditSlot("front-left"),
            FormationEditSlot("front-center"),
            FormationEditSlot("front-right"),
            FormationEditSlot("middle-left"),
            FormationEditSlot("middle-center"),
            FormationEditSlot("middle-right"),
            FormationEditSlot("rear-left"),
            FormationEditSlot("rear-center"),
            FormationEditSlot("rear-right"),
            FormationEditFacingN,
            FormationEditFacingE,
            FormationEditFacingS,
            FormationEditFacingW,
            MobilityRegroup,
            SettlementPanel,
            SettlementOutcome,
            ActionSettle,
            ReturnAction,
        };

        public static readonly string[] MainTitleFocusOrder =
        {
            MainTitleStart,
        };

        public static readonly string[] GameplayFocusOrder =
        {
            DeployToggle(0),
            DeployToggle(1),
            DeployToggle(2),
            ActionDepart,
            StationYeongdeungpo,
            StationSindorim,
            StationGuro,
            ActionFaceEncounter,
            ActionEnterResolution,
            ChoiceNegotiate,
            ChoiceBypass,
            ChoiceCombat,
            FormationSwapFront,
            EditFormation,
            CardGeneralUse,
            MobilityRegroup,
            BattlePlayPause,
            BattleReset,
            ActionSettle,
            ReturnAction,
        };
    }
}
