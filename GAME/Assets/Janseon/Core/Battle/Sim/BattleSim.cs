using System;
using System.Collections.Generic;
using System.Globalization;
using Janseon.Core.Battle.Contracts;

namespace Janseon.Core.Battle.Sim
{
    public static class BattleSim
    {
        public static BattleSimState Open(BattleSetup setup)
        {
            if (setup == null)
            {
                throw new ArgumentNullException(nameof(setup));
            }
            if (setup.Context == null || setup.Definition == null || setup.Navigation == null)
            {
                throw new ArgumentException("Battle setup requires explicit context, definition, and navigation.", nameof(setup));
            }
            setup.Context.ValidateIntegrity();
            if (setup.PlayerUnits == null || setup.EnemyUnits == null)
            {
                throw new ArgumentException("Both rosters are required.", nameof(setup));
            }
            if (setup.PlayerFormation == null || setup.EnemyFormation == null)
            {
                throw new ArgumentException("Both formations are required.", nameof(setup));
            }

            setup.Navigation.Validate();
            ValidateRoster(setup.PlayerUnits, 0);
            ValidateRoster(setup.EnemyUnits, 1);
            ValidateUniqueSoldierIds(setup.PlayerUnits, setup.EnemyUnits);
            ValidateFormation(setup.Navigation, setup.PlayerFormation, setup.PlayerUnits);
            ValidateFormation(setup.Navigation, setup.EnemyFormation, setup.EnemyUnits);
            ValidateCommander(setup.PlayerUnits, setup.PlayerCommanderId, "Player");
            ValidateCommander(setup.EnemyUnits, setup.EnemyCommanderId, "Enemy");
            ValidateRetreatAnchors(setup.Navigation, setup.PlayerRetreatAnchors);
            ValidateRetreatAnchors(setup.Navigation, setup.EnemyRetreatAnchors);
            if (!setup.Navigation.Contains(setup.EnemyObjectivePosition))
            {
                throw new ArgumentException("Enemy objective must reference an authored navigation position.", nameof(setup));
            }

            var state = new BattleSimState
            {
                Context = setup.Context,
                Definition = setup.Definition,
                Arena = new ArenaState
                {
                    Navigation = setup.Navigation,
                    PlayerRetreatAnchors = ClonePositions(setup.PlayerRetreatAnchors),
                    EnemyRetreatAnchors = ClonePositions(setup.EnemyRetreatAnchors),
                    EnemyObjectivePosition = setup.EnemyObjectivePosition
                },
                Outcome = BattleOutcomeKind.Ongoing,
                Rng = CreateRng(setup.Context),
                Units = CreateUnits(setup.PlayerUnits, setup.EnemyUnits, setup.PlayerFormation, setup.EnemyFormation),
                Heroes = CreateHeroes(setup),
                Sides = new[]
                {
                    new SideState { Morale = setup.Definition.MoraleBase },
                    new SideState { Morale = setup.Definition.MoraleBase }
                },
                PlayerCommanderId = setup.PlayerCommanderId,
                EnemyCommanderId = setup.EnemyCommanderId,
                NextEnemyDecisionSeconds = setup.Definition.DecisionIntervalSeconds
            };

            state.Telegraphs = CreateTelegraphs(setup.Telegraphs);
            state.PreviousHp = new int[state.Units.Length];
            state.PreviousStatuses = new BattleUnitStatus[state.Units.Length];
            for (var i = 0; i < state.Units.Length; i++)
            {
                state.PreviousHp[i] = state.Units[i].Hp;
                state.PreviousStatuses[i] = state.Units[i].Status;
            }

            UpdateCommanderState(state);
            state.PublishFrame();
            return state;
        }

        public static object Submit(BattleSimState state, Ledger ledger, BattleTickCommand command)
        {
            if (state == null || ledger == null || command == null)
            {
                return Reject(BattleRejectReason.MalformedCommand);
            }
            if (command.AtSeconds < state.ElapsedSeconds)
            {
                return Reject(BattleRejectReason.TimestampMismatch);
            }
            if (state.Outcome != BattleOutcomeKind.Ongoing)
            {
                return Reject(BattleRejectReason.BattleEnded);
            }

            var candidate = state.Clone();
            BattleRejection rejection;
            try
            {
                rejection = ValidateAndApply(candidate, command.Clone());
            }
            catch (ArgumentException exception)
            {
                return Reject(BattleRejectReason.MalformedCommand, exception.Message);
            }
            if (rejection != null)
            {
                return rejection;
            }

            state.Pending = candidate.Pending;
            state.Deployed = candidate.Deployed;
            state.PublishFrame();
            ledger.Events.Add(new TypedEvent
            {
                Id = new EventId(command.Id.Value),
                CauseId = command.Id,
                SummaryHash = state.Fingerprint()
            });
            return null;
        }

