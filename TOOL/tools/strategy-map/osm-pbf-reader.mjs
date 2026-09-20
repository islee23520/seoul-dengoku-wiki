// 경계가 검증된(bounded) OSM PBF 리더 — task3 보안 감사 대응.
// 모든 할당/인플레이션은 DEFAULT_LIMITS 상한 안에서만 일어난다. 한도를 넘거나 구조가
// 프로토콜에 어긋나면 PbfLimitError(code 포함, message 항상 'pbf: ' 접두사)로 거절한다.
// varint는 BigInt로 파싱해 10바이트/uint64 넘침을 검사하고, ID/좌표 계열은 안전 정수
// 범위를 벗어나면 거절한다. 시간값은 넣지 않는다(재실행 바이트 동일).
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

export const ROUTE_KINDS = new Set(['subway', 'light_rail', 'tram', 'train']);

export class PbfLimitError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'PbfLimitError';
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new PbfLimitError(`pbf: ${message}`, code);
};

// 파일 전체와 블록별 상한. 실제 서울 스냅샷(51,794,961바이트, 최대 블록 압축 376,436바이트 /
// 해제 815,360바이트)보다 충분히 크고, 악의적 입력에 대한 할당은 이 값으로 제한된다.
export const DEFAULT_LIMITS = {
  maxTotalPbfBytes: 134217728, // 128 MiB — 파일 전체
  maxBlobHeaderBytes: 65536, // BlobHeader 메시지
  maxBlobBytes: 33554432, // 32 MiB — 압축 Blob 본문
  maxRawBytes: 67108864, // 64 MiB — 해제된 블록
  maxPackedValues: 16777216, // packed 배열 원소 수
  maxStringTableEntries: 1048576, // 블록별 문자열 수
  maxStringTableBytes: 67108864, // 블록별 문자열 총 바이트
  maxPrimitiveGroups: 4096, // 블록별 그룹 수
  maxSafeInteger: Number.MAX_SAFE_INTEGER, // ID/델타 헌값
};

const MAX_VARIANT_BYTES = 10; // uint64 varint 최대 바이트
const UINT64_MAX = (1n << 64n) - 1n;
let ACTIVE = { ...DEFAULT_LIMITS };

function readVarint(buf, pos, end) {
  let value = 0n;
  for (let i = 0; i < MAX_VARIANT_BYTES; i += 1) {
    if (pos >= end) fail('varint_truncated', 'varint runs past end of buffer');
    const b = buf[pos];
    value |= BigInt(b & 0x7f) << BigInt(7 * i);
    pos += 1;
    if ((b & 0x80) === 0) {
      if (value > UINT64_MAX) fail('varint_overflow', 'varint exceeds uint64 range');
      return [value, pos];
    }
  }
  fail('varint_too_long', `varint longer than ${MAX_VARIANT_BYTES} bytes`);
}

// ID/델타/좌표처럼 Number로 쓰는 값만 안전 정수로 변환한다. 범위 밖은 거절.
function safeNumber(value, code) {
  if (value > BigInt(ACTIVE.maxSafeInteger)) fail(code, `integer ${value} exceeds safe integer range`);
  return Number(value);
}

const zigzagBig = (v) => (v & 1n ? -(v >> 1n) - 1n : v >> 1n);

// 길이정의 메시지 필드 순회. cb(field, wireType, varint, payload).
// 정책: 필드번호 0 거절, 미지원 wire type 거절, 단일(singular) 필드 중복 거절.
function walkFields(buf, start, end, singularFields, cb) {
  let pos = start;
  const seen = new Set();
  while (pos < end) {
    let tag;
    [tag, pos] = readVarint(buf, pos, end);
    const wireType = Number(tag & 7n);
    const field = Number(tag >> 3n);
    if (field === 0) fail('field_number_zero', 'field number 0 is invalid');
    if (wireType === 0) {
      let v;
      [v, pos] = readVarint(buf, pos, end);
      if (singularFields?.has(field)) {
        if (seen.has(field)) fail('duplicate_field', `duplicate singular field ${field}`);
        seen.add(field);
      }
      cb(field, 0, v, null);
    } else if (wireType === 2) {
      let len;
      [len, pos] = readVarint(buf, pos, end);
      const lenN = safeNumber(len, 'length_overflow');
      if (pos + lenN > end) fail('field_truncated', 'length-delimited field past end');
      if (singularFields?.has(field)) {
        if (seen.has(field)) fail('duplicate_field', `duplicate singular field ${field}`);
        seen.add(field);
      }
      cb(field, 2, lenN, buf.subarray(pos, pos + lenN));
      pos += lenN;
    } else if (wireType === 5) {
      if (pos + 4 > end) fail('field_truncated', 'fixed32 past end');
      pos += 4;
    } else if (wireType === 1) {
      if (pos + 8 > end) fail('field_truncated', 'fixed64 past end');
      pos += 8;
    } else {
      fail('wire_type_unsupported', `unsupported wire type ${wireType}`);
    }
  }
}

