import { readFile, mkdir, writeFile, chmod, rename, unlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve, delimiter, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';

export const DEFAULT_IMAGE_MODEL = 'gpt-image-2.5-sunburst';
export const SUBSCRIPTION_IMAGE_MODEL = 'gpt-image-2';

function fields(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) throw new Error(`invalid ${label} fields`);
}

function endpoint(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('baseUrl must be an explicit HTTP or HTTPS URL'); }
  if (typeof value !== 'string' || value !== value.trim() || !/^https?:\/\//.test(value) || !['http:', 'https:'].includes(url.protocol) || url.username || url.password || value.split('/')[2].includes('@') || value.includes('?') || value.includes('#')) throw new Error('baseUrl must use HTTP or HTTPS without userinfo, query, or fragment');
  return url;
}

function service(value, text = false) {
  fields(value, text ? ['baseUrl', 'model', 'apiKeyEnv', 'allowUnauthenticated'] : ['schemaVersion', 'provider', 'baseUrl', 'imageModel', 'apiKeyEnv', 'allowUnauthenticated', 'translation'], text ? 'translation' : 'connection');
  const url = endpoint(value.baseUrl);
  if (value.apiKeyEnv !== undefined && (typeof value.apiKeyEnv !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(value.apiKeyEnv))) throw new Error('apiKeyEnv must name an environment variable');
  if (value.allowUnauthenticated !== undefined && typeof value.allowUnauthenticated !== 'boolean') throw new Error('allowUnauthenticated must be a boolean');
  if (value.apiKeyEnv && value.allowUnauthenticated === true) throw new Error('authentication choices conflict');
  if (!value.apiKeyEnv && value.allowUnauthenticated !== true) throw new Error('apiKeyEnv or explicit allowUnauthenticated required');
  if (value.allowUnauthenticated === true && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('unauthenticated connections require a loopback server');
  if (text && (typeof value.model !== 'string' || !value.model.trim() || value.model !== value.model.trim())) throw new Error('translation model required');
  return { baseUrl: value.baseUrl, ...(text ? { model: value.model } : {}), ...(value.apiKeyEnv ? { apiKeyEnv: value.apiKeyEnv } : { allowUnauthenticated: true }) };
}

// Returns a new validated public object. No credentials or input mutation.
export function validateConnectionConfig(input) {
  fields(input, ['schemaVersion', 'provider', 'baseUrl', 'imageModel', 'apiKeyEnv', 'allowUnauthenticated', 'translation', 'codexExecutable', 'modelException'], 'connection');
  if (input.schemaVersion !== 1) throw new Error('unsupported connection schemaVersion');
  let config;
  if (input.provider === 'openai-compatible') {
    const imageModel = input.imageModel === undefined ? DEFAULT_IMAGE_MODEL : input.imageModel;
    if (imageModel !== DEFAULT_IMAGE_MODEL) throw new Error('unsupported OpenAI-compatible image model');
    config = { schemaVersion: 1, provider: input.provider, ...service(input), imageModel };
  } else if (input.provider === 'codex-subscription') {
    fields(input, ['schemaVersion', 'provider', 'imageModel', 'codexExecutable', 'modelException', 'translation'], 'subscription connection');
    if (input.imageModel !== SUBSCRIPTION_IMAGE_MODEL || input.modelException !== true) throw new Error('codex-subscription requires gpt-image-2 and explicit modelException: true');
    if (input.codexExecutable !== undefined && (typeof input.codexExecutable !== 'string' || !input.codexExecutable.trim() || input.codexExecutable.includes('\0'))) throw new Error('invalid codexExecutable');
    config = { schemaVersion: 1, provider: input.provider, imageModel: SUBSCRIPTION_IMAGE_MODEL, modelException: true, codexExecutable: input.codexExecutable ?? 'codex' };
  } else throw new Error('unsupported connection provider');
  if (input.translation !== undefined) config.translation = service(input.translation, true);
  return config;
}

export function parseConnectionConfig(text) {
  let input;
  try {
    input = JSON.parse(text);
    // Duplicate discriminants/auth fields must not disappear into JSON.parse.
    const tokens = text.match(/"(?:\\.|[^"\\])*"|[{}\[\]:,]|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/g);
    const stack = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token === '{') stack.push(new Set());
      else if (token === '[') stack.push(null);
      else if (token === '}' || token === ']') stack.pop();
      else if (token.startsWith('"') && tokens[i + 1] === ':') {
        const key = JSON.parse(token);
        if (stack.at(-1).has(key)) throw new Error('duplicate field');
        stack.at(-1).add(key);
      }
    }
  } catch { throw new Error('invalid connection JSON'); }
  return validateConnectionConfig(input);
}

