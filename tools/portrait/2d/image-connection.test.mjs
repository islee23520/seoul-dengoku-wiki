import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'vitest';
import {
  DEFAULT_IMAGE_MODEL, validateConnectionConfig,
  parseConnectionConfig, connectionConfigPath, parseConnectionArgs,
  readConnectionConfig, saveConnectionConfig, connectionSummary,
  resolveConnection, loadConnection, readCurrentMachineConnection,
} from './image-connection.mjs';

const evidence = new URL('../../../.omo/evidence/portable-image-connection-20261004/config/', import.meta.url);
await mkdir(evidence, { recursive: true });
const openai = () => ({ schemaVersion: 1, provider: 'openai-compatible', baseUrl: 'https://Example.test:443/v1/', apiKeyEnv: 'TEST_IMAGE_KEY' });

test('pure resolver preserves original input and exact URL, selects default image model, omits secrets from public summary', () => {
  const input = openai();
  input.translation = { baseUrl: 'https://text.test/service/', model: 'chosen-text-model', apiKeyEnv: 'TEXT_KEY' };
  const before = JSON.stringify(input);
  const environment = { TEST_IMAGE_KEY: 'private-image-secret', TEXT_KEY: 'private-text-secret' };
  const resolved = resolveConnection(input, { environment });
  assert.equal(resolved.baseUrl, input.baseUrl);
  assert.equal(resolved.imageModel, DEFAULT_IMAGE_MODEL);
  assert.equal(resolved.apiKey, environment.TEST_IMAGE_KEY);
  assert.equal(resolved.translation.apiKey, environment.TEXT_KEY);
  assert.equal(resolved.translation.model, 'chosen-text-model');
  assert.equal(JSON.stringify(input), before);
  assert.equal(JSON.stringify(connectionSummary(input)).includes('private-'), false);
  assert.equal(Object.hasOwn(validateConnectionConfig(openai()), 'translation'), false);
});

test.each([undefined, '', '   ', 'secret\nvalue'])('missing or malformed named environment key is not unauthenticated: %s', key => {
  assert.throws(() => resolveConnection(openai(), { environment: { TEST_IMAGE_KEY: key } }), /environment variable is missing or invalid/);
});

test.each(['http://localhost:8000/v1', 'http://127.0.0.1:8000', 'http://[::1]:8000'])('explicit unauthenticated loopback server works without any key: %s', baseUrl => {
  const input = { schemaVersion: 1, provider: 'openai-compatible', baseUrl, allowUnauthenticated: true };
  assert.equal(resolveConnection(input, { environment: {} }).apiKey, '');
  assert.equal(resolveConnection(input, { environment: {} }).baseUrl, baseUrl);
});

test.each([
  { baseUrl: 'https://remote.test', allowUnauthenticated: true, apiKeyEnv: undefined },
  { baseUrl: 'https://secret:password@host.test' },
  { baseUrl: 'https://@host.test' },
  { baseUrl: 'https://host.test?secret=token' },
  { baseUrl: 'https://host.test#secret' },
  { baseUrl: 'https://host.test?' },
  { baseUrl: 'file:///private' },
  { baseUrl: ' https://host.test ' },
  { baseUrl: undefined },
  { imageModel: 'gpt-image-2' },
  { imageModel: 'gpt-6-sol' },
  { imageModel: null },
  { provider: 'proxy' },
  { schemaVersion: 2 },
  { apiKey: 'private-secret' },
  { auth: 'private-secret' },
  { apiKeyEnv: undefined },
  { apiKeyEnv: 'bad env name' },
  { allowUnauthenticated: true },
  { codexExecutable: 'codex' },
  { modelException: true },
  { provider: 'codex-subscription' },
  { imageModel: 'gpt-image-2', provider: 'openai-compatible' },
  { translation: { baseUrl: 'https://text.test', apiKeyEnv: 'TEXT_KEY' } },
  { translation: { baseUrl: 'https://text.test', model: 'text', apiKey: 'private-secret' } },
])('rejects malformed, conflicting, or unsupported fields without echoing values: %j', patch => {
  const input = { ...openai(), ...patch };
  const before = JSON.stringify(input);
  assert.throws(() => validateConnectionConfig(input), error => !error.message.includes('private-secret') && !error.message.includes('password') && !error.message.includes('token'));
  assert.equal(JSON.stringify(input), before);
});

test('parser rejects malformed JSON and duplicate provider/auth fields without exposing source', () => {
  for (const text of ['{"apiKey":"private-secret",', '{"schemaVersion":1,"provider":"openai-compatible","provider":"codex-subscription"}', 'null', '[]']) {
    assert.throws(() => parseConnectionConfig(text), error => !error.message.includes('private-secret'));
  }
  assert.deepEqual(parseConnectionConfig(JSON.stringify(openai())), validateConnectionConfig(openai()));
});

