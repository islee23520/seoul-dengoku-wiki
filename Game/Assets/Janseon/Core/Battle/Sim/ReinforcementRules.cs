using System;
using System.Globalization;
using Janseon.Core.Battle.Contracts;
namespace Janseon.Core.Battle.Sim
{
    public static class ReinforcementRules
    {
        static readonly string[] Roles = { "근위", "돌격", "궁수" };
        static readonly int[] Hp = { 30, 20, 14 }, Power = { 4, 6, 3 }, Range = { 1, 1, 3 };
        public static void Resolve(BattleSimState s)
        {
            if (s.Telegraphs == null) return;
            for (var i = 0; i < s.Telegraphs.Length; i++)
            {
                var t = s.Telegraphs[i]; if (t.Arrived || t.ArrivalTick > s.Tick) continue;
                var added = 0;
                for (var n = 0; n < t.Count; n++)
                {
                    var cell = t.Cell; for (var step = 0; step < 5 && Occupied(s, cell); step++) cell = step == 4 ? t.Cell : t.Cell.Step((CardinalDirection)step);
                    if (!s.Arena.InBounds(cell) || Occupied(s, cell)) break;
                    var role = (i + n) % Roles.Length;
                    var side = cell.X >= s.Arena.Width / 2 ? 1 : 0;
                    var unit = new UnitState { Id = new UnitId("reinforce-" + i.ToString(CultureInfo.InvariantCulture) + "-" + n.ToString(CultureInfo.InvariantCulture)), Side = side, State = "Active", Cell = cell, Facing = side == 0 ? CardinalDirection.East : CardinalDirection.West, Hp = Hp[role], MaxHp = Hp[role], Power = Power[role], RangeMin = 1, RangeMax = Range[role], MoveTicksPerCell = BattleRules.MoveTicksPerCell, MoveTicksLeft = BattleRules.MoveTicksPerCell, AttackCooldownTicks = BattleRules.AttackCooldownTicks };
                    var old = s.Units; s.Units = new UnitState[old.Length + 1]; Array.Copy(old, s.Units, old.Length); s.Units[old.Length] = unit; added++;
                }
                if (added == t.Count) t.Arrived = true;
            }
        }
        static bool Occupied(BattleSimState s, GridCoord c) { for (var i = 0; i < s.Units.Length; i++) if (s.Units[i].State != "Down" && s.Units[i].State != "Routing" && s.Units[i].Cell.Equals(c)) return true; return false; }
    }
}