// packed 배열: 원소 수 상한 + 안전 정수 변환.
function decodePacked(buf, start, end, kind) {
  if (end - start > ACTIVE.maxPackedValues) fail('packed_too_long', `packed ${kind} byte length suggests more than ${DEFAULT_LIMITS.maxPackedValues} values`);
  const out = [];
  let pos = start;
  while (pos < end) {
    if (out.length >= ACTIVE.maxPackedValues) fail('packed_too_long', `packed ${kind} exceeds ${ACTIVE.maxPackedValues} values`);
    let v;
    [v, pos] = readVarint(buf, pos, end);
    out.push(v);
  }
  return out;
}

const packedSafe = (values, code) => values.map((v) => safeNumber(zigzagBig(v), code));

function decodeStringTable(payload) {
  const strings = [];
  let bytes = 0;
  walkFields(payload, 0, payload.length, null, (field, wireType, _v, data) => {
    if (field === 1 && wireType === 2) {
      if (strings.length >= ACTIVE.maxStringTableEntries) fail('string_table_too_large', `string table exceeds ${ACTIVE.maxStringTableEntries} entries`);
      bytes += data.length;
      if (bytes > ACTIVE.maxStringTableBytes) fail('string_table_too_large', `string table exceeds ${ACTIVE.maxStringTableBytes} bytes`);
      strings.push(data);
    }
  });
  return strings;
}

const str = (bytes) => bytes.toString('utf8');
const stringAt = (strings, index) => {
  const i = safeNumber(index, 'string_index_overflow');
  if (i < 0 || i >= strings.length) fail('string_index_out_of_range', `string index ${i} out of range ${strings.length}`);
  return strings[i];
};

// Tag 키/값 디코딩: keys/vals 길이 일치 + 문자열 인덱스 경계 검사.
function decodeTags(keys, vals, strings, where) {
  if (keys.length !== vals.length) fail('field_length_mismatch', `${where}: keys(${keys.length}) and vals(${vals.length}) length mismatch`);
  const tags = {};
  for (let i = 0; i < keys.length; i += 1) {
    tags[str(stringAt(strings, keys[i]))] = str(stringAt(strings, vals[i]));
  }
  return tags;
}

function parsePrimitiveBlock(block) {
  let granularity = 100n;
  let latOffset = 0n;
  let lonOffset = 0n;
  let strings = [];
  const groups = [];
  const SINGULAR = new Set([17, 19, 20]); // stringtable(1)·primitivegroup(2)은 반복 필드다
  walkFields(block, 0, block.length, SINGULAR, (field, wireType, v, payload) => {
    if (field === 17 && wireType === 0) granularity = v;
    else if (field === 19 && wireType === 0) latOffset = v;
    else if (field === 20 && wireType === 0) lonOffset = v;
    else if (field === 1 && wireType === 2) strings = decodeStringTable(payload);
    else if (field === 2 && wireType === 2) {
      if (groups.length >= ACTIVE.maxPrimitiveGroups) fail('too_many_groups', `block exceeds ${ACTIVE.maxPrimitiveGroups} primitive groups`);
      groups.push(payload);
    }
  });
  const gran = safeNumber(granularity, 'granularity_overflow');
  const latOff = safeNumber(latOffset, 'offset_overflow');
  const lonOff = safeNumber(lonOffset, 'offset_overflow');
  // 위도/경도 변환: zigzag·delta 복원된 누적값에 1e-9*(granularity*v+offset)를 적용한다.
  const latOf = (v) => 1e-9 * (gran * v + latOff);
  const lonOf = (v) => 1e-9 * (gran * v + lonOff);
  return { strings, groups, latOf, lonOf };
}