test('only the current OpenAI-compatible image model is accepted', () => {
  for (const imageModel of ['gpt-image-2', 'gpt-image-1', 'gpt-6-sol']) assert.throws(() => validateConnectionConfig({ ...openai(), imageModel }));
  assert.throws(() => validateConnectionConfig({ ...openai(), provider: 'codex-subscription', imageModel: 'gpt-image-2', modelException: true }));
});

test('current machine connection reads only CLIProxy address and reuses environment authentication', async () => {
  const home = await mkdtemp(new URL('fixture-proxy-', evidence));
  try {
    await mkdir(join(home, '.omo'));
    await writeFile(join(home, '.omo', 'cliproxy.json'), JSON.stringify({ baseUrl: 'http://127.0.0.1:8317', apiKey: 'must-not-be-read', imageModel: 'wrong-model' }));
    const connection = await readCurrentMachineConnection({ home, environment: { CLIPROXY_API_KEY: 'private-proxy-key' } });
    assert.equal(connection.baseUrl, 'http://127.0.0.1:8317/v1');
    assert.equal(connection.imageModel, DEFAULT_IMAGE_MODEL);
    assert.equal(connection.apiKey, 'private-proxy-key');
    assert.equal(JSON.stringify(connection).includes('must-not-be-read'), false);
  } finally { await rm(home, { recursive: true }); }
});

test.each([
  ['http://127.0.0.1:8317', 'http://127.0.0.1:8317/v1'],
  ['http://127.0.0.1:8317/', 'http://127.0.0.1:8317/v1'],
  ['http://127.0.0.1:8317/v1', 'http://127.0.0.1:8317/v1'],
  ['http://127.0.0.1:8317/v1/', 'http://127.0.0.1:8317/v1/'],
  ['http://127.0.0.1:8317/custom/api/', 'http://127.0.0.1:8317/custom/api/'],
])('machine address adapts only the root while explicit image and translation bases stay exact: %s', async (baseUrl, expected) => {
  const home = await mkdtemp(new URL('fixture-proxy-route-', evidence));
  try {
    await mkdir(join(home, '.omo'));
    const path = join(home, '.omo', 'cliproxy.json');
    const text = JSON.stringify({ baseUrl, apiKey: 'must-not-be-read', imageModel: 'wrong-model' });
    await writeFile(path, text);
    const environment = {};
    const connection = await readCurrentMachineConnection({ home, environment });
    assert.equal(connection.baseUrl, expected);
    assert.equal(connection.apiKey, '');
    assert.equal(connection.imageModel, DEFAULT_IMAGE_MODEL);
    assert.deepEqual(environment, {});
    assert.equal(await readFile(path, 'utf8'), text);
    const input = { schemaVersion: 1, provider: 'openai-compatible', baseUrl, allowUnauthenticated: true, translation: { baseUrl, model: 'fixture-text', allowUnauthenticated: true } };
    const before = structuredClone(input);
    const explicit = resolveConnection(input, { environment });
    assert.equal(explicit.baseUrl, baseUrl);
    assert.equal(explicit.translation.baseUrl, baseUrl);
    assert.deepEqual(input, before);
  } finally { await rm(home, { recursive: true }); }
});

test.each([
  ['http://private:secret@127.0.0.1:8317/', {}],
  ['http://@127.0.0.1:8317/', {}],
  ['http://127.0.0.1:8317/?private=secret', {}],
  ['http://127.0.0.1:8317/?', {}],
  ['http://127.0.0.1:8317/#private-secret', {}],
  [' http://127.0.0.1:8317/ ', {}],
  ['file:///private-secret', {}],
  ['http://remote.invalid/', {}],
  ['http://127.0.0.1:8317/', { CLIPROXY_API_KEY: ' ', LOCAL_OPENAI_COMPAT_API_KEY: 'valid-fallback' }],
  ['http://127.0.0.1:8317/', { CLIPROXY_API_KEY: 'private\nsecret', LOCAL_OPENAI_COMPAT_API_KEY: 'valid-fallback' }],
  ['http://127.0.0.1:8317/', { LOCAL_OPENAI_COMPAT_API_KEY: ' ' }],
])('machine raw URL and authentication remain validated before adaptation: %#', async (baseUrl, environment) => {
  const home = await mkdtemp(new URL('fixture-proxy-boundary-', evidence));
  try {
    await mkdir(join(home, '.omo'));
    await writeFile(join(home, '.omo', 'cliproxy.json'), JSON.stringify({ baseUrl, apiKey: 'must-not-be-read' }));
    const before = structuredClone(environment);
    await assert.rejects(readCurrentMachineConnection({ home, environment }), error => !error.message.includes('private') && !error.message.includes('secret') && !error.message.includes('valid-fallback'));
    assert.deepEqual(environment, before);
  } finally { await rm(home, { recursive: true }); }
});


