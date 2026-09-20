// osm-pbf-reader 경계/보안 테스트. 악의적·손상 PBF 픽스처를 직접 인코딩해
// PbfLimitError(code, 'pbf: ' 접두사)로 거절되는지, 경계값은 통과하는지 검증한다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { DEFAULT_LIMITS, PbfLimitError, readEntities, readRelations } from './osm-pbf-reader.mjs';

// --- minimal protobuf writer -------------------------------------------------

const pv = (value) => {
  let v = BigInt(value);
  const out = [];
  do {
    let b = Number(v & 0x7fn);
    v >>= 7n;
    if (v > 0n) b |= 0x80;
    out.push(b);
  } while (v > 0n);
  return out;
};
const tagOf = (field, wireType) => pv(BigInt(field) << 3n | BigInt(wireType));
const vint = (field, value) => [...tagOf(field, 0), ...pv(value)];
const len = (field, payload) => [...tagOf(field, 2), ...pv(payload.length), ...payload];
const bytes = (arr) => Buffer.from(arr);

const stringTable = (strings) => len(1, strings.flatMap((s) => len(1, Buffer.from(s, 'utf8'))));
const packed = (field, values) => len(field, values.flatMap((v) => pv(v)));
const zigzag = (v) => (v >= 0n ? v << 1n : ((-v) << 1n) - 1n);

const denseGroup = ({ ids, lats, lons, kvs }) => {
  const out = [...packed(1, ids.map((v) => zigzag(BigInt(v))))];
  if (lats) out.push(...packed(8, lats.map((v) => zigzag(BigInt(v)))));
  if (lons) out.push(...packed(9, lons.map((v) => zigzag(BigInt(v)))));
  if (kvs) out.push(...packed(10, kvs));
  return len(2, out);
};
const plainNode = ({ id, lat, lon, keys = [], vals = [] }) => len(1, [
  ...vint(1, zigzag(BigInt(id))), ...packed(2, keys), ...packed(3, vals), ...vint(8, zigzag(BigInt(lat))), ...vint(9, zigzag(BigInt(lon))),
]);
const relationMsg = ({ id, keys = [], vals = [], roles, memids, types }) => len(4, [
  ...vint(1, BigInt(id)), ...packed(2, keys), ...packed(3, vals),
  ...packed(8, roles ?? []), ...packed(9, (memids ?? []).map((v) => zigzag(BigInt(v)))), ...packed(10, types ?? []),
]);

const primitiveBlock = ({ strings = [''], groups }) => bytes([
  ...stringTable(strings),
  ...groups.flatMap((g) => len(2, g)), // osmformat.proto: primitivegroup = 2
]);

const headerBlock = () => bytes([...len(4, Buffer.from('OsmSchema-V0.6')), ...len(4, Buffer.from('DenseNodes'))]);

const blobBlock = (type, body, { compression = 'raw', rawSize, datasizeOverride, includeRawZlibBoth = false } = {}) => {
  const blobFields = [];
  if (compression === 'raw' || includeRawZlibBoth) blobFields.push(...len(1, body));
  if (compression === 'zlib' || includeRawZlibBoth) blobFields.push(...len(3, deflateSync(body)));
  if (compression === 'none') blobFields.push(...[]);
  if (rawSize !== undefined) blobFields.push(...vint(2, rawSize));
  const blob = bytes(blobFields);
  const header = bytes([...len(1, Buffer.from(type)), ...vint(3, datasizeOverride ?? blob.length)]);
  const prefix = Buffer.alloc(4);
  prefix.writeUInt32BE(header.length);
  return Buffer.concat([prefix, header, blob]);
};

const minimalFile = () =>
  Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', primitiveBlock({ groups: [denseGroup({ ids: [1], lats: [3750000000n], lons: [12700000000n], kvs: [0] })] }))]);

const parseOrError = (buf, opts) => {
  try {
    readRelations(buf, opts);
    return null;
  } catch (error) {
    return error;
  }
};

test('valid minimal PBF parses through the bounded reader', () => {
  const { relations, counts } = readRelations(minimalFile());
  assert.equal(relations.length, 0);
  assert.equal(counts.nodes, 1);
});

test('oversized blob header length is rejected by default limits', () => {
  const junk = Buffer.alloc(DEFAULT_LIMITS.maxBlobHeaderBytes + 1, 0x61);
  const prefix = Buffer.alloc(4);
  prefix.writeUInt32BE(junk.length);
  const err = parseOrError(Buffer.concat([prefix, junk]));
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'blob_header_too_large');
});