function parseDenseGroup(group, block, sink) {
  const ranges = {};
  walkFields(group, 0, group.length, null, (field, wireType, _v, payload) => {
    if (wireType === 2 && [1, 8, 9, 10].includes(field)) ranges[field] = payload;
  });
  if (!ranges[1]) return;
  if (!ranges[8] || !ranges[9]) fail('field_length_mismatch', 'dense nodes missing lat or lon packed array');
  const ids = decodePacked(ranges[1], 0, ranges[1].length, 'dense.ids');
  const lats = decodePacked(ranges[8], 0, ranges[8].length, 'dense.lat');
  const lons = decodePacked(ranges[9], 0, ranges[9].length, 'dense.lon');
  const kvs = ranges[10] ? decodePacked(ranges[10], 0, ranges[10].length, 'dense.keys_vals') : [];
  if (lats.length !== ids.length || lons.length !== ids.length) {
    fail('field_length_mismatch', `dense ids(${ids.length}) lats(${lats.length}) lons(${lons.length}) length mismatch`);
  }
  const idList = packedSafe(ids, 'unsafe_integer');
  const latList = packedSafe(lats, 'unsafe_integer');
  const lonList = packedSafe(lons, 'unsafe_integer');
  let id = 0;
  let latAcc = 0;
  let lonAcc = 0;
  let kv = 0;
  for (let i = 0; i < idList.length; i += 1) {
    id += idList[i];
    latAcc += latList[i];
    lonAcc += lonList[i];
    const tags = {};
    if (kv < kvs.length && kvs[kv] !== 0n) {
      while (kv < kvs.length && kvs[kv] !== 0n) {
        if (kv + 1 >= kvs.length) fail('keys_vals_unterminated', 'dense keys_vals pair without value');
        const key = str(stringAt(block.strings, kvs[kv]));
        const value = str(stringAt(block.strings, kvs[kv + 1]));
        tags[key] = value;
        kv += 2;
      }
      if (kv >= kvs.length) fail('keys_vals_unterminated', 'dense keys_vals run missing 0 terminator');
    }
    kv += 1; // 0 종결자
    if (kv > kvs.length) fail('keys_vals_unterminated', 'dense keys_vals run missing 0 terminator');
    sink.node({ id, lat: block.latOf(latAcc), lon: block.lonOf(lonAcc), tags });
    sink.counts.nodes += 1;
    if (Object.keys(tags).length > 0) sink.counts.taggedNodes += 1;
  }
  if (kv !== kvs.length) fail('keys_vals_unterminated', 'dense keys_vals has trailing bytes after the final node');
}

function parsePlainNode(payload, block, sink) {
  let id = null;
  let lat = null;
  let lon = null;
  let keys = [];
  let vals = [];
  walkFields(payload, 0, payload.length, new Set([1, 8, 9]), (f, wt, v, bytes) => {
    if (f === 1 && wt === 0) id = safeNumber(zigzagBig(v), 'unsafe_integer');
    else if (f === 8 && wt === 0) lat = safeNumber(zigzagBig(v), 'unsafe_integer');
    else if (f === 9 && wt === 0) lon = safeNumber(zigzagBig(v), 'unsafe_integer');
    else if (f === 2 && wt === 2) keys = decodePacked(bytes, 0, bytes.length, 'node.keys');
    else if (f === 3 && wt === 2) vals = decodePacked(bytes, 0, bytes.length, 'node.vals');
  });
  if (id === null || lat === null || lon === null) fail('node_incomplete', 'plain node missing id/lat/lon');
  const tags = decodeTags(keys, vals, block.strings, 'node');
  sink.node({ id, lat: block.latOf(lat), lon: block.lonOf(lon), tags });
  sink.counts.nodes += 1;
  if (Object.keys(tags).length > 0) sink.counts.taggedNodes += 1;
}

