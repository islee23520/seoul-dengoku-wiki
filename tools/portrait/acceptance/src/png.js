import { deflateSync, inflateSync } from "node:zlib";
const PNG_SIGNATURE = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const MAX_PIXEL_COUNT = 40_000_000;
export class PngError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = "PngError";
        this.code = code;
    }
}
function byteAt(bytes, index) {
    return bytes[index] ?? 0;
}
function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++)
            crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
}
function readUint32BE(bytes, offset) {
    return (((byteAt(bytes, offset) << 24) |
        (byteAt(bytes, offset + 1) << 16) |
        (byteAt(bytes, offset + 2) << 8) |
        byteAt(bytes, offset + 3)) >>>
        0);
}
function writeUint32BE(bytes, offset, value) {
    bytes[offset] = (value >>> 24) & 0xff;
    bytes[offset + 1] = (value >>> 16) & 0xff;
    bytes[offset + 2] = (value >>> 8) & 0xff;
    bytes[offset + 3] = value & 0xff;
}
function concatBytes(parts) {
    let total = 0;
    for (const part of parts)
        total += part.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }
    return out;
}
function chunkTypeAt(bytes, offset) {
    return String.fromCharCode(byteAt(bytes, offset), byteAt(bytes, offset + 1), byteAt(bytes, offset + 2), byteAt(bytes, offset + 3));
}
function isCriticalType(type) {
    const first = type.charCodeAt(0);
    return first >= 0x41 && first <= 0x5a;
}
function describeError(error) {
    return error instanceof Error ? error.message : String(error);
}
function paethPredictor(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}
function parseChannels(header, width, height) {
    const colorType = byteAt(header, 9);
    const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
    const supported = width > 0 &&
        height > 0 &&
        width * height <= MAX_PIXEL_COUNT &&
        byteAt(header, 8) === 8 &&
        channels !== 0 &&
        byteAt(header, 10) === 0 &&
        byteAt(header, 11) === 0 &&
        byteAt(header, 12) === 0;
    if (!supported)
        throw new PngError("unsupported-encoding", "unsupported PNG encoding or dimensions");
    return channels;
}
function unfilterRow(raw, pixels, stride, bpp, y, filter) {
    const rowStart = y * (stride + 1) + 1;
    const outStart = y * stride;
    for (let x = 0; x < stride; x++) {
        const a = x >= bpp ? byteAt(pixels, outStart + x - bpp) : 0;
        const b = y > 0 ? byteAt(pixels, outStart - stride + x) : 0;
        const c = y > 0 && x >= bpp ? byteAt(pixels, outStart - stride + x - bpp) : 0;
        let prediction = 0;
        if (filter === 1)
            prediction = a;
        else if (filter === 2)
            prediction = b;
        else if (filter === 3)
            prediction = Math.floor((a + b) / 2);
        else if (filter === 4)
            prediction = paethPredictor(a, b, c);
        pixels[outStart + x] = byteAt(raw, rowStart + x) + prediction;
    }
}
export function decodePng(bytes) {
    const hasSignature = bytes.length >= PNG_SIGNATURE.length &&
        PNG_SIGNATURE.every((byte, index) => byteAt(bytes, index) === byte);
    if (!hasSignature)
        throw new PngError("not-png", "not a PNG signature");
    let width = 0;
    let height = 0;
    let channels;
    let sawIhdr = false;
    let firstChunk = true;
    let ended = false;
    const idatParts = [];
    let offset = 8;
    while (offset < bytes.length) {
        if (bytes.length - offset < 12)
            throw new PngError("truncated", "truncated PNG chunk");
        const size = readUint32BE(bytes, offset);
        if (size > bytes.length - offset - 12)
            throw new PngError("truncated", "truncated PNG chunk");
        const type = chunkTypeAt(bytes, offset + 4);
        const body = bytes.subarray(offset + 8, offset + 8 + size);
        const crcStored = readUint32BE(bytes, offset + 8 + size);
        if (crc32(bytes.subarray(offset + 4, offset + 8 + size)) !== crcStored) {
            throw new PngError("invalid-crc", `invalid PNG CRC in ${type} chunk`);
        }
        if (firstChunk && type !== "IHDR")
            throw new PngError("missing-ihdr", "PNG missing IHDR");
        firstChunk = false;
        if (type === "IHDR") {
            if (sawIhdr || size !== 13)
                throw new PngError("invalid-ihdr", "invalid PNG IHDR");
            sawIhdr = true;
            width = readUint32BE(body, 0);
            height = readUint32BE(body, 4);
            channels = parseChannels(body, width, height);
        }
        else if (type === "IDAT") {
            idatParts.push(body);
        }
        else if (type === "IEND") {
            if (size !== 0 || offset + 12 !== bytes.length)
                throw new PngError("invalid-end", "invalid PNG end");
            ended = true;
            break;
        }
        else if (isCriticalType(type) && type !== "PLTE") {
            throw new PngError("unsupported-chunk", `unsupported PNG critical chunk ${type}`);
        }
        offset += size + 12;
    }
    if (!ended || idatParts.length === 0 || channels === undefined) {
        throw new PngError("incomplete", "incomplete PNG");
    }
    const stride = width * channels;
    const expectedLength = (stride + 1) * height;
    let raw;
    try {
        raw = inflateSync(concatBytes(idatParts), {
            maxOutputLength: expectedLength,
        });
    }
    catch (error) {
        throw new PngError("invalid-idat", `PNG IDAT failed to inflate (${describeError(error)})`);
    }
    if (raw.length !== expectedLength)
        throw new PngError("invalid-scanline", "invalid PNG scanline length");
    const pixels = new Uint8Array(stride * height);
    for (let y = 0; y < height; y++) {
        const filter = byteAt(raw, y * (stride + 1));
        if (filter > 4)
            throw new PngError("invalid-filter", "invalid PNG filter");
        unfilterRow(raw, pixels, stride, channels, y, filter);
    }
    return { width, height, channels, pixels };
}
function writeChunk(type, body) {
    const chunk = new Uint8Array(body.length + 12);
    writeUint32BE(chunk, 0, body.length);
    for (let i = 0; i < 4; i++)
        chunk[4 + i] = type.charCodeAt(i);
    chunk.set(body, 8);
    writeUint32BE(chunk, 8 + body.length, crc32(chunk.subarray(4, 8 + body.length)));
    return chunk;
}
export function encodePng({ width, height, pixels, }) {
    const validDimensions = Number.isInteger(width) &&
        Number.isInteger(height) &&
        width > 0 &&
        height > 0 &&
        pixels.length === width * height * 4;
    if (!validDimensions)
        throw new PngError("invalid-input", "invalid RGBA dimensions");
    const stride = width * 4;
    const scanlines = new Uint8Array((stride + 1) * height);
    for (let y = 0; y < height; y++) {
        scanlines.set(pixels.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
    }
    const header = new Uint8Array(13);
    writeUint32BE(header, 0, width);
    writeUint32BE(header, 4, height);
    header[8] = 8;
    header[9] = 6;
    return concatBytes([
        PNG_SIGNATURE,
        writeChunk("IHDR", header),
        writeChunk("IDAT", deflateSync(scanlines)),
        writeChunk("IEND", new Uint8Array(0)),
    ]);
}
