using Janseon.Core;

namespace Janseon.Core.Battle.Sim
{
    public static class IntentPlanner
    {
        public static void Resolve(BattleSimState s)
        {
            for (var i = 0; i < s.Units.Length; i++)
            {
                var a = s.Units[i];
                if (a.State != "Active" || a.Hp <= 0) continue;
                if (a.CooldownTicksLeft > 0) a.CooldownTicksLeft--;
                if (a.MoveTicksLeft > 0) a.MoveTicksLeft--;
                var target = Nearest(s, a);
                if (target == null) continue;
                var distance = a.Cell.ManhattanTo(target.Cell);
                if (distance >= a.RangeMin && distance <= a.RangeMax)
                {
                    continue;
                }
                if (distance <= a.RangeMax || a.MoveTicksLeft != 0) continue;
                var dx = target.Cell.X - a.Cell.X;
                var dy = target.Cell.Y - a.Cell.Y;
                var direction = dx != 0 ? (dx > 0 ? CardinalDirection.East : CardinalDirection.West) : (dy > 0 ? CardinalDirection.North : CardinalDirection.South);
                var next = a.Cell.Step(direction);
                if (s.Arena.InBounds(next)
                    && (s.Terrain == null || s.Terrain.MoveCost(a.Cell, next) >= 0)
                    && !Occupied(s, next))
                {
                    a.Cell = next;
                    a.Facing = direction;
                    a.MoveTicksLeft = 10;
                }
            }
        }
        static UnitState Nearest(BattleSimState s, UnitState a)
        {
            UnitState best = null; var distance = int.MaxValue;
            for (var i = 0; i < s.Units.Length; i++) { var b=s.Units[i]; if (b.Side==a.Side || b.State=="Down" || b.State=="Routing" || b.Hp<=0) continue; var d=a.Cell.ManhattanTo(b.Cell); if (d<distance) { distance=d; best=b; } }
            return best;
        }
        static bool Occupied(BattleSimState s, GridCoord c)
        {
            for (var i=0;i<s.Units.Length;i++) if (s.Units[i].State!="Down" && s.Units[i].State!="Routing" && s.Units[i].Cell.Equals(c)) return true;
            return false;
        }
    }
}
