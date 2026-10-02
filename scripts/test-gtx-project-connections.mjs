import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'

test('GTX projects preserve sourced branches separately from opening movement rights', async () => {
  const source = JSON.parse(await readFile(new URL('../lore/places/gtx-project-connections.json', import.meta.url), 'utf8'))
  const projects = new Map(source.projects.map((project) => [project.id, project]))
  assert.equal(projects.size, source.projects.length)
  for (const id of ['GTX-A', 'GTX-B', 'GTX-C', 'GTX-D', 'GTX-E', 'GTX-F', 'GTX-A-extension', 'GTX-B-extension', 'GTX-C-extension']) assert.ok(projects.has(id), id)
  for (const project of projects.values()) {
    assert.match(project.sourceUrl, /^https:\/\//u)
    assert.equal(project.surveyedTrackGeometry, false)
    assert.equal(project.opening2126Control, null)
    assert.equal(project.opening2126Passage, null)
    assert.ok(project.paths.every((path) => path.length >= 2 && path.every((name) => typeof name === 'string' && name.length > 0)))
  }
  assert.deepEqual(projects.get('GTX-C').paths[1], ['금정', '상록수'])
  assert.deepEqual(projects.get('GTX-A').pendingStations, ['창릉', '삼성'])
  const ring = projects.get('GTX-F').paths[0]
  assert.equal(ring[0], ring.at(-1))
  assert.equal(projects.get('GTX-B').status, 'under-construction')
  for (const id of ['GTX-D', 'GTX-E', 'GTX-F']) {
    assert.equal(projects.get(id).status, 'announced-proposal')
    assert.equal(projects.get(id).stationLocationsFinal, false)
  }
})
