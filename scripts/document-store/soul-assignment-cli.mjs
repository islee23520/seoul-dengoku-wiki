import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { INTERNAL_SOUL_CAPABILITY, SOUL_ASSIGNMENT_SOURCE_SHA256, initializeSoulAssignmentEdits,
  openSoulAssignments, replaceSoulAssignment } from './soul-assignment.mjs';

const fail = message => { throw Object.assign(new Error(message), { code: 'E_ARGUMENTS' }); };
export async function soulAssignmentCommand(argv, input=process.stdin) {
  if(argv.length===1&&argv[0]==='--help')return {
    usage:'node scripts/document-store/soul-assignment-cli.mjs <init-edits|read|revision|replace> --db <path> [options]',
    initialize:'init-edits --actor <actor> --reason <reason> explicitly migrates an existing mode-0600 snapshot to editable schema.',
    read:'read [--person-id <personId>] [--revision <integer>] [--view <current|approved>]',
    revision:'revision [--revision <integer>] [--view <current|approved>]',
    replace:'replace --person-id <personId> --expected-revision <integer> --actor <actor> --reason <reason>',
    stdin:'replace reads one complete typed assignment object. Its personId and name must match the existing identity; status must be draft and approvalRef must be absent.',
    visibility:'Private local authoring only. Current-head reads are the default. Edits never grant owner approval; view approved pins imported revision zero.',
  };
  const [command,...args]=argv;
  const flags={'--db':'dbPath','--person-id':'personId','--expected-revision':'expectedRevision',
    '--actor':'actor','--reason':'reason','--revision':'revision','--view':'view'};
  const allowed={
    'init-edits':['dbPath','actor','reason'],
    read:['dbPath','personId','revision','view'],
    revision:['dbPath','revision','view'],
    replace:['dbPath','personId','expectedRevision','actor','reason'],
  };
  if(!Object.hasOwn(allowed,command))fail('init-edits, read, revision or replace command required');
  const options={capability:INTERNAL_SOUL_CAPABILITY,scope:'internal',expectedSha256:SOUL_ASSIGNMENT_SOURCE_SHA256};
  for(let i=0;i<args.length;i+=2) {
    const key=flags[args[i]],value=args[i+1];
    if(!allowed[command].includes(key)||Object.hasOwn(options,key)||typeof value!=='string'||!value.trim()||value.startsWith('--'))fail('unsupported, duplicate or missing option');
    options[key]=value;
  }
  const required=command==='replace'||command==='init-edits'?allowed[command]:['dbPath'];
  if(required.some(key=>!Object.hasOwn(options,key)))fail('explicit database and command options required');
  for(const key of ['revision','expectedRevision'])if(Object.hasOwn(options,key)) {
    if(!/^(0|[1-9][0-9]*)$/.test(options[key])||!Number.isSafeInteger(Number(options[key])))fail('revision must be a nonnegative safe integer');
    options[key]=Number(options[key]);
  }
  if(command==='init-edits')return initializeSoulAssignmentEdits(options.dbPath,options);
  if(command==='replace') {
    if(input.isTTY)fail('typed assignment object required on stdin');
    let body='';
    for await(const chunk of input)body+=chunk;
    let assignment;
    try { assignment=JSON.parse(body); } catch { fail('stdin must contain a JSON assignment object'); }
    return replaceSoulAssignment(options.dbPath,{...options,assignment});
  }
  const store=openSoulAssignments(options.dbPath,options);
  try {
    if(command==='revision')return store.readRevision(options.revision);
    const snapshot=store.readSnapshot({revision:options.revision});
    if(options.personId!==undefined) {
      const assignment=snapshot.document.assignments.find(a=>a.personId===options.personId);
      if(!assignment)throw Object.assign(new Error('assignment absent'),{code:'E_SOUL_IDENTITY'});
      return {revision:snapshot.revision,assignment};
    }
    return snapshot;
  } finally { store.close(); }
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
  try { process.stdout.write(JSON.stringify(await soulAssignmentCommand(process.argv.slice(2)))+'\n'); }
  catch(error) {
    process.stderr.write(JSON.stringify({error:{code:error.code??'E_SOUL_COMMAND',message:error.message}})+'\n');
    process.exitCode=1;
  }
}
