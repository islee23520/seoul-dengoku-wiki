import { closeSync, openSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const SCHEMA_VERSION = 5;
export const APPLICATION_ID = 0x57435351;
const schemaPaths = Object.freeze([
  new URL('./schema.sql', import.meta.url),
  new URL('./current-family.sql', import.meta.url),
  new URL('./current-engine.sql', import.meta.url),
  new URL('./current-context.sql', import.meta.url),
  new URL('./current-index.sql', import.meta.url),
  new URL('./historical-context.sql', import.meta.url),
  new URL('./current-identity-provenance.sql', import.meta.url),
  new URL('./excluded-sources.sql', import.meta.url),
  new URL('./source-closure.sql', import.meta.url),
  new URL('./text-corpus-documents.sql', import.meta.url),
  new URL('./text-corpus-lines.sql', import.meta.url),
  new URL('./text-data-simple.sql', import.meta.url),
  new URL('./text-data-atlas.sql', import.meta.url),
  new URL('./text-data-bestiary.sql', import.meta.url),
  new URL('./text-data-geography.sql', import.meta.url),
  new URL('./text-data-character-example.sql', import.meta.url),
]);

function failure(code, message, cause) {
  const error = new Error(`${code}: ${message}`, cause === undefined ? undefined : { cause });
  error.code = code;
  return error;
}

function requireRuntime() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 24 || (major === 24 && minor < 15)) {
    throw failure('E_NODE_VERSION', `Node.js 24.15.0 이상이 필요합니다: ${process.versions.node}`);
  }
}

function configureConnection(db, readOnly) {
  db.exec('PRAGMA foreign_keys=ON');
  if (db.prepare('PRAGMA foreign_keys').get().foreign_keys !== 1) {
    throw failure('E_DB_FOREIGN_KEYS', '연결에서 외래 키 검사를 활성화하지 못했습니다.');
  }
  if (readOnly) {
    db.exec('PRAGMA query_only=ON');
  } else {
    const { journal_mode } = db.prepare('PRAGMA journal_mode=DELETE').get();
    if (journal_mode !== 'delete') throw failure('E_DB_JOURNAL', 'DELETE 저널 모드가 필요합니다.');
  }
}

function assertIdentity(db) {
  const { user_version } = db.prepare('PRAGMA user_version').get();
  if (user_version !== SCHEMA_VERSION) {
    throw failure('E_SCHEMA_VERSION', `지원하지 않는 스키마 버전입니다: ${user_version}`);
  }
  const { application_id } = db.prepare('PRAGMA application_id').get();
  if (application_id !== APPLICATION_ID) {
    throw failure('E_APPLICATION_ID', `위키 인물 DB의 application_id가 아닙니다: ${application_id}`);
  }
}

/** Reserve a new file exclusively; existing bytes are never opened for writes. */
export function openWritableNew(dbPath) {
  requireRuntime();
  const path = resolve(dbPath);
  try {
    closeSync(openSync(path, 'wx'));
  } catch (cause) {
    if (cause.code === 'EEXIST') throw failure('E_OUTPUT_EXISTS', `이미 존재하는 출력입니다: ${path}`, cause);
    throw failure('E_DB_OPEN', `새 DB 경로를 만들 수 없습니다: ${path}`, cause);
  }
  let db;
  try {
    db = new DatabaseSync(path, { enableForeignKeyConstraints: true });
    configureConnection(db, false);
    return db;
  } catch (cause) {
    if (db?.isOpen) db.close();
    unlinkSync(path);
    throw failure('E_DB_OPEN', '새 DB 연결을 초기화하지 못했습니다.', cause);
  }
}

/** Open an existing compatible artifact without creating or changing it. */
export function openReadOnly(dbPath) {
  requireRuntime();
  let db;
  try {
    db = new DatabaseSync(resolve(dbPath), { readOnly: true, enableForeignKeyConstraints: true });
    configureConnection(db, true);
    assertIdentity(db);
    return db;
  } catch (cause) {
    if (db?.isOpen) db.close();
    if (typeof cause.code === 'string' && cause.code.startsWith('E_')) throw cause;
    const corrupt = cause.errcode === 11 || cause.errcode === 26 || /malformed|not a database/i.test(cause.message);
    throw failure(corrupt ? 'E_DB_INTEGRITY' : 'E_DB_OPEN', '읽기 전용 DB를 열지 못했습니다.', cause);
  }
}

/** Create the complete schema only in an empty, unversioned database. */
export function applySchema(db) {
  const version = db.prepare('PRAGMA user_version').get().user_version;
  const applicationId = db.prepare('PRAGMA application_id').get().application_id;
  const { count } = db.prepare("SELECT count(*) AS count FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%'").get();
  if (count !== 0 || version !== 0 || applicationId !== 0) {
    throw failure('E_SCHEMA_EXISTS', '기존 DB의 스키마 생성, 갱신 또는 마이그레이션은 허용하지 않습니다.');
  }
  const create = () => {
    for (const schemaPath of schemaPaths) db.exec(readFileSync(schemaPath, 'utf8'));
    db.exec(`PRAGMA application_id=${APPLICATION_ID}; PRAGMA user_version=${SCHEMA_VERSION}`);
  };
  if (db.isTransaction) create();
  else withTransaction(db, create);
}

/** Execute a synchronous callback atomically; nested/async transactions are rejected. */
export function withTransaction(db, fn) {
  if (db.isTransaction) throw failure('E_TRANSACTION_ACTIVE', '이미 열린 트랜잭션에 중첩할 수 없습니다.');
  if (typeof fn !== 'function') throw new TypeError('트랜잭션 callback은 함수여야 합니다.');
  if (fn.constructor?.name === 'AsyncFunction') {
    throw failure('E_TRANSACTION_ASYNC', 'DatabaseSync 트랜잭션 callback은 동기 함수여야 합니다.');
  }
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn(db);
    if (result !== null && (typeof result === 'object' || typeof result === 'function') && typeof result.then === 'function') {
      throw failure('E_TRANSACTION_ASYNC', '트랜잭션 callback은 Promise를 반환할 수 없습니다.');
    }
    db.exec('COMMIT');
    return result;
  } catch (cause) {
    if (db.isTransaction) db.exec('ROLLBACK');
    throw cause;
  }
}

export function runIntegrityChecks(db) {
  try {
    const integrity = db.prepare('PRAGMA integrity_check').all();
    const foreignKeys = db.prepare('PRAGMA foreign_key_check').all();
    if (integrity.length !== 1 || integrity[0].integrity_check !== 'ok' || foreignKeys.length !== 0) {
      const error = failure('E_DB_INTEGRITY', 'SQLite 무결성 또는 외래 키 검사에 실패했습니다.');
      error.details = { integrity, foreign_keys: foreignKeys };
      throw error;
    }
    return { integrity_check: 'ok', foreign_key_violations: 0 };
  } catch (cause) {
    if (cause.code === 'E_DB_INTEGRITY') throw cause;
    throw failure('E_DB_INTEGRITY', 'SQLite 무결성 검사를 실행하지 못했습니다.', cause);
  }
}
