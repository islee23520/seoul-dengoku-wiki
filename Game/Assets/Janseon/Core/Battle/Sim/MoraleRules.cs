using Janseon.Core;
using Janseon.Core.Battle.Contracts;
namespace Janseon.Core.Battle.Sim
{
 public static class MoraleRules
 {
  public static void Resolve(BattleSimState s) { for(int side=0;side<2;side++){var x=s.Sides[side]; int dead=0; for(int i=0;i<s.Units.Length;i++)if(s.Units[i].Side==side&&s.Units[i].State=="Down")dead++; x.Morale-=dead*BattleRules.MoraleLossPerDeath; int hp=100; for(int i=0;i<s.Units.Length;i++)if(s.Units[i].Side==side&&i==0)hp=s.Units[i].MaxHp==0?0:s.Units[i].Hp*100/s.Units[i].MaxHp; x.CommanderHpPercent=hp; if(hp<50)x.Morale-=BattleRules.MoraleLossCommanderBelowHalf; if(s.Tick%BattleRules.TicksPerSecond==0&&x.Morale<BattleRules.MoraleRecoverCap)x.Morale+=BattleRules.MoraleRecoveryPerSecond; if(x.Morale<0)x.Morale=0; if(x.Morale==0){x.CommandsLocked=true; foreach(var u in s.Units)if(u.Side==side&&u.State=="Active")u.State="Routing";} } }
 }
}
