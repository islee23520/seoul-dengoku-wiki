using Janseon.Core.Battle.Contracts;

namespace Janseon.Core.Battle.Sim
{
    public static class CombatRules
    {
        public static void Resolve(BattleSimState state)
        {
            var damage = new int[state.Units.Length];
            var front = FrontUnit(state);
            var pincer = IsActive(state, "pincer-focus");
            var guard = IsActive(state, "guard-shieldwall");
            for (var i = 0; i < state.Units.Length; i++)
            {
                var attacker = state.Units[i];
                if (attacker.State != "Active" || attacker.Hp <= 0 || attacker.CooldownTicksLeft > 0) continue;
                if (attacker.OrderKind == BattleOrderKind.Attack)
                {
                    var targetIndex = FindTargetIndex(state, attacker);
                    if (targetIndex >= 0) Attack(state, damage, attacker, targetIndex, front, pincer);
                    continue;
                }
                for (var j = 0; j < state.Units.Length; j++)
                    if (Attack(state, damage, attacker, j, front, pincer)) break;
            }

            for (var i = 0; i < state.Units.Length; i++)
            {
                if (damage[i] <= 0) continue;
                var unit = state.Units[i];
                var received = guard && ReferenceEquals(unit, front) ? System.Math.Max(0, damage[i] - 3) : damage[i];
                unit.Hp = System.Math.Max(0, unit.Hp - received);
                unit.SurvivorCount = System.Math.Min(
                    unit.SurvivorCount,
                    AggregateSurvivorRules.FromHp(unit.Hp, unit.MaxHp));
            }
        }

        static int FindTargetIndex(BattleSimState state, UnitState attacker)
        {
            for (var i = 0; i < state.Units.Length; i++)
                if (state.Units[i].Id.Equals(attacker.OrderTargetUnitId)) return i;
            return -1;
        }

        static bool Attack(BattleSimState state, int[] damage, UnitState attacker, int targetIndex, UnitState front, bool pincer)
        {
            var target = state.Units[targetIndex];
            if (target.Side == attacker.Side || target.State == "Down" || target.State == "Routing" || target.Hp <= 0) return false;
            var distance = attacker.Cell.ManhattanTo(target.Cell);
            if (distance < attacker.RangeMin || distance > attacker.RangeMax) return false;
            var dealt = attacker.Power;
            if (pincer && ReferenceEquals(attacker, front)) dealt++;
            damage[targetIndex] += dealt;
            attacker.CooldownTicksLeft = attacker.AttackCooldownTicks;
            return true;
        }

        static UnitState FrontUnit(BattleSimState state)
        {
            for (var i = 0; i < state.Units.Length; i++)
            {
                var unit = state.Units[i];
                if (unit.Side == 0 && unit.State == "Active" && unit.Hp > 0) return unit;
            }
            return null;
        }

        static bool IsActive(BattleSimState state, string cardId)
        {
            if (state.Cards == null) return false;
            for (var i = 0; i < state.Cards.Length; i++)
                if (state.Cards[i].Id == cardId && state.Cards[i].ActiveTicksLeft > 0) return true;
            return false;
        }
    }
}