// osmformat.proto: Way.id는 int64(그대로), refs는 sint64(zigzag delta).
function parseWay(payload, block, sink, keepWay) {
  let id = null;
  let refs = [];
  let keys = [];
  let vals = [];
  walkFields(payload, 0, payload.length, new Set([1]), (f, wt, v, bytes) => {
    if (f === 1 && wt === 0) id = safeNumber(v, 'unsafe_integer');
    else if (f === 8 && wt === 2) refs = packedSafe(decodePacked(bytes, 0, bytes.length, 'way.refs'), 'unsafe_integer');
    else if (f === 2 && wt === 2) keys = decodePacked(bytes, 0, bytes.length, 'way.keys');
    else if (f === 3 && wt === 2) vals = decodePacked(bytes, 0, bytes.length, 'way.vals');
  });
  if (id === null) fail('way_incomplete', 'way missing id');
  sink.counts.ways += 1;
  if (!keepWay || !keepWay(id)) return;
  const tags = decodeTags(keys, vals, block.strings, 'way');
  let ref = 0;
  const nodeRefs = refs.map((delta) => {
    ref += delta;
    return ref;
  });
  sink.ways.set(id, { id, refs: nodeRefs, tags });
}

// osmformat.proto: Relation.id는 int64(그대로), memids는 sint64(zigzag delta).
function parseRelation(payload, block, sink, keepRelation) {
  let id = null;
  let keys = [];
  let vals = [];
  let roles = [];
  let memids = [];
  let types = [];
  walkFields(payload, 0, payload.length, new Set([1]), (f, wt, v, bytes) => {
    if (f === 1 && wt === 0) id = safeNumber(v, 'unsafe_integer');
    else if (f === 2 && wt === 2) keys = decodePacked(bytes, 0, bytes.length, 'relation.keys');
    else if (f === 3 && wt === 2) vals = decodePacked(bytes, 0, bytes.length, 'relation.vals');
    else if (f === 8 && wt === 2) roles = decodePacked(bytes, 0, bytes.length, 'relation.roles');
    else if (f === 9 && wt === 2) memids = decodePacked(bytes, 0, bytes.length, 'relation.memids');
    else if (f === 10 && wt === 2) types = decodePacked(bytes, 0, bytes.length, 'relation.types');
  });
  if (id === null) fail('relation_incomplete', 'relation missing id');
  sink.counts.relations += 1;
  if (memids.length !== roles.length || memids.length !== types.length) {
    fail('field_length_mismatch', `relation ${id}: memids(${memids.length}) roles(${roles.length}) types(${types.length}) length mismatch`);
  }
  if (!keepRelation) return;
  const tags = decodeTags(keys, vals, block.strings, 'relation');
  if (!keepRelation(id, tags)) return;
  let ref = 0;
  const members = memids.map((delta, i) => {
    ref += safeNumber(zigzagBig(delta), 'unsafe_integer');
    const typeIndex = safeNumber(types[i], 'member_type_overflow');
    if (typeIndex < 0 || typeIndex >= MEMBER_TYPES.length) fail('member_type_invalid', `relation ${id}: member type ${typeIndex} invalid`);
    return { type: MEMBER_TYPES[typeIndex], ref, role: str(stringAt(block.strings, roles[i])) };
  });
  sink.relations.push({ id, tags, members });
}

const MEMBER_TYPES = ['node', 'way', 'relation'];

