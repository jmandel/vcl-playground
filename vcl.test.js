// VCL test suite — run with: bun test vcl.test.js
import { test, expect, describe } from 'bun:test';
import { readFileSync } from 'fs';
import { parseVCL, indexData, createEvaluator, astToCompose, prettyAST } from './vcl.js';

// Load data
const data = JSON.parse(readFileSync(new URL('./rxnorm-subset.json', import.meta.url), 'utf-8'));
const examples = JSON.parse(readFileSync(new URL('./examples.json', import.meta.url), 'utf-8'));
const DB = indexData(data);
const evaluate = createEvaluator(DB);
const system = data.system;

// Every named example must parse, return >0 results, and produce clean compose JSON.
describe('all named examples', () => {
  for (const [name, ex] of Object.entries(examples)) {
    const { expr } = ex;

    test(`${name}: parses and returns results`, () => {
      const ast = parseVCL(expr);
      expect(ast).toBeDefined();
      const results = evaluate(ast);
      expect(results.size).toBeGreaterThan(0);
    });

    test(`${name}: compose output has no [object Object]`, () => {
      const ast = parseVCL(expr);
      const compose = astToCompose(ast, system);
      const json = JSON.stringify(compose, null, 2);
      expect(json).not.toContain('[object Object]');
      expect(json).not.toContain('(complex)');
    });
  }
});

describe('compose output correctness', () => {
  test('single-hop "of" generates correct compose', () => {
    const ast = parseVCL('104906.has_tradename');
    const compose = astToCompose(ast, system);
    expect(compose.include).toHaveLength(1);
    expect(compose.include[0].filter).toHaveLength(1);
    expect(compose.include[0].filter[0]).toEqual({
      property: 'has_tradename',
      op: 'of',
      value: '104906',
    });
  });

  test('chained "of" generates nested compose value', () => {
    const ast = parseVCL('{104906.has_tradename}.has_ingredient');
    const compose = astToCompose(ast, system);
    expect(compose.include).toHaveLength(1);
    const filter = compose.include[0].filter[0];
    expect(filter.property).toBe('has_ingredient');
    expect(filter.op).toBe('of');
    expect(typeof filter.value).toBe('object');
    expect(filter.value.filter[0].property).toBe('has_tradename');
    expect(filter.value.filter[0].op).toBe('of');
    expect(filter.value.filter[0].value).toBe('104906');
  });

  test('"in" with filter list generates nested compose', () => {
    const ast = parseVCL('consists_of^{has_ingredient=161}');
    const compose = astToCompose(ast, system);
    const filter = compose.include[0].filter[0];
    expect(filter.property).toBe('consists_of');
    expect(filter.op).toBe('in');
    expect(typeof filter.value).toBe('object');
    expect(filter.value.filter[0].property).toBe('has_ingredient');
    expect(filter.value.filter[0].value).toBe('161');
  });

  test('exclusion generates include and exclude', () => {
    const ast = parseVCL('(has_ingredient=161)-(has_ingredient=5489)');
    const compose = astToCompose(ast, system);
    expect(compose.include).toHaveLength(1);
    expect(compose.exclude).toHaveLength(1);
    expect(compose.include[0].filter[0].value).toBe('161');
    expect(compose.exclude[0].filter[0].value).toBe('5489');
  });

  test('conjunction generates multiple filters in one include', () => {
    const ast = parseVCL('has_ingredient=161,has_dose_form=317541');
    const compose = astToCompose(ast, system);
    expect(compose.include).toHaveLength(1);
    expect(compose.include[0].filter).toHaveLength(2);
  });
});

describe('parse-only tests (no data dependency)', () => {
  const parseOnly = [
    '(http://www.nlm.nih.gov/research/umls/rxnorm)161',
    '(http://www.nlm.nih.gov/research/umls/rxnorm)has_ingredient=161',
    '^http://hl7.org/fhir/ValueSet/my-vs',
    'concept<<161',
    'concept>>104906',
  ];

  for (const expr of parseOnly) {
    test(`parses without error: ${expr}`, () => {
      const ast = parseVCL(expr);
      expect(ast).toBeDefined();
    });
  }
});
