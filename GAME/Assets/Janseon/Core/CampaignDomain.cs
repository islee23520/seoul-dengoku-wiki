using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace Janseon.Core
{
    public enum CampaignDongStatus
    {
        Vacant = 0,
        Contested = 1,
        Held = 2
    }

    public sealed class CampaignControlState
    {
        readonly Dictionary<string, int> _influence;
        readonly Dictionary<string, string> _buildings;
        readonly HashSet<string> _stationLosses;

        public string DongId { get; }
        public string StationId { get; }
        public string StationController { get; }
        public int TotalInfluence
        {
            get
            {
                var total = 0;
                foreach (var value in _influence.Values) total += value;
                return total;
            }
        }

        public CampaignDongStatus DongStatus
        {
            get
            {
                if (_influence.Count == 0) return CampaignDongStatus.Vacant;
                var strongest = 0;
                var active = 0;
                foreach (var value in _influence.Values)
                {
                    if (value <= 0) continue;
                    active++;
                    if (value > strongest) strongest = value;
                }
                return active == 1 && strongest >= 50
                    ? CampaignDongStatus.Held
                    : CampaignDongStatus.Contested;
            }
        }

        CampaignControlState(string dongId, string stationId, string stationController,
            Dictionary<string, int> influence, Dictionary<string, string> buildings, HashSet<string> stationLosses)
        {
            DongId = dongId;
            StationId = stationId;
            StationController = stationController;
            _influence = influence;
            _buildings = buildings;
            _stationLosses = stationLosses;
        }

        public static CampaignControlState Create(string dongId, string stationId)
        {
            if (string.IsNullOrWhiteSpace(dongId)) throw new ArgumentException("Dong id is required.", nameof(dongId));
            if (string.IsNullOrWhiteSpace(stationId)) throw new ArgumentException("Station id is required.", nameof(stationId));
            return new CampaignControlState(dongId.Trim(), stationId.Trim(), "Uncontrolled",
                new Dictionary<string, int>(StringComparer.Ordinal),
                new Dictionary<string, string>(StringComparer.Ordinal),
                new HashSet<string>(StringComparer.Ordinal));
        }

        public int InfluenceOf(string factionId)
        {
            return factionId != null && _influence.TryGetValue(factionId, out var value) ? value : 0;
        }

        public CampaignControlState OccupyBuilding(string factionId, string buildingId, int influence)
        {
            if (string.IsNullOrWhiteSpace(factionId)) throw new ArgumentException("Faction id is required.", nameof(factionId));
            if (string.IsNullOrWhiteSpace(buildingId)) throw new ArgumentException("Building id is required.", nameof(buildingId));
            if (influence < 0 || influence > 100) throw new ArgumentOutOfRangeException(nameof(influence));
            var nextInfluence = new Dictionary<string, int>(_influence, StringComparer.Ordinal);
            var previousFaction = _buildings.TryGetValue(buildingId, out var existing) ? existing : null;
            if (previousFaction != null && nextInfluence.TryGetValue(previousFaction, out var previous))
                nextInfluence[previousFaction] = Math.Max(0, previous - influence);
            nextInfluence[factionId] = Math.Min(100, InfluenceOf(factionId) + influence);
            TrimInfluence(nextInfluence);
            var buildings = new Dictionary<string, string>(_buildings, StringComparer.Ordinal) { [buildingId] = factionId };
            return new CampaignControlState(DongId, StationId, StationController, nextInfluence, buildings,
                new HashSet<string>(_stationLosses, StringComparer.Ordinal));
        }

        public CampaignControlState ControlStation(string factionId)
        {
            if (string.IsNullOrWhiteSpace(factionId)) throw new ArgumentException("Faction id is required.", nameof(factionId));
            return new CampaignControlState(DongId, StationId, factionId.Trim(),
                new Dictionary<string, int>(_influence, StringComparer.Ordinal),
                new Dictionary<string, string>(_buildings, StringComparer.Ordinal),
                new HashSet<string>(_stationLosses, StringComparer.Ordinal));
        }

        public CampaignControlState ApplyStationLoss(string factionId, string buildingId)
        {
            var key = (factionId ?? string.Empty) + "\0" + (buildingId ?? string.Empty);
            if (!_stationLosses.Add(key)) return this;
            var nextInfluence = new Dictionary<string, int>(_influence, StringComparer.Ordinal);
            if (buildingId == "building-core" && string.Equals(StationController, factionId, StringComparison.Ordinal))
            {
                nextInfluence[factionId] = InfluenceOf(factionId) / 2;
                return new CampaignControlState(DongId, StationId, "Uncontrolled", nextInfluence,
                    new Dictionary<string, string>(_buildings, StringComparer.Ordinal), _stationLosses);
            }
            return new CampaignControlState(DongId, StationId, StationController, nextInfluence,
                new Dictionary<string, string>(_buildings, StringComparer.Ordinal), _stationLosses);
        }

        static void TrimInfluence(Dictionary<string, int> influence)
        {
            var total = 0;
            foreach (var value in influence.Values) total += value;
            if (total <= 100) return;
            var excess = total - 100;
            var keys = new List<string>(influence.Keys);
            keys.Sort(StringComparer.Ordinal);
            foreach (var key in keys)
            {
                if (excess == 0) break;
                var reduction = Math.Min(excess, influence[key]);
                influence[key] -= reduction;
                excess -= reduction;
            }
        }
    }

    /// <summary>
    /// Six-stage campaign loop (docs/Campaign-Loop + Concept 거점→원정→조우→해결→정산→복귀).
    /// </summary>
    public enum CampaignStage
    {
        /// <summary>거점 준비 — preparation/base.</summary>
        BasePreparation = 0,
        /// <summary>원정 통행 — expedition/travel.</summary>
        ExpeditionTravel = 1,
        /// <summary>조우 — encounter.</summary>
        Encounter = 2,
        /// <summary>해결 선택 — resolution (negotiate / bypass / combat).</summary>
        Resolution = 3,
        /// <summary>정산 — settlement of non-combat consequence.</summary>
        Settlement = 4,
        /// <summary>복귀 후 거점 준비 완료 — return/base-ready.</summary>
        BaseReady = 5
    }

    public enum StartingPreset
    {
        Wanderer = 0,
        StationMaster = 1
    }

    public enum CampaignRejectReason
    {
        None = 0,
        WrongStage = 1,
        AlreadyResolved = 2,
        TravelRejected = 3,
        MissingResolution = 4,
        BattlePending = 5
    }

    public enum EncounterChoice
    {
        None = 0,
        Negotiate = 1,
        Bypass = 2,
        Combat = 3
    }

    public enum CampaignCommandKind
    {
        Depart = 1,
        Travel = 2,
        FaceEncounter = 3,
        EnterResolution = 4,
        ChooseNegotiate = 5,
        ChooseBypass = 6,
        ChooseCombat = 7,
        ApplySettlement = 8,
        CompleteReturn = 9,
        Rest = 10
    }

    public sealed class CampaignCommand
    {
        public CommandId Id;
        public CampaignCommandKind Kind;
        public StationId TravelDestination;
    }

    public sealed class CampaignRejection
    {
        public readonly CampaignRejectReason Reason;
        public readonly CampaignStage Stage;
        public readonly CampaignCommandKind Attempted;

        public CampaignRejection(CampaignRejectReason reason, CampaignStage stage, CampaignCommandKind attempted)
        {
            Reason = reason;
            Stage = stage;
            Attempted = attempted;
        }
    }

    /// <summary>
    /// Immutable per-unit HP snapshot keyed by stable unit id (Strategy-Battle-Roundtrip 부상 왕복).
    /// Copies caller storage on construction and exposes no mutation, so sharing a snapshot
    /// reference can never alias mutable state. Keys are stable battle unit ids ("ally-0").
    /// </summary>
    public sealed class UnitHpSnapshot
    {
        readonly Dictionary<string, int> _hp;

        public UnitHpSnapshot(IEnumerable<KeyValuePair<string, int>> entries)
        {
            _hp = new Dictionary<string, int>(StringComparer.Ordinal);
            if (entries == null)
            {
                return;
            }

            foreach (var entry in entries)
            {
                if (entry.Key == null)
                {
                    throw new ArgumentException("Unit id must not be null.", nameof(entries));
                }

                _hp[entry.Key] = entry.Value;
            }
        }

        /// <summary>Default opening party keyed by the stable realtime unit id.</summary>
        public static UnitHpSnapshot DefaultParty()
        {
            return new UnitHpSnapshot(new Dictionary<string, int>
            {
                [Battle.Contracts.RealtimeBattleApi.PersistentAllyId] = Battle.Contracts.RealtimeBattleApi.PersistentMaxHp
            });
        }

        public bool TryGet(string unitId, out int hp)
        {
            if (unitId != null && _hp.TryGetValue(unitId, out hp))
            {
                return true;
            }

            hp = 0;
            return false;
        }

        /// <summary>True when every stored HP is inside [minInclusive, maxInclusive].</summary>
        public bool IsWithinRange(int minInclusive, int maxInclusive)
        {
            foreach (var value in _hp.Values)
            {
                if (value < minInclusive || value > maxInclusive)
                {
                    return false;
                }
            }

            return true;
        }

        /// <summary>Stable content hash: keys sorted ordinal, invariant numbers.</summary>
        public string Fingerprint()
        {
            var keys = new List<string>(_hp.Keys);
            keys.Sort(StringComparer.Ordinal);
            var sb = new StringBuilder();
            for (var i = 0; i < keys.Count; i++)
            {
                if (i > 0)
                {
                    sb.Append('|');
                }

                sb.Append(keys[i])
                    .Append('=')
                    .Append(_hp[keys[i]].ToString(CultureInfo.InvariantCulture));
            }

            return CoreApi.StableHashHex(sb.ToString());
        }
    }

    public enum DeploymentRejectReason
    {
        None = 0,
        UnknownUnit = 1,
        DeployCapReached = 2,
        WoundedOverrideRequired = 3
    }

    public sealed class DeploymentRejection
    {
        public readonly DeploymentRejectReason Reason;
        public readonly string UnitId;

        public DeploymentRejection(DeploymentRejectReason reason, string unitId)
        {
            Reason = reason;
            UnitId = unitId ?? string.Empty;
        }
    }

    /// <summary>
    /// Immutable roster-to-deployment decision. Roster membership and battle participation are
    /// separate: at most three members participate, while wounded members default to rest.
    /// </summary>
    public sealed class DeploymentState
    {
        readonly string[] unitIds;
        readonly int[] hp;
        readonly bool[] participating;

        internal DeploymentState(string[] unitIds, int[] hp, bool[] participating)
        {
            this.unitIds = (string[])unitIds.Clone();
            this.hp = (int[])hp.Clone();
            this.participating = (bool[])participating.Clone();
        }

        public int RosterCount => unitIds.Length;

        public int ParticipantCount
        {
            get
            {
                var count = 0;
                for (var i = 0; i < participating.Length; i++)
                {
                    if (participating[i])
                    {
                        count++;
                    }
                }

                return count;
            }
        }

        public string UnitIdAt(int index) => unitIds[index];
        public int HpAt(int index) => hp[index];
        public bool IsParticipatingAt(int index) => participating[index];
        public bool IsWoundedAt(int index) => hp[index] < Battle.Contracts.RealtimeBattleApi.PersistentMaxHp;

        public bool IsParticipating(string unitId)
        {
            var index = IndexOf(unitId);
            return index >= 0 && participating[index];
        }

        public bool IsWounded(string unitId)
        {
            var index = IndexOf(unitId);
            return index >= 0 && hp[index] < Battle.Contracts.RealtimeBattleApi.PersistentMaxHp;
        }

        internal int IndexOf(string unitId)
        {
            for (var i = 0; i < unitIds.Length; i++)
            {
                if (string.Equals(unitIds[i], unitId, StringComparison.Ordinal))
                {
                    return i;
                }
            }

            return -1;
        }

        internal DeploymentState WithParticipation(int index, bool value)
        {
            var next = (bool[])participating.Clone();
            next[index] = value;
            return new DeploymentState(unitIds, hp, next);
        }

        public string Fingerprint()
        {
            var sb = new StringBuilder();
            for (var i = 0; i < unitIds.Length; i++)
            {
                if (i > 0)
                {
                    sb.Append('|');
                }

                sb.Append(unitIds[i])
                    .Append('=')
                    .Append(hp[i].ToString(CultureInfo.InvariantCulture))
                    .Append(participating[i] ? ":in" : ":out");
            }

            return CoreApi.StableHashHex(sb.ToString());
        }
    }

    public static class DeploymentApi
    {
        public const int DeployCap = 3;

        public static string UnitId(int rosterIndex) => "ally-" + rosterIndex.ToString(CultureInfo.InvariantCulture);

        public static DeploymentState Create(int rosterCount, UnitHpSnapshot partyHp)
        {
            if (rosterCount < 0)
            {
                throw new ArgumentOutOfRangeException(nameof(rosterCount));
            }

            var ids = new string[rosterCount];
            var hp = new int[rosterCount];
            var participating = new bool[rosterCount];
            var selected = 0;
            for (var i = 0; i < rosterCount; i++)
            {
                ids[i] = UnitId(i);
                hp[i] = partyHp != null && partyHp.TryGet(ids[i], out var storedHp)
                    ? storedHp
                    : Battle.Contracts.RealtimeBattleApi.PersistentMaxHp;
                if (hp[i] < 0 || hp[i] > Battle.Contracts.RealtimeBattleApi.PersistentMaxHp)
                {
                    throw new ArgumentOutOfRangeException(nameof(partyHp), "Deployment HP must be within battle HP bounds.");
                }

                // Wounded leftovers rest by default; healthy members fill up to the deploy cap.
                participating[i] = hp[i] == Battle.Contracts.RealtimeBattleApi.PersistentMaxHp && selected < DeployCap;
                if (participating[i])
                {
                    selected++;
                }
            }

            return new DeploymentState(ids, hp, participating);
        }

        public static object SetParticipation(
            DeploymentState state,
            string unitId,
            bool participating,
            bool explicitWoundedOverride)
        {
            if (state == null)
            {
                throw new ArgumentNullException(nameof(state));
            }

            var index = state.IndexOf(unitId);
            if (index < 0)
            {
                return new DeploymentRejection(DeploymentRejectReason.UnknownUnit, unitId);
            }

            if (state.IsParticipatingAt(index) == participating)
            {
                return state;
            }

            if (participating && state.IsWoundedAt(index) && !explicitWoundedOverride)
            {
                return new DeploymentRejection(DeploymentRejectReason.WoundedOverrideRequired, unitId);
            }

            if (participating && state.ParticipantCount >= DeployCap)
            {
                return new DeploymentRejection(DeploymentRejectReason.DeployCapReached, unitId);
            }

            return state.WithParticipation(index, participating);
        }
    }

    /// <summary>
    /// Immutable battle handoff for Todo 8. Campaign must not mutate fields after issue.
    /// </summary>
    public sealed class BattleContext
    {
        public readonly string BattleId;
        public readonly string CampaignId;
        public readonly StationId Location;
        public readonly int WorldSeed;
        public readonly Tick WorldTick;
        public readonly int PartyResources;
        public readonly int Reputation;
        public readonly string RulesVersion;
        /// <summary>Stable encounter command identity included in canonical battle material.</summary>
        public readonly string IdentityKey;
        public readonly string ContextHash;
        /// <summary>
        /// Deterministic battle-opening seed identity. This intentionally excludes mutable party
        /// condition while <see cref="ContextHash"/> binds the complete immutable handoff.
        /// </summary>
        public readonly string SeedIdentityHash;
        /// <summary>Battle id paired with <see cref="SeedIdentityHash"/> for the opening RNG contract.</summary>
        public readonly string SeedIdentityBattleId;
        /// <summary>
        /// Opening HP per stable unit id. The persistent ally entry is required; zero means downed.
        /// Units absent from the snapshot open at their realtime roster default.
        /// </summary>
        public readonly UnitHpSnapshot StartHp;

        public BattleContext(
            string battleId,
            string campaignId,
            StationId location,
            int worldSeed,
            Tick worldTick,
            int partyResources,
            int reputation,
            string rulesVersion,
            string identityKey,
            string contextHash,
            UnitHpSnapshot startHp,
            string seedIdentityHash,
            string seedIdentityBattleId)
        {
            CampaignId = campaignId ?? string.Empty;
            Location = location;
            WorldSeed = worldSeed;
            WorldTick = worldTick;
            PartyResources = partyResources;
            Reputation = reputation;
            RulesVersion = rulesVersion ?? string.Empty;
            IdentityKey = identityKey ?? string.Empty;
            StartHp = startHp;

            DeriveIdentity(
                CampaignId,
                Location,
                WorldSeed,
                WorldTick,
                PartyResources,
                Reputation,
                RulesVersion,
                IdentityKey,
                StartHp,
                out var expectedBattleId,
                out var expectedContextHash,
                out var expectedSeedIdentityHash,
                out var expectedSeedIdentityBattleId);

            RequireClaim(battleId, expectedBattleId, nameof(battleId));
            RequireClaim(contextHash, expectedContextHash, nameof(contextHash));
            RequireClaim(seedIdentityHash, expectedSeedIdentityHash, nameof(seedIdentityHash));
            RequireClaim(seedIdentityBattleId, expectedSeedIdentityBattleId, nameof(seedIdentityBattleId));

            BattleId = expectedBattleId;
            ContextHash = expectedContextHash;
            SeedIdentityHash = expectedSeedIdentityHash;
            SeedIdentityBattleId = expectedSeedIdentityBattleId;
        }

        public static BattleContext Create(
            string campaignId,
            StationId location,
            int worldSeed,
            Tick worldTick,
            int partyResources,
            int reputation,
            string rulesVersion,
            string identityKey,
            UnitHpSnapshot startHp)
        {
            DeriveIdentity(
                campaignId,
                location,
                worldSeed,
                worldTick,
                partyResources,
                reputation,
                rulesVersion,
                identityKey,
                startHp,
                out var battleId,
                out var contextHash,
                out var seedIdentityHash,
                out var seedIdentityBattleId);

            return new BattleContext(
                battleId,
                campaignId,
                location,
                worldSeed,
                worldTick,
                partyResources,
                reputation,
                rulesVersion,
                identityKey,
                contextHash,
                startHp,
                seedIdentityHash,
                seedIdentityBattleId);
        }

        internal void ValidateIntegrity()
        {
            DeriveIdentity(
                CampaignId,
                Location,
                WorldSeed,
                WorldTick,
                PartyResources,
                Reputation,
                RulesVersion,
                IdentityKey,
                StartHp,
                out var battleId,
                out var contextHash,
                out var seedIdentityHash,
                out var seedIdentityBattleId);

            RequireClaim(BattleId, battleId, nameof(BattleId));
            RequireClaim(ContextHash, contextHash, nameof(ContextHash));
            RequireClaim(SeedIdentityHash, seedIdentityHash, nameof(SeedIdentityHash));
            RequireClaim(SeedIdentityBattleId, seedIdentityBattleId, nameof(SeedIdentityBattleId));
        }

        static void DeriveIdentity(
            string campaignId,
            StationId location,
            int worldSeed,
            Tick worldTick,
            int partyResources,
            int reputation,
            string rulesVersion,
            string identityKey,
            UnitHpSnapshot startHp,
            out string battleId,
            out string contextHash,
            out string seedIdentityHash,
            out string seedIdentityBattleId)
        {
            var material =
                "battle"
                + ";campaign=" + (campaignId ?? string.Empty)
                + ";node=" + (location.Value ?? string.Empty)
                + ";seed=" + worldSeed.ToString(CultureInfo.InvariantCulture)
                + ";tick=" + worldTick.Value.ToString(CultureInfo.InvariantCulture)
                + ";res=" + partyResources.ToString(CultureInfo.InvariantCulture)
                + ";rep=" + reputation.ToString(CultureInfo.InvariantCulture)
                + ";rules=" + (rulesVersion ?? string.Empty)
                + ";cmd=" + (identityKey ?? string.Empty);
            seedIdentityHash = CoreApi.StableHashHex(material);
            seedIdentityBattleId = "battle-" + seedIdentityHash.Substring(0, 16);
            var contextMaterial = material
                + ";hp=" + (startHp != null ? startHp.Fingerprint() : string.Empty);
            contextHash = CoreApi.StableHashHex(contextMaterial);
            battleId = "battle-" + contextHash.Substring(0, 16);
        }

        static void RequireClaim(string claimed, string expected, string paramName)
        {
            if (!string.Equals(claimed ?? string.Empty, expected, StringComparison.Ordinal))
            {
                throw new ArgumentException(
                    "Battle context identity claim does not match canonical immutable material.",
                    paramName);
            }
        }
    }

    public sealed class BattleRequired
    {
        public readonly BattleContext Context;

        public BattleRequired(BattleContext context)
        {
            Context = context;
        }
    }

    /// <summary>
    /// Campaign position. Successful commands return a new instance; rejections leave caller state untouched.
    /// </summary>
    public sealed class CampaignState
    {
        public string CampaignId;
        public CampaignStage Stage;
        public Tick Tick;
        public StationId Node;
        public PlaceId Location;
        public StationId HomeBase;
        public StartingPreset StartingPreset;
        public int PartyMemberCount;
        public bool HasStronghold;
        public bool HasBulletin;
        public string OvernightCopy;
        public int Resources;
        public int Reputation;
        public int Seed;
        public PurposeRng Rng;
        public EncounterChoice Choice;
        public bool ChoiceLocked;
        public bool SettlementApplied;
        public string ConsequenceId;
        public int PendingResourceDelta;
        public int PendingReputationDelta;
        public BattleContext PendingBattle;
        /// <summary>
        /// Canonical persistent party HP keyed by stable unit id (Strategy-Battle-Roundtrip).
        /// Campaign owns this store; battle seeds from it and settlement rewrites it from the
        /// result payload. Immutable snapshot type — Clone may share the reference safely.
        /// </summary>
        public UnitHpSnapshot PartyHp;
        /// <summary>Current roster participation decision; immutable and capped at three.</summary>
        public DeploymentState Deployment;
        /// <summary>ResultId last applied via SettlementApi (exact-once). Empty if none.</summary>
        public string SettledResultId;
        /// <summary>ReceiptHash of last SettlementReceipt. Empty if none.</summary>
        public string LastReceiptHash;

        public CampaignState Clone()
        {
            return new CampaignState
            {
                CampaignId = CampaignId,
                Stage = Stage,
                Tick = Tick,
                Node = Node,
                Location = Location,
                HomeBase = HomeBase,
                StartingPreset = StartingPreset,
                PartyMemberCount = PartyMemberCount,
                HasStronghold = HasStronghold,
                HasBulletin = HasBulletin,
                OvernightCopy = OvernightCopy,
                Resources = Resources,
                Reputation = Reputation,
                Seed = Seed,
                Rng = Rng != null ? Rng.Clone() : null,
                Choice = Choice,
                ChoiceLocked = ChoiceLocked,
                SettlementApplied = SettlementApplied,
                ConsequenceId = ConsequenceId,
                PendingResourceDelta = PendingResourceDelta,
                PendingReputationDelta = PendingReputationDelta,
                PendingBattle = PendingBattle,
                PartyHp = PartyHp,
                Deployment = Deployment,
                SettledResultId = SettledResultId,
                LastReceiptHash = LastReceiptHash
            };
        }
    }

    public static class CampaignApi
    {
        public const string ConsequenceNegotiate = "negotiation";
        public const string ConsequenceBypass = "bypass";
        public const int NegotiateResourceDelta = -5;
        public const int NegotiateReputationDelta = 3;
        public const int BypassResourceDelta = -2;
        public const int BypassReputationDelta = -1;
        public const string RulesVersion = "poc-campaign-loop-v1";
        public const int ConfirmedMoveTicks = 1;
        public const int ConfirmedMoveResourceDelta = -2;
        public const int RestTicks = 2;

        public static CampaignState Start(int seed, StationId homeBase, string campaignId)
        {
            return CreateStart(seed, homeBase, campaignId, 100, StartingPreset.Wanderer, 1, false, false, string.Empty);
        }

        public static CampaignState StartNewGame(
            int seed,
            StationId homeBase,
            string campaignId,
            StartingPreset preset)
        {
            switch (preset)
            {
                case StartingPreset.Wanderer:
                    return CreateStart(
                        seed, homeBase, campaignId, 30, preset, 3, false, false,
                        "영등포 대합실에서 하룻밤 잠자리만 허락받았다.");
                case StartingPreset.StationMaster:
                    return CreateStart(seed, homeBase, campaignId, 40, preset, 3, true, true, string.Empty);
                default:
                    throw new ArgumentOutOfRangeException(nameof(preset));
            }
        }

        static CampaignState CreateStart(
            int seed,
            StationId homeBase,
            string campaignId,
            int resources,
            StartingPreset preset,
            int partyMemberCount,
            bool hasStronghold,
            bool hasBulletin,
            string overnightCopy)
        {
            return new CampaignState
            {
                CampaignId = campaignId ?? "campaign-0",
                Stage = CampaignStage.BasePreparation,
                Tick = new Tick(0),
                Node = homeBase,
                Location = new PlaceId(PlaceKind.Station, homeBase.Value),
                HomeBase = homeBase,
                StartingPreset = preset,
                PartyMemberCount = partyMemberCount,
                HasStronghold = hasStronghold,
                HasBulletin = hasBulletin,
                OvernightCopy = overnightCopy ?? string.Empty,
                Resources = resources,
                Reputation = 0,
                Seed = seed,
                Rng = new PurposeRng(seed),
                Choice = EncounterChoice.None,
                ChoiceLocked = false,
                SettlementApplied = false,
                ConsequenceId = string.Empty,
                PendingResourceDelta = 0,
                PendingReputationDelta = 0,
                PendingBattle = null,
                PartyHp = UnitHpSnapshot.DefaultParty(),
                Deployment = DeploymentApi.Create(partyMemberCount, UnitHpSnapshot.DefaultParty()),
                SettledResultId = string.Empty,
                LastReceiptHash = string.Empty
            };
        }

        public static object SetDeploymentParticipation(
            CampaignState state,
            string unitId,
            bool participating,
            bool explicitWoundedOverride = false)
        {
            if (state == null)
            {
                throw new ArgumentNullException(nameof(state));
            }

            DeploymentState current = state.Deployment ?? DeploymentApi.Create(state.PartyMemberCount, state.PartyHp);
            object changed = DeploymentApi.SetParticipation(
                current,
                unitId,
                participating,
                explicitWoundedOverride);
            if (changed is DeploymentRejection)
            {
                return changed;
            }

            var next = state.Clone();
            next.Deployment = (DeploymentState)changed;
            return next;
        }

        /// <summary>
        /// Adopt an immutable BattleRequired handoff: lock combat choice and stash PendingBattle.
        /// Stage stays Resolution until SettlementApi applies a result. Does not mutate BattleContext.
        /// </summary>
        public static object AttachPendingBattle(
            CampaignState state,
            Ledger ledger,
            BattleContext context,
            CommandId cmdId)
        {
            if (state == null)
            {
                throw new ArgumentNullException(nameof(state));
            }

            if (ledger == null)
            {
                throw new ArgumentNullException(nameof(ledger));
            }

            if (context == null)
            {
                return new CampaignRejection(CampaignRejectReason.MissingResolution, state.Stage, CampaignCommandKind.ChooseCombat);
            }

            if (state.Stage != CampaignStage.Resolution)
            {
                return new CampaignRejection(CampaignRejectReason.WrongStage, state.Stage, CampaignCommandKind.ChooseCombat);
            }

            if (state.ChoiceLocked || state.Choice != EncounterChoice.None)
            {
                return new CampaignRejection(CampaignRejectReason.AlreadyResolved, state.Stage, CampaignCommandKind.ChooseCombat);
            }

            if (state.PendingBattle != null)
            {
                return new CampaignRejection(CampaignRejectReason.BattlePending, state.Stage, CampaignCommandKind.ChooseCombat);
            }

            var next = state.Clone();
            next.PendingBattle = context;
            next.Choice = EncounterChoice.Combat;
            next.ChoiceLocked = true;
            next.ConsequenceId = string.Empty;
            next.PendingResourceDelta = 0;
            next.PendingReputationDelta = 0;
            next.SettlementApplied = false;
            // Stage remains Resolution — settlement advances it. Battle setup does not consume campaign time.
            var cmd = new CampaignCommand { Id = cmdId, Kind = CampaignCommandKind.ChooseCombat };
            AppendEvent(ledger, cmd, next, "attach-battle:" + (context.BattleId ?? string.Empty), 0);
            return next;
        }

        public static object Apply(RouteGraph graph, CampaignState state, Ledger ledger, CampaignCommand cmd)
        {
            if (graph == null)
            {
                throw new ArgumentNullException(nameof(graph));
            }

            if (state == null)
            {
                throw new ArgumentNullException(nameof(state));
            }

            if (ledger == null)
            {
                throw new ArgumentNullException(nameof(ledger));
            }

            if (cmd == null)
            {
                throw new ArgumentNullException(nameof(cmd));
            }

            switch (cmd.Kind)
            {
                case CampaignCommandKind.Depart:
                    return Depart(state, ledger, cmd);
                case CampaignCommandKind.Travel:
                    return Travel(graph, state, ledger, cmd);
                case CampaignCommandKind.FaceEncounter:
                    return FaceEncounter(state, ledger, cmd);
                case CampaignCommandKind.EnterResolution:
                    return EnterResolution(state, ledger, cmd);
                case CampaignCommandKind.ChooseNegotiate:
                    return ChooseNonCombat(state, ledger, cmd, EncounterChoice.Negotiate, ConsequenceNegotiate, NegotiateResourceDelta, NegotiateReputationDelta);
                case CampaignCommandKind.ChooseBypass:
                    return ChooseNonCombat(state, ledger, cmd, EncounterChoice.Bypass, ConsequenceBypass, BypassResourceDelta, BypassReputationDelta);
                case CampaignCommandKind.ChooseCombat:
                    return ChooseCombat(state, ledger, cmd);
                case CampaignCommandKind.ApplySettlement:
                    return ApplySettlement(state, ledger, cmd);
                case CampaignCommandKind.CompleteReturn:
                    return CompleteReturn(state, ledger, cmd);
                case CampaignCommandKind.Rest:
                    return Rest(state, ledger, cmd);
                default:
                    return new CampaignRejection(CampaignRejectReason.WrongStage, state.Stage, cmd.Kind);
            }
        }

        static object Depart(CampaignState state, Ledger ledger, CampaignCommand cmd)
        {
            if (state.Stage != CampaignStage.BasePreparation && state.Stage != CampaignStage.BaseReady)
            {
                return Reject(state, cmd, CampaignRejectReason.WrongStage);
            }

            var next = state.Clone();
            next.Stage = CampaignStage.ExpeditionTravel;
            next.Choice = EncounterChoice.None;
            next.ChoiceLocked = false;
            next.SettlementApplied = false;
            next.ConsequenceId = string.Empty;
            next.PendingResourceDelta = 0;
            next.PendingReputationDelta = 0;
            next.PendingBattle = null;
            next.SettledResultId = string.Empty;
            next.LastReceiptHash = string.Empty;
            AppendEvent(ledger, cmd, next, "depart", (int)next.Stage);
            return next;
        }

        static object Travel(RouteGraph graph, CampaignState state, Ledger ledger, CampaignCommand cmd)
        {
            if (state.Stage != CampaignStage.ExpeditionTravel)
            {
                return Reject(state, cmd, CampaignRejectReason.WrongStage);
            }

            // Use a throwaway ledger so a rejected hop cannot mutate the campaign ledger.
            var hopLedger = new Ledger();
            var routeState = new RouteState
            {
                Current = state.Node,
                Location = state.Location.IsValid ? state.Location : new PlaceId(PlaceKind.Station, state.Node.Value),
                Tick = state.Tick,
                HopCount = 0
            };
            var travelCmd = new TravelCommand
            {
                Id = cmd.Id,
                Destination = cmd.TravelDestination
            };
            var travelResult = RouteApi.TryTravel(graph, routeState, hopLedger, travelCmd);
            if (travelResult is TravelRejection)
            {
                return Reject(state, cmd, CampaignRejectReason.TravelRejected);
            }

            var routeNext = (RouteState)travelResult;
            var next = state.Clone();
            next.Node = routeNext.Current;
            next.Tick = routeNext.Tick;
            next.Resources = checked(state.Resources + ConfirmedMoveResourceDelta);
            // Fold hop ledger event into campaign ledger with campaign-scoped summary.
            AppendEvent(ledger, cmd, next, "travel:" + (routeState.Current.Value ?? string.Empty) + "->" + (routeNext.Current.Value ?? string.Empty), routeNext.HopCount);
            return next;
        }

        static object FaceEncounter(CampaignState state, Ledger ledger, CampaignCommand cmd)
        {
            if (state.Stage != CampaignStage.ExpeditionTravel)
            {
                return Reject(state, cmd, CampaignRejectReason.WrongStage);
            }

            // Encounter requires having left the home base node.
            if (state.Node.Equals(state.HomeBase))
            {
                return Reject(state, cmd, CampaignRejectReason.WrongStage);
            }

            var next = state.Clone();
            next.Stage = CampaignStage.Encounter;
            // Deterministic encounter salt from Encounter stream (does not touch World/Battle).
            if (next.Rng != null)
            {
                next.Rng.Consume(RngPurpose.Encounter);
            }

            AppendEvent(ledger, cmd, next, "face-encounter", (int)next.Stage);
            return next;
        }

        static object EnterResolution(CampaignState state, Ledger ledger, CampaignCommand cmd)
        {
            if (state.Stage != CampaignStage.Encounter)
            {
                return Reject(state, cmd, CampaignRejectReason.WrongStage);
            }

            var next = state.Clone();
            next.Stage = CampaignStage.Resolution;
            AppendEvent(ledger, cmd, next, "enter-resolution", (int)next.Stage);
            return next;
        }

        static object ChooseNonCombat(
            CampaignState state,
            Ledger ledger,
            CampaignCommand cmd,
            EncounterChoice choice,
            string consequenceId,
            int resourceDelta,
            int reputationDelta)
        {
            if (state.ChoiceLocked || state.Choice != EncounterChoice.None)
            {
                return Reject(state, cmd, CampaignRejectReason.AlreadyResolved);
            }

            if (state.Stage != CampaignStage.Resolution)
            {
                return Reject(state, cmd, CampaignRejectReason.WrongStage);
            }

            if (state.PendingBattle != null)
            {
                return Reject(state, cmd, CampaignRejectReason.BattlePending);
            }

            var next = state.Clone();
            next.Choice = choice;
            next.ChoiceLocked = true;
            next.ConsequenceId = consequenceId;
            next.PendingResourceDelta = resourceDelta;
            next.PendingReputationDelta = reputationDelta;
            next.Stage = CampaignStage.Settlement;
            next.SettlementApplied = false;
            next.PendingBattle = null;
            AppendEvent(ledger, cmd, next, "resolve:" + consequenceId, resourceDelta);
            return next;
        }

        static object ChooseCombat(CampaignState state, Ledger ledger, CampaignCommand cmd)
        {
            if (state.ChoiceLocked || state.Choice != EncounterChoice.None)
            {
                return Reject(state, cmd, CampaignRejectReason.AlreadyResolved);
            }

            if (state.Stage != CampaignStage.Resolution)
            {
                return Reject(state, cmd, CampaignRejectReason.WrongStage);
            }

            // Battle handoff is pure: no caller state/ledger mutation; immutable context returned.
            var context = BattleContext.Create(
                state.CampaignId,
                state.Node,
                state.Seed,
                state.Tick,
                state.Resources,
                state.Reputation,
                Battle.Contracts.BattleRules.RulesVersion,
                cmd.Id.Value,
                // Seed opening HP from the canonical campaign store (leftover HP roundtrip).
                state.PartyHp);
            return new BattleRequired(context);
        }

        static object ApplySettlement(CampaignState state, Ledger ledger, CampaignCommand cmd)
        {
            if (state.Stage != CampaignStage.Settlement)
            {
                return Reject(state, cmd, CampaignRejectReason.WrongStage);
            }

            if (!state.ChoiceLocked || state.Choice == EncounterChoice.None || state.Choice == EncounterChoice.Combat)
            {
                return Reject(state, cmd, CampaignRejectReason.MissingResolution);
            }

            if (state.SettlementApplied)
            {
                return Reject(state, cmd, CampaignRejectReason.AlreadyResolved);
            }

            var next = state.Clone();
            // Settlement resolves consequences at the expedition station. Location changes only
            // when CompleteReturn is explicitly dispatched by return-action.
            next.Node = state.Node;
            next.Resources = checked(state.Resources + state.PendingResourceDelta);
            next.Reputation = checked(state.Reputation + state.PendingReputationDelta);
            next.PendingResourceDelta = 0;
            next.PendingReputationDelta = 0;
            next.SettlementApplied = true;
            AppendEvent(ledger, cmd, next, "settle:" + (next.ConsequenceId ?? string.Empty), next.Resources);
            return next;
        }

        static object CompleteReturn(CampaignState state, Ledger ledger, CampaignCommand cmd)
        {
            if (state.Stage != CampaignStage.Settlement)
            {
                return Reject(state, cmd, CampaignRejectReason.WrongStage);
            }

            if (!state.SettlementApplied)
            {
                return Reject(state, cmd, CampaignRejectReason.MissingResolution);
            }

            if (state.PendingBattle != null)
            {
                return Reject(state, cmd, CampaignRejectReason.BattlePending);
            }

            var next = state.Clone();
            next.Node = state.HomeBase;
            next.Stage = CampaignStage.BaseReady;
            AppendEvent(ledger, cmd, next, "return-base", (int)next.Stage);
            return next;
        }

        static object Rest(CampaignState state, Ledger ledger, CampaignCommand cmd)
        {
            if ((state.Stage != CampaignStage.BasePreparation && state.Stage != CampaignStage.BaseReady)
                || !state.Node.Equals(state.HomeBase))
            {
                return Reject(state, cmd, CampaignRejectReason.WrongStage);
            }

            var next = state.Clone();
            next.Tick = state.Tick.Next().Next();
            AppendEvent(ledger, cmd, next, "rest", RestTicks);
            return next;
        }

        static CampaignRejection Reject(CampaignState state, CampaignCommand cmd, CampaignRejectReason reason)
        {
            return new CampaignRejection(reason, state.Stage, cmd.Kind);
        }

        static void AppendEvent(Ledger ledger, CampaignCommand cmd, CampaignState next, string kind, int value)
        {
            var summary = CoreApi.StableHashHex(
                "campaign=" + kind
                + ";cmd=" + (cmd.Id.Value ?? string.Empty)
                + ";stage=" + ((int)next.Stage).ToString(CultureInfo.InvariantCulture)
                + ";node=" + (next.Node.Value ?? string.Empty)
                + ";tick=" + next.Tick.Value.ToString(CultureInfo.InvariantCulture)
                + ";res=" + next.Resources.ToString(CultureInfo.InvariantCulture)
                + ";rep=" + next.Reputation.ToString(CultureInfo.InvariantCulture)
                + ";cons=" + (next.ConsequenceId ?? string.Empty)
                + ";val=" + value.ToString(CultureInfo.InvariantCulture));

            ledger.Events.Add(new TypedEvent
            {
                Id = new EventId(
                    "campaign-" + next.Tick.Value.ToString(CultureInfo.InvariantCulture)
                    + "-" + (cmd.Id.Value ?? "none")),
                CauseId = cmd.Id,
                Value = value,
                At = next.Tick,
                SummaryHash = summary
            });
        }

        public static string ComputeCampaignHash(CampaignState state, Ledger ledger)
        {
            var sb = new StringBuilder(256);
            if (state == null)
            {
                sb.Append("campaign:null");
            }
            else
            {
                sb.Append("id=").Append(state.CampaignId ?? string.Empty);
                sb.Append(";stage=").Append(((int)state.Stage).ToString(CultureInfo.InvariantCulture));
                sb.Append(";tick=").Append(state.Tick.Value.ToString(CultureInfo.InvariantCulture));
                sb.Append(";node=").Append(state.Node.Value ?? string.Empty);
                sb.Append(";home=").Append(state.HomeBase.Value ?? string.Empty);
                sb.Append(";preset=").Append(((int)state.StartingPreset).ToString(CultureInfo.InvariantCulture));
                sb.Append(";party=").Append(state.PartyMemberCount.ToString(CultureInfo.InvariantCulture));
                sb.Append(";stronghold=").Append(state.HasStronghold ? "1" : "0");
                sb.Append(";bulletin=").Append(state.HasBulletin ? "1" : "0");
                sb.Append(";overnight=").Append(state.OvernightCopy ?? string.Empty);
                sb.Append(";res=").Append(state.Resources.ToString(CultureInfo.InvariantCulture));
                sb.Append(";rep=").Append(state.Reputation.ToString(CultureInfo.InvariantCulture));
                sb.Append(";seed=").Append(state.Seed.ToString(CultureInfo.InvariantCulture));
                sb.Append(";hp=").Append(state.PartyHp != null ? state.PartyHp.Fingerprint() : string.Empty);
                sb.Append(";deploy=").Append(state.Deployment != null ? state.Deployment.Fingerprint() : string.Empty);
                sb.Append(";choice=").Append(((int)state.Choice).ToString(CultureInfo.InvariantCulture));
                sb.Append(";locked=").Append(state.ChoiceLocked ? "1" : "0");
                sb.Append(";settled=").Append(state.SettlementApplied ? "1" : "0");
                sb.Append(";cons=").Append(state.ConsequenceId ?? string.Empty);
                sb.Append(";pendR=").Append(state.PendingResourceDelta.ToString(CultureInfo.InvariantCulture));
                sb.Append(";pendP=").Append(state.PendingReputationDelta.ToString(CultureInfo.InvariantCulture));
                sb.Append(";settledRid=").Append(state.SettledResultId ?? string.Empty);
                sb.Append(";receipt=").Append(state.LastReceiptHash ?? string.Empty);
                if (state.Rng != null)
                {
                    sb.Append(";rng=").Append(state.Rng.Fingerprint());
                }

                if (state.PendingBattle != null)
                {
                    sb.Append(";battle=").Append(state.PendingBattle.ContextHash ?? string.Empty);
                }
            }

            if (ledger == null)
            {
                sb.Append(";ledger=null");
            }
            else
            {
                sb.Append(";events=").Append(ledger.Events.Count.ToString(CultureInfo.InvariantCulture));
                for (var i = 0; i < ledger.Events.Count; i++)
                {
                    var e = ledger.Events[i];
                    sb.Append('|')
                        .Append(i.ToString(CultureInfo.InvariantCulture))
                        .Append(':')
                        .Append(e.Id.Value ?? string.Empty)
                        .Append(',')
                        .Append(e.CauseId.Value ?? string.Empty)
                        .Append(',')
                        .Append(e.Value.ToString(CultureInfo.InvariantCulture))
                        .Append(',')
                        .Append(e.At.Value.ToString(CultureInfo.InvariantCulture))
                        .Append(',')
                        .Append(e.SummaryHash ?? string.Empty);
                }
            }

            return CoreApi.StableHashHex(sb.ToString());
        }

        public static string ComputeStateHash(CampaignState state)
        {
            return ComputeCampaignHash(state, null);
        }
    }
}
