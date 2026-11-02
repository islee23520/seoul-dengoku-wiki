import { readFileSync } from "node:fs";
import { transformReferencePng } from "./transform_v1.ts";
const input = JSON.parse(readFileSync(0, "utf8"));
const result = transformReferencePng(Buffer.from(input.original, "base64"));
console.log(JSON.stringify({receipt: result.receipt, rgb: Buffer.from(result.rgbBytes).toString("base64")}));
