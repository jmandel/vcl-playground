import { describe, test, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { parseVCL, astToVclText, astToCompose, indexData, createEvaluator } from './vcl.js';
import { parseVCLWithAntlrToAst } from './antlr-to-ast.ts';

const examples = JSON.parse(readFileSync(new URL('./examples.json', import.meta.url), 'utf-8'));
const data = JSON.parse(readFileSync(new URL('./rxnorm-subset.json', import.meta.url), 'utf-8'));
const DB = indexData(data);
const evaluate = createEvaluator(DB);
const system = data.system;

const validQueries = [
  ...new Set([
    ...Object.values(examples).map((x) => x.expr),
    '104906.has_tradename.has_ingredient',
    'consists_of.has_ingredient=161',
    'tradename_of.has_ingredient.TTY=SCD',
    '(http://www.nlm.nih.gov/research/umls/rxnorm)consists_of.has_ingredient=161',
    '(TTY=SCD,consists_of.has_ingredient=5640);(TTY=SBD,has_ingredient=5640)',
    '*.consists_of.has_ingredient',
    '(204574).consists_of.has_ingredient',
    '*<<369097'
  ])
];

const invalidQueries = [
  '[',
  'has_ingredient^[161;5640]',
  'has_ingredient=',
  '^',
  '[has_ingredient;tradename_of]=5640',
  '[consists_of.has_ingredient;has_ingredient]=1191',
  '*.consists_of.has_ingredient=1191,consists_of.has_ingredient=1886',
  '(204574).consists_of.has_ingredient=1191,consists_of.has_ingredient=1886',
  '104906..has_tradename',
  'consists_of^(has_ingredient=161',
  '(a;b)<<201'
];

describe('ANTLR conformance with hand parser', () => {
  for (const expr of validQueries) {
    test(`ANTLR mapping produces equivalent semantics: ${expr}`, () => {
      const handAst = parseVCL(expr);
      const antlrAst = parseVCLWithAntlrToAst(expr);

      expect(astToVclText(antlrAst)).toBe(astToVclText(handAst));
      expect(astToCompose(antlrAst, system)).toEqual(astToCompose(handAst, system));
      expect(evaluate(antlrAst)).toEqual(evaluate(handAst));
    });
  }

  for (const expr of invalidQueries) {
    test(`invalid query rejected by both parsers: ${expr}`, () => {
      expect(() => parseVCL(expr)).toThrow();
      expect(() => parseVCLWithAntlrToAst(expr)).toThrow();
    });
  }
});
