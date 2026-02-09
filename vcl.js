// VCL: ValueSet Compose Language — Parser, Evaluator, and Compose Generator
// This module can be used standalone (Node/Bun) or embedded in a browser page.
import { resolveTerminologyProfile } from './terminology-profile.js';

// ==================== TOKENIZER ====================
const TT = {
  DASH:'-', OPEN:'(', CLOSE:')', SEMI:';', COMMA:',', DOT:'.', STAR:'*',
  EQ:'=', IS_A:'<<', IS_NOT_A:'~<<', DESC_OF:'<', REGEX:'/', IN:'^', NOT_IN:'~^',
  GENERALIZES:'>>', CHILD_OF:'<!', DESC_LEAF:'!!<', EXISTS:'?',
  URI:'URI', SCODE:'SCODE', QUOTED:'QUOTED', EOF:'EOF'
};

class ParseError extends Error {
  constructor(msg, pos) { super(msg); this.pos = pos; }
}

function tokenize(input) {
  const tokens = [];
  let i = 0;
  while (i < input.length) {
    if (input[i] === ' ' || input[i] === '\t' || input[i] === '\n' || input[i] === '\r') { i++; continue; }

    const rest = input.substring(i);
    let m;

    // multi-char operators (longest match first)
    if (rest.startsWith('~<<')) { tokens.push({type: TT.IS_NOT_A, value: '~<<', pos: i}); i += 3; continue; }
    if (rest.startsWith('!!<')) { tokens.push({type: TT.DESC_LEAF, value: '!!<', pos: i}); i += 3; continue; }
    if (rest.startsWith('~^'))  { tokens.push({type: TT.NOT_IN, value: '~^', pos: i}); i += 2; continue; }
    if (rest.startsWith('<<'))  { tokens.push({type: TT.IS_A, value: '<<', pos: i}); i += 2; continue; }
    if (rest.startsWith('>>'))  { tokens.push({type: TT.GENERALIZES, value: '>>', pos: i}); i += 2; continue; }
    if (rest.startsWith('<!'))  { tokens.push({type: TT.CHILD_OF, value: '<!', pos: i}); i += 2; continue; }

    // single-char operators
    const singles = { '-': TT.DASH, '(': TT.OPEN, ')': TT.CLOSE,
      ';': TT.SEMI, ',': TT.COMMA, '.': TT.DOT, '*': TT.STAR, '=': TT.EQ,
      '<': TT.DESC_OF, '/': TT.REGEX, '^': TT.IN, '?': TT.EXISTS, '>': TT.GENERALIZES };
    if (singles[input[i]] && input[i] !== '>') {
      tokens.push({type: singles[input[i]], value: input[i], pos: i});
      i++; continue;
    }

    // Quoted value
    if (input[i] === '"') {
      let j = i + 1, val = '';
      while (j < input.length && input[j] !== '"') {
        if (input[j] === '\\' && j + 1 < input.length) { val += input[j+1]; j += 2; }
        else { val += input[j]; j++; }
      }
      if (j >= input.length) throw new ParseError('Unterminated string', i);
      tokens.push({type: TT.QUOTED, value: val, pos: i});
      i = j + 1; continue;
    }

    // URI
    m = rest.match(/^([a-zA-Z]+:[a-zA-Z0-9?=:;&_%+\-.@#$^!{}/]+)/);
    if (m && /[./]/.test(m[1].substring(m[1].indexOf(':') + 1))) {
      tokens.push({type: TT.URI, value: m[1], pos: i});
      i += m[1].length; continue;
    }

    // SCODE
    m = rest.match(/^([a-zA-Z0-9][-_a-zA-Z0-9]*)/);
    if (m) {
      tokens.push({type: TT.SCODE, value: m[1], pos: i});
      i += m[1].length; continue;
    }

    throw new ParseError(`Unexpected character: '${input[i]}'`, i);
  }
  tokens.push({type: TT.EOF, value: '', pos: i});
  return tokens;
}

// ==================== PARSER ====================
class Parser {
  constructor(tokens) { this.tokens = tokens; this.pos = 0; }
  peek() { return this.tokens[this.pos]; }
  advance() { return this.tokens[this.pos++]; }
  expect(type) {
    const t = this.peek();
    if (t.type !== type) throw new ParseError(`Expected ${type}, got ${t.type} '${t.value}'`, t.pos);
    return this.advance();
  }
  match(type) {
    if (this.peek().type === type) return this.advance();
    return null;
  }

  parse() {
    const ast = this.parseExpr();
    this.expect(TT.EOF);
    return ast;
  }

  parseExpr() {
    const first = this.parseSubExpr();
    const t = this.peek();
    if (t.type === TT.COMMA) {
      const parts = [first];
      while (this.match(TT.COMMA)) parts.push(this.parseSubExpr());
      return {type: 'conjunction', parts};
    }
    if (t.type === TT.SEMI) {
      const parts = [first];
      while (this.match(TT.SEMI)) parts.push(this.parseSubExpr());
      return {type: 'disjunction', parts};
    }
    if (t.type === TT.DASH) {
      this.advance();
      const excluded = this.parseSubExpr();
      return {type: 'exclusion', include: first, exclude: excluded};
    }
    return first;
  }

  parseSubExpr() {
    let systemUri = null;
    if (this.peek().type === TT.OPEN) {
      const saved = this.pos;
      this.advance();
      if (this.peek().type === TT.URI) {
        const uri = this.advance().value;
        if (this.peek().type === TT.CLOSE) {
          this.advance();
          const next = this.peek();
          if (next.type === TT.OPEN || next.type === TT.STAR || next.type === TT.SCODE ||
              next.type === TT.QUOTED || next.type === TT.IN ||
              this.isOperator(next.type)) {
            systemUri = uri;
          } else {
            this.pos = saved;
          }
        } else {
          this.pos = saved;
        }
      } else {
        this.pos = saved;
      }
    }

    if (this.peek().type === TT.OPEN) {
      this.advance();
      const inner = this.parseExpr();
      this.expect(TT.CLOSE);
      return this.parsePostfixForNavSource(inner, systemUri);
    }

    return this.parseSimpleExpr(systemUri);
  }

  isOperator(type) {
    return [TT.EQ, TT.IS_A, TT.IS_NOT_A, TT.DESC_OF, TT.REGEX, TT.IN, TT.NOT_IN,
            TT.GENERALIZES, TT.CHILD_OF, TT.DESC_LEAF, TT.EXISTS].includes(type);
  }

  parseSimpleExpr(systemUri) {
    const t = this.peek();

    if (t.type === TT.STAR) {
      this.advance();
      return this.parsePostfixForNavSource({type: 'star'}, systemUri);
    }

    if (t.type === TT.IN) {
      this.advance();
      if (this.peek().type === TT.URI) {
        return {type: 'includeVs', uri: this.advance().value, systemUri};
      }
      if (this.peek().type === TT.OPEN) {
        this.advance();
        const uri = this.expect(TT.URI).value;
        this.expect(TT.CLOSE);
        return {type: 'includeVs', uri, systemUri};
      }
      throw new ParseError('Expected URI after ^', t.pos);
    }
    if (t.type === TT.SCODE || t.type === TT.QUOTED) {
      return this.parseCodeLedExpr(systemUri);
    }

    throw new ParseError(`Unexpected token: ${t.type} '${t.value}'`, t.pos);
  }

  parseNavTail(node, systemUri) {
    let out = node;
    while (this.match(TT.DOT)) {
      const prop = this.parseCode();
      out = {type: 'of', value: out, property: prop};
    }
    if (systemUri) out.systemUri = systemUri;
    return out;
  }

  // For star/grouped navSource:
  // - nav only: navSource.p1.p2
  // - operators are not accepted after a grouped/star navigation chain
  parsePostfixForNavSource(navSource, systemUri) {
    const path = [];
    while (this.match(TT.DOT)) path.push(this.parseCode());

    let out;
    if (path.length === 0 && navSource.type === 'star' && this.isOperator(this.peek().type)) {
      if (!this.isHierarchyOperatorToken(this.peek().type)) {
        throw new ParseError('Star shorthand is only supported for hierarchy operators', this.peek().pos);
      }
      out = this.parseFilterRest('concept', null);
    } else if (path.length > 0) {
      out = navSource;
      for (const prop of path) out = {type: 'of', value: out, property: prop};
    } else {
      out = navSource;
    }

    if (systemUri) out.systemUri = systemUri;
    return out;
  }

  parseCodeLedExpr(systemUri) {
    const path = this.parsePropertyPath();

    if (this.isOperator(this.peek().type)) {
      return this.parsePathFilter(path, systemUri);
    }

    let node = {type: 'code', value: path[0]};
    for (let i = 1; i < path.length; i++) {
      node = {type: 'of', value: node, property: path[i]};
    }
    if (systemUri) node.systemUri = systemUri;
    return node;
  }

  // Dotted property-path sugar:
  //   a.b.c OP x  =>  a^(b^(c OP x))
  parsePathFilter(path, systemUri) {
    const terminal = this.parseFilterTail();
    return this.buildPathFilter(path, terminal, systemUri);
  }

  parsePropertyPath() {
    const path = [this.parseCode()];
    while (this.match(TT.DOT)) path.push(this.parseCode());
    return path;
  }

  cloneFilterValue(value) {
    if (value && typeof value === 'object') return JSON.parse(JSON.stringify(value));
    return value;
  }

  buildPathFilter(path, terminal, systemUri) {
    let node = {
      type: 'filter',
      property: path[path.length - 1],
      op: terminal.op,
      value: this.cloneFilterValue(terminal.value),
      systemUri: null
    };
    for (let i = path.length - 2; i >= 0; i--) {
      node = {type: 'filter', property: path[i], op: 'in', value: node};
    }
    if (systemUri) node.systemUri = systemUri;
    return node;
  }

  isHierarchyOperatorToken(type) {
    return [TT.IS_A, TT.IS_NOT_A, TT.DESC_OF, TT.GENERALIZES, TT.CHILD_OF, TT.DESC_LEAF].includes(type);
  }

  parseFilterRest(property, systemUri) {
    const terminal = this.parseFilterTail();
    return { type: 'filter', property, op: terminal.op, value: terminal.value, systemUri };
  }

  parseFilterTail() {
    const op = this.advance();
    const opType = op.type;

    if (opType === TT.EQ) return { op: '=', value: this.parseCode() };
    if (opType === TT.IS_A) return { op: 'is-a', value: this.parseCode() };
    if (opType === TT.IS_NOT_A) return { op: 'is-not-a', value: this.parseCode() };
    if (opType === TT.DESC_OF) return { op: 'descendent-of', value: this.parseCode() };
    if (opType === TT.GENERALIZES) return { op: 'generalizes', value: this.parseCode() };
    if (opType === TT.CHILD_OF) return { op: 'child-of', value: this.parseCode() };
    if (opType === TT.DESC_LEAF) return { op: 'descendent-leaf', value: this.parseCode() };
    if (opType === TT.EXISTS) return { op: 'exists', value: this.parseCode() };

    if (opType === TT.REGEX) return { op: 'regex', value: this.expect(TT.QUOTED).value };

    if (opType === TT.IN || opType === TT.NOT_IN) {
      const inOp = opType === TT.IN ? 'in' : 'not-in';
      const next = this.peek();
      if (next.type === TT.URI) return { op: inOp, value: {type: 'vsRef', uri: this.advance().value} };
      if (next.type === TT.OPEN) return { op: inOp, value: this.parseParenExpr() };
      throw new ParseError(`Expected (expression) or URI after ${op.value}`, op.pos);
    }

    throw new ParseError(`Unknown operator: ${op.value}`, op.pos);
  }

  parseParenExpr() {
    this.expect(TT.OPEN);
    const inner = this.parseExpr();
    this.expect(TT.CLOSE);
    return inner;
  }

  parseFilter() {
    const t = this.peek();
    if (t.type === TT.SCODE || t.type === TT.QUOTED) {
      const code = this.parseCode();
      if (this.isOperator(this.peek().type)) {
        return this.parseFilterRest(code, null);
      }
      if (this.peek().type === TT.DOT) {
        this.advance();
        const prop = this.parseCode();
        return {type: 'of', value: {type: 'code', value: code}, property: prop};
      }
      throw new ParseError(`Expected operator after '${code}'`, this.peek().pos);
    }
    throw new ParseError(`Expected filter, got ${t.type}`, t.pos);
  }

  parseCode() {
    const t = this.peek();
    if (t.type === TT.SCODE) return this.advance().value;
    if (t.type === TT.QUOTED) return this.advance().value;
    throw new ParseError(`Expected code, got ${t.type} '${t.value}'`, t.pos);
  }
}

function parseVCL(input) {
  const tokens = tokenize(input);
  const parser = new Parser(tokens);
  return parser.parse();
}

// ==================== DB INDEXING ====================
function indexData(d) {
  const byCode = new Map();
  for (const c of d.concepts) byCode.set(c.code, c);

  const edgesBySource = new Map();
  const edgesByTarget = new Map();
  for (const e of d.edges) {
    if (!edgesBySource.has(e.source)) edgesBySource.set(e.source, []);
    edgesBySource.get(e.source).push(e);
    if (!edgesByTarget.has(e.target)) edgesByTarget.set(e.target, []);
    edgesByTarget.get(e.target).push(e);
  }

  const literalsByCode = new Map();
  for (const l of d.literals) {
    if (!literalsByCode.has(l.code)) literalsByCode.set(l.code, []);
    literalsByCode.get(l.code).push(l);
  }

  const allCodes = new Set(d.concepts.map(c => c.code));

  return { byCode, edgesBySource, edgesByTarget, literalsByCode, allCodes, concepts: d.concepts, system: d.system || null };
}

// ==================== EVALUATOR ====================
function createEvaluator(DB, options) {
  options = options || {};
  const userResolver = typeof options.resolveValueSet === 'function' ? options.resolveValueSet : null;
  const terminologyResolver = typeof options.resolveTerminologyProfile === 'function' ?
    options.resolveTerminologyProfile : null;
  const terminologySystem = typeof options.terminologySystem === 'string' &&
    options.terminologySystem.length > 0 ? options.terminologySystem : DB.system;
  const terminologyProfile = resolveTerminologyProfile(terminologySystem, terminologyResolver);
  // Backward-compatible explicit override (kept local to evaluator config).
  const conceptHierarchyPropertyOverride = typeof options.conceptHierarchyProperty === 'string' &&
    options.conceptHierarchyProperty.length > 0 ? options.conceptHierarchyProperty : null;
  const conceptHierarchyProperty = conceptHierarchyPropertyOverride ||
    terminologyProfile.conceptHierarchyProperty || null;
  const resolvingUris = new Set();

  function decodeImplicitVclUri(uri) {
    const normalized = uri.replace(/%28/gi, '(').replace(/%29/gi, ')');
    let u;
    try {
      u = new URL(normalized);
    } catch (e) {
      return null;
    }
    if (u.origin + u.pathname !== 'http://fhir.org/VCL') return null;
    const v1 = u.searchParams.get('v1');
    if (!v1) return null;
    let decoded = v1;
    try { decoded = decodeURIComponent(v1); } catch (e) { /* already decoded */ }
    const m = decoded.match(/^\(([^)]+)\)\(([\s\S]*)\)$/);
    if (!m) return null;
    return { system: m[1], expr: m[2] };
  }

  function toSet(v) {
    if (v == null) return null;
    if (v instanceof Set) return v;
    if (Array.isArray(v)) return new Set(v);
    if (typeof v[Symbol.iterator] === 'function') return new Set(v);
    return null;
  }

  function defaultResolveValueSet(uri) {
    const decoded = decodeImplicitVclUri(uri);
    if (!decoded) return null;
    if (DB.system && decoded.system !== DB.system) return new Set();
    try {
      return evaluate(parseVCL(decoded.expr));
    } catch (e) {
      return new Set();
    }
  }

  function resolveValueSetCodes(uri) {
    if (resolvingUris.has(uri)) return new Set();
    resolvingUris.add(uri);
    try {
      const fromUser = toSet(userResolver ? userResolver(uri) : null);
      if (fromUser) return fromUser;
      const fromDefault = toSet(defaultResolveValueSet(uri));
      if (fromDefault) return fromDefault;
      return null;
    } finally {
      resolvingUris.delete(uri);
    }
  }

  function evaluate(ast) {
    if (ast && ast.systemUri && DB.system && ast.systemUri !== DB.system) {
      return new Set();
    }
    switch (ast.type) {
      case 'star':
        return new Set(DB.allCodes);

      case 'code': {
        const c = DB.byCode.get(ast.value);
        return c ? new Set([ast.value]) : new Set();
      }

      case 'codeList':
        return new Set(ast.codes.filter(c => DB.byCode.has(c)));

      case 'filter':
        return evalFilter(ast);

      case 'of':
        return evalOf(ast);

      case 'conjunction': {
        let result = null;
        for (const part of ast.parts) {
          const partResult = evaluate(part);
          if (result === null) result = partResult;
          else result = intersect(result, partResult);
        }
        return result || new Set();
      }

      case 'disjunction': {
        const result = new Set();
        for (const part of ast.parts) {
          for (const code of evaluate(part)) result.add(code);
        }
        return result;
      }

      case 'exclusion': {
        const include = evaluate(ast.include);
        const exclude = evaluate(ast.exclude);
        const result = new Set(include);
        for (const code of exclude) result.delete(code);
        return result;
      }

      case 'includeVs':
        return resolveValueSetCodes(ast.uri) || new Set();

      case 'filterList': {
        let result = null;
        for (const f of ast.filters) {
          const fResult = evaluate(f);
          if (result === null) result = fResult;
          else result = intersect(result, fResult);
        }
        return result || new Set();
      }

      default:
        return new Set();
    }
  }

  function evalFilter(ast) {
    const {property, op, value} = ast;
    const results = new Set();

    if (op === '=') {
      const targetValue = typeof value === 'object' ? value.value : value;
      for (const code of DB.allCodes) {
        const edges = DB.edgesBySource.get(code) || [];
        for (const e of edges) {
          if (e.property === property && e.target === targetValue) { results.add(code); break; }
        }
        if (results.has(code)) continue;
        const lits = DB.literalsByCode.get(code) || [];
        for (const l of lits) {
          if (l.property === property && l.value === targetValue) { results.add(code); break; }
        }
      }
      return results;
    }

    if (op === 'exists') {
      const val = typeof value === 'object' ? value.value || value : value;
      const wantExists = val === 'true' || val === true;
      for (const code of DB.allCodes) {
        const edges = DB.edgesBySource.get(code) || [];
        let found = edges.some(e => e.property === property);
        if (!found) {
          const lits = DB.literalsByCode.get(code) || [];
          found = lits.some(l => l.property === property);
        }
        if (found === wantExists) results.add(code);
      }
      return results;
    }

    if (op === 'regex') {
      let re;
      try { re = new RegExp(value); } catch(e) { return results; }
      for (const code of DB.allCodes) {
        if (property === 'code' || property === 'display') {
          const c = DB.byCode.get(code);
          const testVal = property === 'code' ? c.code : c.display;
          if (testVal && re.test(testVal)) results.add(code);
          continue;
        }
        const lits = DB.literalsByCode.get(code) || [];
        for (const l of lits) {
          if (l.property === property && re.test(l.value)) { results.add(code); break; }
        }
        const edges = DB.edgesBySource.get(code) || [];
        for (const e of edges) {
          if (e.property === property && re.test(e.target)) { results.add(code); break; }
        }
      }
      return results;
    }

    if (op === 'in' || op === 'not-in') {
      let matchSet;
      if (value.type === 'codeList') {
        matchSet = new Set(value.codes);
      } else if (value.type === 'vsRef') {
        matchSet = resolveValueSetCodes(value.uri);
        if (matchSet === null) return results;
      } else if (value && typeof value === 'object') {
        matchSet = evaluate(value);
      } else {
        return results;
      }

      for (const code of DB.allCodes) {
        const edges = DB.edgesBySource.get(code) || [];
        let found = false;
        for (const e of edges) {
          if (e.property === property && matchSet.has(e.target)) { found = true; break; }
        }
        if (!found) {
          const lits = DB.literalsByCode.get(code) || [];
          for (const l of lits) {
            if (l.property === property && matchSet.has(l.value)) { found = true; break; }
          }
        }
        if (op === 'in' ? found : !found) results.add(code);
      }
      return results;
    }

    // Hierarchy operators: walk property edges transitively
    if (op === 'is-a' || op === 'descendent-of' || op === 'child-of' ||
        op === 'is-not-a' || op === 'generalizes' || op === 'descendent-leaf') {
      const targetCode = typeof value === 'object' ? value.value : value;
      const hierarchyProperty = property === 'concept' ? conceptHierarchyProperty : property;

      if (op === 'generalizes') {
        // Ancestors of targetCode (plus self): codes reachable by following property edges from targetCode
        const ancestors = new Set();
        const queue = [targetCode];
        while (queue.length) {
          const cur = queue.pop();
          if (ancestors.has(cur)) continue;
          ancestors.add(cur);
          for (const e of (DB.edgesBySource.get(cur) || [])) {
            if (e.property === hierarchyProperty) queue.push(e.target);
          }
        }
        for (const code of ancestors) {
          if (DB.allCodes.has(code)) results.add(code);
        }
        return results;
      }

      // Descendants: codes whose property edge chain reaches targetCode
      // Build reverse index for this property
      const reverseEdges = new Map();
      for (const code of DB.allCodes) {
        for (const e of (DB.edgesBySource.get(code) || [])) {
          if (e.property === hierarchyProperty) {
            if (!reverseEdges.has(e.target)) reverseEdges.set(e.target, []);
            reverseEdges.get(e.target).push(code);
          }
        }
      }

      if (op === 'child-of') {
        // Direct children only
        for (const child of (reverseEdges.get(targetCode) || [])) results.add(child);
        return results;
      }

      // BFS for all descendants
      const descendants = new Set();
      const queue = [targetCode];
      while (queue.length) {
        const cur = queue.pop();
        for (const child of (reverseEdges.get(cur) || [])) {
          if (!descendants.has(child)) {
            descendants.add(child);
            queue.push(child);
          }
        }
      }

      if (op === 'is-a') {
        // Descendants + self
        if (DB.allCodes.has(targetCode)) results.add(targetCode);
        for (const d of descendants) results.add(d);
      } else if (op === 'descendent-of') {
        // Strict descendants only
        for (const d of descendants) results.add(d);
      } else if (op === 'is-not-a') {
        // Everything NOT in is-a
        for (const code of DB.allCodes) {
          if (code !== targetCode && !descendants.has(code)) results.add(code);
        }
      } else if (op === 'descendent-leaf') {
        // Descendants with no children of their own
        for (const d of descendants) {
          if (!reverseEdges.has(d) || reverseEdges.get(d).length === 0) results.add(d);
        }
      }
      return results;
    }

    return results;
  }

  function evalOf(ast) {
    const valueCodes = evaluate(ast.value);
    const results = new Set();
    const prop = ast.property;

    for (const code of valueCodes) {
      const edges = DB.edgesBySource.get(code) || [];
      for (const e of edges) {
        if (e.property === prop) results.add(e.target);
      }
    }
    return results;
  }

  function intersect(a, b) {
    const result = new Set();
    for (const x of a) { if (b.has(x)) result.add(x); }
    return result;
  }

  return evaluate;
}

// ==================== AST TO VCL TEXT ====================
function astToVclText(node) {
  function withSystem(n, text, grouped) {
    if (!n || !n.systemUri) return text;
    return grouped ? `(${n.systemUri})(${text})` : `(${n.systemUri})${text}`;
  }

  switch (node.type) {
    case 'code': return withSystem(node, node.value, false);
    case 'star': return withSystem(node, '*', false);
    case 'codeList': return withSystem(node, '(' + node.codes.join(';') + ')', false);
    case 'filter': {
      const opMap = {'=':'=', 'is-a':'<<', 'is-not-a':'~<<', 'descendent-of':'<',
        'generalizes':'>>', 'child-of':'<!', 'descendent-leaf':'!!<', 'exists':'?',
        'regex':'/', 'in':'^', 'not-in':'~^'};
      const opStr = opMap[node.op] || node.op;
      if (node.op === 'regex') return withSystem(node, node.property + '/"' + node.value + '"', false);
      if (node.op === 'in' || node.op === 'not-in') {
        if (node.value && node.value.type === 'vsRef') return withSystem(node, node.property + opStr + node.value.uri, false);
        if (node.value && node.value.type === 'codeList') return withSystem(node, node.property + opStr + '(' + node.value.codes.join(';') + ')', false);
        return withSystem(node, node.property + opStr + '(' + astToVclText(node.value) + ')', false);
      }
      return withSystem(node, node.property + opStr + (typeof node.value === 'string' ? node.value : astToVclText(node.value)), false);
    }
    case 'filterList': return withSystem(node, '(' + node.filters.map(f => astToVclText(f)).join(',') + ')', false);
    case 'of': {
      const valText = astToVclText(node.value);
      // Wrap in parens if inner is complex; code/star/codeList are self-delimiting.
      const needsParens = node.value.type !== 'code' &&
        node.value.type !== 'star' &&
        node.value.type !== 'codeList' &&
        node.value.type !== 'of';
      return withSystem(node, (needsParens ? '(' + valText + ')' : valText) + '.' + node.property, false);
    }
    case 'conjunction': return withSystem(node, node.parts.map(p => astToVclText(p)).join(','), true);
    case 'disjunction': return withSystem(node, node.parts.map(p => astToVclText(p)).join(';'), true);
    case 'exclusion': return withSystem(node, '(' + astToVclText(node.include) + ')-(' + astToVclText(node.exclude) + ')', true);
    case 'includeVs': return withSystem(node, '^' + node.uri, false);
    default: return '(?)';
  }
}

function vclUrl(system, node) {
  const vclText = astToVclText(node);
  if (node && node.systemUri) {
    return 'http://fhir.org/VCL?v1=' + encodeURIComponent(vclText);
  }
  return 'http://fhir.org/VCL?v1=' + encodeURIComponent('(' + system + ')(' + vclText + ')');
}

// ==================== AST TO COMPOSE COLLECTION ====================
function astToComposeCollection(ast, system) {
  const valueSets = [];
  const deps = [];

  function isSimpleOfValue(node) {
    return node.type === 'code' || node.type === 'codeList' || node.type === 'star';
  }

  function filterValue(v, deps) {
    if (typeof v === 'string') return v;
    if (v && v.type === 'codeList') return v.codes.join(',');
    if (v && v.type === 'code') return v.value;
    if (v && v.type === 'vsRef') return v.uri;
    // Complex nested value — emit as dependency VS and return URL
    const url = vclUrl(system, v);
    collectDependency(v, url, deps);
    return url;
  }

  function collectDependency(node, url, deps) {
    // Check if already collected
    if (deps.some(d => d.url === url)) return;
    // Recursively generate compose for this sub-expression
    const subResult = buildCompose(node, []);
    deps.push({ url, compose: subResult.compose });
    // Collect sub-dependencies too
    for (const subDep of subResult.subDeps) {
      if (!deps.some(d => d.url === subDep.url)) {
        deps.push(subDep);
      }
    }
  }

  function buildCompose(ast, subDeps) {
    const compose = { include: [], exclude: [] };

    function membershipFilterForNode(node, sys) {
      // In conjunctions, constrain membership in a computed set of concepts.
      // This preserves arbitrary sub-expressions without dropping structure.
      if (node.type === 'star') return null;
      if (node.type === 'code') {
        return { property: 'concept', op: '=', value: node.value };
      }
      if (node.type === 'includeVs') {
        return { property: 'concept', op: 'in', value: node.uri };
      }
      const nodeSys = node.systemUri || sys;
      const url = vclUrl(nodeSys, node);
      collectDependency(node, url, subDeps);
      return { property: 'concept', op: 'in', value: url };
    }

    function addFilters(node, target) {
      const sys = node.systemUri || system;
      if (node.type === 'filter') {
        const f = { property: node.property, op: node.op, value: filterValue(node.value, subDeps) };
        target.push({ system: sys, filter: [f] });
      } else if (node.type === 'conjunction') {
        const filters = [];
        for (const p of node.parts) {
          if (p.type === 'filter') {
            filters.push({ property: p.property, op: p.op, value: filterValue(p.value, subDeps) });
          } else if (p.type === 'of') {
            if (isSimpleOfValue(p.value)) {
              const v = p.value.type === 'code' ? p.value.value :
                        p.value.type === 'codeList' ? p.value.codes.join(',') : '*';
              filters.push({ property: p.property, op: 'of', value: v });
            } else {
              const url = vclUrl(sys, p.value);
              collectDependency(p.value, url, subDeps);
              filters.push({ property: p.property, op: 'of', value: url });
            }
          } else {
            const membership = membershipFilterForNode(p, sys);
            if (membership) filters.push(membership);
          }
        }
        target.push({ system: sys, filter: filters });
      } else if (node.type === 'disjunction') {
        for (const p of node.parts) addFilters(p, target);
      } else if (node.type === 'code') {
        target.push({ system: sys, concept: [{ code: node.value }] });
      } else if (node.type === 'codeList') {
        target.push({ system: sys, concept: node.codes.map(c => ({ code: c })) });
      } else if (node.type === 'star') {
        target.push({ system: sys });
      } else if (node.type === 'of') {
        const f = { property: node.property, op: 'of' };
        if (isSimpleOfValue(node.value)) {
          f.value = node.value.type === 'code' ? node.value.value :
                    node.value.type === 'codeList' ? node.value.codes.join(',') : '*';
        } else {
          const url = vclUrl(sys, node.value);
          collectDependency(node.value, url, subDeps);
          f.value = url;
        }
        target.push({ system: sys, filter: [f] });
      } else if (node.type === 'includeVs') {
        target.push({ valueSet: [node.uri] });
      } else if (node.type === 'filterList') {
        // A filterList at top level: treat like conjunction of its filters
        const filters = [];
        for (const f of node.filters) {
          if (f.type === 'filter') {
            filters.push({ property: f.property, op: f.op, value: filterValue(f.value, subDeps) });
          } else if (f.type === 'of') {
            if (isSimpleOfValue(f.value)) {
              const v = f.value.type === 'code' ? f.value.value :
                        f.value.type === 'codeList' ? f.value.codes.join(',') : '*';
              filters.push({ property: f.property, op: 'of', value: v });
            } else {
              const url = vclUrl(sys, f.value);
              collectDependency(f.value, url, subDeps);
              filters.push({ property: f.property, op: 'of', value: url });
            }
          }
        }
        if (filters.length > 0) target.push({ system: sys, filter: filters });
      } else {
        target.push({ system: sys, _note: `Unsupported: ${node.type}` });
      }
    }

    if (ast.type === 'exclusion') {
      addFilters(ast.include, compose.include);
      addFilters(ast.exclude, compose.exclude);
    } else {
      addFilters(ast, compose.include);
    }

    if (compose.exclude.length === 0) delete compose.exclude;
    return { compose, subDeps };
  }

  const topResult = buildCompose(ast, deps);
  valueSets.push({ url: null, compose: topResult.compose });
  for (const dep of deps) {
    valueSets.push({ url: dep.url, compose: dep.compose });
  }
  return { valueSets };
}

// ==================== AST TO COMPOSE (backward compat wrapper) ====================
function astToCompose(ast, system) {
  const { valueSets } = astToComposeCollection(ast, system);
  return valueSets[0].compose;
}

// ==================== AST PRETTY PRINTER ====================
function prettyAST(ast, indent) {
  indent = indent || 0;
  const pad = '  '.repeat(indent);
  if (!ast || typeof ast !== 'object') return pad + String(ast);
  switch (ast.type) {
    case 'star': return `${pad}Star: *${ast.systemUri ? ` [system: ${ast.systemUri}]` : ''}`;
    case 'code': return `${pad}Code: ${ast.value}${ast.systemUri ? ` [system: ${ast.systemUri}]` : ''}`;
    case 'codeList': return `${pad}CodeList: {${ast.codes.join(', ')}}`;
    case 'filter': return `${pad}Filter: ${ast.property} ${ast.op} ${typeof ast.value === 'object' ? JSON.stringify(ast.value) : ast.value}`;
    case 'filterList': {
      let s = `${pad}FilterList:\n`;
      for (const f of ast.filters) s += prettyAST(f, indent + 1) + '\n';
      return s;
    }
    case 'of': return `${pad}Of: .${ast.property}\n${prettyAST(ast.value, indent + 1)}`;
    case 'conjunction': return `${pad}AND:\n${ast.parts.map(p => prettyAST(p, indent + 1)).join('\n')}`;
    case 'disjunction': return `${pad}OR:\n${ast.parts.map(p => prettyAST(p, indent + 1)).join('\n')}`;
    case 'exclusion': return `${pad}EXCEPT:\n${pad}  include:\n${prettyAST(ast.include, indent + 2)}\n${pad}  exclude:\n${prettyAST(ast.exclude, indent + 2)}`;
    case 'includeVs': return `${pad}IncludeVS: ${ast.uri}`;
    default: return `${pad}${JSON.stringify(ast, null, 2)}`;
  }
}

// ==================== EXPORTS ====================
export { parseVCL, indexData, createEvaluator, astToCompose, astToComposeCollection, astToVclText, vclUrl, prettyAST, ParseError };
