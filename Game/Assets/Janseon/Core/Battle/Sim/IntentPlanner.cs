using Janseon.Core;
namespace Janseon.Core.Battle.Sim { public static class IntentPlanner { public static void Resolve(BattleSimState s) { for(int i=0;i<s.Units.Length;i++){var u=s.Units[i];if(u.State!="Active")continue;if(u.CooldownTicksLeft>0)u.CooldownTicksLeft--; } } } }
