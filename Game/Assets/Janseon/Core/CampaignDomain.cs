using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace Janseon.Core
{
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
        CompleteReturn = 9
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

        /// <summary>Default opening party: one ally at <see cref="BattleApi.DefaultMaxHp"/>.</summary>
        public static UnitHpSnapshot DefaultParty()
        {
            return new UnitHpSnapshot(new Dictionary<string, int>
            {
                [BattleApi.AllyId] = BattleApi.DefaultMaxHp
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
        /// The non-persistent foe may be absent and then opens at <see cref="BattleApi.DefaultMaxHp"/>.
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
        public StationId HomeBase;
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
                HomeBase = HomeBase,
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

        public static CampaignState Start(int seed, StationId homeBase, string campaignId)
        {
            return new CampaignState
            {
                CampaignId = campaignId ?? "campaign-0",
                Stage = CampaignStage.BasePreparation,
                Tick = new Tick(0),
                Node = homeBase,
                HomeBase = homeBase,
                Resources = 100,
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
                SettledResultId = string.Empty,
                LastReceiptHash = string.Empty
            };
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
            next.Tick = state.Tick.Next();
            // Stage remains Resolution — settlement advances it.
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
            next.Tick = state.Tick.Next();
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
            next.Tick = state.Tick.Next();
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
            next.Tick = state.Tick.Next();
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
            next.Tick = state.Tick.Next();
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
                RulesVersion,
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
            next.Tick = state.Tick.Next();
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
            next.Tick = state.Tick.Next();
            AppendEvent(ledger, cmd, next, "return-base", (int)next.Stage);
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
                sb.Append(";res=").Append(state.Resources.ToString(CultureInfo.InvariantCulture));
                sb.Append(";rep=").Append(state.Reputation.ToString(CultureInfo.InvariantCulture));
                sb.Append(";seed=").Append(state.Seed.ToString(CultureInfo.InvariantCulture));
                sb.Append(";hp=").Append(state.PartyHp != null ? state.PartyHp.Fingerprint() : string.Empty);
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
