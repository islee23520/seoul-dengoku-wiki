#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { evaluatePortraitAcceptance } from '../lib/acceptance-gate.mjs';

try {
  if (process.argv.length !== 6) throw new Error('usage: node bin/portrait-acceptance.mjs <image.png> <review.json> <profile.json> <measurement.json>');
  const [imagePath,reviewPath,profilePath,measurementPath]=process.argv.slice(2);
  const review=JSON.parse(await readFile(reviewPath,'utf8'));
  const result=evaluatePortraitAcceptance({characterId:review.characterId,requestId:review.requestId,imageBytes:await readFile(imagePath),review,profile:JSON.parse(await readFile(profilePath,'utf8')),measurementBytes:await readFile(measurementPath)});
  console.log(JSON.stringify(result,null,2));
  if (!result.pass) process.exitCode=1;
} catch(error) { console.error(error.message);process.exitCode=1; }
