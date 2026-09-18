using System.Collections.Generic;
using System.Globalization;
using System.Text;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
using Janseon.Core.Battle.Sim;

namespace Janseon.Foundation.UI
{
    public enum GameplayPanelId
    {
        None = 0,
        RouteStage = 1,
        Encounter = 2,
        Battle = 3,
        Settlement = 4,
    }

    /// <summary>
    /// Deterministic UI snapshot derived from Core campaign/battle state (Design.md §5.2).
    /// </summary>
    public sealed class GameplayUiSnapshot
    {
        public GameplayPanelId VisiblePanel { get; private set; }
        public string CurrentStageElement { get; private set; } = string.Empty;
        public string CurrentStationElement { get; private set; } = string.Empty;
        public string Fingerprint { get; private set; } = string.Empty;
        public Dictionary<string, bool> NamedFlags { get; } = new Dictionary<string, bool>();
        public Dictionary<string, string> BattleCellOccupancy { get; } = new Dictionary<string, string>();
        public int BattleHp { get; private set; }
        public int BattleMaxHp { get; private set; }
        public float HpFill01 { get; private set; }
        public int PlayerMorale { get; private set; }
        public int EnemyMorale { get; private set; }
        public int GeneralRechargeTicksLeft { get; private set; }
        public string ActingCardOwnerText { get; private set; } = string.Empty;
        public int ActingCardCooldownTicksLeft { get; private set; }
        public int NextReinforcementTick { get; private set; } = -1;
        public int RemainingReinforcementCount { get; private set; }
        public bool BattlePaused { get; private set; }
        public string FormationSelectionText { get; private set; } = string.Empty;
        public string SettlementOutcomeCode { get; private set; } = string.Empty;
        public string SettlementOutcomeText { get; private set; } = string.Empty;
        public List<string> BattleLogEntries { get; } = new List<string>();
        public List<string> PartyNames { get; } = new List<string>();
        public List<int> PartyHp { get; } = new List<int>();
        public List<int> PartyMaxHp { get; } = new List<int>();
        public List<string> DeployUnitIds { get; } = new List<string>();
        public List<int> DeployHp { get; } = new List<int>();
        public List<bool> DeployParticipating { get; } = new List<bool>();
        public List<bool> DeployWounded { get; } = new List<bool>();
        public string EncounterContext { get; private set; } = string.Empty;
        public string WhyText { get; private set; } = string.Empty;
        public string BattleForecast { get; private set; } = string.Empty;
        public int ClockTick { get; private set; }
        public string ClockText { get; private set; } = string.Empty;
        public bool ShowOvernightCopy { get; private set; }
        public bool ShowBulletinPanel { get; private set; }

        public bool ShowDepartAction { get; private set; }
        public bool ShowTravelActions { get; private set; }
        public StationId[] TravelNeighbors { get; private set; } = System.Array.Empty<StationId>();
        public bool ShowFaceAction { get; private set; }
        public bool ShowEnterResolutionAction { get; private set; }
        public bool ShowSettleAction { get; private set; }
        public bool ShowBattlePlayPauseAction { get; private set; }
        public bool ShowBattleResetAction { get; private set; }
        public bool ShowCardGeneralUseAction { get; private set; }
        public bool ShowEditFormationAction { get; private set; }
        public bool ShowCardMobilityRegroupAction { get; private set; }
        public bool CanUseGeneralCard { get; private set; }
        public bool CanUseGuardCard { get; private set; }
        public bool CanUsePincerCard { get; private set; }
        public bool CanUseMobilityCard { get; private set; }
        public bool ShowReturnAction { get; private set; }

