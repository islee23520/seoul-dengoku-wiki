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
        public const string BattleGrid = "battle-grid";
        public const string BattleHp = "battle-hp";
        public const string BattleHpMeter = "battle-hp-meter";
        public const string BattleHpFill = "battle-hp-fill";
        public const string BattleMorale = "battle-morale";
        public const string BattleReinforcementForecast = "battle-reinforcement-forecast";
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
        public const string CardGeneralRecharge = "card-general-recharge";
        public const string CardGeneralUse = "card-general-use";
        public const string FormationSwapFront = "formation-swap-front";
        public const string FormationSelection = "formation-selection";
        public const string EditFormation = "edit-formation";
        public const string MobilityRegroup = "card-mobility-regroup";
        public const string MissionConsole = "mission-console";
        public const string HubOvernightCopy = "hub-overnight-copy";
        public const string HubBulletinPanel = "hub-bulletin-panel";
        public const string DeployPanel = "deploy-panel";
        public const string DeployHeading = "deploy-heading";

        public static string DeployToggle(int rosterIndex) => "deploy-toggle-" + rosterIndex;

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
            BattleReinforcementForecast,
            BattleLog,
            BattlePlayPause,
            CardGeneralRecharge,
            CardGeneralUse,
            FormationSwapFront,
            FormationSelection,
            EditFormation,
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
            ActionSettle,
            ReturnAction,
        };
    }
}