        public static void Step(BattleSimState state, Ledger ledger, double fixedDeltaSeconds)
        {
            if (state == null || ledger == null || state.Outcome != BattleOutcomeKind.Ongoing)
            {
                return;
            }
            if (fixedDeltaSeconds <= 0d)
            {
                throw new ArgumentOutOfRangeException(nameof(fixedDeltaSeconds));
            }

            var previous = state.ElapsedSeconds;
            state.ElapsedSeconds += fixedDeltaSeconds;
            state.Pending.Sort(CompareCommands);
            while (state.Pending.Count > 0 && state.Pending[0].AtSeconds <= state.ElapsedSeconds)
            {
                var command = state.Pending[0];
                state.Pending.RemoveAt(0);
                ApplyCommand(state, command);
            }

            MoveUnits(state, fixedDeltaSeconds);
            ResolveSoldierSpacing(state);
            ResolveAttacks(state, fixedDeltaSeconds);
            while (state.NextEnemyDecisionSeconds <= state.ElapsedSeconds)
            {
                IssueEnemyCommands(state, state.NextEnemyDecisionSeconds);
                state.NextEnemyDecisionSeconds += state.Definition.DecisionIntervalSeconds;
            }
            ResolveMorale(state, fixedDeltaSeconds);
            UpdateCommanderState(state);
            ResolveOutcome(state);
            if (previous < state.Definition.MaximumDurationSeconds
                && state.ElapsedSeconds >= state.Definition.MaximumDurationSeconds)
            {
                state.Outcome = BattleOutcomeKind.Draw;
            }

            ledger.Events.Add(new TypedEvent
            {
                Id = new EventId(state.Context.BattleId + "@" + state.ElapsedSeconds.ToString("R", CultureInfo.InvariantCulture)),
                SummaryHash = state.Fingerprint()
            });
            state.PublishFrame();
        }

        public static void Step(BattleSimState state, Ledger ledger, float fixedDeltaSeconds)
        {
            Step(state, ledger, (double)fixedDeltaSeconds);
        }

        static BattleRejection ValidateAndApply(BattleSimState state, BattleTickCommand command, bool enemy = false)
        {
            if (command.AtSeconds < state.ElapsedSeconds)
            {
                return Reject(BattleRejectReason.TimestampMismatch);
            }
            if (command.Kind == BattleTickCommandKind.Deploy)
            {
                if (state.Deployed || command.Formation == null)
                {
                    return Reject(BattleRejectReason.BattleStarted);
                }
                ValidateFormation(state.Arena.Navigation, command.Formation, state.Units);
                state.Pending.Add(command);
                return null;
            }
            if (!state.Deployed)
            {
                return Reject(BattleRejectReason.NotDeployed);
            }
            if (state.Sides[0].CommandsLocked)
            {
                return Reject(BattleRejectReason.CommandsLocked);
            }
            if (command.Kind == BattleTickCommandKind.DemandSurrender)
            {
                UpdateCommanderState(state);
                return state.Sides[1].SurrenderConditionsMet
                    ? Queue(state, command)
                    : Reject(BattleRejectReason.SurrenderConditionsUnmet);
            }
            if (command.Kind == BattleTickCommandKind.OrderRetreat)
            {
                return HasRetreatPath(state, 0)
                    ? Queue(state, command)
                    : Reject(BattleRejectReason.RetreatUnavailable);
            }

            var actor = FindUnit(state, command.ActorUnitId);
            if (actor == null || (actor.Side != 0 && !(enemy && actor.Side == 1)) || actor.Hp <= 0 || actor.Status != BattleUnitStatus.Active)
            {
                return Reject(BattleRejectReason.UnknownActor);
            }
            if (command.Kind == BattleTickCommandKind.Move)
            {
                if (!ValidPath(state.Arena.Navigation, actor.Position, command.Destination, command.Path))
                {
                    return Reject(BattleRejectReason.DestinationOffNav);
                }
            }
            else if (command.Kind == BattleTickCommandKind.Attack)
            {
                var target = FindUnit(state, command.TargetUnitId);
                if (target == null || target.Side == actor.Side || target.Hp <= 0 || !CanBeTargeted(target.Status))
                {
                    return Reject(BattleRejectReason.InvalidTarget);
                }
            }
            else
            {
                return Reject(BattleRejectReason.MalformedCommand);
            }

            state.Pending.Add(command);
            return null;
        }

