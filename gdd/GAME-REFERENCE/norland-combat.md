# Norland combat reference

Evaluated continuation: [Norland consolidated research](norland-consolidated-research.md). The consolidated report preserves these September 29 notes, adds September 30 gameplay context, and distinguishes inherited data analysis from firsthand battle evidence.

Observed 2026-09-29 on the installed build `v0.5588.9777.0` (`Norland.exe` launched with `-debug`). The settlement played was Gorno, day 5, 17:00, seven days before winter. Gold started at 3000. No manual save was written. The existing autosave was left as it was.

This is a play reference for how a fight is assembled and resolved. It is not a reproduction of the interface.

## What was actually played

1. The army panel opened with four lords and zero warriors. Weapons in store were five spears. Every other weapon, shield, and armor slot was zero, so a squad could not be created.
2. Hiring opened three lists: freed prisoners (0), peasant militia (1, combat 2, price 40), mercenaries (13, combat 7 to 9).
3. One mercenary was hired: Boromil, 18, culture 8-half, mood "nectar addict", combat +140, nectar addiction -30%. Price 112 gold, so gold fell from 3000 to 2888. The contract lasts 10 days. The army warrior count became 1.
4. Debug `Attack By Forest Bandits` placed a band on the world map. The camp panel read: 7 bandits, camp loot 160 gold, 4 bows, 2 spears. The moving band's own popup said the opposite about equipment: 7 weaponless bandits of combat skill 5, willing to join a squad. Hiring them costs 350 gold and changes the neighbor relation by -7. That hire was not taken.
5. `Create squad` was clicked twice from the army panel. Both clicks opened the dynasty window (House Peremyl, ruler Peremyl, age 43) instead of the squad builder. The squad was therefore never formed, and the camp was never attacked. No battlefield, deployment, or battle-result screen was reached.

## How a battle is entered

The player does not fight personally. A lord commands a squad, and the squad is what gets sent.

- Warriors come from peasants, freed prisoners, or mercenaries. Peasants and freed prisoners need time to get over their fear of death. Mercenaries arrive with a higher combat skill and a travel delay. A mercenary contract in this session was 10 days.
- A squad needs a commander chosen from the lords, then equipment assigned from the warehouse. With zero warriors the create button does nothing useful. The auto-fill button was also empty while the warrior list was empty.
- On the world map, a forest bandit camp is attacked by a formed squad. Neighbors also read army strength as the total value of the best weapons and armor the warriors can wear, not as a head count.

## The fight itself

A hit does not subtract a hit-point number. Each weapon owns a weighted table of injuries, and a hit draws one outcome from that table. The numbers below are weights from `battle_params.json`, not damage points.

Dodge starts at 20. A combat skill higher than the opponent's adds 11. A lower one adds 3. Arrows are a separate check: a shield has weight 500 to stop them, and the Tanya shield has weight 1000.

| Weapon | What the table favors | What it does to armor |
| --- | --- | --- |
| Spear | Cut 100, deep wound 30, deadly wound 15 | Armor break 10, and the spear itself breaks at 10 |
| Sword | Cut 280, deep wound 80, limb and face injuries 20 | Armor break 40. As a defender it also carries a no-damage weight of 440 |
| Axe | Cut 200, lost arm 60, lost head 60 | Armor break 480. This is the armor-splitting weapon |
| Hammer | Bruise 120, light bruise 125, stun 30, limb and rib injuries 15-20 | Armor break 5. It knocks down rather than kills |
| Knife | Cut 130, light cut 100, deep wound 20 | Armor break 5, and only 15 weight of being blocked |
| Bow | Light cut 40, deep wound 10, piercings of lung, arm, leg, shoulder at 5-7 | No armor break |
| Crossbow | The same piercings at roughly ten times the bow, light cut 400 | Armor break 400 |
| Unarmed | Light bruise 120, bruise 50, stun 10 | None |
| Shield bash | Light bruise 300 | The shield itself breaks at weight 20 |

Armor changes the outcome table instead of subtracting damage. Heavy armor answers with no-damage 400, light bruise 1000, bruise 60. Light armor answers with light bruise 400 and bruise 30. A shield answers with no-damage 300 and light bruise 100. So a spear into heavy armor tends to become a bruise, while an axe or a crossbow is built to destroy that armor.

Injuries stack, with a cap per kind: light cut and light bruise 10, cut and bruise 5, deep wound and the fractures 2 or 3, lost arm and lost eye 2.

Pain is what drains the will to keep fighting. Light cut and light bruise are -1, bruise -3, cut -6, fractures and piercings -8, rib -11, deep wound -13, pierced lung, lost eye, and lost arm -15. Only the 7 most painful injuries count.

When will breaks, the unit runs. Panic movement is about 1.42 times normal. Killing the enemy commander adds 20 will to the other side, the enemy commander retreating adds 15, and an enemy soldier retreating adds 6. The commander's own bonus is doubled in that sum.

Combat skill rises by 1 during a fight. A successful hunt also grants combat and command skill. The training yard is slower: 0.01 experience per trainer level and 0.1 skill points. Hiring price adds 20 gold per point of combat skill (`soldier.cost_for_combat_level`).

## Around the battle

- A neighbor spends about 20% of its budget on the army (`ai_economy.army_budget_factor` 0.2) and pays 10 per soldier upkeep.
- The same target cannot be attacked again for 10 turns. A defense alliance has a 4-turn cooldown.
- A genius king doubles both army size and army budget.
- Forest bandits in this session were combat skill 5 and weaponless, while their camp held the weapons. Those are two different stockpiles.
- The battle maps shipped with the game are `battleground_camp` (100 by 80 cells, two level-1 watchtowers) and `battleground_field_with_fortifications`. They were not entered.

## Not seen

No battlefield, no unit selection on a field, no move or attack order, no pause during a fight, and no win or loss screen. The next step is to open the army panel, click `분대 만들기` without landing on the dynasty button, assign Lucherad and the hired warrior, then use the camp's attack action.
