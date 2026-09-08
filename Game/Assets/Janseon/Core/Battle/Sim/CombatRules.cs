using Janseon.Core;
using Janseon.Core.Battle.Contracts;

namespace Janseon.Core.Battle.Sim
{
    public static class CombatRules
    {
        public static void Resolve(BattleSimState state)
        {
            var damage = new int[state.Units.Length];
            for (var i=0; i<state.Units.Length; i++) { var a=state.Units[i]; if (a.State!="Active" || a.Hp<=0 || a.CooldownTicksLeft>0) continue;
                for (var j=0; j<state.Units.Length; j++) { var b=state.Units[j]; if (b.Side==a.Side || b.State=="Down" || b.State=="Routing" || b.Hp<=0) continue; var d=a.Cell.ManhattanTo(b.Cell);
                    if (d>=a.RangeMin && d<=a.RangeMax) { damage[j]+=a.Power; a.CooldownTicksLeft=a.AttackCooldownTicks; break; }
                }
            }
            for (var i=0; i<state.Units.Length; i++) if (damage[i]>0) { var u=state.Units[i]; u.Hp-=damage[i]; if(u.Hp<=0) u.Hp=0; }
        }
    }
}
