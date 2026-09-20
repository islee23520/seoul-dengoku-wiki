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
        public const string LocalReviewProvenanceBanner = "local-review-provenance-banner";
        public const string BattleDock = "battle-dock";
        public const string BattleHp = "battle-hp";
        public const string BattleHpMeter = "battle-hp-meter";
        public const string BattleHpFill = "battle-hp-fill";
        public const string BattleMorale = "battle-morale";
        public const string BattleMoralePlayer = "battle-morale-player";
        public const string BattleMoraleEnemy = "battle-morale-enemy";
        public const string BattleReinforcementForecast = "battle-reinforcement-forecast";
        public const string BattleReinforcement = "battle-reinforcement";
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
        public const string MissionConsole = "mission-console";
        public const string HubOvernightCopy = "hub-overnight-copy";
        public const string HubBulletinPanel = "hub-bulletin-panel";
        public const string DeployPanel = "deploy-panel";
        public const string DeployHeading = "deploy-heading";

        // Campaign-only chrome: HTML POC hub relations / territory / travel detail.
        // Battle stays isometric; none of these may move under the battle HUD.
        public const string TerritoryPanel = "territory-panel";
        public const string TerritoryHeading = "territory-heading";
        public const string TerritoryRowYeongdeungpo = "territory-row-Yeongdeungpo";
        public const string TerritoryRowSindorim = "territory-row-Sindorim";
        public const string TerritoryRowGuro = "territory-row-Guro";
        public const string RelationsHeading = "relations-heading";
        public const string RelationsRowExplorerMedic = "relations-row-explorer-medic";
        public const string RelationsRowExplorerPatrol = "relations-row-explorer-patrol";
        public const string RelationsRowMedicPatrol = "relations-row-medic-patrol";
        public const string TravelDetailHeading = "travel-detail-heading";
        public const string TravelPath = "travel-path";
        public const string TravelCost = "travel-cost";
        public const string TravelForecast = "travel-forecast";
        public const string TravelState = "travel-state";

        public const string DataContractPanel = "data-contract-panel";
        public const string DataContentVersion = "data-content-version";
        public const string DataContentCounts = "data-content-counts";
        public const string DataContentFingerprint = "data-content-fingerprint";
        public const string DataContractDisclosure = "data-contract-disclosure";
        public const string DataContractBody = "data-contract-body";

        public static string DeployToggle(int rosterIndex) => "deploy-toggle-" + rosterIndex;


        public const string Res720Class = "jk-res-720";
        public const string Res1080Class = "jk-res-1080";

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
            BattleHp,
            BattleHpMeter,
            BattleHpFill,
            BattleMorale,
            BattleMoralePlayer,
            BattleMoraleEnemy,
            BattleReinforcementForecast,
            BattleReinforcement,
            BattleHudTitle,
            BattleDock,
            DataContractDisclosure,
            DataContractBody,
            BattleLog,
            BattlePlayPause,
            BattleReset,
            SettlementPanel,
            SettlementOutcome,
            ActionSettle,
            ReturnAction,
            TerritoryPanel,
            TerritoryHeading,
            TerritoryRowYeongdeungpo,
            TerritoryRowSindorim,
            TerritoryRowGuro,
            RelationsHeading,
            RelationsRowExplorerMedic,
            RelationsRowExplorerPatrol,
            RelationsRowMedicPatrol,
            TravelDetailHeading,
            TravelPath,
            TravelCost,
            TravelForecast,
            TravelState,
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
            BattlePlayPause,
            BattleReset,
            ActionSettle,
            ReturnAction,
        };
    }
}