        static void IssueEnemyCommands(BattleSimState state, double atSeconds)
        {
            var enemies = new List<UnitState>();
            foreach (var unit in state.Units)
                if (unit.Side == 1 && unit.Hp > 0 && unit.Status == BattleUnitStatus.Active) enemies.Add(unit);
            enemies.Sort((left, right) => string.CompareOrdinal(left.Id.Value, right.Id.Value));
            foreach (var enemy in enemies)
            {
                var target = FindUnit(state, enemy.OrderTargetUnitId);
                if (target == null || target.Side != 0 || target.Hp <= 0 || !CanBeTargeted(target.Status))
                    target = NearestLegalPlayer(state, enemy);
                if (target != null)
                {
                    var distance = enemy.Position.DistanceSquaredTo(target.Position);
                    var maxRange = (long)enemy.RangeMaxMm * enemy.RangeMaxMm;
                    var minRange = (long)enemy.RangeMinMm * enemy.RangeMinMm;
                    if (distance >= minRange && distance <= maxRange)
                    {
                        QueueEnemyCommand(state, new BattleTickCommand { AtSeconds = state.ElapsedSeconds, Kind = BattleTickCommandKind.Attack, ActorUnitId = enemy.Id, TargetUnitId = target.Id });
                        continue;
                    }
                    NavPath path;
                    if (TryBuildPath(state.Arena.Navigation, enemy.Position, target.Position, out path))
                        QueueEnemyCommand(state, new BattleTickCommand { AtSeconds = state.ElapsedSeconds, Kind = BattleTickCommandKind.Move, ActorUnitId = enemy.Id, Destination = target.Position, Path = path });
                }
                else if (TryBuildPath(state.Arena.Navigation, enemy.Position, state.Arena.EnemyObjectivePosition, out var objectivePath))
                    QueueEnemyCommand(state, new BattleTickCommand { AtSeconds = state.ElapsedSeconds, Kind = BattleTickCommandKind.Move, ActorUnitId = enemy.Id, Destination = state.Arena.EnemyObjectivePosition, Path = objectivePath });
            }
        }

        static void QueueEnemyCommand(BattleSimState state, BattleTickCommand command)
        {
            if (ValidateAndApply(state, command, true) == null)
                ApplyCommand(state, command);
        }

        static UnitState NearestLegalPlayer(BattleSimState state, UnitState enemy)
        {
            UnitState result = null;
            foreach (var unit in state.Units)
                if (unit.Side == 0 && unit.Hp > 0 && CanBeTargeted(unit.Status)
                    && (result == null || enemy.Position.DistanceSquaredTo(unit.Position) < enemy.Position.DistanceSquaredTo(result.Position)
                        || (enemy.Position.DistanceSquaredTo(unit.Position) == enemy.Position.DistanceSquaredTo(result.Position)
                            && string.CompareOrdinal(unit.Id.Value, result.Id.Value) < 0))) result = unit;
            return result;
        }

        static bool TryBuildPath(NavPath navigation, BattlePositionMm origin, BattlePositionMm destination, out NavPath path)
        {
            path = null;
            if (!TryFindNodeId(navigation, origin, out var originId) || !TryFindNodeId(navigation, destination, out var destinationId)) return false;
            var previous = new Dictionary<string, string>(StringComparer.Ordinal) { [originId] = null };
            var queue = new Queue<string>(); queue.Enqueue(originId);
            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                var next = new List<NavSegment>();
                foreach (var segment in navigation.Segments) if (segment.FromNodeId == current) next.Add(segment);
                next.Sort((a, b) => string.CompareOrdinal(a.ToNodeId, b.ToNodeId));
                foreach (var segment in next) if (previous.TryAdd(segment.ToNodeId, current)) queue.Enqueue(segment.ToNodeId);
            }
            if (!previous.ContainsKey(destinationId)) return false;
            var ids = new List<string>(); for (var id = destinationId; id != null; id = previous[id]) ids.Add(id); ids.Reverse();
            var segments = new List<NavSegment>(); for (var i = 1; i < ids.Count; i++) segments.Add(new NavSegment(ids[i - 1], ids[i]));
            var nodes = new List<NavNode>(); foreach (var id in ids) { navigation.TryGetNode(id, out var node); nodes.Add(node); }
            path = new NavPath(nodes, segments); return true;
        }

        static BattleRejection Queue(BattleSimState state, BattleTickCommand command)
        {
            state.Pending.Add(command);
            return null;
        }

        static void ApplyCommand(BattleSimState state, BattleTickCommand command)
        {
            if (command.Kind == BattleTickCommandKind.Deploy)
            {
                for (var i = 0; i < command.Formation.Length; i++)
                {
                    var unit = FindUnit(state, command.Formation[i].Unit);
                    unit.Position = command.Formation[i].Position;
                    unit.Facing = command.Formation[i].Facing;
                }
                state.Deployed = true;
                return;
            }
            if (command.Kind == BattleTickCommandKind.OrderRetreat)
            {
                if (HasRetreatPath(state, 0))
                {
                    state.Outcome = BattleOutcomeKind.PlayerRetreat;
                }
                return;
            }
            if (command.Kind == BattleTickCommandKind.DemandSurrender)
            {
                UpdateCommanderState(state);
                if (state.Sides[1].SurrenderConditionsMet)
                {
                    state.Outcome = BattleOutcomeKind.EnemySurrender;
                }
                return;
            }

            var actor = FindUnit(state, command.ActorUnitId);
            if (actor == null)
            {
                return;
            }
            if (command.Kind == BattleTickCommandKind.Move)
            {
                actor.OrderKind = BattleOrderKind.Move;
                actor.OrderDestination = command.Destination;
                actor.OrderTargetUnitId = new UnitId();
                actor.ActivePath = command.Path;
                actor.ActivePathSegmentIndex = 0;
                actor.ActivePathSegmentProgressMm = 0d;
            }
            else if (command.Kind == BattleTickCommandKind.Attack)
            {
                actor.OrderKind = BattleOrderKind.Attack;
                actor.OrderTargetUnitId = command.TargetUnitId;
                actor.ActivePath = null;
                actor.ActivePathSegmentIndex = 0;
                actor.ActivePathSegmentProgressMm = 0d;
            }
        }

