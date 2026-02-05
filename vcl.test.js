// VCL test suite — run with: bun test vcl.test.js
import { test, expect, describe } from 'bun:test';
import { readFileSync } from 'fs';
import { parseVCL, indexData, createEvaluator, astToCompose, astToComposeCollection, astToVclText, vclUrl, prettyAST } from './vcl.js';

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

    test(`${name}: compose collection has no [object Object]`, () => {
      const ast = parseVCL(expr);
      const { valueSets } = astToComposeCollection(ast, system);
      for (const vs of valueSets) {
        const json = JSON.stringify(vs.compose, null, 2);
        expect(json).not.toContain('[object Object]');
        expect(json).not.toContain('(complex)');
      }
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

  test('chained "of" generates URL string value (not nested object)', () => {
    const ast = parseVCL('{104906.has_tradename}.has_ingredient');
    const compose = astToCompose(ast, system);
    expect(compose.include).toHaveLength(1);
    const filter = compose.include[0].filter[0];
    expect(filter.property).toBe('has_ingredient');
    expect(filter.op).toBe('of');
    expect(typeof filter.value).toBe('string');
    expect(filter.value).toContain('http://fhir.org/VCL?v1=');
  });

  test('"in" with filter list generates URL string value (not nested object)', () => {
    const ast = parseVCL('consists_of^{has_ingredient=161}');
    const compose = astToCompose(ast, system);
    const filter = compose.include[0].filter[0];
    expect(filter.property).toBe('consists_of');
    expect(filter.op).toBe('in');
    expect(typeof filter.value).toBe('string');
    expect(filter.value).toContain('http://fhir.org/VCL?v1=');
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

describe('astToComposeCollection', () => {
  test('simple expression produces single ValueSet', () => {
    const ast = parseVCL('has_ingredient=161');
    const { valueSets } = astToComposeCollection(ast, system);
    expect(valueSets).toHaveLength(1);
    expect(valueSets[0].url).toBeNull();
    expect(valueSets[0].compose.include[0].filter[0].value).toBe('161');
  });

  test('chained of produces top-level + dependency ValueSet', () => {
    const ast = parseVCL('{104906.has_tradename}.has_ingredient');
    const { valueSets } = astToComposeCollection(ast, system);
    expect(valueSets.length).toBeGreaterThanOrEqual(2);
    // Top-level
    expect(valueSets[0].url).toBeNull();
    const topFilter = valueSets[0].compose.include[0].filter[0];
    expect(topFilter.property).toBe('has_ingredient');
    expect(topFilter.op).toBe('of');
    expect(topFilter.value).toContain('http://fhir.org/VCL?v1=');
    // Dependency
    expect(valueSets[1].url).toContain('http://fhir.org/VCL?v1=');
    expect(valueSets[1].url).toBe(topFilter.value);
    const depFilter = valueSets[1].compose.include[0].filter[0];
    expect(depFilter.property).toBe('has_tradename');
    expect(depFilter.op).toBe('of');
    expect(depFilter.value).toBe('104906');
  });

  test('in with filter list produces top-level + dependency ValueSet', () => {
    const ast = parseVCL('consists_of^{has_ingredient=161}');
    const { valueSets } = astToComposeCollection(ast, system);
    expect(valueSets.length).toBeGreaterThanOrEqual(2);
    expect(valueSets[0].url).toBeNull();
    const topFilter = valueSets[0].compose.include[0].filter[0];
    expect(topFilter.op).toBe('in');
    expect(topFilter.value).toBe(valueSets[1].url);
    const depFilter = valueSets[1].compose.include[0].filter[0];
    expect(depFilter.property).toBe('has_ingredient');
    expect(depFilter.op).toBe('=');
    expect(depFilter.value).toBe('161');
  });

  test('simple of does not produce dependencies', () => {
    const ast = parseVCL('104906.has_tradename');
    const { valueSets } = astToComposeCollection(ast, system);
    expect(valueSets).toHaveLength(1);
  });

  test('all filter values in collection are strings', () => {
    for (const [name, ex] of Object.entries(examples)) {
      const ast = parseVCL(ex.expr);
      const { valueSets } = astToComposeCollection(ast, system);
      for (const vs of valueSets) {
        const json = JSON.stringify(vs.compose);
        // Should never contain nested objects as filter values
        expect(json).not.toContain('[object Object]');
      }
    }
  });
});

describe('astToVclText', () => {
  test('simple code', () => {
    const ast = parseVCL('161');
    expect(astToVclText(ast)).toBe('161');
  });

  test('filter', () => {
    const ast = parseVCL('has_ingredient=161');
    expect(astToVclText(ast)).toBe('has_ingredient=161');
  });

  test('of', () => {
    const ast = parseVCL('104906.has_tradename');
    expect(astToVclText(ast)).toBe('104906.has_tradename');
  });

  test('chained of', () => {
    const ast = parseVCL('{104906.has_tradename}.has_ingredient');
    expect(astToVclText(ast)).toBe('{104906.has_tradename}.has_ingredient');
  });

  test('conjunction', () => {
    const ast = parseVCL('has_ingredient=161,has_dose_form=317541');
    expect(astToVclText(ast)).toBe('has_ingredient=161,has_dose_form=317541');
  });

  test('in with code list', () => {
    const ast = parseVCL('has_ingredient^{161,5640,1191}');
    expect(astToVclText(ast)).toBe('has_ingredient^{161,5640,1191}');
  });

  test('in with filter list', () => {
    const ast = parseVCL('consists_of^{has_ingredient=161}');
    expect(astToVclText(ast)).toBe('consists_of^{has_ingredient=161}');
  });

  test('star', () => {
    const ast = parseVCL('*');
    expect(astToVclText(ast)).toBe('*');
  });

  test('code list', () => {
    const ast = parseVCL('{161,5640}');
    expect(astToVclText(ast)).toBe('{161,5640}');
  });
});

describe('vclUrl', () => {
  test('generates correct URL format', () => {
    const ast = parseVCL('104906.has_tradename');
    const url = vclUrl(system, ast);
    expect(url).toStartWith('http://fhir.org/VCL?v1=');
    expect(url).toContain(encodeURIComponent('(' + system + ')'));
    expect(url).toContain(encodeURIComponent('(104906.has_tradename)'));
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