test('oversized blob body is rejected before allocation', () => {
  const header = bytes([...len(1, Buffer.from('OSMData')), ...vint(3, DEFAULT_LIMITS.maxBlobBytes + 1)]);
  const prefix = Buffer.alloc(4);
  prefix.writeUInt32BE(header.length);
  const buf = Buffer.concat([prefix, header, Buffer.alloc(16)]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'blob_too_large');
});

test('blob at the exact byte boundary is accepted', () => {
  const body = headerBlock();
  const blobLen = body.length + 2; // Blob 필드 태그+길이 2바이트 포함
  const buf = blobBlock('OSMHeader', body);
  const err = parseOrError(buf, { limits: { maxBlobBytes: blobLen } });
  assert.equal(err, null); // datasize == maxBlobBytes 인 경계는 통과한다
});

// --- decompression bounds ------------------------------------------------------

test('decompression bomb exceeding default maxRawBytes is rejected', () => {
  const bomb = Buffer.alloc(100 * 1024 * 1024); // 압축 시 수십 KB, 해제 시 100MB
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', bomb, { compression: 'zlib' })]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'decompressed_too_large');
});

test('decompression bomb is rejected against a small maxRawBytes override', () => {
  const bomb = Buffer.alloc(5000);
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', bomb, { compression: 'zlib' })]);
  const err = parseOrError(buf, { limits: { maxRawBytes: 1000 } });
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'decompressed_too_large');
});

test('inflated output exactly at maxRawBytes boundary succeeds', () => {
  const body = primitiveBlock({ groups: [denseGroup({ ids: [1], lats: [3750000000n], lons: [12700000000n], kvs: [0] })] });
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', body, { compression: 'zlib', rawSize: body.length })]);
  const limits = { maxRawBytes: body.length };
  const err = parseOrError(buf, { limits });
  assert.equal(err, null);
});

test('raw and zlib payloads are mutually exclusive', () => {
  const body = headerBlock();
  const buf = blobBlock('OSMHeader', body, { includeRawZlibBoth: true });
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'raw_and_zlib_exclusive');
});

test('blob with neither raw nor zlib payload is rejected', () => {
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', headerBlock(), { compression: 'none' })]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'blob_no_payload');
});

test('raw_size must match the actual payload length', () => {
  const body = headerBlock();
  const wrong = body.length + 7;
  const errRaw = parseOrError(blobBlock('OSMHeader', body, { rawSize: wrong }));
  assert.ok(errRaw instanceof PbfLimitError);
  assert.equal(errRaw.code, 'raw_size_mismatch');
  const errZlib = parseOrError(blobBlock('OSMHeader', body, { compression: 'zlib', rawSize: wrong }));
  assert.ok(errZlib instanceof PbfLimitError);
  assert.equal(errZlib.code, 'raw_size_mismatch');
});

// --- varint / integer safety ---------------------------------------------------

test('varint longer than 10 bytes is rejected', () => {
  const relation = len(4, [...vint(1, 5n), ...Array.from({ length: 11 }, (_, i) => (i === 10 ? 0x01 : 0x80))]);
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', primitiveBlock({ groups: [relation] }))]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'varint_too_long');
});

test('unsafe integer ids beyond the safe range are rejected', () => {
  const unsafe = 1n << 60n; // zigzag(2^60) = 2^61 > MAX_SAFE
  const buf = Buffer.concat([
    blobBlock('OSMHeader', headerBlock()),
    blobBlock('OSMData', primitiveBlock({ groups: [denseGroup({ ids: [unsafe], lats: [3750000000n], lons: [12700000000n], kvs: [0] })] })),
  ]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'unsafe_integer');
});

test('packed arrays above maxPackedValues are rejected', () => {
  const values = [1n, 2n, 3n, 4n].map((v) => zigzag(v));
  const group = len(2, [...packed(1, values), ...packed(8, values), ...packed(9, values), ...packed(10, [0, 0, 0, 0])]);
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', primitiveBlock({ groups: [group] }))]);
  const err = parseOrError(buf, { limits: { maxPackedValues: 2 } });
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'packed_too_long');
});

// --- structural length equality / index bounds ----------------------------------