        static void MoveUnits(BattleSimState state, double seconds)
        {
            var units = new List<UnitState>(state.Units);
            units.Sort((left, right) => string.CompareOrdinal(left.Id.Value, right.Id.Value));
            for (var i = 0; i < units.Count; i++)
            {
                var unit = units[i];
                if (unit.OrderKind != BattleOrderKind.Move || unit.Hp <= 0 || unit.Status != BattleUnitStatus.Active
                    || unit.ActivePath == null)
                {
                    continue;
                }

                var remaining = unit.MoveSpeedMillimetersPerSecond * seconds;
                while (remaining > 0d && unit.ActivePathSegmentIndex < unit.ActivePath.Segments.Count)
                {
                    var segment = unit.ActivePath.Segments[unit.ActivePathSegmentIndex];
                    NavNode from;
                    NavNode to;
                    if (!unit.ActivePath.TryGetNode(segment.FromNodeId, out from)
                        || !unit.ActivePath.TryGetNode(segment.ToNodeId, out to))
                    {
                        ClearMoveOrder(unit);
                        break;
                    }

                    var segmentLength = DistanceMm(from.Position, to.Position);
                    if (segmentLength <= 0d)
                    {
                        unit.Position = to.Position;
                        unit.ActivePathSegmentIndex++;
                        unit.ActivePathSegmentProgressMm = 0d;
                        continue;
                    }

                    var available = segmentLength - unit.ActivePathSegmentProgressMm;
                    var advance = Math.Min(remaining, available);
                    unit.ActivePathSegmentProgressMm += advance;
                    remaining -= advance;
                    unit.Position = Interpolate(from.Position, to.Position, unit.ActivePathSegmentProgressMm / segmentLength);
                    unit.Facing = BattleFacing.FromDelta(to.Position.X - from.Position.X, to.Position.Z - from.Position.Z);

                    if (unit.ActivePathSegmentProgressMm + 0.0000001d >= segmentLength)
                    {
                        unit.Position = to.Position;
                        unit.ActivePathSegmentIndex++;
                        unit.ActivePathSegmentProgressMm = 0d;
                    }
                }

                if (unit.ActivePathSegmentIndex >= unit.ActivePath.Segments.Count)
                {
                    unit.Position = unit.OrderDestination;
                    ClearMoveOrder(unit);
                }
            }
        }

        static void ResolveSoldierSpacing(BattleSimState state)
        {
            var units = new List<UnitState>();
            for (var i = 0; i < state.Units.Length; i++)
            {
                if (state.Units[i].Hp > 0 && state.Units[i].Status == BattleUnitStatus.Active)
                {
                    units.Add(state.Units[i]);
                }
            }
            units.Sort((left, right) => string.CompareOrdinal(left.Id.Value, right.Id.Value));

            for (var pass = 0; pass < units.Count; pass++)
            {
                var changed = false;
                for (var leftIndex = 0; leftIndex < units.Count; leftIndex++)
                {
                    for (var rightIndex = leftIndex + 1; rightIndex < units.Count; rightIndex++)
                    {
                        changed |= SeparatePair(state.Arena.Navigation, units[leftIndex], units[rightIndex]);
                    }
                }
                if (!changed)
                {
                    break;
                }
            }
        }

        static bool SeparatePair(NavPath navigation, UnitState left, UnitState right)
        {
            var deltaX = (long)right.Position.X - left.Position.X;
            var deltaZ = (long)right.Position.Z - left.Position.Z;
            var required = (long)left.RadiusMm + right.RadiusMm;
            var distanceSquared = deltaX * deltaX + deltaZ * deltaZ;
            if (distanceSquared >= required * required)
            {
                return false;
            }

            if (distanceSquared == 0)
            {
                deltaX = string.CompareOrdinal(left.Id.Value, right.Id.Value) <= 0 ? 1L : -1L;
                deltaZ = 0L;
            }

            var distance = Math.Sqrt(deltaX * deltaX + deltaZ * deltaZ);
            var overlap = required - distance;
            var unitX = deltaX / distance;
            var unitZ = deltaZ / distance;
            var half = overlap / 2d;
            var leftCandidate = Offset(left.Position, -unitX * half, -unitZ * half);
            var rightCandidate = Offset(right.Position, unitX * half, unitZ * half);
            var leftLegal = IsOnNavigation(navigation, leftCandidate);
            var rightLegal = IsOnNavigation(navigation, rightCandidate);

            if (leftLegal && rightLegal)
            {
                left.Position = leftCandidate;
                right.Position = rightCandidate;
                return true;
            }

            if (leftLegal)
            {
                left.Position = Offset(left.Position, -unitX * overlap, -unitZ * overlap);
                return IsOnNavigation(navigation, left.Position);
            }

            if (rightLegal)
            {
                right.Position = Offset(right.Position, unitX * overlap, unitZ * overlap);
                return IsOnNavigation(navigation, right.Position);
            }

            return false;
        }

