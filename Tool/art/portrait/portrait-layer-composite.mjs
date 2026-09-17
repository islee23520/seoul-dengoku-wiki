import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync, inflateSync } from 'node:zlib';

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilterRow(filter, row, prev, bpp) {
  const out = new Uint8Array(row.length);
  for (let i = 0; i < row.length; i += 1) {
    const left = i >= bpp ? out[i - bpp] : 0;
    const up = prev[i];
    const upLeft = i >= bpp ? prev[i - bpp] : 0;
    let recon = row[i];
    if (filter === 1) recon += left;
    else if (filter === 2) recon += up;
    else if (filter === 3) recon += (left + up) >> 1;
    else if (filter === 4) recon += paethPredictor(left, up, upLeft);
    else if (filter !== 0) throw new Error(`unsupported PNG filter ${filter}`);
    out[i] = recon & 255;
  }
  return out;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

export function decodePng(buffer) {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIG)) {
    throw new Error('not a PNG');
  }
  let offset = 8;
  let width;
  let height;
  let bitDepth;
  let colorType;
  const idat = [];
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  if (!width || !height) throw new Error('missing PNG IHDR');
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) {
    throw new Error('unsupported PNG; expected 8-bit RGB or RGBA');
  }
  const inflated = inflateSync(Buffer.concat(idat));
  const channels = colorType === 2 ? 3 : 4;
  const stride = width * channels;
  const pixels = new Uint8Array(width * height * 4);
  let src = 0;
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[src];
    src += 1;
    const row = inflated.subarray(src, src + stride);
    src += stride;
    const recon = unfilterRow(filter, row, prev, channels);
    if (colorType === 6) {
      pixels.set(recon, y * width * 4);
    } else {
      const dst = y * width * 4;
      for (let x = 0; x < width; x += 1) {
        const s = x * 3;
        const d = dst + x * 4;
        pixels[d] = recon[s];
        pixels[d + 1] = recon[s + 1];
        pixels[d + 2] = recon[s + 2];
        pixels[d + 3] = 255;
      }
    }
    prev = recon;
  }
  return { width, height, pixels };
}

export function encodePng(width, height, pixels) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const srcStart = y * width * 4;
    const dstStart = y * (width * 4 + 1);
    raw[dstStart] = 0;
    Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength).copy(
      raw,
      dstStart + 1,
      srcStart,
      srcStart + width * 4,
    );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function sourceOverPixel(dst, src, i) {
  const srcA = src[i + 3] / 255;
  const dstA = dst[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) {
    dst[i] = 0;
    dst[i + 1] = 0;
    dst[i + 2] = 0;
    dst[i + 3] = 0;
    return;
  }
  const inv = 1 - srcA;
  dst[i] = Math.round(((src[i] / 255) * srcA + (dst[i] / 255) * dstA * inv) / outA * 255);
  dst[i + 1] = Math.round(((src[i + 1] / 255) * srcA + (dst[i + 1] / 255) * dstA * inv) / outA * 255);
  dst[i + 2] = Math.round(((src[i + 2] / 255) * srcA + (dst[i + 2] / 255) * dstA * inv) / outA * 255);
  dst[i + 3] = Math.round(outA * 255);
}

export function sourceOver(dst, src) {
  for (let i = 0; i < dst.length; i += 4) {
    sourceOverPixel(dst, src, i);
  }
}

function multiplyPixel(dst, src, i) {
  const srcA = src[i + 3] / 255;
  const dstA = dst[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) {
    dst[i] = 0; dst[i + 1] = 0; dst[i + 2] = 0; dst[i + 3] = 0;
    return;
  }
  for (let channel = 0; channel < 3; channel += 1) {
    const source = src[i + channel] / 255;
    const backdrop = dst[i + channel] / 255;
    const premultiplied = source * backdrop * srcA * dstA
      + source * srcA * (1 - dstA)
      + backdrop * dstA * (1 - srcA);
    dst[i + channel] = Math.round(premultiplied / outA * 255);
  }
  dst[i + 3] = Math.round(outA * 255);
}

export function multiply(dst, src) {
  for (let i = 0; i < dst.length; i += 4) multiplyPixel(dst, src, i);
}

export function sourceIn(dst, mask) {
  for (let i = 0; i < dst.length; i += 4) {
    if (mask[i + 3] === 0) {
      dst[i] = 0; dst[i + 1] = 0; dst[i + 2] = 0; dst[i + 3] = 0;
    } else {
      const alpha = mask[i + 3] / 255;
      dst[i+3] = Math.round(dst[i+3] * alpha);
    }
  }
}

export function compositePortraitLayers({ schema, slots, blendModes = {}, clipMasks = {}, outputPath } = {}) {
  if (!schema || !Array.isArray(schema.slots)) {
    throw new Error('missing slot schema');
  }
  const slotMap = slots && typeof slots === 'object' ? slots : {};
  const ordered = [...schema.slots].sort((a, b) => a.z - b.z);
  const missing = [];
  for (const slot of ordered) {
    const path = slotMap[slot.id];
    const present = typeof path === 'string' && path.length > 0 && existsSync(path);
    if (slot.required && !present) missing.push(slot.id);
  }
  if (missing.length > 0) {
    throw new Error(`missing required slot: ${missing.join(', ')}`);
  }

  let width = 0;
  let height = 0;
  let dest = null;
  for (const slot of ordered) {
    const path = slotMap[slot.id];
    if (typeof path !== 'string' || path.length === 0 || !existsSync(path)) continue;
    const layer = decodePng(readFileSync(path));
    if (!dest) {
      width = layer.width;
      height = layer.height;
      dest = new Uint8Array(width * height * 4);
    } else if (layer.width !== width || layer.height !== height) {
      throw new Error(`slot ${slot.id} size ${layer.width}x${layer.height} != ${width}x${height}`);
    }
    const blendMode = blendModes[slot.id] ?? 'source-over';
    if (blendMode === 'source-over') sourceOver(dest, layer.pixels);
    else if (blendMode === 'multiply') multiply(dest, layer.pixels);
    else throw new Error(`unsupported blend mode ${blendMode} for slot ${slot.id}`);
    if (clipMasks[slot.id]) {
      const maskPath = slotMap[clipMasks[slot.id]];
      if (typeof maskPath === 'string' && maskPath.length > 0 && existsSync(maskPath)) {
        const maskLayer = decodePng(readFileSync(maskPath));
        sourceIn(dest, maskLayer.pixels);
      }
    }
  }
  if (!dest) {
    throw new Error('missing required slot: no layers');
  }

  const png = encodePng(width, height, dest);
  if (outputPath) writeFileSync(outputPath, png);
  return { width, height, pixels: dest, png };
}
