import { strict as assert } from "node:assert";
import { decodePng, encodePng } from "./png_v1.ts";
import { transformReferencePng, rgbPng } from "./transform_v1.ts";

// A native-size source proves exact placement without introducing another resampler.
const pixels = new Uint8Array(340 * 510 * 4);
for (let i = 0; i < pixels.length; i += 4) {
  pixels[i] = (i / 4) % 251;
  pixels[i + 1] = 71;
  pixels[i + 2] = 149;
  pixels[i + 3] = 255;
}
const original = encodePng({width: 340, height: 510, pixels});
const transformed = transformReferencePng(original);
const rgb = decodePng(transformed.rgbBytes);
assert.deepEqual([rgb.width, rgb.height, rgb.channels], [352, 512, 3]);
assert.deepEqual(transformed.receipt.computationalContentRect, {x: 6, y: 1, width: 340, height: 510});
for (let y = 0; y < 512; y++) for (let x = 0; x < 352; x++) {
  const out = (y * 352 + x) * 3;
  const content = x >= 6 && x < 346 && y >= 1 && y < 511;
  for (let c = 0; c < 3; c++) assert.equal(rgb.pixels[out + c], content ? pixels[((y - 1) * 340 + x - 6) * 4 + c] : 224 + c * 2);
}
assert.throws(() => transformReferencePng(rgbPng(1, 1, Uint8Array.from([0, 0, 0, 255]))));
assert.throws(() => transformReferencePng(original.subarray(0, 30)));
console.log("NATIVE_TRANSFORM_EXACT_PLACEMENT_PASS");
