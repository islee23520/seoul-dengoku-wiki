using Janseon.Core;
using Janseon.Core.Battle.Contracts;

namespace Janseon.Core.Battle.Sim
{
    public static class FormationResolver
    {
        public static void Resolve(BattleSimState s, FormationSlot[] formation)
        {
            if (s == null || formation == null) return;
            for (var i = 0; i < formation.Length; i++)
            {
                var slot = formation[i];
                for (var j = 0; j < s.Units.Length; j++)
                {
                    var unit = s.Units[j];
                    if (!unit.Id.Equals(slot.Unit)) continue;
                    unit.Cell = Cell(slot, unit.Side == 0);
                    unit.Facing = slot.Facing;
                    break;
                }
            }
        }

        public static GridCoord Cell(FormationSlot x, bool player)
        {
            return new GridCoord(player ? x.Column + 1 : 10 - x.Column, x.Row + 2);
        }
    }
}
