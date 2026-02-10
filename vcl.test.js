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
    const ast = parseVCL('(104906.has_tradename).has_ingredient');
    const compose = astToCompose(ast, system);
    expect(compose.include).toHaveLength(1);
    const filter = compose.include[0].filter[0];
    expect(filter.property).toBe('has_ingredient');
    expect(filter.op).toBe('of');
    expect(typeof filter.value).toBe('string');
    expect(filter.value).toContain('http://fhir.org/VCL?v1=');
  });

  test('"in" with filter list generates URL string value (not nested object)', () => {
    const ast = parseVCL('consists_of^(has_ingredient=161)');
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

  test('conjunction preserves grouped source via valueSet dependency', () => {
    const ast = parseVCL('(204574;204574;204574),has_tradename?bool:true');
    const { valueSets } = astToComposeCollection(ast, system);

    const top = valueSets[0].compose.include[0];
    expect(top.filter).toHaveLength(2);
    const membership = top.filter.find((f) => f.property === 'concept' && f.op === 'in');
    expect(membership).toBeDefined();
    expect(membership.value).toContain('http://fhir.org/VCL?v1=');
    expect(top.filter).toContainEqual({ property: 'has_tradename', op: 'exists', value: 'true' });

    const dep = valueSets.find((vs) => vs.url === membership.value);
    expect(dep).toBeDefined();
    expect(dep.compose.include).toHaveLength(3);
    const depCodes = dep.compose.include.map((inc) => inc.concept?.[0]?.code);
    expect(depCodes).toEqual(['204574', '204574', '204574']);

    const json = JSON.stringify(valueSets);
    expect(json).not.toContain('(complex)');
  });

  test('conjunction with code + filter does not drop code term', () => {
    const ast = parseVCL('204574,has_tradename?bool:true');
    const { valueSets } = astToComposeCollection(ast, system);

    const top = valueSets[0].compose.include[0];
    expect(top.filter).toContainEqual({ property: 'concept', op: '=', value: '204574' });
    expect(top.filter).toContainEqual({ property: 'has_tradename', op: 'exists', value: 'true' });
    expect(valueSets).toHaveLength(1);
    expect(JSON.stringify(valueSets)).not.toContain('(complex)');
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
    const ast = parseVCL('(104906.has_tradename).has_ingredient');
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
    const ast = parseVCL('consists_of^(has_ingredient=161)');
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
    const ast = parseVCL('104906.has_tradename.has_ingredient');
    expect(astToVclText(ast)).toBe('104906.has_tradename.has_ingredient');
  });

  test('conjunction', () => {
    const ast = parseVCL('has_ingredient=161,has_dose_form=317541');
    expect(astToVclText(ast)).toBe('has_ingredient=161,has_dose_form=317541');
  });

  test('in with code list', () => {
    const ast = parseVCL('has_ingredient^(161;5640;1191)');
    expect(astToVclText(ast)).toBe('has_ingredient^(161;5640;1191)');
  });

  test('in with filter list', () => {
    const ast = parseVCL('consists_of^(has_ingredient=161)');
    expect(astToVclText(ast)).toBe('consists_of^(has_ingredient=161)');
  });

  test('star', () => {
    const ast = parseVCL('*');
    expect(astToVclText(ast)).toBe('*');
  });

  test('code list', () => {
    const ast = parseVCL('(161;5640)');
    expect(astToVclText(ast)).toBe('161;5640');
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

// Every data-example reference in the tutorial must point to a valid example in examples.json
describe('tutorial data-example references', () => {
  const tutorialHtml = readFileSync(new URL('./tutorial.html', import.meta.url), 'utf-8');
  const refs = [...tutorialHtml.matchAll(/data-example="([^"]+)"/g)].map(m => m[1]);

  test('found data-example references in tutorial', () => {
    expect(refs.length).toBeGreaterThan(0);
  });

  for (const name of refs) {
    test(`example "${name}" exists and returns >0 results`, () => {
      expect(examples[name]).toBeDefined();
      const ast = parseVCL(examples[name].expr);
      const results = evaluate(ast);
      expect(results.size).toBeGreaterThan(0);
    });
  }
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

describe('typed literal syntax', () => {
  test('code literals can be explicit with single quotes', () => {
    const ast = parseVCL("TTY='SCD'");
    expect(ast.type).toBe('filter');
    expect(ast.op).toBe('=');
    expect(ast.value).toEqual({ type: 'literal', kind: 'code', value: 'SCD' });
  });

  test('double quotes are string literals', () => {
    const ast = parseVCL('TTY="SCD"');
    expect(ast.type).toBe('filter');
    expect(ast.op).toBe('=');
    expect(ast.value).toEqual({ type: 'literal', kind: 'string', value: 'SCD' });
  });

  test('number/date/boolean typed literals parse', () => {
    expect(parseVCL('rank=num:42').value).toEqual({ type: 'literal', kind: 'number', value: 42 });
    expect(parseVCL('effective_date=date:2026-02-09').value).toEqual({ type: 'literal', kind: 'date', value: '2026-02-09' });
    expect(parseVCL('has_tradename?bool:true').value).toEqual({ type: 'literal', kind: 'boolean', value: true });
  });

  test('exists requires explicit boolean literal', () => {
    expect(() => parseVCL('has_tradename?true')).toThrow();
    expect(() => parseVCL('has_tradename?false')).toThrow();
  });

  test('typed literals serialize and map to compose filter strings', () => {
    const boolAst = parseVCL('has_tradename?bool:true');
    expect(astToVclText(boolAst)).toBe('has_tradename?bool:true');
    const boolCompose = astToCompose(boolAst, system);
    expect(boolCompose.include[0].filter[0]).toEqual({ property: 'has_tradename', op: 'exists', value: 'true' });

    const numberAst = parseVCL('rank=num:42');
    expect(astToVclText(numberAst)).toBe('rank=num:42');
    const numberCompose = astToCompose(numberAst, system);
    expect(numberCompose.include[0].filter[0]).toEqual({ property: 'rank', op: '=', value: '42' });

    const dateAst = parseVCL('effective_date=date:2026-02-09');
    expect(astToVclText(dateAst)).toBe('effective_date=date:2026-02-09');
    const dateCompose = astToCompose(dateAst, system);
    expect(dateCompose.include[0].filter[0]).toEqual({ property: 'effective_date', op: '=', value: '2026-02-09' });
  });
});

describe('set syntax', () => {
  test('rejects square-bracket set syntax in in operator', () => {
    expect(() => parseVCL('has_ingredient^[161;5640]')).toThrow();
  });

  test('rejects square-bracket standalone set syntax', () => {
    expect(() => parseVCL('[161;5640]')).toThrow();
  });

  test('rejects square-bracket property lhs syntax', () => {
    expect(() => parseVCL('[has_ingredient;tradename_of]=5640')).toThrow();
  });

  test('accepts parenthesized one-item set expression', () => {
    const ast = parseVCL('(161)');
    expect(ast).toBeDefined();
  });
});

describe('star hierarchy shorthand', () => {
  test('star hierarchy shorthand maps to concept hierarchy', () => {
    const shorthand = parseVCL('*<<369097');
    const explicit = parseVCL('concept<<369097');
    expect(astToVclText(shorthand)).toBe('concept<<369097');
    expect(astToCompose(shorthand, system)).toEqual(astToCompose(explicit, system));
    expect(evaluate(shorthand)).toEqual(evaluate(explicit));
  });

  test('grouped expressions are not valid property lhs', () => {
    expect(() => parseVCL('(has_ingredient;tradename_of)=5640')).toThrow();
    expect(() => parseVCL('(a;b)<<201')).toThrow();
  });
});

describe('dotted path semantics', () => {
  test('accepts bare multi-hop navigation without extra parentheses', () => {
    const ast = parseVCL('104906.has_tradename.has_ingredient');
    expect(astToVclText(ast)).toBe('104906.has_tradename.has_ingredient');
  });

  test('multi-hop navigation matches explicit parenthesized form', () => {
    const compact = evaluate(parseVCL('104906.has_tradename.has_ingredient'));
    const explicit = evaluate(parseVCL('(104906.has_tradename).has_ingredient'));
    expect(compact).toEqual(explicit);
  });

  test('dotted property filter lowers to nested membership semantics', () => {
    const dotted = parseVCL('consists_of.has_ingredient=161');
    const nested = parseVCL('consists_of^(has_ingredient=161)');
    expect(astToCompose(dotted, system)).toEqual(astToCompose(nested, system));
    expect(evaluate(dotted)).toEqual(evaluate(nested));
  });

  test('deep dotted property filters also lower to nested membership', () => {
    const dotted = parseVCL('tradename_of.has_ingredient.TTY=SCD');
    const nested = parseVCL('tradename_of^(has_ingredient^(TTY=SCD))');
    expect(astToCompose(dotted, system)).toEqual(astToCompose(nested, system));
    expect(evaluate(dotted)).toEqual(evaluate(nested));
  });

  test('star navigation cannot be used as a filter lhs', () => {
    expect(() => parseVCL('*.consists_of.has_ingredient=1191')).toThrow();
  });

  test('grouped expressions cannot be used as a filter lhs', () => {
    expect(() => parseVCL('(204574).consists_of.has_ingredient=1191')).toThrow();
  });
});

describe('regex built-in concept fields', () => {
  test('code regex applies to concept code identifiers', () => {
    const regexSet = evaluate(parseVCL('code/"^161$"'));
    const literalSet = evaluate(parseVCL('161'));
    expect(regexSet).toEqual(literalSet);
  });

  test('display regex applies to concept display text', () => {
    const result = evaluate(parseVCL('display/"acetaminophen"'));
    expect(result.size).toBeGreaterThan(0);
  });

  test('designation regex applies to designation labels', () => {
    const result = evaluate(parseVCL('designation/"[Ii]buprofen"'));
    expect(result.size).toBeGreaterThan(0);
  });

  test('designation equality can match exact designation text', () => {
    const sample = data.literals.find((l) => l.property === 'designation');
    expect(sample).toBeDefined();
    const expr = `designation=${JSON.stringify(sample.value)}`;
    const result = evaluate(parseVCL(expr));
    expect(result.has(sample.code)).toBeTrue();
  });

  test('designation search includes display values', () => {
    const result = evaluate(parseVCL('designation="ibuprofen"'));
    expect(result.has('5640')).toBeTrue();
  });

  test('designation regex search includes display values', () => {
    const result = evaluate(parseVCL('designation/"^ibuprofen$"'));
    expect(result.has('5640')).toBeTrue();
  });

  test('designation literals exclude exact display duplicates', () => {
    const displayByCode = new Map(data.concepts.map((c) => [c.code, c.display]));
    const duplicate = data.literals.find(
      (l) => l.property === 'designation' && displayByCode.get(l.code) === l.value
    );
    expect(duplicate).toBeUndefined();
  });

  test('designation literals are capped at 5 per concept', () => {
    const counts = new Map();
    for (const l of data.literals) {
      if (l.property !== 'designation') continue;
      counts.set(l.code, (counts.get(l.code) || 0) + 1);
    }
    const maxPerConcept = Math.max(0, ...counts.values());
    expect(maxPerConcept).toBeLessThanOrEqual(5);
  });
});

describe('concept hierarchy alias semantics', () => {
  test('concept is-a matches isa is-a in RxNorm prototype', () => {
    const conceptAst = parseVCL('concept<<369097');
    const isaAst = parseVCL('isa<<369097');
    expect(evaluate(conceptAst)).toEqual(evaluate(isaAst));
  });

  test('concept generalizes matches isa generalizes in RxNorm prototype', () => {
    const conceptAst = parseVCL('concept>>308291');
    const isaAst = parseVCL('isa>>308291');
    expect(evaluate(conceptAst)).toEqual(evaluate(isaAst));
  });

  test('custom terminology resolver can remap concept hierarchy property', () => {
    const evalCustom = createEvaluator(DB, {
      resolveTerminologyProfile: () => ({ conceptHierarchyProperty: 'tradename_of' }),
    });
    const conceptAst = parseVCL('concept<<5640');
    const remappedAst = parseVCL('tradename_of<<5640');
    expect(evalCustom(conceptAst)).toEqual(evalCustom(remappedAst));
  });

  test('unknown terminology does not assume isa hierarchy for concept', () => {
    const unknownSystemEvaluator = createEvaluator({ ...DB, system: 'http://example.org/codesystem' });
    const conceptAst = parseVCL('concept<<369097');
    const isaAst = parseVCL('isa<<369097');
    expect(unknownSystemEvaluator(conceptAst)).not.toEqual(unknownSystemEvaluator(isaAst));
    expect(unknownSystemEvaluator(conceptAst)).toEqual(new Set(['369097']));
  });
});

describe('system scoping round-trip', () => {
  test('astToVclText preserves scoped simple expression', () => {
    const expr = '(http://loinc.org)(SCALE_TYP=Doc)';
    const ast = parseVCL(expr);
    expect(astToVclText(ast)).toBe('(http://loinc.org)SCALE_TYP=Doc');
  });

  test('astToVclText preserves scoped grouped expression', () => {
    const expr = '(http://snomed.info/sct)(concept<<404684003;concept<<71388002)';
    const ast = parseVCL(expr);
    expect(astToVclText(ast)).toBe(expr);
  });
});

describe('ValueSet URI resolver integration', () => {
  function toVclUri(uri) {
    return uri.replace(/\(/g, '%28').replace(/\)/g, '%29');
  }

  function makeRxNormSubsetResolver() {
    let localEvaluate;
    const resolver = (uri) => {
      if (!uri.startsWith('http://fhir.org/VCL?v1=')) return null;
      const encoded = uri.slice('http://fhir.org/VCL?v1='.length);
      const decoded = decodeURIComponent(encoded);
      const m = decoded.match(/^\(([^)]+)\)\((.*)\)$/);
      if (!m) return null;
      const [, scopedSystem, scopedExpr] = m;
      if (scopedSystem !== system) return new Set();
      const ast = parseVCL(scopedExpr);
      return localEvaluate(ast);
    };
    localEvaluate = createEvaluator(DB, { resolveValueSet: resolver });
    return resolver;
  }

  test('includeVs resolves via resolver', () => {
    const resolver = makeRxNormSubsetResolver();
    const evalWithResolver = createEvaluator(DB, { resolveValueSet: resolver });
    const uri = toVclUri(vclUrl(system, parseVCL('161')));
    const results = evalWithResolver(parseVCL(`^${uri}`));
    expect(results.has('161')).toBeTrue();
    expect(results.size).toBe(1);
  });

  test('in/not-in with URI resolves via resolver', () => {
    const resolver = makeRxNormSubsetResolver();
    const evalWithResolver = createEvaluator(DB, { resolveValueSet: resolver });
    const uri = toVclUri(vclUrl(system, parseVCL('161')));

    const inResults = evalWithResolver(parseVCL(`has_ingredient^${uri}`));
    const eqResults = evaluate(parseVCL('has_ingredient=161'));
    expect(inResults).toEqual(eqResults);

    const notInResults = evalWithResolver(parseVCL(`has_ingredient~^${uri}`));
    const all = evaluate(parseVCL('*'));
    for (const code of inResults) expect(notInResults.has(code)).toBeFalse();
    expect(inResults.size + notInResults.size).toBe(all.size);
  });
});
