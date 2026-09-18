const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function unfilter(filter, row, previous, bytesPerPixel) {
  const result = new Uint8Array(row.length);
  for (let index = 0; index < row.length; index += 1) {
    const left = index >= bytesPerPixel ? result[index - bytesPerPixel] : 0;
    const up = previous[index], upLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;
    let value = row[index];
    if (filter === 1) value += left;
    else if (filter === 2) value += up;
    else if (filter === 3) value += (left + up) >> 1;
    else if (filter === 4) value += paeth(left, up, upLeft);
    else if (filter !== 0) throw new Error(`지원하지 않는 PNG filter: ${filter}`);
    result[index] = value & 255;
  }
  return result;
}

export async function decodeBrowserPng(bytes) {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (!PNG_SIGNATURE.every((value, index) => data[index] === value)) throw new Error('PNG signature 오류');
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 8, width, height, bitDepth, colorType; const idat = [];
  while (offset + 12 <= data.length) {
    const length = view.getUint32(offset); const type = String.fromCharCode(...data.slice(offset + 4, offset + 8));
    const chunk = data.slice(offset + 8, offset + 8 + length);
    if (type === 'IHDR') { const chunkView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength); width = chunkView.getUint32(0); height = chunkView.getUint32(4); bitDepth = chunk[8]; colorType = chunk[9]; }
    else if (type === 'IDAT') idat.push(chunk);
    else if (type === 'IEND') break;
    offset += 12 + length;
  }
  if (!width || !height || bitDepth !== 8 || ![2, 6].includes(colorType)) throw new Error('8-bit RGB/RGBA PNG만 지원합니다.');
  const compressedLength = idat.reduce((sum, chunk) => sum + chunk.length, 0); const compressed = new Uint8Array(compressedLength);
  let write = 0; for (const chunk of idat) { compressed.set(chunk, write); write += chunk.length; }
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate'));
  const inflated = new Uint8Array(await new Response(stream).arrayBuffer());
  const channels = colorType === 6 ? 4 : 3, stride = width * channels, pixels = new Uint8ClampedArray(width * height * 4);
  let source = 0, previous = new Uint8Array(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[source++], row = inflated.slice(source, source + stride); source += stride;
    const decoded = unfilter(filter, row, previous, channels); previous = decoded;
    for (let x = 0; x < width; x += 1) {
      const from = x * channels, to = (y * width + x) * 4;
      pixels[to] = decoded[from]; pixels[to + 1] = decoded[from + 1]; pixels[to + 2] = decoded[from + 2]; pixels[to + 3] = colorType === 6 ? decoded[from + 3] : 255;
    }
  }
  return { naturalWidth: width, naturalHeight: height, width, height, pixels };
}

export async function loadPngPixels(url, fetcher = fetch) {
  const response = await fetcher(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`이미지를 불러오지 못했습니다: HTTP ${response.status} ${url}`);
  return decodeBrowserPng(await response.arrayBuffer());
}