        static BattlePositionMm Offset(BattlePositionMm position, double deltaX, double deltaZ)
        {
            return new BattlePositionMm(
                checked(position.X + (int)Math.Ceiling(deltaX)),
                position.Y,
                checked(position.Z + (int)Math.Ceiling(deltaZ)));
        }

        static bool IsOnNavigation(NavPath navigation, BattlePositionMm position)
        {
            if (navigation.Contains(position))
            {
                return true;
            }

            for (var i = 0; i < navigation.Segments.Count; i++)
            {
                if (!navigation.TryGetNode(navigation.Segments[i].FromNodeId, out var from)
                    || !navigation.TryGetNode(navigation.Segments[i].ToNodeId, out var to))
                {
                    continue;
                }

                var segmentX = (long)to.Position.X - from.Position.X;
                var segmentZ = (long)to.Position.Z - from.Position.Z;
                var pointX = (long)position.X - from.Position.X;
                var pointZ = (long)position.Z - from.Position.Z;
                if (segmentX * pointZ != segmentZ * pointX)
                {
                    continue;
                }

                var dot = pointX * segmentX + pointZ * segmentZ;
                var lengthSquared = segmentX * segmentX + segmentZ * segmentZ;
                if (dot >= 0 && dot <= lengthSquared && position.Y == from.Position.Y)
                {
                    return true;
                }
            }
            return false;
        }

        static void ClearMoveOrder(UnitState unit)
        {
            unit.OrderKind = BattleOrderKind.None;
            unit.ActivePath = null;
            unit.ActivePathSegmentIndex = 0;
            unit.ActivePathSegmentProgressMm = 0d;
        }

        static void ResolveAttacks(BattleSimState state, double seconds)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                var attacker = state.Units[i];
                attacker.AttackCooldownSecondsRemaining = Math.Max(0d, attacker.AttackCooldownSecondsRemaining - seconds);
                if (attacker.OrderKind != BattleOrderKind.Attack || attacker.AttackCooldownSecondsRemaining > 0d
                    || attacker.Hp <= 0 || attacker.Status != BattleUnitStatus.Active)
                {
                    continue;
                }

                var target = FindUnit(state, attacker.OrderTargetUnitId);
                if (target == null || target.Side == attacker.Side || target.Hp <= 0 || !CanBeTargeted(target.Status))
                {
                    continue;
                }

                var distanceSquared = attacker.Position.DistanceSquaredTo(target.Position);
                var rangeMinSquared = (long)attacker.RangeMinMm * attacker.RangeMinMm;
                var rangeMaxSquared = (long)attacker.RangeMaxMm * attacker.RangeMaxMm;
                if (distanceSquared < rangeMinSquared || distanceSquared > rangeMaxSquared)
                {
                    continue;
                }

