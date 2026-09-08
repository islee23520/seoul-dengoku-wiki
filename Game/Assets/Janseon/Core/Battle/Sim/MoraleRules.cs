using System;
using Janseon.Core;
using Janseon.Core.Battle.Contracts;
namespace Janseon.Core.Battle.Sim
{
 public static class MoraleRules
 {
  public static void Resolve(BattleSimState s)
  {
   if (s.PreviousHp == null) { s.PreviousHp = new int[s.Units.Length]; s.PreviousStates = new string[s.Units.Length]; for (var i=0;i<s.Units.Length;i++) { s.PreviousHp[i]=s.Units[i].Hp; s.PreviousStates[i]=s.Units[i].State; } }
   else if (s.PreviousHp.Length != s.Units.Length) {
    var oldHp=s.PreviousHp; var oldStates=s.PreviousStates; s.PreviousHp=new int[s.Units.Length]; s.PreviousStates=new string[s.Units.Length]; System.Array.Copy(oldHp,s.PreviousHp,System.Math.Min(oldHp.Length,s.PreviousHp.Length)); System.Array.Copy(oldStates,s.PreviousStates,System.Math.Min(oldStates.Length,s.PreviousStates.Length));
    for (var i=oldHp.Length;i<s.Units.Length;i++) { s.PreviousHp[i]=s.Units[i].Hp; s.PreviousStates[i]=s.Units[i].State; }
   }
   for (var i=0;i<s.Units.Length;i++) if (s.Units[i].Hp<=0 && s.Units[i].State!="Down") { s.Units[i].Hp=0; s.Units[i].State="Down"; }
   if (s.CommanderBelowHalf == null) s.CommanderBelowHalf = new bool[2];
   for (var side=0; side<2; side++)
   {
    var x=s.Sides[side];
    for (var i=0;i<s.Units.Length;i++) if (s.Units[i].Side==side && s.Units[i].State=="Down" && (s.PreviousStates[i]!="Down" || (s.PreviousHp[i]>0 && s.Units[i].Hp<=0))) x.Morale-=BattleRules.MoraleLossPerDeath;
    var commanderId=side==0?s.PlayerCommanderId:s.EnemyCommanderId; var hp=100;
    for (var i=0;i<s.Units.Length;i++) if (s.Units[i].Side==side && s.Units[i].Id.Equals(commanderId)) { hp=s.Units[i].MaxHp==0?0:s.Units[i].Hp*100/s.Units[i].MaxHp; break; }
    x.CommanderHpPercent=hp;
    if (hp>0 && hp<50 && !s.CommanderBelowHalf[side]) { x.Morale-=BattleRules.MoraleLossCommanderBelowHalf; s.CommanderBelowHalf[side]=true; }
    else if (hp<=0) s.CommanderBelowHalf[side]=true;
    if (s.Tick>0 && s.Tick%BattleRules.TicksPerSecond==0 && x.Morale<BattleRules.MoraleRecoverCap) x.Morale=Math.Min(BattleRules.MoraleRecoverCap,x.Morale+BattleRules.MoraleRecoveryPerSecond);
    if (x.Morale<0) x.Morale=0;
    if (x.Morale==0) { x.CommandsLocked=true; foreach(var u in s.Units) if(u.Side==side && u.State=="Active") u.State="Routing"; }
   }
   for (var i=0;i<s.Units.Length;i++) { s.PreviousHp[i]=s.Units[i].Hp; s.PreviousStates[i]=s.Units[i].State; }
  }
 }
}