export function connectionConfigPath({ connectionConfig, home = homedir() } = {}) {
  if (connectionConfig !== undefined && (typeof connectionConfig !== 'string' || !connectionConfig.trim() || connectionConfig.includes('\0'))) throw new Error('invalid connection-config path');
  return connectionConfig === undefined ? join(home, '.seoul-character-art', 'connection.json') : resolve(connectionConfig);
}

export function parseConnectionArgs(argv) {
  const args = [];
  let connectionConfig;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--connection-config' || argv[i].startsWith('--connection-config=')) {
      if (connectionConfig !== undefined) throw new Error('duplicate connection-config option');
      connectionConfig = argv[i] === '--connection-config' ? argv[++i] : argv[i].slice('--connection-config='.length);
      if (!connectionConfig || connectionConfig.startsWith('--')) throw new Error('connection-config path required');
      connectionConfigPath({ connectionConfig });
    } else args.push(argv[i]);
  }
  return { connectionConfig, args };
}

export async function readConnectionConfig(options = {}) {
  let text;
  try { text = await readFile(connectionConfigPath(options), 'utf8'); }
  catch (error) { throw new Error(error.code === 'ENOENT' ? 'connection config missing; save an explicit tool-owned connection first' : 'cannot read connection config'); }
  return parseConnectionConfig(text);
}

export async function readCurrentMachineConnection() { throw new Error('explicit connection-config required'); }

export async function saveConnectionConfig(input, options = {}) {
  const config = validateConnectionConfig(input);
  const path = connectionConfigPath(options);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(config, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    await chmod(temporary, 0o600);
    await rename(temporary, path);
  } catch {
    await unlink(temporary).catch(() => {});
    throw new Error('cannot save connection config');
  }
  return config;
}

export function connectionSummary(input) {
  return validateConnectionConfig(input);
}

export function resolveConnection(input, { environment = process.env } = {}) {
  const config = validateConnectionConfig(input);
  const withKey = value => {
    const apiKey = value.apiKeyEnv ? environment[value.apiKeyEnv] : '';
    if (value.apiKeyEnv && (typeof apiKey !== 'string' || !apiKey.trim() || /[\r\n]/.test(apiKey))) throw new Error('configured API key environment variable is missing or invalid');
    return { ...value, apiKey };
  };
  const result = config.provider === 'openai-compatible' ? withKey(config) : { ...config };
  if (config.translation) result.translation = withKey(config.translation);
  return result;
}

export async function resolveCodexExecutable(input, { environment = process.env, cwd = process.cwd() } = {}) {
  const config = validateConnectionConfig(input);
  if (config.provider !== 'codex-subscription') throw new Error('codex-subscription connection required');
  const executable = config.codexExecutable;
  const candidates = isAbsolute(executable) || executable.includes('/') || executable.includes('\\')
    ? [resolve(cwd, executable)] : (environment.PATH ?? '').split(delimiter).filter(Boolean).map(path => resolve(cwd, path, executable));
  for (const candidate of candidates) {
    try { await (await import('node:fs/promises')).access(candidate, constants.X_OK); if ((await (await import('node:fs/promises')).stat(candidate)).isFile()) return candidate; } catch { /* Try the next explicitly supplied PATH entry. */ }
  }
  throw new Error('configured codex executable unavailable; no provider fallback');
}

// Explicit executable availability check; never substitutes another provider.
export async function loadConnection(options = {}) {
  return resolveConnection(await readConnectionConfig(options), options);
}
