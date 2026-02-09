import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { parseVCL } from './vcl.js';
import { parseWithAntlr } from './antlr-to-ast.ts';
import { expressionCatalog } from './expression-catalog.ts';

const pages = [
  { name: 'index', html: readFileSync(new URL('./index.html', import.meta.url), 'utf-8') },
  { name: 'tutorial', html: readFileSync(new URL('./tutorial.html', import.meta.url), 'utf-8') }
];

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractAttr(attrs, name) {
  const m = attrs.match(new RegExp(`${name}="([^"]+)"`));
  return m ? m[1] : null;
}

describe('expression catalog integrity', () => {
  for (const [key, expr] of Object.entries(expressionCatalog)) {
    test(`catalog expression parses (hand parser): ${key}`, () => {
      expect(() => parseVCL(expr)).not.toThrow();
    });

    test(`catalog expression parses (ANTLR): ${key}`, () => {
      expect(() => parseWithAntlr(expr)).not.toThrow();
    });
  }
});

describe('docs expression sourcing', () => {
  for (const page of pages) {
    test(`${page.name}: data-vcl-expr-key values exist in catalog`, () => {
      const matches = [...page.html.matchAll(/data-vcl-expr-key="([^"]+)"/g)].map((m) => m[1]);
      for (const key of matches) expect(expressionCatalog[key]).toBeDefined();
    });

    test(`${page.name}: data-vcl-compose-key values exist in catalog`, () => {
      const matches = [...page.html.matchAll(/data-vcl-compose-key="([^"]+)"/g)].map((m) => m[1]);
      for (const key of matches) expect(expressionCatalog[key]).toBeDefined();
    });

    test(`${page.name}: no hardcoded parseable VCL in <pre><code> blocks`, () => {
      const blocks = [...page.html.matchAll(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g)];
      for (const [, attrs, raw] of blocks) {
        const hasExprKey = extractAttr(attrs, 'data-vcl-expr-key');
        const hasComposeKey = extractAttr(attrs, 'data-vcl-compose-key');
        const hasComposeLiteral = extractAttr(attrs, 'data-vcl-compose');
        if (hasExprKey || hasComposeKey || hasComposeLiteral) continue;

        const text = decodeEntities(raw).trim();
        if (!text) continue;

        let parsed = true;
        try {
          parseVCL(text);
        } catch {
          parsed = false;
        }

        expect(parsed).toBeFalse();
      }
    });
  }
});
