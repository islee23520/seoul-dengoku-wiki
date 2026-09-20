import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { observeRun } from './task02-run-observation.mjs';

const [repoRoot, requestCommit, requestPath, outputPath] = process.argv.slice(2);
const request = JSON.parse(execFileSync('git', ['-C', repoRoot, 'show', `${requestCommit}:${requestPath}`], { encoding: 'utf8' }));
const observation = observeRun(repoRoot, request, requestCommit);
if (observation.head !== request.implementation_commit || observation.tree !== request.implementation_tree || observation.tracked_status !== '') throw new TypeError('begin observation differs from committed request');
writeFileSync(outputPath, `${JSON.stringify({ schema_version: 'task02-begin-context.v1', ...observation }, null, 2)}\n`);
