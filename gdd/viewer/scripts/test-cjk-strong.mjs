import assert from 'node:assert/strict'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { remarkCjkStrong } from '../src/remarkCjkStrong.ts'

const render = (markdown, plugins = [remarkGfm, remarkCjkStrong]) => renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: plugins }, markdown))

test('renders punctuation-ended bold before Korean particles', () => {
  const markdown = '**X(CK3)**와 **Y(Norland)**로';
  const html = render(markdown)
  assert.equal(html, '<p><strong>X(CK3)</strong>와 <strong>Y(Norland)</strong>로</p>')
})

test('keeps normal sentence-end bold unchanged', () => {
  const markdown = '**x**.'
  const html = render(markdown)
  assert.equal(html, render(markdown, [remarkGfm]))
})

test('does not transform fenced or inline code', () => {
  const markdown = '`**X(CK3)**와`\n\n```\n**X(CK3)**와\n```'
  const html = render(markdown)
  assert.equal(html, render(markdown, [remarkGfm]))
})

test('keeps escaped asterisks and single asterisks literal', () => {
  const markdown = String.raw`\*\*X(CK3)\*\*와 * and **Y(CK3)**로`
  const html = render(markdown)
  assert.equal(html, '<p>**X(CK3)**와 * and <strong>Y(CK3)</strong>로</p>')
})

test('keeps existing table-cell bold unchanged', () => {
  const markdown = '| name |\n| --- |\n| **X(CK3)** |'
  const html = render(markdown)
  assert.equal(html, render(markdown, [remarkGfm]))
  assert.ok(html.includes('<strong>X(CK3)</strong>'))
})

test('does not reinterpret entity-encoded delimiters', () => {
  const markdown = '&#42;&#42;X(CK3)&#42;&#42;와'
  const html = render(markdown)
  assert.equal(html, render(markdown, [remarkGfm]))
})