        public static GameplayUiSnapshot FromCampaign(
            CampaignState campaign,
            BattleSimState battle,
            bool battlePaused = false,
            FormationSlot[] pendingFormation = null,
            RouteGraph graph = null)
        {
            var snap = new GameplayUiSnapshot { BattlePaused = battlePaused };
            if (campaign == null)
            {
                snap.VisiblePanel = GameplayPanelId.None;
                snap.Fingerprint = snap.ComputeFingerprint(null, battle);
                return snap;
            }

            snap.CurrentStageElement = StageElement(campaign.Stage);
            snap.CurrentStationElement = StationElement(campaign.Node);
            snap.ClockTick = campaign.Tick.Value;
            snap.ClockText = FormatClock(campaign.Tick);
            snap.ShowOvernightCopy = !string.IsNullOrEmpty(campaign.OvernightCopy);
            snap.ShowBulletinPanel = campaign.HasBulletin
                && campaign.HomeBase.Equals(StationId.Yeongdeungpo);
            snap.NamedFlags[UiElementNames.HubOvernightCopy + ":visible"] = snap.ShowOvernightCopy;
            snap.NamedFlags[UiElementNames.HubBulletinPanel + ":visible"] = snap.ShowBulletinPanel;
            FillDeployment(snap, campaign);
            snap.EncounterContext = campaign.Node.Value
                + " · "
                + campaign.Stage.ToString()
                + " · 자원 "
                + campaign.Resources.ToString(CultureInfo.InvariantCulture)
                + " · 평판 "
                + campaign.Reputation.ToString(CultureInfo.InvariantCulture);
            snap.NamedFlags[snap.CurrentStageElement + ":current"] = true;
            snap.NamedFlags[snap.CurrentStationElement + ":current"] = true;

            if (battle != null && campaign.PendingBattle != null
                && campaign.Stage == CampaignStage.Resolution
                && battle.Outcome == BattleOutcomeKind.Ongoing)
            {
                snap.VisiblePanel = GameplayPanelId.Battle;
                ConfigureBattleActions(snap, battle);
                FillBattle(snap, battle, pendingFormation);
            }
            else if (battle != null && campaign.PendingBattle != null
                     && campaign.Stage == CampaignStage.Resolution
                     && battle.Outcome != BattleOutcomeKind.Ongoing
                     && !campaign.SettlementApplied)
            {
                snap.VisiblePanel = GameplayPanelId.Settlement;
                snap.ShowSettleAction = true;
                snap.NamedFlags[UiElementNames.SettlementPanel + ":visible"] = true;
                snap.NamedFlags[UiElementNames.ActionSettle + ":visible"] = true;
                snap.NamedFlags[UiElementNames.SettlementOutcome + ":visible"] = true;
                FillSettlement(snap, campaign);
                if (string.IsNullOrEmpty(snap.SettlementOutcomeText))
                {
                    snap.SettlementOutcomeCode = "combat-pending-settle";
                    snap.SettlementOutcomeText = battle.Outcome == BattleOutcomeKind.PlayerVictory
                        ? "전투 승리 · 정산 대기"
                        : "전투 패배 · 정산 대기";
                }
            }
            else if (campaign.Stage == CampaignStage.Settlement && campaign.SettlementApplied)
            {
                snap.VisiblePanel = GameplayPanelId.Settlement;
                snap.ShowReturnAction = true;
                snap.NamedFlags[UiElementNames.SettlementPanel + ":visible"] = true;
                snap.NamedFlags[UiElementNames.ReturnAction + ":visible"] = true;
                snap.NamedFlags[UiElementNames.SettlementOutcome + ":visible"] = true;
                FillSettlement(snap, campaign);
            }
            else if (campaign.Stage == CampaignStage.Settlement && !campaign.SettlementApplied
                     && campaign.Choice != EncounterChoice.None && campaign.Choice != EncounterChoice.Combat)
            {
                snap.VisiblePanel = GameplayPanelId.Settlement;
                snap.ShowSettleAction = true;
                snap.NamedFlags[UiElementNames.SettlementPanel + ":visible"] = true;
                snap.NamedFlags[UiElementNames.ActionSettle + ":visible"] = true;
                FillSettlement(snap, campaign);
            }
            else if (campaign.Stage == CampaignStage.Resolution && campaign.PendingBattle == null
                     && !campaign.ChoiceLocked)
            {
                snap.VisiblePanel = GameplayPanelId.Encounter;
                snap.NamedFlags[UiElementNames.EncounterChoices + ":visible"] = true;
                snap.NamedFlags[UiElementNames.ChoiceNegotiate + ":visible"] = true;
                snap.NamedFlags[UiElementNames.ChoiceBypass + ":visible"] = true;
                snap.NamedFlags[UiElementNames.ChoiceCombat + ":visible"] = true;
            }
            else if (campaign.Stage == CampaignStage.Resolution && campaign.PendingBattle != null && battle != null)
            {
                snap.VisiblePanel = GameplayPanelId.Battle;
                ConfigureBattleActions(snap, battle);
                FillBattle(snap, battle, pendingFormation);
            }
            else if (campaign.Stage == CampaignStage.Encounter)
            {
                snap.VisiblePanel = GameplayPanelId.RouteStage;
                snap.ShowEnterResolutionAction = true;
                snap.NamedFlags[UiElementNames.RouteRail + ":visible"] = true;
                snap.NamedFlags[UiElementNames.StageRail + ":visible"] = true;
                snap.NamedFlags[UiElementNames.ActionEnterResolution + ":visible"] = true;
            }
            else if (campaign.Stage == CampaignStage.ExpeditionTravel)
            {
                snap.VisiblePanel = GameplayPanelId.RouteStage;
                snap.ShowTravelActions = true;
                if (graph != null)
                {
                    snap.TravelNeighbors = graph.Neighbors(campaign.Node);
                }
                snap.ShowFaceAction = !campaign.Node.Equals(campaign.HomeBase);
                snap.NamedFlags[UiElementNames.RouteRail + ":visible"] = true;
                snap.NamedFlags[UiElementNames.StageRail + ":visible"] = true;
                snap.NamedFlags[UiElementNames.ActionFaceEncounter + ":visible"] = snap.ShowFaceAction;
            }
            else if (campaign.Stage == CampaignStage.BasePreparation
                     || campaign.Stage == CampaignStage.BaseReady)
            {
                snap.VisiblePanel = GameplayPanelId.RouteStage;
                snap.ShowDepartAction = true;
                snap.NamedFlags[UiElementNames.RouteRail + ":visible"] = true;
                snap.NamedFlags[UiElementNames.StageRail + ":visible"] = true;
                snap.NamedFlags[UiElementNames.ActionDepart + ":visible"] = true;
            }
            else
            {
                snap.VisiblePanel = GameplayPanelId.RouteStage;
                snap.NamedFlags[UiElementNames.RouteRail + ":visible"] = true;
                snap.NamedFlags[UiElementNames.StageRail + ":visible"] = true;
            }

            snap.Fingerprint = snap.ComputeFingerprint(campaign, battle, graph);
            return snap;
        }

