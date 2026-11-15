// Evaluate the data tables of S-Map subwayDatas.js and write JSON (relocation, exitPosition, krNameAndPrjId).
import fs from 'node:fs';
const s = fs.readFileSync(process.argv[2], 'utf8');
const i = s.indexOf('var locationAndExitData = {'), j = s.indexOf('var pois = [];');
const loc = new Function(s.slice(i, j) + '; return locationAndExitData;')();
const k0 = s.indexOf('var krNameAndPrjId = {'), k1 = s.indexOf('//서버로부터');
const kr = new Function(s.slice(k0, k1) + '; return krNameAndPrjId;')();
fs.writeFileSync(process.argv[3], JSON.stringify({ ...loc, krNameAndPrjId: kr }));
console.log(Object.fromEntries(Object.entries(loc).map(([k, v]) => [k, Object.keys(v).length])));
