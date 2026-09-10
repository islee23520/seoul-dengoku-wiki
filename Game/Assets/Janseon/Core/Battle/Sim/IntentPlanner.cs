using System.Collections.Generic;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;

namespace Janseon.Core.Battle.Sim
{
    public static class IntentPlanner
    {
        static readonly CardinalDirection[] PathTieOrder =
        {
            CardinalDirection.North,
            CardinalDirection.East,
            CardinalDirection.South,
            CardinalDirection.West,
        };

        public static void Resolve(BattleSimState state)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                var actor = state.Units[i];
                if (actor.State != "Active" || actor.Hp <= 0) continue;
                if (actor.CooldownTicksLeft > 0) actor.CooldownTicksLeft--;
                if (actor.MoveTicksLeft > 0) actor.MoveTicksLeft--;

                if (actor.OrderKind == BattleOrderKind.Move)
                {
                    if (actor.Cell.Equals(actor.OrderDestination))
                    {
                        ClearOrder(actor);
                        continue;
                    }
                    MoveToward(state, actor, actor.OrderDestination);
                    if (actor.Cell.Equals(actor.OrderDestination)) ClearOrder(actor);
                    continue;
                }

                var target = actor.OrderKind == BattleOrderKind.Attack
                    ? Find(state, actor.OrderTargetUnitId)
                    : Nearest(state, actor);
                if (actor.OrderKind == BattleOrderKind.Attack && !IsEnemyTarget(actor, target)) continue;
                if (target == null) continue;
                var distance = actor.Cell.ManhattanTo(target.Cell);
                if (distance >= actor.RangeMin && distance <= actor.RangeMax) continue;
                if (distance <= actor.RangeMax) continue;
                if (actor.OrderKind == BattleOrderKind.Attack) MoveToward(state, actor, target.Cell);
                else MoveAutomatically(state, actor, target.Cell);
            }
        }

        static void MoveToward(BattleSimState state, UnitState actor, GridCoord destination)
        {
            if (actor.MoveTicksLeft != 0) return;
            GridCoord next;
            if (!TryNextTerrainStep(state, actor.Cell, destination, out next) || Occupied(state, actor, next))
            {
                actor.MoveTicksLeft = actor.MoveTicksPerCell;
                return;
            }
            MoveTo(actor, next);
        }

        static void MoveAutomatically(BattleSimState state, UnitState actor, GridCoord destination)
        {
            if (actor.MoveTicksLeft != 0) return;
            var dx = destination.X - actor.Cell.X;
            var dy = destination.Y - actor.Cell.Y;
            var direction = dx != 0
                ? (dx > 0 ? CardinalDirection.East : CardinalDirection.West)
                : (dy > 0 ? CardinalDirection.North : CardinalDirection.South);
            var next = actor.Cell.Step(direction);
            if (Passable(state, actor.Cell, next) && !Occupied(state, actor, next)) MoveTo(actor, next);
        }

        static void MoveTo(UnitState actor, GridCoord next)
        {
            actor.Facing = Direction(actor.Cell, next);
            actor.Cell = next;
            actor.MoveTicksLeft = actor.MoveTicksPerCell;
        }

        static bool TryNextTerrainStep(BattleSimState state, GridCoord start, GridCoord destination, out GridCoord next)
        {
            next = start;
            if (start.Equals(destination)) return false;
            var width = state.Arena.Width;
            var height = state.Arena.Height;
            var visited = new bool[width * height];
            var previous = new GridCoord[width * height];
            var hasPrevious = new bool[width * height];
            var queue = new Queue<GridCoord>();
            queue.Enqueue(start);
            visited[Index(start, width)] = true;

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                for (var i = 0; i < PathTieOrder.Length; i++)
                {
                    var candidate = current.Step(PathTieOrder[i]);
                    if (!Passable(state, current, candidate)) continue;
                    var candidateIndex = Index(candidate, width);
                    if (visited[candidateIndex]) continue;
                    visited[candidateIndex] = true;
                    previous[candidateIndex] = current;
                    hasPrevious[candidateIndex] = true;
                    if (candidate.Equals(destination))
                    {
                        var cursor = candidate;
                        while (hasPrevious[Index(cursor, width)] && !previous[Index(cursor, width)].Equals(start))
                            cursor = previous[Index(cursor, width)];
                        next = cursor;
                        return true;
                    }
                    queue.Enqueue(candidate);
                }
            }
            return false;
        }

        static bool Passable(BattleSimState state, GridCoord from, GridCoord to)
        {
            return state.Arena.InBounds(to)
                && (state.Terrain == null || state.Terrain.MoveCost(from, to) >= 0);
        }

        static int Index(GridCoord cell, int width) { return cell.Y * width + cell.X; }

        static CardinalDirection Direction(GridCoord from, GridCoord to)
        {
            if (to.Y > from.Y) return CardinalDirection.North;
            if (to.X > from.X) return CardinalDirection.East;
            if (to.Y < from.Y) return CardinalDirection.South;
            return CardinalDirection.West;
        }

        static UnitState Nearest(BattleSimState state, UnitState actor)
        {
            UnitState best = null;
            var distance = int.MaxValue;
            for (var i = 0; i < state.Units.Length; i++)
            {
                var candidate = state.Units[i];
                if (!IsEnemyTarget(actor, candidate)) continue;
                var candidateDistance = actor.Cell.ManhattanTo(candidate.Cell);
                if (candidateDistance < distance)
                {
                    distance = candidateDistance;
                    best = candidate;
                }
            }
            return best;
        }

        static UnitState Find(BattleSimState state, UnitId id)
        {
            for (var i = 0; i < state.Units.Length; i++)
                if (state.Units[i].Id.Equals(id)) return state.Units[i];
            return null;
        }

        static bool IsEnemyTarget(UnitState actor, UnitState target)
        {
            return target != null && target.Side != actor.Side && target.State == "Active" && target.Hp > 0;
        }

        static bool Occupied(BattleSimState state, UnitState actor, GridCoord cell)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                var candidate = state.Units[i];
                if (ReferenceEquals(candidate, actor)) continue;
                if (candidate.State != "Down" && candidate.State != "Routing" && candidate.Hp > 0 && candidate.Cell.Equals(cell))
                    return true;
            }
            return false;
        }

        static void ClearOrder(UnitState unit)
        {
            unit.OrderKind = BattleOrderKind.None;
            unit.OrderDestination = new GridCoord();
            unit.OrderTargetUnitId = new UnitId();
        }
    }
}
