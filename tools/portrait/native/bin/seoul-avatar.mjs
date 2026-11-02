#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { previewPortrait, fullbodyTokens, partTokens, modeToken, project, generatePortrait, modifyPortrait, completeSourceReplacement, prepareCompleteReplacement, strictJSONParse } from '../lib/index.mjs';
const argv = process.argv.slice(2);
const trustFlag = argv.indexOf('--trust-registry');
let trust = null;
if (trustFlag >= 0) {
  const [,path,digest] = argv.splice(trustFlag,3);
  trust = { registryBytes: await readFile(path), registrySHA: digest, readEvidence: path => readFile(path) };
}
const [command, inputPath, outputPath, ...rest] = argv;
try {
  if (['--help', 'help', undefined].includes(command)) { process.stdout.write('Usage: seoul-avatar <preview|normalized|fullbody|3Dparts|mode|modify|replacement-preview|complete-source> request.json [output.json]\ngenerate <native generation flags>\ncomplete-source generates a new unreviewed whole canvas; replacement-preview validates without provider calls. See README for bindings and reference policy.\n'); }
  else if (command === 'generate') { await generatePortrait(process.argv.slice(3)); }
  else {
    if (!inputPath || rest.length) throw new Error('usage: seoul-avatar <preview|normalized|fullbody|3Dparts|mode|modify|replacement-preview|complete-source> request.json [output.json]; generate <native generation flags>');
    const input = strictJSONParse(await readFile(inputPath, 'utf8'));
    for (const key of ['lookBytes','originalLookBytes','boundaryPolicyBytes','authorityBytes','modeBytes','previewBytes','packageBytes','ruleBytes','sourceImageBytes']) if (input[key] !== undefined && input[key] !== null) input[key] = await readFile(input[key]);
    const handlers = { preview: previewPortrait, normalized: project, fullbody: fullbodyTokens, '3Dparts': partTokens, mode: modeToken, modify: modifyPortrait, 'complete-source': value => completeSourceReplacement(value, trust), 'replacement-preview': async value => { const { uploads, ...result } = await prepareCompleteReplacement(value, trust); return result; } };
    if (!handlers[command]) throw new Error('unsupported command');
    const result = await handlers[command](input);
    const text = JSON.stringify(result, null, 2) + '\n';
    if (outputPath) await writeFile(outputPath, text, { flag: 'wx' }); else process.stdout.write(text);
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
