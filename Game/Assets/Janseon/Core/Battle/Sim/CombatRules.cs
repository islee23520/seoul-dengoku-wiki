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
                for (var j = 0; j < state.Units.Length; j++)
                {
                    var target = state.Units[j];
                    if (target.Side == attacker.Side || target.State == "Down" || target.State == "Routing" || target.Hp <= 0) continue;
                    var distance = attacker.Cell.ManhattanTo(target.Cell);
                    if (distance < attacker.RangeMin || distance > attacker.RangeMax) continue;
                    var dealt = attacker.Power;
                    if (pincer && ReferenceEquals(attacker, front)) dealt++;
                    damage[j] += dealt;
                    attacker.CooldownTicksLeft = attacker.AttackCooldownTicks;
                    break;
                }
            }

            for (var i = 0; i < state.Units.Length; i++)
            {
                if (damage[i] <= 0) continue;
                var unit = state.Units[i];
                var received = guard && ReferenceEquals(unit, front) ? System.Math.Max(0, damage[i] - 3) : damage[i];
                unit.Hp = System.Math.Max(0, unit.Hp - received);
            }
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
                if (state.Cards[i].Id == cardId) return state.Cards[i].ActiveTicksLeft > 0;
            return false;
        }
    }
}
