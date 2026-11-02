import { inflateSync } from 'node:zlib';

export class PngError extends Error {}
export interface PngInfo { readonly width: number; readonly height: number; readonly visiblePixels: number }

function crc(bytes: Uint8Array): number {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}

/** Decode Blender's noninterlaced 8-bit RGB/RGBA PNG, including CRC and scanline checks. */
export function inspectPng(bytes: Buffer): PngInfo {
  if (!bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new PngError('Invalid PNG signature');
  let offset = 8, width = 0, height = 0, channels = 0, ended = false;
  const compressed: Buffer[] = [];
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset), end = offset + 8 + length;
    if (end + 4 > bytes.length) throw new PngError('Truncated PNG chunk');
    const kind = bytes.toString('ascii', offset + 4, offset + 8);
    if (crc(bytes.subarray(offset + 4, end)) !== bytes.readUInt32BE(end)) throw new PngError('PNG CRC mismatch');
    if (kind === 'IHDR') {
      if (width || offset !== 8 || length !== 13) throw new PngError('Invalid IHDR');
      width = bytes.readUInt32BE(offset + 8); height = bytes.readUInt32BE(offset + 12);
      const depth = bytes[offset + 16], type = bytes[offset + 17];
      if (depth !== 8 || (type !== 2 && type !== 6) || bytes[offset + 18] || bytes[offset + 19] || bytes[offset + 20]) throw new PngError('Expected noninterlaced 8-bit RGB/RGBA PNG');
      channels = type === 6 ? 4 : 3;
      if (width < 1 || height < 1 || width > 2048 || height > 2048) throw new PngError('Unsupported PNG dimensions');
    } else if (kind === 'IDAT') compressed.push(bytes.subarray(offset + 8, end));
    else if (kind === 'IEND') {
      if (length !== 0 || end + 4 !== bytes.length) throw new PngError('Invalid PNG terminator');
      ended = true; break;
    }
    offset = end + 4;
  }
  if (!ended || !width || !compressed.length) throw new PngError('Incomplete PNG');
  const stride = width * channels;
  const decoded = inflateSync(Buffer.concat(compressed), { maxOutputLength: (stride + 1) * height });
  if (decoded.length !== (stride + 1) * height) throw new PngError('PNG scanline length mismatch');
  let prior: Buffer = Buffer.alloc(stride), source = 0, visiblePixels = 0;
  for (let y = 0; y < height; y++) {
    const filter = decoded[source++];
    if (filter > 4) throw new PngError('Unknown PNG scanline filter');
    const row = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? row[x - channels] : 0, up = prior[x], corner = x >= channels ? prior[x - channels] : 0;
      const p = left + up - corner, a = Math.abs(p-left), b = Math.abs(p-up), c = Math.abs(p-corner);
      const predictor = filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left+up)/2) : filter === 4 ? (a <= b && a <= c ? left : b <= c ? up : corner) : 0;
      row[x] = (decoded[source++] + predictor) & 255;
    }
    for (let x = 0; x < width; x++) if (channels === 3 || row[x * 4 + 3] > 0) visiblePixels++;
    prior = row;
  }
  if (!visiblePixels) throw new PngError('Rendered PNG is fully transparent');
  return { width, height, visiblePixels };
}