        static void FillDeployment(GameplayUiSnapshot snap, CampaignState campaign)
        {
            DeploymentState deployment = campaign.Deployment
                ?? DeploymentApi.Create(campaign.PartyMemberCount, campaign.PartyHp);
            for (var i = 0; i < deployment.RosterCount; i++)
            {
                snap.DeployUnitIds.Add(deployment.UnitIdAt(i));
                snap.DeployHp.Add(deployment.HpAt(i));
                snap.DeployParticipating.Add(deployment.IsParticipatingAt(i));
                snap.DeployWounded.Add(deployment.IsWoundedAt(i));
            }
        }

        static void FillSettlement(GameplayUiSnapshot snap, CampaignState campaign)
        {
            string code;
            switch (campaign.Choice)
            {
                case EncounterChoice.Negotiate:
                    code = "negotiate";
                    break;
                case EncounterChoice.Bypass:
                    code = "bypass";
                    break;
                case EncounterChoice.Combat:
                    code = "combat";
                    break;
                default:
                    code = "settled";
                    break;
            }

            if (campaign.SettlementApplied && !string.IsNullOrEmpty(campaign.SettledResultId))
            {
                code = code + ":" + campaign.SettledResultId;
            }

            if (!string.IsNullOrEmpty(campaign.LastReceiptHash))
            {
                var hash = campaign.LastReceiptHash;
                code = code + "#" + (hash.Length > 12 ? hash.Substring(0, 12) : hash);
            }

            snap.SettlementOutcomeCode = code;
            var sb = new StringBuilder(64);
            switch (campaign.Choice)
            {
                case EncounterChoice.Negotiate:
                    sb.Append("교섭 정산");
                    break;
                case EncounterChoice.Bypass:
                    sb.Append("우회 정산");
                    break;
                case EncounterChoice.Combat:
                    sb.Append("전투 정산");
                    break;
                default:
                    sb.Append("정산 완료");
                    break;
            }

            if (campaign.SettlementApplied)
            {
                sb.Append(" · 적용");
            }

            if (!string.IsNullOrEmpty(campaign.SettledResultId))
            {
                sb.Append(' ').Append(campaign.SettledResultId);
            }

            snap.SettlementOutcomeText = sb.ToString();
            snap.NamedFlags[UiElementNames.SettlementOutcome + ":bound"] = true;
        }