test('dense ids and lats length mismatch is rejected', () => {
  const group = len(2, [...packed(1, [zigzag(1n), zigzag(2n)]), ...packed(8, [zigzag(3750000000n)]), ...packed(9, [zigzag(12700000000n), zigzag(12700000000n)]), ...packed(10, [0, 0])]);
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', primitiveBlock({ groups: [group] }))]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'field_length_mismatch');
});

test('relation memids/roles/types length mismatch is rejected', () => {
  const relation = relationMsg({ id: 9, roles: [0, 0], memids: [5, 6, 7], types: [0, 0, 0] });
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', primitiveBlock({ groups: [relation] }))]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'field_length_mismatch');
});

test('plain node keys/vals length mismatch is rejected', () => {
  const node = plainNode({ id: 3, lat: 3750000000n, lon: 12700000000n, keys: [0, 1], vals: [2] });
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', primitiveBlock({ strings: ['a', 'b', 'c'], groups: [node] }))]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'field_length_mismatch');
});

test('dense keys_vals unterminated run is rejected', () => {
  const group = denseGroup({ ids: [1], lats: [3750000000n], lons: [12700000000n], kvs: [0, 1, 1] }); // 마지막 쌍 뒤 종결자 없음
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', primitiveBlock({ strings: ['a', 'b'], groups: [group] }))]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'keys_vals_unterminated');
});

test('string table index out of range is rejected', () => {
  const group = denseGroup({ ids: [1], lats: [3750000000n], lons: [12700000000n], kvs: [9, 0, 0] });
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', primitiveBlock({ strings: ['a', 'b'], groups: [group] }))]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'string_index_out_of_range');
});

// --- block state machine / wire policy ------------------------------------------

test('OSMData before OSMHeader is rejected', () => {
  const file = Buffer.concat([blobBlock('OSMData', primitiveBlock({ groups: [denseGroup({ ids: [1], lats: [3750000000n], lons: [12700000000n], kvs: [0] })] }))]);
  const err = parseOrError(file);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'state_data_before_header');
});

test('duplicate OSMHeader is rejected', () => {
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', primitiveBlock({ groups: [denseGroup({ ids: [1], lats: [3750000000n], lons: [12700000000n], kvs: [0] })] }))]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'state_duplicate_header');
});

test('missing OSMHeader is rejected', () => {
  const err = parseOrError(Buffer.alloc(0));
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'state_missing_header');
});

test('field number 0 is rejected', () => {
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', bytes([...tagOf(0, 0), ...pv(1n)]))]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'field_number_zero');
});

test('unsupported wire type is rejected', () => {
  const group = bytes([...tagOf(2, 6), ...pv(4n)]);
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', primitiveBlock({ groups: [group] }))]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'wire_type_unsupported');
});

test('duplicate singular field is rejected', () => {
  const block = bytes([...vint(17, 100n), ...vint(17, 200n), ...stringTable(['']), ...len(5, denseGroup({ ids: [1], lats: [3750000000n], lons: [12700000000n], kvs: [0] }))]);
  const buf = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', block)]);
  const err = parseOrError(buf);
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'duplicate_field');
});

test('file beyond maxTotalPbfBytes is rejected', () => {
  const file = minimalFile();
  const err = parseOrError(file, { limits: { maxTotalPbfBytes: 10 } });
  assert.ok(err instanceof PbfLimitError);
  assert.equal(err.code, 'file_too_large');
});

// --- entity API sanity (ways + wanted coordinates) -------------------------------

test('readEntities keeps wanted ways and their node coordinates', () => {
  // way 100 references node 1; relation-free pass with wantWayIds={100}
  const way = len(3, [...vint(1, 100n), ...packed(8, [zigzag(1n)]), ...packed(2, [0n]), ...packed(3, [1n])]);
  const file = Buffer.concat([blobBlock('OSMHeader', headerBlock()), blobBlock('OSMData', primitiveBlock({ strings: ['tunnel', 'yes'], groups: [way, denseGroup({ ids: [1], lats: [3750000000n], lons: [12700000000n], kvs: [0] })] }))]);
  const { ways, nodeCoords, taggedNodes } = readEntities(file, { wantWayIds: new Set([100]) });
  assert.equal(ways.get(100).refs.length, 1);
  assert.equal(ways.get(100).tags.tunnel, 'yes');
  assert.equal(nodeCoords.get(1).lat, 375); // 1e-9 * (granularity 100 * 37500000*100) — 좌표 스케일 확인
  assert.equal(taggedNodes.size, 0); // 노드 1은 태그가 없다(kvs=[0])
});
