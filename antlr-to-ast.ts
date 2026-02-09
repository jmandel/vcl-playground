import * as antlr from 'antlr4ng';
import { VCLLexer } from './antlr-generated/VCLLexer.ts';
import {
  VCLParser,
  type CodeLedContext,
  type CodeValueContext,
  type ConjunctionContext,
  type CoreContext,
  type DisjunctionContext,
  type ExclusionContext,
  type ExprContext,
  type FilterValueContext,
  type HierarchyOperatorContext,
  type IncludeVsContext,
  type NavTailContext,
  type OperatorContext,
  type PrimaryContext
} from './antlr-generated/VCLParser.ts';

function parseError(input: string, msg: string): never {
  throw new Error(`ANTLR parse failed for "${input}": ${msg}`);
}

function unescapeQuoted(raw: string): string {
  if (raw.length < 2 || raw[0] !== '"' || raw[raw.length - 1] !== '"') return raw;
  let out = '';
  for (let i = 1; i < raw.length - 1; i++) {
    const ch = raw[i];
    if (ch === '\\' && i + 1 < raw.length - 1) {
      out += raw[i + 1];
      i++;
    } else {
      out += ch;
    }
  }
  return out;
}

function decodeCode(ctx: CodeValueContext | null, input: string): { value: string; quoted: boolean } {
  if (!ctx) parseError(input, 'Missing code value');
  const s = ctx.SCODE();
  if (s) return { value: s.getText(), quoted: false };
  const q = ctx.QUOTED();
  if (q) return { value: unescapeQuoted(q.getText()), quoted: true };
  parseError(input, 'Expected SCODE or QUOTED token');
}

function opFromCtx(ctx: OperatorContext | null, input: string): string {
  const op = ctx?.getText();
  const map = {
    '=': '=',
    '<<': 'is-a',
    '~<<': 'is-not-a',
    '<': 'descendent-of',
    '>>': 'generalizes',
    '<!': 'child-of',
    '!!<': 'descendent-leaf',
    '?': 'exists',
    '/': 'regex',
    '^': 'in',
    '~^': 'not-in'
  };
  if (!op || !map[op]) parseError(input, `Unknown operator ${op ?? '(missing)'}`);
  return map[op];
}

function mapFilterValue(ctx: FilterValueContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing filter value');
  const cv = ctx.codeValue();
  if (cv) {
    const { value, quoted } = decodeCode(cv, input);
    return { kind: 'code', value, quoted };
  }
  const uri = ctx.URI();
  if (uri) return { kind: 'uri', value: uri.getText() };
  const nested = ctx.expr();
  if (nested) return { kind: 'expr', value: mapExpr(nested, input) };
  parseError(input, 'Unsupported filter value');
}

function applyNavTail(base: any, nav: NavTailContext | null, input: string): any {
  if (!nav) return base;
  let out = base;
  for (const c of nav.codeValue()) {
    const { value } = decodeCode(c, input);
    out = { type: 'of', value: out, property: value };
  }
  return out;
}

function terminalFilterValue(op: string, fv: any, input: string): any {
  if (op === 'regex') {
    if (fv.kind !== 'code' || !fv.quoted) {
      parseError(input, 'Regex operator requires a quoted string value');
    }
    return fv.value;
  }
  if (op === 'in' || op === 'not-in') {
    if (fv.kind === 'uri') return { type: 'vsRef', uri: fv.value };
    if (fv.kind === 'expr') return fv.value;
    parseError(input, `${op} operator requires URI or parenthesized expression`);
  }
  if (fv.kind !== 'code') parseError(input, `${op} operator requires code-like value`);
  return fv.value;
}

function cloneFilterValue(value: any): any {
  if (value && typeof value === 'object') return JSON.parse(JSON.stringify(value));
  return value;
}

function buildPathFilterFromTerminal(path: string[], op: string, terminalValue: any): any {
  let node: any = {
    type: 'filter',
    property: path[path.length - 1],
    op,
    value: cloneFilterValue(terminalValue)
  };
  for (let i = path.length - 2; i >= 0; i--) {
    node = { type: 'filter', property: path[i], op: 'in', value: node };
  }
  return node;
}

function buildPathFilter(path: string[], op: string, fvCtx: FilterValueContext | null, input: string): any {
  const fv = mapFilterValue(fvCtx, input);
  return buildPathFilterFromTerminal(path, op, terminalFilterValue(op, fv, input));
}

function mapIncludeVs(ctx: IncludeVsContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing includeVs context');
  const uri = ctx.URI();
  if (!uri) parseError(input, 'Expected URI in includeVs');
  return { type: 'includeVs', uri: uri.getText() };
}

