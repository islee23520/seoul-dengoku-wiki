using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

namespace Janseon.Core
{
    /// <summary>
    /// Immutable identity for a settled encounter/battle result (Strategy-Battle-Roundtrip ResultId).
    /// </summary>
    public readonly struct ResultId : IEquatable<ResultId>
    {
        public readonly string Value;

        public ResultId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(ResultId other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
        public override bool Equals(object obj) => obj is ResultId other && Equals(other);
        public override int GetHashCode() => Value == null ? 0 : StringComparer.Ordinal.GetHashCode(Value);
        public override string ToString() => Value;
    }

    /// <summary>
    /// Immutable battle identity matching <see cref="BattleContext.BattleId"/>.
    /// </summary>
    public readonly struct BattleId : IEquatable<BattleId>
    {
        public readonly string Value;

        public BattleId(string value)
        {
            Value = value ?? string.Empty;
        }

        public bool Equals(BattleId other) => string.Equals(Value, other.Value, StringComparison.Ordinal);
        public override bool Equals(object obj) => obj is BattleId other && Equals(other);
        public override int GetHashCode() => Value == null ? 0 : StringComparer.Ordinal.GetHashCode(Value);
        public override string ToString() => Value;
    }

    /// <summary>
    /// Settlement outcomes covering combat terminals and non-combat encounter paths.
    /// </summary>
    public enum SettlementOutcomeKind
    {
        None = 0,
        PlayerVictory = 1,
        EnemyVictory = 2,
        Negotiate = 3,
        Bypass = 4,
        Draw = 5,
        PlayerRetreat = 6,
        EnemySurrender = 7,
        PlayerRout = 8
    }

    public enum SettlementRejectReason
    {
        None = 0,
        WrongStage = 1,
        NoPendingBattle = 2,
        BattleIdMismatch = 3,
        InvalidResult = 4,
        MissingResolution = 5,
        AlreadySettled = 6
    }

    /// <summary>
    /// Immutable encounter/battle result payload submitted for exact-once campaign settlement.
    /// </summary>
    public sealed class EncounterResult
    {
        public ResultId ResultId;
        public BattleId BattleId;
        public SettlementOutcomeKind Outcome;
        public string ResultHash;
    }

    /// <summary>
    /// Exact-once settlement receipt: result id + before/after campaign hashes + receipt hash.
    /// </summary>
    public sealed class SettlementReceipt : IEquatable<SettlementReceipt>
    {
        public readonly ResultId ResultId;
        public readonly BattleId BattleId;
        public readonly SettlementOutcomeKind Outcome;
        public readonly string BeforeCampaignHash;
        public readonly string AfterCampaignHash;
        public readonly string ReceiptHash;
        public readonly string PayloadHash;

        public SettlementReceipt(
            ResultId resultId,
            BattleId battleId,
            SettlementOutcomeKind outcome,
            string beforeCampaignHash,
            string afterCampaignHash,
            string receiptHash,
            string payloadHash)
        {
            ResultId = resultId;
            BattleId = battleId;
            Outcome = outcome;
            BeforeCampaignHash = beforeCampaignHash ?? string.Empty;
            AfterCampaignHash = afterCampaignHash ?? string.Empty;
            ReceiptHash = receiptHash ?? string.Empty;
            PayloadHash = payloadHash ?? string.Empty;
        }

        public bool Equals(SettlementReceipt other)
        {
            return other != null
                && ResultId.Equals(other.ResultId)
                && BattleId.Equals(other.BattleId)
                && Outcome == other.Outcome
                && string.Equals(BeforeCampaignHash, other.BeforeCampaignHash, StringComparison.Ordinal)
                && string.Equals(AfterCampaignHash, other.AfterCampaignHash, StringComparison.Ordinal)
                && string.Equals(ReceiptHash, other.ReceiptHash, StringComparison.Ordinal)
                && string.Equals(PayloadHash, other.PayloadHash, StringComparison.Ordinal);
        }

        public override bool Equals(object obj) => Equals(obj as SettlementReceipt);

        public override int GetHashCode()
        {
            unchecked
            {
                var hash = ResultId.GetHashCode();
                hash = (hash * 397) ^ BattleId.GetHashCode();
                hash = (hash * 397) ^ (int)Outcome;
                hash = (hash * 397) ^ (ReceiptHash == null ? 0 : StringComparer.Ordinal.GetHashCode(ReceiptHash));
                return hash;
            }
        }
    }

    public sealed class SettlementSuccess
    {
        public readonly CampaignState State;
        public readonly SettlementReceipt Receipt;

        public SettlementSuccess(CampaignState state, SettlementReceipt receipt)
        {
            State = state;
            Receipt = receipt;
        }
    }

    public sealed class SettlementRejection
    {
        public readonly SettlementRejectReason Reason;
        public readonly CampaignStage Stage;
        public readonly ResultId ResultId;

        public SettlementRejection(SettlementRejectReason reason, CampaignStage stage, ResultId resultId)
        {
            Reason = reason;
            Stage = stage;
            ResultId = resultId;
        }
    }

    /// <summary>
    /// Same battle, different result payload/hash (or ResultId). Zero mutation recovery error.
    /// </summary>
    public sealed class SettlementConflict
    {
        public readonly ResultId ResultId;
        public readonly BattleId BattleId;
        public readonly string StoredPayloadHash;
        public readonly string IncomingPayloadHash;

        public SettlementConflict(
            ResultId resultId,
            BattleId battleId,
            string storedPayloadHash,
            string incomingPayloadHash)
        {
            ResultId = resultId;
            BattleId = battleId;
            StoredPayloadHash = storedPayloadHash ?? string.Empty;
            IncomingPayloadHash = incomingPayloadHash ?? string.Empty;
        }
    }

    /// <summary>
    /// Exact-once settlement book keyed by ResultId, with BattleId uniqueness for combat results.
    /// Reuses the RequestIndex exact-once shape without depending on TypedPayload.
    /// </summary>
    public sealed class SettlementBook
    {
        struct Entry
        {
            public string PayloadHash;
            public BattleId BattleId;
            public SettlementReceipt Receipt;
        }

        readonly Dictionary<string, Entry> _byResultId = new Dictionary<string, Entry>(StringComparer.Ordinal);
        readonly Dictionary<string, string> _battleToResultId = new Dictionary<string, string>(StringComparer.Ordinal);

        public bool TryGetByResultId(ResultId resultId, out SettlementReceipt receipt, out string payloadHash)
        {
            if (_byResultId.TryGetValue(resultId.Value ?? string.Empty, out var entry))
            {
                receipt = entry.Receipt;
                payloadHash = entry.PayloadHash;
                return true;
            }

            receipt = null;
            payloadHash = null;
            return false;
        }

        public bool TryGetResultIdForBattle(BattleId battleId, out ResultId resultId)
        {
            var key = battleId.Value ?? string.Empty;
            if (string.IsNullOrEmpty(key))
            {
                resultId = default;
                return false;
            }

            if (_battleToResultId.TryGetValue(key, out var stored))
            {
                resultId = new ResultId(stored);
                return true;
            }

            resultId = default;
            return false;
        }

        public void Record(SettlementReceipt receipt, string payloadHash)
        {
            if (receipt == null)
            {
                throw new ArgumentNullException(nameof(receipt));
            }

            var resultKey = receipt.ResultId.Value ?? string.Empty;
            _byResultId[resultKey] = new Entry
            {
                PayloadHash = payloadHash ?? string.Empty,
                BattleId = receipt.BattleId,
                Receipt = receipt
            };

            var battleKey = receipt.BattleId.Value ?? string.Empty;
            if (!string.IsNullOrEmpty(battleKey))
            {
                _battleToResultId[battleKey] = resultKey;
            }
        }
    }

    /// <summary>
    /// Engine-free exact-once settlement seam (Todo 9). Applies combat/non-combat results once.
    /// Documented order: fate → supplies → party location → time → control → reputation.
    /// </summary>
    public static class SettlementApi
    {
        public const string RulesVersion = "poc-settlement-v1";
        public const string ConsequencePlayerVictory = "player-victory";
        public const string ConsequenceEnemyVictory = "enemy-victory";

        public const int PlayerVictoryResourceDelta = 10;
        public const int PlayerVictoryReputationDelta = 5;
        public const int EnemyVictoryResourceDelta = -15;
        public const int EnemyVictoryReputationDelta = -5;

        /// <summary>
        /// Apply an encounter/battle result exactly once.
        /// Returns SettlementSuccess on first apply, SettlementReceipt on exact duplicate,
        /// SettlementConflict on same-battle different payload, or SettlementRejection.
        /// Never mutates caller state/ledger on reject/conflict/duplicate; first apply returns a new state.
        /// </summary>
        public static object Apply(
            CampaignState state,
            Ledger ledger,
            SettlementBook book,
            EncounterResult result)
        {
            if (state == null)
            {
                throw new ArgumentNullException(nameof(state));
            }

            if (ledger == null)
            {
                throw new ArgumentNullException(nameof(ledger));
            }

            if (book == null)
            {
                throw new ArgumentNullException(nameof(book));
            }

            if (result == null
                || string.IsNullOrEmpty(result.ResultId.Value)
                || result.Outcome == SettlementOutcomeKind.None
                || string.IsNullOrEmpty(result.ResultHash))
            {
                return new SettlementRejection(
                    SettlementRejectReason.InvalidResult,
                    state.Stage,
                    result != null ? result.ResultId : default);
            }

            var incomingHash = ComputePayloadHash(result);

            // Exact-once by ResultId: duplicate returns stored receipt with zero mutation.
            if (book.TryGetByResultId(result.ResultId, out var storedReceipt, out var storedPayloadHash))
            {
                if (string.Equals(storedPayloadHash, incomingHash, StringComparison.Ordinal))
                {
                    return storedReceipt;
                }

                return new SettlementConflict(
                    result.ResultId,
                    result.BattleId,
                    storedPayloadHash,
                    incomingHash);
            }

            // Same battle already settled under a different ResultId → conflict, zero mutation.
            if (!string.IsNullOrEmpty(result.BattleId.Value)
                && book.TryGetResultIdForBattle(result.BattleId, out var priorResultId)
                && !priorResultId.Equals(result.ResultId))
            {
                book.TryGetByResultId(priorResultId, out _, out var priorHash);
                return new SettlementConflict(
                    result.ResultId,
                    result.BattleId,
                    priorHash ?? string.Empty,
                    incomingHash);
            }

            var isCombat = result.Outcome == SettlementOutcomeKind.PlayerVictory
                || result.Outcome == SettlementOutcomeKind.EnemyVictory
                || result.Outcome == SettlementOutcomeKind.Draw
                || result.Outcome == SettlementOutcomeKind.PlayerRetreat
                || result.Outcome == SettlementOutcomeKind.EnemySurrender
                || result.Outcome == SettlementOutcomeKind.PlayerRout;
            var isNonCombat = result.Outcome == SettlementOutcomeKind.Negotiate
                || result.Outcome == SettlementOutcomeKind.Bypass;

            if (isCombat)
            {
                if (state.Stage != CampaignStage.Resolution)
                {
                    return new SettlementRejection(SettlementRejectReason.WrongStage, state.Stage, result.ResultId);
                }

                if (state.PendingBattle != null && !string.Equals(state.PendingBattle.BattleId, result.BattleId.Value, StringComparison.Ordinal))
                {
                    return new SettlementRejection(SettlementRejectReason.BattleIdMismatch, state.Stage, result.ResultId);
                }

                if (state.SettlementApplied)
                {
                    return new SettlementRejection(SettlementRejectReason.AlreadySettled, state.Stage, result.ResultId);
                }
            }
            else if (isNonCombat)
            {
                if (state.Stage != CampaignStage.Settlement)
                {
                    return new SettlementRejection(SettlementRejectReason.WrongStage, state.Stage, result.ResultId);
                }

                if (!state.ChoiceLocked
                    || state.Choice == EncounterChoice.None
                    || state.Choice == EncounterChoice.Combat)
                {
                    return new SettlementRejection(SettlementRejectReason.MissingResolution, state.Stage, result.ResultId);
                }

                if (state.SettlementApplied)
                {
                    return new SettlementRejection(SettlementRejectReason.AlreadySettled, state.Stage, result.ResultId);
                }

                if (state.PendingBattle != null)
                {
                    return new SettlementRejection(SettlementRejectReason.NoPendingBattle, state.Stage, result.ResultId);
                }

                // Non-combat has no battle id.
                if (!string.IsNullOrEmpty(result.BattleId.Value))
                {
                    return new SettlementRejection(SettlementRejectReason.BattleIdMismatch, state.Stage, result.ResultId);
                }
            }
            else
            {
                return new SettlementRejection(SettlementRejectReason.InvalidResult, state.Stage, result.ResultId);
            }

            // ---- first apply: fixed documented order ----
            // 1) fate  2) supplies  3) party location  4) time  5) control  6) reputation
            var beforeHash = CampaignApi.ComputeCampaignHash(state, ledger);
            ResolveConsequences(result.Outcome, out var consequenceId, out var resourceDelta, out var reputationDelta);

            var next = state.Clone();

            // 1. Character fate / consequence identity
            next.ConsequenceId = consequenceId;
            next.Choice = MapOutcomeToChoice(result.Outcome);
            next.ChoiceLocked = true;

            // 2. Supplies (resources)
            next.Resources = checked(state.Resources + resourceDelta);
            next.PendingResourceDelta = 0;

            // 3. Party location — POC keeps expedition node until CompleteReturn.
            // (no location mutation here)

            // 4. Time
            next.Tick = state.Tick.Next();

            // 5. Stronghold/route control — no POC control graph mutation.

            // 6. Relation / reputation
            next.Reputation = checked(state.Reputation + reputationDelta);
            next.PendingReputationDelta = 0;

            next.Stage = CampaignStage.Settlement;
            next.SettlementApplied = true;
            next.PendingBattle = null;

            var cmd = new CampaignCommand
            {
                Id = new CommandId("settle-" + (result.ResultId.Value ?? string.Empty)),
                Kind = CampaignCommandKind.ApplySettlement
            };
            AppendSettlementEvent(ledger, cmd, next, result, resourceDelta, reputationDelta);

            // Provisional SettledResultId/LastReceiptHash so after-hash includes them; receipt hash closes the loop.
            next.SettledResultId = result.ResultId.Value ?? string.Empty;
            next.LastReceiptHash = string.Empty;

            // Receipt hash covers result + before + after(without receipt) then we re-stamp LastReceiptHash.
            var afterWithoutReceipt = CampaignApi.ComputeCampaignHash(next, ledger);
            var receiptMaterial =
                "settlement-receipt"
                + ";rid=" + (result.ResultId.Value ?? string.Empty)
                + ";bid=" + (result.BattleId.Value ?? string.Empty)
                + ";out=" + ((int)result.Outcome).ToString(CultureInfo.InvariantCulture)
                + ";payload=" + incomingHash
                + ";before=" + beforeHash
                + ";after=" + afterWithoutReceipt
                + ";rules=" + RulesVersion;
            var receiptHash = CoreApi.StableHashHex(receiptMaterial);
            next.LastReceiptHash = receiptHash;
            var afterHash = CampaignApi.ComputeCampaignHash(next, ledger);

            var receipt = new SettlementReceipt(
                result.ResultId,
                result.BattleId,
                result.Outcome,
                beforeHash,
                afterHash,
                receiptHash,
                incomingHash);
            book.Record(receipt, incomingHash);
            return new SettlementSuccess(next, receipt);
        }

        static EncounterChoice MapOutcomeToChoice(SettlementOutcomeKind outcome)
        {
            switch (outcome)
            {
                case SettlementOutcomeKind.PlayerVictory:
                case SettlementOutcomeKind.EnemyVictory:
                    return EncounterChoice.Combat;
                case SettlementOutcomeKind.Negotiate:
                    return EncounterChoice.Negotiate;
                case SettlementOutcomeKind.Bypass:
                    return EncounterChoice.Bypass;
                default:
                    return EncounterChoice.None;
            }
        }

        static void AppendSettlementEvent(
            Ledger ledger,
            CampaignCommand cmd,
            CampaignState next,
            EncounterResult result,
            int resourceDelta,
            int reputationDelta)
        {
            var summary = CoreApi.StableHashHex(
                "settle=" + (result.Outcome).ToString()
                + ";rid=" + (result.ResultId.Value ?? string.Empty)
                + ";bid=" + (result.BattleId.Value ?? string.Empty)
                + ";rh=" + (result.ResultHash ?? string.Empty)
                + ";cmd=" + (cmd.Id.Value ?? string.Empty)
                + ";stage=" + ((int)next.Stage).ToString(CultureInfo.InvariantCulture)
                + ";node=" + (next.Node.Value ?? string.Empty)
                + ";tick=" + next.Tick.Value.ToString(CultureInfo.InvariantCulture)
                + ";res=" + next.Resources.ToString(CultureInfo.InvariantCulture)
                + ";rep=" + next.Reputation.ToString(CultureInfo.InvariantCulture)
                + ";dRes=" + resourceDelta.ToString(CultureInfo.InvariantCulture)
                + ";dRep=" + reputationDelta.ToString(CultureInfo.InvariantCulture)
                + ";cons=" + (next.ConsequenceId ?? string.Empty)
                + ";order=fate,supplies,location,time,control,reputation");

            ledger.Events.Add(new TypedEvent
            {
                Id = new EventId(
                    "settle-" + next.Tick.Value.ToString(CultureInfo.InvariantCulture)
                    + "-" + (result.ResultId.Value ?? "none")),
                CauseId = cmd.Id,
                Value = resourceDelta,
                At = next.Tick,
                SummaryHash = summary
            });
        }

        /// <summary>
        /// Build a combat EncounterResult from a terminal battle state. Does not mutate battle.
        /// </summary>
        public static EncounterResult FromRealtimeResult(Janseon.Core.Battle.Contracts.BattleResult battle)
        {
            if (battle == null) throw new ArgumentNullException(nameof(battle));
            return battle.ToEncounterResult();
        }

        /// <summary>
        /// Build a non-combat EncounterResult from a locked campaign choice at Settlement stage.
        /// </summary>

        public static EncounterResult FromNonCombat(CampaignState state)
        {
            if (state == null)
            {
                throw new ArgumentNullException(nameof(state));
            }

            SettlementOutcomeKind outcome;
            switch (state.Choice)
            {
                case EncounterChoice.Negotiate:
                    outcome = SettlementOutcomeKind.Negotiate;
                    break;
                case EncounterChoice.Bypass:
                    outcome = SettlementOutcomeKind.Bypass;
                    break;
                default:
                    outcome = SettlementOutcomeKind.None;
                    break;
            }

            var material =
                "noncombat"
                + ";campaign=" + (state.CampaignId ?? string.Empty)
                + ";choice=" + ((int)state.Choice).ToString(CultureInfo.InvariantCulture)
                + ";cons=" + (state.ConsequenceId ?? string.Empty)
                + ";tick=" + state.Tick.Value.ToString(CultureInfo.InvariantCulture)
                + ";node=" + (state.Node.Value ?? string.Empty)
                + ";seed=" + state.Seed.ToString(CultureInfo.InvariantCulture);
            var resultHash = CoreApi.StableHashHex(material);
            return new EncounterResult
            {
                ResultId = new ResultId("result-" + resultHash.Substring(0, 16)),
                BattleId = new BattleId(string.Empty),
                Outcome = outcome,
                ResultHash = resultHash
            };
        }

        public static string ComputePayloadHash(EncounterResult result)
        {
            if (result == null)
            {
                return CoreApi.StableHashHex("encounter-result:null");
            }

            var sb = new StringBuilder(128);
            sb.Append("rid=").Append(result.ResultId.Value ?? string.Empty);
            sb.Append(";bid=").Append(result.BattleId.Value ?? string.Empty);
            sb.Append(";out=").Append(((int)result.Outcome).ToString(CultureInfo.InvariantCulture));
            sb.Append(";rh=").Append(result.ResultHash ?? string.Empty);
            return CoreApi.StableHashHex(sb.ToString());
        }

        // GREEN implementation helpers live below once RED is proven.
        internal static void ResolveConsequences(
            SettlementOutcomeKind outcome,
            out string consequenceId,
            out int resourceDelta,
            out int reputationDelta)
        {
            switch (outcome)
            {
                case SettlementOutcomeKind.PlayerVictory:
                case SettlementOutcomeKind.EnemySurrender:
                    consequenceId = ConsequencePlayerVictory;
                    resourceDelta = PlayerVictoryResourceDelta;
                    reputationDelta = PlayerVictoryReputationDelta;
                    break;
                case SettlementOutcomeKind.EnemyVictory:
                case SettlementOutcomeKind.PlayerRetreat:
                case SettlementOutcomeKind.PlayerRout:
                    consequenceId = ConsequenceEnemyVictory;
                    resourceDelta = EnemyVictoryResourceDelta;
                    reputationDelta = EnemyVictoryReputationDelta;
                    break;
                case SettlementOutcomeKind.Negotiate:
                    consequenceId = CampaignApi.ConsequenceNegotiate;
                    resourceDelta = CampaignApi.NegotiateResourceDelta;
                    reputationDelta = CampaignApi.NegotiateReputationDelta;
                    break;
                case SettlementOutcomeKind.Draw:
                    consequenceId = "draw";
                    resourceDelta = 0;
                    reputationDelta = 0;
                    break;
                case SettlementOutcomeKind.Bypass:
                    consequenceId = CampaignApi.ConsequenceBypass;
                    resourceDelta = CampaignApi.BypassResourceDelta;
                    reputationDelta = CampaignApi.BypassReputationDelta;
                    break;
                default:
                    consequenceId = string.Empty;
                    resourceDelta = 0;
                    reputationDelta = 0;
                    break;
            }
        }
    }
}