// 단일 패스: 블록 구조 검증 + 지정 콜백으로 원개 수집.
// 상태 기계: OSMHeader가 정확히 1개 먼저 와야 하고, 이후 OSMData만 허용된다.
function scanPass(buf, sink) {
  let pos = 0;
  let headerSeen = false;
  let dataSeen = false;
  while (pos < buf.length) {
    if (pos + 4 > buf.length) fail('truncated_header_length', 'truncated blob header length prefix');
    const headerLen = buf.readUInt32BE(pos);
    pos += 4;
    if (headerLen <= 0) fail('bad_header_length', 'blob header length is zero');
    if (headerLen > ACTIVE.maxBlobHeaderBytes) fail('blob_header_too_large', `blob header ${headerLen} exceeds ${ACTIVE.maxBlobHeaderBytes}`);
    if (pos + headerLen > buf.length) fail('truncated_header', 'truncated blob header');
    let type = null;
    let datasize = null;
    walkFields(buf, pos, pos + headerLen, new Set([1, 2, 3]), (field, wireType, v, payload) => {
      if (field === 1 && wireType === 2) type = payload.toString('utf8');
      else if (field === 3 && wireType === 0) datasize = safeNumber(v, 'datasize_overflow');
    });
    pos += headerLen;
    if (type === null || datasize === null) fail('header_incomplete', 'blob header missing type or datasize');
    if (datasize > ACTIVE.maxBlobBytes) fail('blob_too_large', `blob ${datasize} exceeds ${ACTIVE.maxBlobBytes}`);
    if (pos + datasize > buf.length) fail('truncated_blob', 'truncated blob body');
    const blobBuf = buf.subarray(pos, pos + datasize);
    pos += datasize;
    if (type === 'OSMHeader') {
      if (dataSeen) fail('state_duplicate_header', 'OSMHeader after OSMData blocks');
      if (headerSeen) fail('state_duplicate_header', 'duplicate OSMHeader');
      headerSeen = true;
      let raw = null;
      let zlibData = null;
      let rawSize = null;
      walkFields(blobBuf, 0, blobBuf.length, new Set([1, 2, 3]), (field, wireType, v, payload) => {
        if (field === 1 && wireType === 2) raw = payload;
        else if (field === 2 && wireType === 0) rawSize = v;
        else if (field === 3 && wireType === 2) zlibData = payload;
      });
      const body = decodeBlobBodyParts(raw, zlibData, rawSize);
      const required = [];
      walkFields(body, 0, body.length, null, (field, wireType, _v, payload) => {
        if (field === 4 && wireType === 2) required.push(payload.toString('utf8'));
      });
      const supported = new Set(['OsmSchema-V0.5', 'OsmSchema-V0.6', 'DenseNodes']); // V0.6: 빈 role/키 생략 허용
      const unknown = required.filter((f) => !supported.has(f));
      if (unknown.length > 0) fail('unsupported_feature', `unsupported required features ${unknown.join(', ')}`);
    } else if (type === 'OSMData') {
      if (!headerSeen) fail('state_data_before_header', 'OSMData before OSMHeader');
      dataSeen = true;
      const body = decodeBlobBodyFrom(blobBuf);
      if (body.length > ACTIVE.maxRawBytes) fail('decompressed_too_large', `block ${body.length} exceeds ${ACTIVE.maxRawBytes}`);
      const block = parsePrimitiveBlock(body);
      for (const group of block.groups) {
        let handled = false;
        walkFields(group, 0, group.length, null, (field, wireType, _v, payload) => {
          if (wireType !== 2) return;
          handled = true;
          if (field === 2) parseDenseGroup(payload, block, sink);
          else if (field === 1) parsePlainNode(payload, block, sink);
          else if (field === 3) parseWay(payload, block, sink, sink.keepWay);
          else if (field === 4) parseRelation(payload, block, sink, sink.keepRelation);
        });
        if (!handled && group.length > 0) fail('empty_group', 'primitive group has no known fields');
      }
    } else {
      fail('unexpected_block', `unexpected block type ${JSON.stringify(type)}`);
    }
  }
  if (!headerSeen) fail('state_missing_header', 'missing OSMHeader block');
}

function decodeBlobBodyFrom(blobBuf) {
  let raw = null;
  let zlibData = null;
  let rawSize = null;
  walkFields(blobBuf, 0, blobBuf.length, new Set([1, 2, 3]), (field, wireType, v, payload) => {
    if (field === 1 && wireType === 2) raw = payload;
    else if (field === 2 && wireType === 0) rawSize = v;
    else if (field === 3 && wireType === 2) zlibData = payload;
  });
  return decodeBlobBodyParts(raw, zlibData, rawSize);
}

