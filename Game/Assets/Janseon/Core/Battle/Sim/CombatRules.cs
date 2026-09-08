using Janseon.Core;
using Janseon.Core.Battle.Contracts;

namespace Janseon.Core.Battle.Sim
{
    public static class CombatRules
    {
        public static void Resolve(BattleSimState state)
        {
            for (var i=0; i<state.Units.Length; i++) { var a=state.Units[i]; if (a.State!="Active" || a.CooldownTicksLeft>0) continue;
                for (var j=0; j<state.Units.Length; j++) { var b=state.Units[j]; if (b.Side==a.Side || b.State=="Down" || b.State=="Routing") continue; var d=a.Cell.ManhattanTo(b.Cell);
                    if (d>=a.RangeMin && d<=a.RangeMax) { b.Hp-=a.Power; a.CooldownTicksLeft=a.AttackCooldownTicks; if(b.Hp<=0){b.Hp=0;b.State="Down";} break; }
                }
            }
        }
    }
}
