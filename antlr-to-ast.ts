import * as antlr from 'antlr4ng';
import { VCLLexer } from './antlr-generated/VCLLexer.ts';
import {
  VCLParser,
  type BooleanValueContext,
  type CodeLedContext,
  type CodeValueContext,
  type ConjunctionContext,
  type CoreContext,
  type DateValueContext,
  type DisjunctionContext,
  type ExclusionContext,
  type ExprContext,
  type FilterTailContext,
  type HierarchyOperatorContext,
  type IncludeVsContext,
  type NavTailContext,
  type NumberValueContext,
  type PrimaryContext,
  type ScalarValueContext,
  type StringValueContext
} from './antlr-generated/VCLParser.ts';

function parseError(input: string, msg: string): never {
  throw new Error(`ANTLR parse failed for "${input}": ${msg}`);
}

function unescapeQuoted(raw: string): string {
  if (raw.length < 2) return raw;
  const quote = raw[0];
  if ((quote !== '"' && quote !== '\'') || raw[raw.length - 1] !== quote) return raw;
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

function decodeCode(ctx: CodeValueContext | null, input: string): string {
  if (!ctx) parseError(input, 'Missing code value');
  const s = ctx.SCODE();
  if (s) return s.getText();
  const q = ctx.CODE_QUOTED();
  if (q) return unescapeQuoted(q.getText());
  parseError(input, 'Expected SCODE or CODE_QUOTED token');
}

function mapHierarchyOperator(ctx: HierarchyOperatorContext | null, input: string): string {
  const op = ctx?.getText();
  const map = {
    '<<': 'is-a',
    '~<<': 'is-not-a',
    '<': 'descendent-of',
    '>>': 'generalizes',
    '<!': 'child-of',
    '!!<': 'descendent-leaf',
  };
  if (!op || !map[op]) parseError(input, `Unknown operator ${op ?? '(missing)'}`);
  return map[op];
}

function decodeString(ctx: StringValueContext | null, input: string): string {
  if (!ctx) parseError(input, 'Missing string literal');
  return unescapeQuoted(ctx.STRING().getText());
}

function decodeNumber(ctx: NumberValueContext | null, input: string): number {
  if (!ctx) parseError(input, 'Missing number literal');
  const raw = ctx.NUMBER().getText();
  if (!raw.startsWith('num:')) parseError(input, 'Invalid number literal');
  return Number(raw.slice(4));
}

function decodeBoolean(ctx: BooleanValueContext | null, input: string): boolean {
  if (!ctx) parseError(input, 'Missing boolean literal');
  const raw = ctx.BOOLEAN().getText();
  if (!raw.startsWith('bool:')) parseError(input, 'Invalid boolean literal');
  return raw.slice(5) === 'true';
}

function decodeDate(ctx: DateValueContext | null, input: string): string {
  if (!ctx) parseError(input, 'Missing date literal');
  const raw = ctx.DATE().getText();
  if (!raw.startsWith('date:')) parseError(input, 'Invalid date literal');
  return raw.slice(5);
}

function mapScalarValue(ctx: ScalarValueContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing scalar value');
  const cv = ctx.codeValue();
  if (cv) return { type: 'literal', kind: 'code', value: decodeCode(cv, input) };
  const sv = ctx.stringValue();
  if (sv) return { type: 'literal', kind: 'string', value: decodeString(sv, input) };
  const nv = ctx.numberValue();
  if (nv) return { type: 'literal', kind: 'number', value: decodeNumber(nv, input) };
  const bv = ctx.booleanValue();
  if (bv) return { type: 'literal', kind: 'boolean', value: decodeBoolean(bv, input) };
  const dv = ctx.dateValue();
  if (dv) return { type: 'literal', kind: 'date', value: decodeDate(dv, input) };
  parseError(input, 'Unsupported scalar value');
}

function mapFilterTail(ctx: FilterTailContext | null, input: string): { op: string; value: any } {
  if (!ctx) parseError(input, 'Missing filter tail');

  if (ctx.EQ()) {
    return { op: '=', value: mapScalarValue(ctx.scalarValue(), input) };
  }

  if (ctx.hierarchyOperator()) {
    return { op: mapHierarchyOperator(ctx.hierarchyOperator(), input), value: decodeCode(ctx.codeValue(), input) };
  }

  if (ctx.REGEX()) {
    return { op: 'regex', value: decodeString(ctx.stringValue(), input) };
  }

  if (ctx.IN() || ctx.NOT_IN()) {
    const op = ctx.IN() ? 'in' : 'not-in';
    const uri = ctx.URI();
    if (uri) return { op, value: { type: 'vsRef', uri: uri.getText() } };
    const nested = ctx.expr();
    if (nested) return { op, value: mapExpr(nested, input) };
    parseError(input, `${op} operator requires URI or parenthesized expression`);
  }

  if (ctx.EXISTS()) {
    return { op: 'exists', value: { type: 'literal', kind: 'boolean', value: decodeBoolean(ctx.booleanValue(), input) } };
  }

  parseError(input, 'Unsupported filter tail');
}

function applyNavTail(base: any, nav: NavTailContext | null, input: string): any {
  if (!nav) return base;
  let out = base;
  for (const c of nav.codeValue()) {
    out = { type: 'of', value: out, property: decodeCode(c, input) };
  }
  return out;
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

function buildPathFilter(path: string[], terminal: { op: string; value: any }): any {
  return buildPathFilterFromTerminal(path, terminal.op, terminal.value);
}

function mapIncludeVs(ctx: IncludeVsContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing includeVs context');
  const uri = ctx.URI();
  if (!uri) parseError(input, 'Expected URI in includeVs');
  return { type: 'includeVs', uri: uri.getText() };
}

function mapCodeLed(ctx: CodeLedContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing code-led expression');
  const path = ctx.codeValue().map((c) => decodeCode(c, input));
  if (path.length === 0) parseError(input, 'Empty code-led expression');

  const tail = ctx.filterTail();
  if (!tail) {
    let node: any = { type: 'code', value: path[0] };
    for (let i = 1; i < path.length; i++) {
      node = { type: 'of', value: node, property: path[i] };
    }
    return node;
  }

  return buildPathFilter(path, mapFilterTail(tail, input));
}

function mapStarHierarchyShorthandFromHierarchy(opCtx: HierarchyOperatorContext | null, codeCtx: CodeValueContext | null, input: string): any {
  return { type: 'filter', property: 'concept', op: mapHierarchyOperator(opCtx, input), value: decodeCode(codeCtx, input) };
}

function mapCore(ctx: CoreContext | null, input: string): any {
  if (!ctx) parseError(input, 'Missing core expression');
  if (ctx.STAR()) {
    const nav = ctx.navTail();
    if (nav) return applyNavTail({ type: 'star' }, nav, input);
    if (ctx.hierarchyOperator()) return mapStarHierarchyShorthandFromHierarchy(ctx.hierarchyOperator(), ctx.codeValue(), input);
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