                target.Hp = Math.Max(0, target.Hp - attacker.Power);
                target.SurvivorCount = AggregateSurvivorRules.FromHp(target.Hp, target.MaxHp);
                if (target.Hp == 0)
                {
                    target.Status = BattleUnitStatus.Down;
                }
                attacker.AttackCooldownSecondsRemaining = attacker.AttackCooldownSeconds;
            }
        }

        static void ResolveMorale(BattleSimState state, double seconds)
        {
            for (var i = 0; i < state.Sides.Length; i++)
            {
                state.Sides[i].Morale = Math.Min(
                    state.Definition.MoraleRecoverCap,
                    state.Sides[i].Morale + (int)Math.Floor(state.Definition.MoraleRecoveryPerSecond * seconds));
            }
        }

        static void UpdateCommanderState(BattleSimState state)
        {
            state.Sides[0].CommanderHpPercent = CommanderHpPercent(state, state.PlayerCommanderId);
            state.Sides[1].CommanderHpPercent = CommanderHpPercent(state, state.EnemyCommanderId);
            state.Sides[0].RetreatCovered = HasRetreatPath(state, 0);
            state.Sides[1].RetreatCovered = HasRetreatPath(state, 1);
        }

        static int CommanderHpPercent(BattleSimState state, UnitId commanderId)
        {
            var commander = FindUnit(state, commanderId);
            return commander == null || commander.MaxHp <= 0
                ? 0
                : (int)Math.Max(0L, Math.Min(100L, (100L * commander.Hp) / commander.MaxHp));
        }

        static bool HasRetreatPath(BattleSimState state, int side)
        {
            var anchors = side == 0 ? state.Arena.PlayerRetreatAnchors : state.Arena.EnemyRetreatAnchors;
            if (anchors == null || anchors.Length == 0)
            {
                return false;
            }

            for (var i = 0; i < state.Units.Length; i++)
            {
                var unit = state.Units[i];
                if (unit.Side != side || unit.Hp <= 0 || !CanRetreat(unit.Status))
                {
                    continue;
                }
                for (var anchorIndex = 0; anchorIndex < anchors.Length; anchorIndex++)
                {
                    if (HasNavigationRoute(state.Arena.Navigation, unit.Position, anchors[anchorIndex]))
                    {
                        return true;
                    }
                }
            }
            return false;
        }

        static void ResolveOutcome(BattleSimState state)
        {
            var player = HasLivingSide(state, 0);
            var enemy = HasLivingSide(state, 1);
            if (!player && !enemy)
            {
                state.Outcome = BattleOutcomeKind.Draw;
            }
            else if (!player)
            {
                state.Outcome = BattleOutcomeKind.EnemyVictory;
            }
            else if (!enemy)
            {
                state.Outcome = BattleOutcomeKind.PlayerVictory;
            }
        }

        static bool ValidPath(NavPath navigation, BattlePositionMm origin, BattlePositionMm destination, NavPath path)
        {
            if (navigation == null || path == null || path.Segments.Count == 0)
            {
                return false;
            }

            NavNode firstFrom;
            NavNode finalTo;
            if (!path.TryGetNode(path.Segments[0].FromNodeId, out firstFrom)
                || !path.TryGetNode(path.Segments[path.Segments.Count - 1].ToNodeId, out finalTo)
                || !firstFrom.Position.Equals(origin)
                || !finalTo.Position.Equals(destination))
            {
                return false;
            }

            for (var i = 0; i < path.Segments.Count; i++)
            {
                var segment = path.Segments[i];
                NavNode from;
                NavNode to;
                NavNode authoredFrom;
                NavNode authoredTo;
                if (!path.TryGetNode(segment.FromNodeId, out from)
                    || !path.TryGetNode(segment.ToNodeId, out to)
                    || !navigation.TryGetNode(segment.FromNodeId, out authoredFrom)
                    || !navigation.TryGetNode(segment.ToNodeId, out authoredTo)
                    || !from.Position.Equals(authoredFrom.Position)
                    || !to.Position.Equals(authoredTo.Position)
                    || !ContainsSegment(navigation, segment.FromNodeId, segment.ToNodeId))
                {
                    return false;
                }
                if (i > 0 && !string.Equals(path.Segments[i - 1].ToNodeId, segment.FromNodeId, StringComparison.Ordinal))
                {
                    return false;
                }
            }
            return true;
        }

        static bool ContainsSegment(NavPath navigation, string fromNodeId, string toNodeId)
        {
            for (var i = 0; i < navigation.Segments.Count; i++)
            {
                var segment = navigation.Segments[i];
                if (string.Equals(segment.FromNodeId, fromNodeId, StringComparison.Ordinal)
                    && string.Equals(segment.ToNodeId, toNodeId, StringComparison.Ordinal))
                {
                    return true;
                }
            }
            return false;
        }

        static bool HasNavigationRoute(NavPath navigation, BattlePositionMm origin, BattlePositionMm destination)
        {
            if (origin.Equals(destination))
            {
                return true;
            }

            string originId;
            string destinationId;
            if (!TryFindNodeId(navigation, origin, out originId) || !TryFindNodeId(navigation, destination, out destinationId))
            {
                return false;
            }

            var visited = new HashSet<string>(StringComparer.Ordinal) { originId };
            var queue = new Queue<string>();
            queue.Enqueue(originId);
            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                for (var i = 0; i < navigation.Segments.Count; i++)
                {
                    var segment = navigation.Segments[i];
                    if (!string.Equals(segment.FromNodeId, current, StringComparison.Ordinal) || !visited.Add(segment.ToNodeId))
                    {
                        continue;
                    }
                    if (string.Equals(segment.ToNodeId, destinationId, StringComparison.Ordinal))
                    {
                        return true;
                    }
                    queue.Enqueue(segment.ToNodeId);
                }
            }
            return false;
        }

        static bool TryFindNodeId(NavPath navigation, BattlePositionMm position, out string id)
        {
            for (var i = 0; i < navigation.Nodes.Count; i++)
            {
                if (navigation.Nodes[i].Position.Equals(position))
                {
                    id = navigation.Nodes[i].Id;
                    return true;
                }
            }
            id = null;
            return false;
        }

        static void ValidateRoster(RosterUnit[] roster, int side)
        {
            if (roster.Length > 20)
            {
                throw new ArgumentException("A battle side cannot contain more than 20 soldiers.");
            }

            var squadCounts = new Dictionary<string, int>(StringComparer.Ordinal);
            var ids = new HashSet<string>(StringComparer.Ordinal);
            for (var i = 0; i < roster.Length; i++)
            {
                var unit = roster[i];
                if (unit == null || unit.Side != side || string.IsNullOrEmpty(unit.Id.Value) || !ids.Add(unit.Id.Value)
                    || string.IsNullOrEmpty(unit.SoldierId.Value) || unit.MaxHp <= 0 || unit.Hp < 0 || unit.Hp > unit.MaxHp || unit.RadiusMm <= 0
                    || unit.MoveMillimetersPerSecond <= 0 || unit.AttackCooldownSeconds < 0d
                    || unit.RangeMinMm < 0 || unit.RangeMaxMm < unit.RangeMinMm || !unit.InitialStatus.HasValue
                    || string.IsNullOrWhiteSpace(unit.VisualKindId))
                {
                    throw new ArgumentException("Roster contains invalid or incomplete authored unit data.");
                }

                var squadId = unit.SquadId.Value ?? string.Empty;
                squadCounts.TryGetValue(squadId, out var squadCount);
                squadCount++;
                if (squadCount > 20)
                {
                    throw new ArgumentException("A squad cannot contain more than 20 soldiers.");
                }
                squadCounts[squadId] = squadCount;
            }
        }

        static void ValidateUniqueSoldierIds(RosterUnit[] player, RosterUnit[] enemy)
        {
            var soldierIds = new HashSet<string>(StringComparer.Ordinal);
            ValidateUniqueSoldierIds(player, soldierIds);
            ValidateUniqueSoldierIds(enemy, soldierIds);
        }

        static void ValidateUniqueSoldierIds(RosterUnit[] roster, HashSet<string> soldierIds)
        {
            for (var i = 0; i < roster.Length; i++)
            {
                var soldierId = roster[i].SoldierId.Value;
                if (!string.IsNullOrEmpty(soldierId) && !soldierIds.Add(soldierId))
                {
                    throw new ArgumentException("Soldier ids must be unique across the complete battle roster.");
                }
            }
        }

        static void ValidateCommander(RosterUnit[] roster, UnitId commanderId, string side)
        {
            if (string.IsNullOrEmpty(commanderId.Value) || FindRoster(roster, commanderId) == null)
            {
                throw new ArgumentException(side + " commander must reference an authored roster unit.");
            }
        }

        static void ValidateRetreatAnchors(NavPath navigation, BattlePositionMm[] anchors)
        {
            if (anchors == null)
            {
                return;
            }
            for (var i = 0; i < anchors.Length; i++)
            {
                if (!navigation.Contains(anchors[i]))
                {
                    throw new ArgumentException("Retreat anchors must reference authored navigation positions.");
                }
            }
        }

        static void ValidateFormation(NavPath navigation, FormationSlot[] formation, RosterUnit[] roster)
        {
            var ids = new HashSet<string>(StringComparer.Ordinal);
            for (var i = 0; i < formation.Length; i++)
            {
                var slot = formation[i];
                if (slot == null || !navigation.Contains(slot.Position) || !ids.Add(slot.Unit.Value) || FindRoster(roster, slot.Unit) == null)
                {
                    throw new ArgumentException("Formation contains invalid authored position or unit.");
                }
            }
            if (ids.Count != roster.Length)
            {
                throw new ArgumentException("Formation must explicitly place every unit.");
            }
        }

        static void ValidateFormation(NavPath navigation, FormationSlot[] formation, UnitState[] units)
        {
            var ids = new HashSet<string>(StringComparer.Ordinal);
            for (var i = 0; i < formation.Length; i++)
            {
                if (formation[i] == null || !navigation.Contains(formation[i].Position) || !ids.Add(formation[i].Unit.Value)
                    || FindUnit(units, formation[i].Unit) == null)
                {
                    throw new ArgumentException("Formation contains invalid authored position or unit.");
                }
            }
            if (ids.Count != units.Length)
            {
                throw new ArgumentException("Formation must explicitly place every unit.");
            }
        }

        static HeroState[] CreateHeroes(BattleSetup setup)
        {
            var heroes = new List<HeroState>();
            AddHero(heroes, setup.PlayerHeroId, setup.PlayerHero, "Player");
            AddHero(heroes, setup.EnemyHeroId, setup.EnemyHero, "Enemy");
            return heroes.ToArray();
        }

        static void AddHero(List<HeroState> heroes, HeroId expectedId, HeroDefinition definition, string side)
        {
            if (string.IsNullOrEmpty(expectedId.Value))
            {
                if (definition != null)
                {
                    throw new ArgumentException(side + " hero definition requires an explicit hero id.");
                }
                return;
            }
            if (definition == null || !definition.Id.Equals(expectedId)
                || definition.MaxHp <= 0 || definition.Hp < 0 || definition.Hp > definition.MaxHp)
            {
                throw new ArgumentException(side + " hero must be explicitly authored with matching id and valid HP.");
            }

            heroes.Add(new HeroState
            {
                Id = definition.Id,
                Hp = definition.Hp,
                Position = definition.Position,
                Facing = definition.Facing
            });
        }

        static UnitState[] CreateUnits(RosterUnit[] player, RosterUnit[] enemy, FormationSlot[] playerFormation, FormationSlot[] enemyFormation)
        {
            var all = new List<UnitState>();
            AddUnits(all, player, playerFormation);
            AddUnits(all, enemy, enemyFormation);
            return all.ToArray();
        }

        static void AddUnits(List<UnitState> output, RosterUnit[] roster, FormationSlot[] formation)
        {
            for (var i = 0; i < roster.Length; i++)
            {
                var unit = roster[i];
                var slot = FindSlot(formation, unit.Id);
                output.Add(new UnitState
                {
                    Id = unit.Id,
                    SoldierId = unit.SoldierId,
                    SquadId = unit.SquadId,
                    Side = unit.Side,
                    Position = slot.Position,
                    Facing = slot.Facing,
                    Hp = unit.Hp,
                    MaxHp = unit.MaxHp,
                    SurvivorCount = AggregateSurvivorRules.FromHp(unit.Hp, unit.MaxHp),
                    Power = unit.Power,
                    RangeMinMm = unit.RangeMinMm,
                    RangeMaxMm = unit.RangeMaxMm,
                    RadiusMm = unit.RadiusMm,
                    MoveSpeedMillimetersPerSecond = unit.MoveMillimetersPerSecond,
                    AttackCooldownSeconds = unit.AttackCooldownSeconds,
                    VisualKindId = unit.VisualKindId.Trim(),
                    Status = unit.InitialStatus.Value
                });
            }
        }

        static TelegraphState[] CreateTelegraphs(TelegraphPlan[] plans)
        {
            if (plans == null)
            {
                return new TelegraphState[0];
            }
            var result = new TelegraphState[plans.Length];
            for (var i = 0; i < plans.Length; i++)
            {
                result[i] = new TelegraphState
                {
                    Position = plans[i].Position,
                    ElapsedSeconds = 0d,
                    DurationSeconds = plans[i].ArrivalSeconds,
                    Count = plans[i].Count
                };
            }
            return result;
        }

        static PurposeRng CreateRng(BattleContext context)
        {
            var seedHash = context.SeedIdentityHash ?? context.ContextHash ?? string.Empty;
            var seed = unchecked((int)uint.Parse(
                CoreApi.StableHashHex(seedHash).Substring(0, 8),
                NumberStyles.HexNumber,
                CultureInfo.InvariantCulture));
            return new PurposeRng(seed);
        }

        static UnitState FindUnit(BattleSimState state, UnitId id)
        {
            return FindUnit(state.Units, id);
        }

        static UnitState FindUnit(UnitState[] units, UnitId id)
        {
            for (var i = 0; i < units.Length; i++)
            {
                if (units[i].Id.Equals(id))
                {
                    return units[i];
                }
            }
            return null;
        }

        static RosterUnit FindRoster(RosterUnit[] roster, UnitId id)
        {
            for (var i = 0; i < roster.Length; i++)
            {
                if (roster[i].Id.Equals(id))
                {
                    return roster[i];
                }
            }
            return null;
        }

        static FormationSlot FindSlot(FormationSlot[] formation, UnitId id)
        {
            for (var i = 0; i < formation.Length; i++)
            {
                if (formation[i].Unit.Equals(id))
                {
                    return formation[i];
                }
            }
            return null;
        }

        static int CompareCommands(BattleTickCommand left, BattleTickCommand right)
        {
            var time = left.AtSeconds.CompareTo(right.AtSeconds);
            return time != 0 ? time : left.Seq.CompareTo(right.Seq);
        }

        static bool HasLivingSide(BattleSimState state, int side)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                var unit = state.Units[i];
                if (unit.Side == side && unit.Hp > 0 && CanRetreat(unit.Status))
                {
                    return true;
                }
            }
            return false;
        }

        static bool CanBeTargeted(BattleUnitStatus status)
        {
            return status != BattleUnitStatus.Down && status != BattleUnitStatus.Dead;
        }

        static bool CanRetreat(BattleUnitStatus status)
        {
            return status != BattleUnitStatus.Down && status != BattleUnitStatus.Dead;
        }

        static double DistanceMm(BattlePositionMm from, BattlePositionMm to)
        {
            return Math.Sqrt(from.DistanceSquaredTo(to));
        }

        static BattlePositionMm Interpolate(BattlePositionMm from, BattlePositionMm to, double ratio)
        {
            ratio = Math.Max(0d, Math.Min(1d, ratio));
            return new BattlePositionMm(
                InterpolateCoordinate(from.X, to.X, ratio),
                InterpolateCoordinate(from.Y, to.Y, ratio),
                InterpolateCoordinate(from.Z, to.Z, ratio));
        }

        static int InterpolateCoordinate(int from, int to, double ratio)
        {
            return checked(from + (int)Math.Round((to - (long)from) * ratio, MidpointRounding.AwayFromZero));
        }

        static BattlePositionMm[] ClonePositions(BattlePositionMm[] positions)
        {
            return positions == null ? null : (BattlePositionMm[])positions.Clone();
        }

        static BattleRejection Reject(BattleRejectReason reason, string detail = null)
        {
            return new BattleRejection { Reason = reason, Detail = detail };
        }
    }
}
