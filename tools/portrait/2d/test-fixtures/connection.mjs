import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

export async function fixtureEnvironment(environment) {
  const directory = join(environment.HOME, '.seoul-character-art');
  await mkdir(directory, { recursive: true });
  const baseUrl = environment.CHARACTER_AI_BASE_URL;
  const apiKey = environment.CHARACTER_AI_API_KEY;
  const auth = apiKey ? { apiKeyEnv: 'FIXTURE_IMAGE_KEY' } : { allowUnauthenticated: true };
  await writeFile(join(directory, 'connection.json'), JSON.stringify({ schemaVersion: 1, provider: 'openai-compatible', baseUrl, ...auth, translation: { baseUrl, model: environment.CHARACTER_AI_TRANSLATION_MODEL, ...auth } }));
  return { ...environment, FIXTURE_IMAGE_KEY: apiKey ?? '' };
}

export function portraitPng(width = 1024, height = 1536) {
  const chunk = (type, bytes) => {
    const body = Buffer.concat([Buffer.from(type), bytes]);
    let crc = 0xffffffff;
    for (const byte of body) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    const result = Buffer.alloc(bytes.length + 12);
    result.writeUInt32BE(bytes.length); body.copy(result, 4); result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
    return result;
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  const pixels = Buffer.alloc((width * 4 + 1) * height);
  pixels[4] = 255;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(pixels)), chunk('IEND', Buffer.alloc(0))]);
}
