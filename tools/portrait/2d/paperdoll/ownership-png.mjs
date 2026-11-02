import {inflateSync} from 'node:zlib';
import {decodeCodexPng} from '../codex-image.mjs';

// Art ownership is grayscale intensity, not API mask alpha. Decode its actual
// noninterlaced grayscale8 PNG representation without changing source bytes.
export function ownershipPng(bytes) {
  if(bytes[25]!==0) {
    const image=decodeCodexPng(bytes);
    if(image.channels!==4)throw new Error('ownership must be grayscale8 or RGBA alpha');
    return {width:image.width,height:image.height,owned:Uint8Array.from({length:image.width*image.height},(_,i)=>image.pixels[i*4+3])};
  }
  if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes[24]!==8||bytes[26]||bytes[27]||bytes[28])throw new Error('unsupported grayscale ownership PNG');
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),idat=[];
  if(!width||!height||width*height>40000000)throw new Error('invalid ownership dimensions');
  let ended=false;
  for(let offset=8;offset<bytes.length;) {
    const size=bytes.readUInt32BE(offset);if(offset+size+12>bytes.length)throw new Error('truncated ownership PNG');
    const body=bytes.subarray(offset+4,offset+8+size);let crc=0xffffffff;
    for(const byte of body){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    if(((crc^0xffffffff)>>>0)!==bytes.readUInt32BE(offset+8+size))throw new Error('ownership PNG CRC mismatch');
    const type=body.subarray(0,4).toString();if(type==='IDAT')idat.push(body.subarray(4));
    if(type==='IEND'){ended=true;if(offset+size+12!==bytes.length)throw new Error('ownership PNG trailing bytes');}
    offset+=size+12;
  }
  if(!ended)throw new Error('incomplete ownership PNG');
  const raw=inflateSync(Buffer.concat(idat),{maxOutputLength:(width+1)*height}),owned=new Uint8Array(width*height);
  if(raw.length!==(width+1)*height)throw new Error('ownership scanline length mismatch');
  for(let y=0;y<height;y++) {
    const filter=raw[y*(width+1)];if(filter>4)throw new Error('invalid ownership PNG filter');
    for(let x=0;x<width;x++) {
      const left=x?owned[y*width+x-1]:0,above=y?owned[(y-1)*width+x]:0,corner=x&&y?owned[(y-1)*width+x-1]:0;
      const p=left+above-corner,pa=Math.abs(p-left),pb=Math.abs(p-above),pc=Math.abs(p-corner);
      const prediction=[0,left,above,Math.floor((left+above)/2),pa<=pb&&pa<=pc?left:pb<=pc?above:corner][filter];
      owned[y*width+x]=(raw[y*(width+1)+x+1]+prediction)&255;
    }
  }
  return {width,height,owned};
}