        static void ConfigureBattleActions(GameplayUiSnapshot snap, BattleSimState battle)
        {
            bool ongoing = battle.Outcome == BattleOutcomeKind.Ongoing;
            snap.ShowEditFormationAction = ongoing && !battle.Deployed;
            snap.ShowBattlePlayPauseAction = ongoing && battle.Deployed;
            snap.ShowBattleResetAction = ongoing;
            snap.ShowCardGeneralUseAction = ongoing && battle.Deployed;
            snap.ShowCardMobilityRegroupAction = ongoing && battle.Deployed;
            snap.NamedFlags[UiElementNames.EditFormation + ":visible"] = snap.ShowEditFormationAction;
            snap.NamedFlags[UiElementNames.BattlePlayPause + ":visible"] = snap.ShowBattlePlayPauseAction;
            snap.NamedFlags[UiElementNames.BattleReset + ":visible"] = snap.ShowBattleResetAction;
            snap.NamedFlags[UiElementNames.CardGeneralUse + ":visible"] = snap.ShowCardGeneralUseAction;
            snap.NamedFlags[UiElementNames.MobilityRegroup + ":visible"] = snap.ShowCardMobilityRegroupAction;
        }

        static void FillBattle(
            GameplayUiSnapshot snap,
            BattleSimState battle,
            FormationSlot[] pendingFormation)
        {
            snap.NamedFlags[UiElementNames.BattleHud + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleGrid + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleHp + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleHpMeter + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleMorale + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleMoralePlayer + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleMoraleEnemy + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleReinforcementForecast + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleReinforcement + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleCardTray + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleCardOwner + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleCardCooldown + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleCardTargetRing + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleCardCancel + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleLog + ":visible"] = true;
            snap.NamedFlags[UiElementNames.CardGeneralRecharge + ":visible"] = true;
            snap.NamedFlags[UiElementNames.FormationSelection + ":visible"] = !battle.Deployed;
            if (!battle.Deployed && pendingFormation != null && pendingFormation.Length >= 2)
            {
                FormationSlot first = pendingFormation[0];
                FormationSlot second = pendingFormation[1];
                snap.FormationSelectionText = first.Unit + "@"
                    + first.Row.ToString(CultureInfo.InvariantCulture) + ","
                    + first.Column.ToString(CultureInfo.InvariantCulture) + " | "
                    + second.Unit + "@"
                    + second.Row.ToString(CultureInfo.InvariantCulture) + ","
                    + second.Column.ToString(CultureInfo.InvariantCulture);
            }

            if (battle.Sides != null && battle.Sides.Length >= 2)
            {
                snap.PlayerMorale = battle.Sides[0].Morale;
                snap.EnemyMorale = battle.Sides[1].Morale;
            }

            if (battle.Cards != null)
            {
                for (var i = 0; i < battle.Cards.Length; i++)
                {
                    CardState card = battle.Cards[i];
                    if (!card.OwnerUnitId.Equals(battle.PlayerCommanderId)) continue;
                    if (card.Id == "encourage-morale")
                    {
                        snap.GeneralRechargeTicksLeft = card.RechargeTicksLeft;
                        snap.ActingCardCooldownTicksLeft = card.RechargeTicksLeft;
                        snap.ActingCardOwnerText = battle.PlayerCommanderId.ToString();
                        snap.CanUseGeneralCard = battle.Deployed && card.RechargeTicksLeft == 0;
                    }
                    else if (card.Id == "guard-shieldwall")
                    {
                        snap.CanUseGuardCard = battle.Deployed && card.RechargeTicksLeft == 0;
                    }
                    else if (card.Id == "pincer-focus")
                    {
                        snap.CanUsePincerCard = battle.Deployed && card.RechargeTicksLeft == 0;
                    }
                    else if (card.Id == "mobility-regroup")
                    {
                        snap.CanUseMobilityCard = battle.Deployed && card.RechargeTicksLeft == 0;
                    }
                }
            }

            if (battle.Telegraphs != null)
            {
                for (var i = 0; i < battle.Telegraphs.Length; i++)
                {
                    TelegraphState telegraph = battle.Telegraphs[i];
                    if (telegraph.Arrived) continue;
                    snap.RemainingReinforcementCount += telegraph.Count;
                    if (snap.NextReinforcementTick < 0 || telegraph.ArrivalTick < snap.NextReinforcementTick)
                    {
                        snap.NextReinforcementTick = telegraph.ArrivalTick;
                    }
                }
            }

            snap.BattleForecast = snap.NextReinforcementTick < 0
                ? "증원 예고 없음"
                : "증원 " + snap.RemainingReinforcementCount.ToString(CultureInfo.InvariantCulture)
                    + "명 · 도착 tick " + snap.NextReinforcementTick.ToString(CultureInfo.InvariantCulture);

            if (battle.Units == null) return;
            UnitState active = null;
            for (var i = 0; i < battle.Units.Length; i++)
            {
                UnitState unit = battle.Units[i];
                if (unit != null && unit.Side == 0 && unit.State != "Down")
                {
                    active = unit;
                    break;
                }
            }
            if (active != null)
            {
                snap.BattleHp = active.Hp;
                snap.BattleMaxHp = active.MaxHp > 0 ? active.MaxHp : 1;
                snap.HpFill01 = Clamp01((float)snap.BattleHp / snap.BattleMaxHp);
                snap.NamedFlags[UiElementNames.BattleHp + ":bound"] = true;
            }

            for (var i = 0; i < battle.Units.Length; i++)
            {
                UnitState unit = battle.Units[i];
                if (unit == null || unit.State == "Down") continue;
                int displayX = battle.Arena == null || battle.Arena.Width <= 1
                    ? 0
                    : unit.Cell.X * 4 / (battle.Arena.Width - 1);
                int displayY = battle.Arena == null || battle.Arena.Height <= 1
                    ? 0
                    : unit.Cell.Y * 4 / (battle.Arena.Height - 1);
                string key = UiElementNames.BattleCell(displayX, displayY);
                snap.BattleCellOccupancy[key] = unit.Side == 0 ? "ally" : "foe";
                snap.BattleLogEntries.Add(
                    (unit.Side == 0 ? "ally" : "foe")
                    + "@" + unit.Cell.X.ToString(CultureInfo.InvariantCulture)
                    + "," + unit.Cell.Y.ToString(CultureInfo.InvariantCulture)
                    + " hp=" + unit.Hp.ToString(CultureInfo.InvariantCulture)
                    + "/" + unit.MaxHp.ToString(CultureInfo.InvariantCulture));
                if (unit.Side == 0)
                {
                    snap.PartyNames.Add(unit.Id.ToString());
                    snap.PartyHp.Add(unit.Hp);
                    snap.PartyMaxHp.Add(unit.MaxHp);
                }
            }
            if (snap.BattleLogEntries.Count > 0) snap.NamedFlags[UiElementNames.BattleLog + ":bound"] = true;
        }