test.each([
  [{ CLIPROXY_API_KEY: 'proxy-key', LOCAL_OPENAI_COMPAT_API_KEY: 'other-key' }, 'proxy-key'],
  [{ LOCAL_OPENAI_COMPAT_API_KEY: 'other-key' }, 'other-key'],
])('current machine connection reuses the first configured environment credential without reading config secrets', async (environment, expectedKey) => {
  const home = await mkdtemp(new URL('fixture-proxy-auth-', evidence));
  try {
    await mkdir(join(home, '.omo'));
    await writeFile(join(home, '.omo', 'cliproxy.json'), JSON.stringify({ baseUrl: 'http://127.0.0.1:8317', apiKey: 'must-not-be-read' }));
    const connection = await readCurrentMachineConnection({ home, environment });
    assert.equal(connection.apiKey, expectedKey);
    assert.equal(JSON.stringify(connection).includes('must-not-be-read'), false);
  } finally { await rm(home, { recursive: true }); }
});

test('current machine connection rejects malformed config without exposing source', async () => {
  const home = await mkdtemp(new URL('fixture-proxy-invalid-', evidence));
  try {
    await mkdir(join(home, '.omo'));
    await writeFile(join(home, '.omo', 'cliproxy.json'), '{"baseUrl":"https://secret:private@invalid"');
    await assert.rejects(readCurrentMachineConnection({ home, environment: {} }), error => error.message === 'current machine CLIProxy config invalid' && !error.message.includes('private'));
  } finally { await rm(home, { recursive: true }); }
});

test('connection-config option consumes only its explicit argument and rejects duplicates/missing paths', () => {
  assert.deepEqual(parseConnectionArgs(['--image', 'a.png', '--connection-config', './chosen.json', '--size', '1024x1024']), { connectionConfig: './chosen.json', args: ['--image', 'a.png', '--size', '1024x1024'] });
  assert.deepEqual(parseConnectionArgs(['--connection-config=chosen.json']), { connectionConfig: 'chosen.json', args: [] });
  assert.deepEqual(parseConnectionArgs([]), { connectionConfig: undefined, args: [] });
  for (const args of [['--connection-config'], ['--connection-config='], ['--connection-config', '--image'], ['--connection-config=a', '--connection-config=b']]) assert.throws(() => parseConnectionArgs(args));
});

test('actual persistence uses clean fixtureHOME, private permissions, explicit paths and preserves good config on invalid save', async () => {
  const home = await mkdtemp(new URL('fixture-home-', evidence));
  try {
    const options = { home, environment: { HOME: home, TEST_IMAGE_KEY: 'private-image-secret' } };
    const path = connectionConfigPath(options);
    assert.equal(path, join(home, '.seoul-character-art', 'connection.json'));
    await assert.rejects(readConnectionConfig(options), /connection config missing/);
    await assert.rejects(loadConnection(options), /connection config missing/);
    // Installed-tool private paths cannot become configuration fallbacks.
    await mkdir(join(home, '.omo'));
    await writeFile(join(home, '.omo', 'cliproxy.json'), '{"apiKey":"private-secret"}');
    await writeFile(join(home, '.omo', 'auth.json'), '{"token":"private-secret"}');
    await assert.rejects(readConnectionConfig(options), /connection config missing/);
    await saveConnectionConfig(openai(), options);
    const saved = await readFile(path, 'utf8');
    assert.equal(saved.includes('private-'), false);
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    assert.equal((await stat(join(home, '.seoul-character-art'))).mode & 0o777, 0o700);
    assert.equal((await loadConnection(options)).apiKey, 'private-image-secret');
    await assert.rejects(saveConnectionConfig({ ...openai(), imageModel: 'wrong-model' }, options));
    assert.equal(await readFile(path, 'utf8'), saved);
    const explicit = { ...options, connectionConfig: join(home, 'explicit.json') };
    await saveConnectionConfig(openai(), explicit);
    assert.equal((await readConnectionConfig(explicit)).provider, 'openai-compatible');
    await writeFile(path, '{"private-secret":');
    await assert.rejects(readConnectionConfig(options), error => !error.message.includes('private-secret'));
  } finally { await rm(home, { recursive: true }); }
});
