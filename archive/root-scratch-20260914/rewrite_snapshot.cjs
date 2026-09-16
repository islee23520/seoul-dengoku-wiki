const fs = require('fs');

const path = 'snapshot_tmp.cs';
const content = fs.readFileSync(path, 'utf8');

const updated = content.replace(/snap\.SettlementOutcomeText = battle\.Outcome == BattleOutcomeKind\.PlayerVictory\r\n                        \? \"\?\?\?\? \?\? \?\? \?\?\?\? \?\?\?\?\r\n                        : \"\?\?\?\? \?\? \?\? \?\?\?\? \?\?\?\?;/g,
'snap.SettlementOutcomeText = battle.Outcome == BattleOutcomeKind.PlayerVictory ? "win" : "lose";');

fs.writeFileSync(path, updated, 'utf8');
