import assert from 'node:assert/strict'
import test from 'node:test'

import { parseCanonJson } from './json-io.mjs'
import { checkSchema } from './schema-subset.mjs'

const codeOf = (fn) => { try { fn() } catch (error) { return error } return null }

test('parseCanonJson rejects a duplicate key at any depth and names path and key', () => {
  const cases = [
    ['{"a":1,"a":2}', '$', 'a'],
    ['{"rows":[{"id":1},{"x":{"k":1,"k":2}}]}', '$.rows[1].x', 'k'],
    ['{"a":1,"\\u0061":2}', '$', 'a'],
  ]
  for (const [text, path, key] of cases) {
    const error = codeOf(() => parseCanonJson(text, 'f.json'))
    assert.equal(error?.code, 'E_DUPLICATE_JSON_KEY', text)
    assert.ok(error.message.includes(`${path} key "${key}"`), error.message)
  }
})

test('parseCanonJson accepts repeated keys across sibling objects and inside strings', () => {
  assert.deepEqual(parseCanonJson('{"a":[{"k":1},{"k":2}],"s":"\\"k\\":1,\\"k\\":2","b":{"k":1}}', 'f'), {
    a: [{ k: 1 }, { k: 2 }], s: '"k":1,"k":2', b: { k: 1 },
  })
})

test('parseCanonJson reports malformed JSON with E_JSON_MALFORMED', () => {
  assert.equal(codeOf(() => parseCanonJson('{ nope', 'f'))?.code, 'E_JSON_MALFORMED')
})

test('checkSchema enforces supported keywords and refuses unknown ones', () => {
  const schema = { type: 'object', required: ['a'], properties: { a: { type: 'integer', minimum: 1 } }, additionalProperties: false }
  assert.equal(checkSchema(schema, schema, { a: 1 }), null)
  assert.match(checkSchema(schema, schema, { a: 0 }), /below 1/)
  assert.match(checkSchema(schema, schema, {}), /missing a/)
  assert.match(checkSchema(schema, schema, { a: 1, b: 2 }), /unexpected b/)
  assert.equal(codeOf(() => checkSchema({}, { format: 'uri' }, 'x'))?.code, 'E_SCHEMA_UNSUPPORTED')
})

const PROTOTYPE_KEYS = ['toString', 'constructor', 'valueOf', 'hasOwnProperty', '__proto__']

test('checkSchema rejects prototype-named extra properties, top level and nested', () => {
  const schema = {
    type: 'object',
    properties: { a: { type: 'integer' }, n: { type: 'object', properties: { b: { type: 'integer' } }, additionalProperties: false } },
    additionalProperties: false,
  }
  for (const key of PROTOTYPE_KEYS) {
    assert.match(checkSchema(schema, schema, JSON.parse(`{"a":1,"${key}":1}`)), /unexpected/, key)
    assert.match(checkSchema(schema, schema, JSON.parse(`{"a":1,"n":{"b":1,"${key}":1}}`)), /unexpected/, key)
  }
})

test('checkSchema does not let inherited members satisfy required or properties', () => {
  const required = { type: 'object', required: ['toString'] }
  assert.match(checkSchema(required, required, {}), /missing toString/)
  const props = { type: 'object', properties: { toString: { type: 'integer' } } }
  assert.equal(checkSchema(props, props, {}), null)
  assert.match(checkSchema(props, props, JSON.parse('{"toString":"x"}')), /expected integer/)
})
