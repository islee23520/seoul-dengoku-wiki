import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stagePortraits } from '../../pipeline/stage.ts';

export async function stageGenerator({repoRoot}) {
  const repo=resolve(repoRoot),source=resolve(repo,'TOOL/portrait-gen');
  return stagePortraits(source,source,resolve(repo,'GAME-LOGIC/site/dist/portrait-gen'));
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../../..');
  console.log(JSON.stringify(await stageGenerator({repoRoot:root}),null,2));
}
