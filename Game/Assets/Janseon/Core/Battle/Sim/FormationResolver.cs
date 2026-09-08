using Janseon.Core;
using Janseon.Core.Battle.Contracts;
namespace Janseon.Core.Battle.Sim { public static class FormationResolver { public static void Resolve(BattleSimState s, FormationSlot[] formation) { }
 public static GridCoord Cell(FormationSlot x, bool player) { return new GridCoord(player ? x.Column+1 : 10-x.Column, x.Row+2); } } }
