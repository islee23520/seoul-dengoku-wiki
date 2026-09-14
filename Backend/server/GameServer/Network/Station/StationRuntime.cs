using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using SeoulKenshi.Common.ErrorCode;
using SeoulKenshi.Common.Exception;
using SeoulKenshi.Contents.Social;
using SeoulKenshi.Contents.Station;
using SeoulKenshi.Protocols.WCF.Station;

namespace SeoulKenshi.GameServer.Service.Station
{
    /// <summary>
    /// Process-local station store. ConstructionQueue.Current cannot be restored from DB
    /// (private setter, no Restore), so the live wiring keeps the queue in memory.
    /// Starter resources are granted here so L1→L2 is payable on first RequestConstruction.
    /// </summary>
    internal static class StationRuntime
    {
        const long StarterFood = 200;
        const long StarterParts = 160;
        const long StarterEnergy = 80;

        static readonly ConcurrentDictionary<long, StationSession> Sessions =
            new ConcurrentDictionary<long, StationSession>();

        public static StationSession Load(long accountIdx, DateTime now)
        {
            return Sessions.GetOrAdd(accountIdx, id =>
            {
                var state = StationState.CreateDefault(id, now);
                state.Food = StarterFood;
                state.Parts = StarterParts;
                state.Energy = StarterEnergy;
                return new StationSession(state);
            });
        }

        public static void TickAndSettle(StationSession session, DateTime now)
        {
            StationEconomy.ApplyTick(session.State, now);
            if (session.Queue.IsCompleted(now))
            {
                var job = session.Queue.Current;
                var kind = job.FacilityKind;
                var level = job.TargetLevel;
                session.Queue.Complete(session.State, now);
                Social.SocialRuntime.AddEvent(
                    session.State.AccountIdx,
                    now,
                    "ConstructionComplete",
                    $"{kind} reached level {level}");
            }
        }

        public static void StartConstruction(StationSession session, int facilityKind, int targetLevel, DateTime now)
        {
            if (!Enum.IsDefined(typeof(FacilityKind), facilityKind))
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_ARGUMENT, $"unknown FacilityKind {facilityKind}");

            var kind = (FacilityKind)facilityKind;
            var current = session.State.GetLevel(kind);
            if (targetLevel != current + 1)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_ARGUMENT, $"target level must be {current + 1}");

            if (session.Queue.HasJob)
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_ARGUMENT, "construction queue is busy");

            var cost = ConstructionQueue.CostFor(targetLevel);
            if (session.State.Food < cost.Food ||
                session.State.Parts < cost.Parts ||
                session.State.Energy < cost.Energy ||
                session.State.Vouchers < cost.Vouchers)
            {
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_ARGUMENT, "insufficient resources");
            }

            session.State.Food -= cost.Food;
            session.State.Parts -= cost.Parts;
            session.State.Energy -= cost.Energy;
            session.State.Vouchers -= cost.Vouchers;

            if (!session.Queue.TryStart(kind, targetLevel, now))
                throw new ErrorCodeException(SystemErrorCode.SYSTEM_INVALID_ARGUMENT, "construction queue is busy");

            Social.SocialRuntime.AddEvent(
                session.State.AccountIdx,
                now,
                "Construction",
                $"{kind} {current}->{targetLevel}");
        }

        public static IEnumerable<RankingScore> AllScores()
        {
            foreach (var session in Sessions.Values)
            {
                var state = session.State;
                var total = state.Food + state.Parts + state.Energy + state.Vouchers;
                var levels = state.SupplyLevel + state.WorkshopLevel + state.SubstationLevel + state.ExchangeLevel;
                yield return new RankingScore(state.AccountIdx, total, levels);
            }
        }

        public static StationPacket ToStationPacket(StationState state)
        {
            return new StationPacket
            {
                Food = state.Food,
                Parts = state.Parts,
                Energy = state.Energy,
                Vouchers = state.Vouchers,
                SupplyLevel = state.SupplyLevel,
                WorkshopLevel = state.WorkshopLevel,
                SubstationLevel = state.SubstationLevel,
                ExchangeLevel = state.ExchangeLevel,
                LastUpdated = ToUnixSeconds(state.LastUpdated)
            };
        }

        public static ConstructionPacket ToConstructionPacket(ConstructionQueue queue)
        {
            if (queue == null || queue.Current == null)
                return null;

            var job = queue.Current;
            return new ConstructionPacket
            {
                FacilityKind = (int)job.FacilityKind,
                TargetLevel = job.TargetLevel,
                StartedAt = ToUnixSeconds(job.StartedAt),
                CompletesAt = ToUnixSeconds(job.CompletesAt)
            };
        }

        static long ToUnixSeconds(DateTime dt)
        {
            var utc = dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            return new DateTimeOffset(utc).ToUnixTimeSeconds();
        }
    }

    internal sealed class StationSession
    {
        public StationSession(StationState state)
        {
            State = state;
            Queue = new ConstructionQueue();
        }

        public StationState State { get; }
        public ConstructionQueue Queue { get; }
    }
}