        static float Clamp01(float v)
        {
            if (v < 0f)
            {
                return 0f;
            }

            if (v > 1f)
            {
                return 1f;
            }

            return v;
        }

        public static string FormatClock(Tick tick)
        {
            return "T+" + tick.Value.ToString(CultureInfo.InvariantCulture);
        }

        public static string StageElement(CampaignStage stage)
        {
            switch (stage)
            {
                case CampaignStage.BasePreparation:
                    return UiElementNames.StageBasePrep;
                case CampaignStage.ExpeditionTravel:
                    return UiElementNames.StageExpedition;
                case CampaignStage.Encounter:
                    return UiElementNames.StageEncounter;
                case CampaignStage.Resolution:
                    return UiElementNames.StageResolution;
                case CampaignStage.Settlement:
                    return UiElementNames.StageSettlement;
                case CampaignStage.BaseReady:
                    return UiElementNames.StageBaseReady;
                default:
                    return UiElementNames.StageBasePrep;
            }
        }

        public static string StationElement(StationId station)
        {
            var value = station.Value ?? string.Empty;
            if (string.Equals(value, StationId.Yeongdeungpo.Value, System.StringComparison.Ordinal))
            {
                return UiElementNames.StationYeongdeungpo;
            }

            if (string.Equals(value, StationId.Sindorim.Value, System.StringComparison.Ordinal))
            {
                return UiElementNames.StationSindorim;
            }

            if (string.Equals(value, StationId.Guro.Value, System.StringComparison.Ordinal))
            {
                return UiElementNames.StationGuro;
            }

            return "station-" + value;
        }