// raw/zlib 상호배타 + raw_size 일치 + maxOutputLength 인플레이션 + 실측 후검.
function decodeBlobBodyParts(raw, zlibData, rawSize) {
  if (raw !== null && zlibData !== null) fail('raw_and_zlib_exclusive', 'blob has both raw and zlib payload');
  let body = null;
  if (raw !== null) {
    if (rawSize !== null && safeNumber(rawSize, 'raw_size_overflow') !== raw.length) fail('raw_size_mismatch', `raw_size ${rawSize} does not match raw length ${raw.length}`);
    body = raw;
  } else if (zlibData !== null) {
    let inflated;
    try {
      inflated = inflateSync(zlibData, { maxOutputLength: ACTIVE.maxRawBytes });
    } catch (error) {
      if (error.code === 'ERR_BUFFER_TOO_LARGE') fail('decompressed_too_large', `inflated block exceeds ${ACTIVE.maxRawBytes} (decompression bomb?)`);
      fail('zlib_invalid', `zlib inflate failed: ${error.message}`);
    }
    if (rawSize !== null && safeNumber(rawSize, 'raw_size_overflow') !== inflated.length) fail('raw_size_mismatch', `raw_size ${rawSize} does not match inflated length ${inflated.length}`);
    if (inflated.length > ACTIVE.maxRawBytes) fail('decompressed_too_large', `inflated block ${inflated.length} exceeds ${ACTIVE.maxRawBytes}`);
    body = inflated;
  } else {
    fail('blob_no_payload', 'blob has neither raw nor zlib payload (unsupported compression)');
  }
  return body;
}

function applyLimits(overrides = {}) {
  ACTIVE = { ...DEFAULT_LIMITS, ...overrides };
}

function resetLimits() {
  ACTIVE = { ...DEFAULT_LIMITS };
}

// 관계 스캔 패스: filter(relationId, tags)가 참인 관계만 members와 함께 보관한다.
export function readRelations(input, { limits = {}, filter } = {}) {
  applyLimits(limits);
  try {
    const buf = typeof input === 'string' ? readFileSync(input) : input;
    if (buf.length > ACTIVE.maxTotalPbfBytes) fail('file_too_large', `file ${buf.length} exceeds ${ACTIVE.maxTotalPbfBytes}`);
    const sink = {
      nodes: new Map(),
      ways: new Map(),
      relations: [],
      counts: { relations: 0, ways: 0, nodes: 0, taggedNodes: 0 },
      strings: [],
      keepWay: () => false,
      keepRelation: (id, tags) => (filter ? filter(id, tags) : false),
      node: () => {},
    };
    scanPass(buf, sink);
    return { relations: sink.relations, counts: sink.counts };
  } finally {
    resetLimits();
  }
}

// 엔티티 스캔: 2회 패스(ways → nodes). wantWayIds에 해당하는 way와 그 노드 좌표,
// wantNodeIds 좌표, 태그 있는 노드 전부를 모은다.
export function readEntities(input, { limits = {}, wantWayIds, wantNodeIds } = {}) {
  applyLimits(limits);
  try {
    const buf = typeof input === 'string' ? readFileSync(input) : input;
    if (buf.length > DEFAULT_LIMITS.maxTotalPbfBytes) fail('file_too_large', `file ${buf.length} exceeds ${DEFAULT_LIMITS.maxTotalPbfBytes}`);
    // pass 1: ways
    const waySink = {
      nodes: new Map(),
      ways: new Map(),
      relations: [],
      counts: { relations: 0, ways: 0, nodes: 0, taggedNodes: 0 },
      strings: [],
      keepWay: (id) => wantWayIds?.has(id) ?? false,
      keepRelation: () => false,
      node: () => {},
    };
    scanPass(buf, waySink);
    const neededNodes = new Set(wantNodeIds ?? []);
    for (const way of waySink.ways.values()) for (const ref of way.refs) neededNodes.add(ref);
    // pass 2: nodes (태그 노드 전수 + 필요 좌표)
    const nodeSink = {
      nodes: new Map(),
      ways: new Map(),
      relations: [],
      counts: { relations: 0, ways: 0, nodes: 0, taggedNodes: 0 },
      strings: [],
      keepWay: () => false,
      keepRelation: () => false,
      node: (n) => {
        if (Object.keys(n.tags).length > 0) nodeSink.nodes.set(n.id, { id: n.id, lat: n.lat, lon: n.lon, tags: n.tags });
        if (neededNodes.has(n.id)) nodeSink.ways.set(`coord:${n.id}`, { id: n.id, lat: n.lat, lon: n.lon });
      },
    };
    scanPass(buf, nodeSink);
    const nodeCoords = new Map();
    for (const entry of nodeSink.ways.values()) nodeCoords.set(entry.id, { lat: entry.lat, lon: entry.lon });
    return { taggedNodes: nodeSink.nodes, nodeCoords, ways: waySink.ways, counts: waySink.counts };
  } finally {
    resetLimits();
  }
}
