function sourceOverPixel(dst, src, index) {
  const srcA = src[index + 3] / 255, dstA = dst[index + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) { dst[index] = 0; dst[index + 1] = 0; dst[index + 2] = 0; dst[index + 3] = 0; return; }
  const inverse = 1 - srcA;
  for (let channel = 0; channel < 3; channel += 1) {
    dst[index + channel] = Math.round(((src[index + channel] / 255) * srcA + (dst[index + channel] / 255) * dstA * inverse) / outA * 255);
  }
  dst[index + 3] = Math.round(outA * 255);
}

function multiplyPixel(dst, src, index) {
  const srcA = src[index + 3] / 255, dstA = dst[index + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) { dst[index] = 0; dst[index + 1] = 0; dst[index + 2] = 0; dst[index + 3] = 0; return; }
  for (let channel = 0; channel < 3; channel += 1) {
    const source = src[index + channel] / 255, backdrop = dst[index + channel] / 255;
    const premultiplied = source * backdrop * srcA * dstA + source * srcA * (1 - dstA) + backdrop * dstA * (1 - srcA);
    dst[index + channel] = Math.round(premultiplied / outA * 255);
  }
  dst[index + 3] = Math.round(outA * 255);
}

export function compositeBrowserPixels(destination, source, blendMode = 'source-over') {
  if (destination.length !== source.length) throw new Error('브라우저 합성 레이어 크기가 다릅니다.');
  const blend = blendMode === 'source-over' ? sourceOverPixel : blendMode === 'multiply' ? multiplyPixel : null;
  if (!blend) throw new Error(`지원하지 않는 blend mode: ${blendMode}`);
  for (let index = 0; index < destination.length; index += 4) blend(destination, source, index);
  return destination;
}