function mapCodeLed(ctx: CodeLedContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing code-led expression');
  const path = ctx.codeValue().map((c) => decodeCode(c, input).value);
  if (path.length === 0) parseError(input, 'Empty code-led expression');

  const opCtx = ctx.operator();
  if (!opCtx) {
    let node: any = { type: 'code', value: path[0] };
    for (let i = 1; i < path.length; i++) {
      node = { type: 'of', value: node, property: path[i] };
    }
    return node;
  }

  const op = opFromCtx(opCtx, input);
  return buildPathFilter(path, op, ctx.filterValue(), input);
}

function isHierarchyOp(op: string): boolean {
  return op === 'is-a' ||
    op === 'is-not-a' ||
    op === 'descendent-of' ||
    op === 'generalizes' ||
    op === 'child-of' ||
    op === 'descendent-leaf';
}

function mapStarHierarchyShorthandFromHierarchy(opCtx: HierarchyOperatorContext | null, fvCtx: FilterValueContext | null, input: string): any {
  const opText = opCtx?.getText();
  const map: Record<string, string> = {
    '<<': 'is-a',
    '~<<': 'is-not-a',
    '<': 'descendent-of',
    '>>': 'generalizes',
    '<!': 'child-of',
    '!!<': 'descendent-leaf'
  };
  if (!opText || !map[opText]) parseError(input, `Unknown hierarchy operator ${opText ?? '(missing)'}`);
  const op = map[opText];
  const terminal = terminalFilterValue(op, mapFilterValue(fvCtx, input), input);
  return { type: 'filter', property: 'concept', op, value: terminal };
}

function mapCore(ctx: CoreContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing core expression');
  if (ctx.STAR()) {
    const nav = ctx.navTail();
    if (nav) return applyNavTail({ type: 'star' }, nav, input);
    if (ctx.hierarchyOperator()) return mapStarHierarchyShorthandFromHierarchy(ctx.hierarchyOperator(), ctx.filterValue(), input);
    return { type: 'star' };
  }
  if (ctx.includeVs()) return mapIncludeVs(ctx.includeVs(), input);
  if (ctx.codeLed()) return mapCodeLed(ctx.codeLed(), input);
  if (ctx.expr()) {
    const grouped = mapExpr(ctx.expr(), input);
    return applyNavTail(grouped, ctx.navTail(), input);
  }
  parseError(input, 'Unsupported core expression');
}

function mapPrimary(ctx: PrimaryContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing primary expression');
  const node = mapCore(ctx.core(), input);
  const scoped = ctx.scoped();
  if (scoped) {
    const uri = scoped.URI()?.getText();
    if (!uri) parseError(input, 'Missing scoped system URI');
    node.systemUri = uri;
  }
  return node;
}

function mapExclusion(ctx: ExclusionContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing exclusion expression');
  const primaries = ctx.primary();
  if (primaries.length === 0) parseError(input, 'Empty exclusion expression');
  const first = mapPrimary(primaries[0], input);
  if (primaries.length === 1) return first;
  return { type: 'exclusion', include: first, exclude: mapPrimary(primaries[1], input) };
}

function mapConjunction(ctx: ConjunctionContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing conjunction expression');
  const exclusions = ctx.exclusion().map((c) => mapExclusion(c, input));
  return exclusions.length === 1 ? exclusions[0] : { type: 'conjunction', parts: exclusions };
}

function mapDisjunction(ctx: DisjunctionContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing disjunction expression');
  const conjunctions = ctx.conjunction().map((c) => mapConjunction(c, input));
  return conjunctions.length === 1 ? conjunctions[0] : { type: 'disjunction', parts: conjunctions };
}

function mapExpr(ctx: ExprContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing expression');
  return mapDisjunction(ctx.disjunction(), input);
}

function parseVCLWithAntlrToAst(input: string): any {
  const errors: string[] = [];
  const errorListener = {
    syntaxError(_r: unknown, _s: unknown, line: number, col: number, msg: string) {
      errors.push(`${line}:${col} ${msg}`);
    }
  };

  const inputStream = antlr.CharStream.fromString(input);
  const lexer = new VCLLexer(inputStream);
  lexer.removeErrorListeners();
  lexer.addErrorListener(errorListener as any);

  const tokens = new antlr.CommonTokenStream(lexer);
  const parser = new VCLParser(tokens);
  parser.removeErrorListeners();
  parser.addErrorListener(errorListener as any);
  parser.errorHandler = new antlr.BailErrorStrategy();
  parser.buildParseTrees = true;

  let tree;
  try {
    tree = parser.vcl();
  } catch (e: any) {
    const details = errors.length > 0 ? errors.join('; ') : e?.message || String(e);
    parseError(input, details);
  }

  if (errors.length > 0) parseError(input, errors.join('; '));
  return mapExpr(tree.expr(), input);
}

function parseWithAntlr(input: string): void {
  parseVCLWithAntlrToAst(input);
}

export { parseVCLWithAntlrToAst, parseWithAntlr };
