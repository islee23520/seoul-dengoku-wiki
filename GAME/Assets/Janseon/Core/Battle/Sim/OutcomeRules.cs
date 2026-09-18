using Janseon.Core;
using Janseon.Core.Battle.Contracts;
namespace Janseon.Core.Battle.Sim
{
 public static class OutcomeRules
 {
  public static bool RetreatCovered(BattleSimState s)
  {
   if (s.Arena == null || s.Arena.EnemyRetreatEdge == null) return false;
   foreach (var edge in s.Arena.EnemyRetreatEdge) { var covered=false; foreach(var u in s.Units) if(u.Side==0 && u.State!="Down" && u.State!="Routing" && u.Cell.ManhattanTo(edge)==1) { covered=true; break; } if(!covered) return false; }
   return true;
  }
  public static bool CanEnemySurrender(BattleSimState s) { return s.Sides[1].Morale<=BattleRules.SurrenderMoraleMax && s.Sides[1].CommanderHpPercent<=BattleRules.SurrenderCommanderHpPercentMax && RetreatCovered(s); }
  public static void Resolve(BattleSimState s) { bool p=false,e=false; for(var i=0;i<s.Units.Length;i++){var u=s.Units[i];if(u.State!="Down"&&u.State!="Routing"&&u.Hp>0){if(u.Side==0)p=true;else e=true;}} if(!p&&!e)s.Outcome=Janseon.Core.Battle.Contracts.BattleOutcomeKind.Draw; else if(!e)s.Outcome=Janseon.Core.Battle.Contracts.BattleOutcomeKind.PlayerVictory; else if(!p)s.Outcome=Janseon.Core.Battle.Contracts.BattleOutcomeKind.EnemyVictory; else if(s.Tick + 1 >= BattleRules.MaxTicks)s.Outcome=Janseon.Core.Battle.Contracts.BattleOutcomeKind.Draw; }
 }
}
