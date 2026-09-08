using System.Collections.Generic;
using System.Globalization;
using System.Text;
using Janseon.Core;

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
        public int BattleAp { get; private set; }
        public int BattleMaxAp { get; private set; }
        public float HpFill01 { get; private set; }
        public float ApFill01 { get; private set; }
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
        public bool ShowFaceAction { get; private set; }
        public bool ShowEnterResolutionAction { get; private set; }
        public bool ShowSettleAction { get; private set; }
        public bool ShowBattleAdvanceAction { get; private set; }
        public bool ShowReturnAction { get; private set; }

        public static GameplayUiSnapshot FromCampaign(CampaignState campaign, BattleState battle)
        {
            var snap = new GameplayUiSnapshot();
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
                snap.ShowBattleAdvanceAction = true;
                snap.NamedFlags[UiElementNames.BattleAdvance + ":visible"] = true;
                FillBattle(snap, battle);
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
                snap.ShowBattleAdvanceAction = battle.Outcome == BattleOutcomeKind.Ongoing;
                if (snap.ShowBattleAdvanceAction)
                {
                    snap.NamedFlags[UiElementNames.BattleAdvance + ":visible"] = true;
                }

                FillBattle(snap, battle);
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

            snap.Fingerprint = snap.ComputeFingerprint(campaign, battle);
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

        static void FillBattle(GameplayUiSnapshot snap, BattleState battle)
        {
            snap.NamedFlags[UiElementNames.BattleHud + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleGrid + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleHp + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleAp + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleLog + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleHpMeter + ":visible"] = true;
            snap.NamedFlags[UiElementNames.BattleApMeter + ":visible"] = true;
            snap.BattleForecast = "근접 AP"
                + BattleApi.MeleeApCost.ToString(CultureInfo.InvariantCulture)
                + " · 피해 "
                + BattleApi.MeleeDamage.ToString(CultureInfo.InvariantCulture)
                + " / 원거리 AP"
                + BattleApi.RangedApCost.ToString(CultureInfo.InvariantCulture)
                + " · 피해 "
                + BattleApi.RangedDamage.ToString(CultureInfo.InvariantCulture);
            if (battle.Units == null)
            {
                return;
            }

            BattleUnit active = battle.ActiveUnit;
            if (active == null)
            {
                for (var i = 0; i < battle.Units.Count; i++)
                {
                    if (battle.Units[i] != null && battle.Units[i].IsPlayer && !battle.Units[i].IsDowned)
                    {
                        active = battle.Units[i];
                        break;
                    }
                }
            }

            if (active != null)
            {
                snap.BattleHp = active.Hp;
                snap.BattleMaxHp = active.MaxHp > 0 ? active.MaxHp : 1;
                snap.BattleAp = active.Ap;
                snap.BattleMaxAp = active.MaxAp > 0 ? active.MaxAp : 1;
                snap.HpFill01 = Clamp01((float)snap.BattleHp / snap.BattleMaxHp);
                snap.ApFill01 = Clamp01((float)snap.BattleAp / snap.BattleMaxAp);
                snap.NamedFlags[UiElementNames.BattleHp + ":bound"] = true;
                snap.NamedFlags[UiElementNames.BattleAp + ":bound"] = true;
            }

            for (var i = 0; i < battle.Units.Count; i++)
            {
                var unit = battle.Units[i];
                if (unit == null || unit.IsDowned)
                {
                    continue;
                }

                var key = UiElementNames.BattleCell(unit.Position.X, unit.Position.Y);
                snap.BattleCellOccupancy[key] = unit.IsPlayer ? "ally" : "foe";
                snap.BattleLogEntries.Add(
                    (unit.IsPlayer ? "ally" : "foe")
                    + "@" + unit.Position.X.ToString(CultureInfo.InvariantCulture)
                    + "," + unit.Position.Y.ToString(CultureInfo.InvariantCulture)
                    + " hp=" + unit.Hp.ToString(CultureInfo.InvariantCulture)
                    + "/" + unit.MaxHp.ToString(CultureInfo.InvariantCulture)
                    + " ap=" + unit.Ap.ToString(CultureInfo.InvariantCulture));
            }

            if (snap.BattleLogEntries.Count > 0)
            {
                snap.NamedFlags[UiElementNames.BattleLog + ":bound"] = true;
            }

            for (var i = 0; i < battle.Units.Count; i++)
            {
                BattleUnit unit = battle.Units[i];
                if (unit == null || !unit.IsPlayer)
                {
                    continue;
                }

                snap.PartyNames.Add(unit.UnitId);
                snap.PartyHp.Add(unit.Hp);
                snap.PartyMaxHp.Add(unit.MaxHp);
            }
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

        string ComputeFingerprint(CampaignState campaign, BattleState battle)
        {
            var sb = new StringBuilder(128);
            sb.Append("panel=").Append(((int)VisiblePanel).ToString(CultureInfo.InvariantCulture));
            sb.Append(";stageEl=").Append(CurrentStageElement ?? string.Empty);
            sb.Append(";stationEl=").Append(CurrentStationElement ?? string.Empty);
            sb.Append(";hp=").Append(BattleHp.ToString(CultureInfo.InvariantCulture));
            sb.Append(";ap=").Append(BattleAp.ToString(CultureInfo.InvariantCulture));
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

            if (battle != null)
            {
                sb.Append(";btick=").Append(battle.BattleTick.Value.ToString(CultureInfo.InvariantCulture));
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