        string ComputeFingerprint(CampaignState campaign, BattleSimState battle, RouteGraph graph = null)
        {
            var sb = new StringBuilder(128);
            sb.Append("panel=").Append(((int)VisiblePanel).ToString(CultureInfo.InvariantCulture));
            sb.Append(";stageEl=").Append(CurrentStageElement ?? string.Empty);
            sb.Append(";stationEl=").Append(CurrentStationElement ?? string.Empty);
            sb.Append(";hp=").Append(BattleHp.ToString(CultureInfo.InvariantCulture));
            sb.Append(";morale=").Append(PlayerMorale.ToString(CultureInfo.InvariantCulture));
            sb.Append(',').Append(EnemyMorale.ToString(CultureInfo.InvariantCulture));
            sb.Append(";generalRecharge=").Append(GeneralRechargeTicksLeft.ToString(CultureInfo.InvariantCulture));
            sb.Append(";cardOwner=").Append(ActingCardOwnerText ?? string.Empty);
            sb.Append(";cardCooldown=").Append(ActingCardCooldownTicksLeft.ToString(CultureInfo.InvariantCulture));
            sb.Append(";reinforcement=").Append(NextReinforcementTick.ToString(CultureInfo.InvariantCulture));
            sb.Append(',').Append(RemainingReinforcementCount.ToString(CultureInfo.InvariantCulture));
            sb.Append(";paused=").Append(BattlePaused ? '1' : '0');
            sb.Append(";formation=").Append(FormationSelectionText ?? string.Empty);
            sb.Append(";out=").Append(SettlementOutcomeCode ?? string.Empty);
            sb.Append(";clock=").Append(ClockTick.ToString(CultureInfo.InvariantCulture));
            if (campaign != null)
            {
                sb.Append(";stage=").Append(((int)campaign.Stage).ToString(CultureInfo.InvariantCulture));
                sb.Append(";node=").Append(campaign.Node.Value ?? string.Empty);
                sb.Append(";tick=").Append(campaign.Tick.Value.ToString(CultureInfo.InvariantCulture));
                sb.Append(";seed=").Append(campaign.Seed.ToString(CultureInfo.InvariantCulture));
                sb.Append(";preset=").Append(((int)campaign.StartingPreset).ToString(CultureInfo.InvariantCulture));
                sb.Append(";party=").Append(campaign.PartyMemberCount.ToString(CultureInfo.InvariantCulture));
                sb.Append(";deploy=").Append(campaign.Deployment != null ? campaign.Deployment.Fingerprint() : string.Empty);
                sb.Append(";stronghold=").Append(campaign.HasStronghold ? "1" : "0");
                sb.Append(";bulletin=").Append(campaign.HasBulletin ? "1" : "0");
                sb.Append(";choice=").Append(((int)campaign.Choice).ToString(CultureInfo.InvariantCulture));
                sb.Append(";settled=").Append(campaign.SettlementApplied ? "1" : "0");
            }

            if (TravelNeighbors != null && TravelNeighbors.Length > 0)
            {
                sb.Append(";neighbors=");
                for (var i = 0; i < TravelNeighbors.Length; i++)
                {
                    if (i > 0)
                    {
                        sb.Append(',');
                    }

                    sb.Append(TravelNeighbors[i].Value ?? string.Empty);
                }
            }

            if (battle != null)
            {
                sb.Append(";btick=").Append(battle.Tick.ToString(CultureInfo.InvariantCulture));
                sb.Append(";bout=").Append(((int)battle.Outcome).ToString(CultureInfo.InvariantCulture));
            }

            var keys = new List<string>(NamedFlags.Keys);
            keys.Sort(System.StringComparer.Ordinal);
            for (var i = 0; i < keys.Count; i++)
            {
                sb.Append('|').Append(keys[i]).Append('=').Append(NamedFlags[keys[i]] ? '1' : '0');
            }

            var cells = new List<string>(BattleCellOccupancy.Keys);
            cells.Sort(System.StringComparer.Ordinal);
            for (var i = 0; i < cells.Count; i++)
            {
                sb.Append('#').Append(cells[i]).Append('=').Append(BattleCellOccupancy[cells[i]]);
            }

            for (var i = 0; i < BattleLogEntries.Count; i++)
            {
                sb.Append('~').Append(BattleLogEntries[i]);
            }

            return CoreApi.StableHashHex(sb.ToString());
        }
    }
}
