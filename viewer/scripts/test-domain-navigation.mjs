import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { test } from 'vitest'
import { DomainDocumentLinks } from '../src/App.tsx'
import { manifestDocuments, isAppRoute, toPublicHref } from '../src/manifest.ts'

test('every domain document links all three registered document surfaces', () => {
  for (let index = 1; index <= 18; index++) {
    const number = String(index).padStart(2, '0')
    const ids = [`doc.Archify-D${number}`, `doc.Mechanism-D${number}`, `doc.mechanism-design-index-d${number}`]
    for (const documentId of ids) {
      const markup = renderToStaticMarkup(createElement(DomainDocumentLinks, { documentId }))
      assert.equal((markup.match(/<a /g) ?? []).length, 3)
      assert.equal((markup.match(/aria-current="page"/g) ?? []).length, 1)
      for (const id of ids) {
        const target = manifestDocuments.find((candidate) => candidate.id === id)
        assert.ok(target, id)
        assert.ok(isAppRoute(target.route), target.route)
        assert.ok(markup.includes(`href="${toPublicHref(target.route)}"`), target.route)
      }
    }
  }
})

test('unrelated documents do not acquire domain navigation', () => {
  assert.equal(renderToStaticMarkup(createElement(DomainDocumentLinks, { documentId: 'doc.Original-TRPG-Core' })), '')
})
