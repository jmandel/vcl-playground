# Proposal: VCL Syntax and Authoring Refresh (Compose-Compatible)

Status: Draft for review

## Summary

This proposal updates VCL syntax and authoring rules while preserving the core expectation that every valid expression is representable as FHIR `ValueSet.compose`.

Primary changes:

1. Add property-path comparisons (chained properties) such as `consists_of.has_ingredient=5640`.
2. Make value kinds explicit and unambiguous:
   - unquoted or single-quoted -> code
   - double-quoted -> string
   - explicit numeric and boolean literals
3. Support multi-line authoring form with canonical compact serialization for implicit ValueSet URIs.
4. Make logical separators consistent everywhere:
   - `,` = AND
   - `;` = OR
5. Use parenthesized set expressions uniformly:
   - `(...)` for code sets
   - `(...)` for nested expression groups

This proposal intentionally does **not** carry legacy compatibility requirements (greenfield assumption).

---

## Goals

1. Improve readability and expressiveness for real-world terminology queries.
2. Remove syntax ambiguities between code sets and nested filter groups.
3. Keep semantics consistent across contexts.
4. Preserve deterministic mapping to `ValueSet.compose`.
5. Support pleasant authoring in docs/editors while keeping URL form canonical.

## Non-Goals

1. Adding capabilities that cannot be lowered to `ValueSet.compose`.
2. Defining server execution semantics beyond compose-mappable meaning.
3. Backward compatibility with pre-refresh syntax.

---

## Problem Statement

Current pain points:

1. No direct syntax for chained property constraints as a single comparison target.
2. Weak visual distinction between codes and literal values.
3. Single-line grammar is hard to author for complex definitions.
4. Inconsistent interpretation of separators in different constructs creates cognitive overhead.

---

## Normative Changes

## 1) Property-Path Comparisons

### New syntax

A filter property may be a path:

- `propertyPath := code ('.' code)*`
- Example: `consists_of.has_ingredient=5640`

A path comparison supports all standard operators at the terminal comparison:

- `=`
- `<<`, `~<<`, `<`, `<!`, `>>`, `!!<`
- `^`, `~^`
- `/` (regex)
- `?` (exists)

### Semantics

`a.b OP x` is defined as syntactic sugar for nested membership:

- `a^(b OP x)`

Longer paths lower recursively:

- `a.b.c OP x` -> `a^(b^(c OP x))`

This guarantees a compose-compatible lowering using nested expressions (and dependency ValueSet URLs where needed).

### Examples

- `TTY=SCD,consists_of.has_ingredient=5640`
- `consists_of.has_ingredient<<5640`
- `consists_of.has_ingredient?bool:true`

### Example queries

1. Find clinical drugs whose ingredient is ibuprofen:

```vcl
TTY=SCD,consists_of.has_ingredient=5640
```

This avoids manually writing nested membership and reads like a direct path constraint.

2. Constrain path-terminal ingredient using subsumption:

```vcl
consists_of.has_ingredient<<5640
```

This applies `is-a` at the terminal path segment (`has_ingredient` target).

3. Test existence at the path terminal:

```vcl
consists_of.has_ingredient?bool:true
```

This allows existence checks on a chained property target.

---

## 2) Explicit Value Kinds

### Value categories

1. **Code value**
   - Unquoted token: `SBD`, `161`, `true`, `42`
   - Or single-quoted explicit code: `'J45.0'`, `'true'`, `'42'`
2. **String value**
   - Double-quoted: `"Oral Tablet"`
3. **Number value**
   - Prefix form: `num:42`, `num:-3.14`
4. **Boolean value**
   - Prefix form: `bool:true`, `bool:false`

### Important default

Bare `true` and bare `42` are **codes**, not boolean/number literals.

### Why this design

- Preserves existing code-centric terminology behavior.
- Avoids silent reinterpretation of common codes like `true`.
- Gives authors explicit, reviewable intent for non-code literals.

### Compose mapping note

`compose.filter.value` is commonly handled as textual in tooling. Therefore:

- `num:42` and `bool:true` can be lowered to canonical strings (`"42"`, `"true"`) for compose portability.
- Exact type round-trip from compose alone may be lossy without extensions.

### Open design point

Whether to preserve literal kind in compose using an extension on each filter (optional, non-blocking for this proposal).

### Example queries

The first query below is RxNorm-grounded. The numeric/boolean examples use a **synthetic demonstration vocabulary** with explicit property typing:

- `risk_score` (number)
- `is_covered` (boolean-like domain value)

1. Explicit string literal (not code):

```vcl
RXTERM_FORM="Oral Tablet"
```

The value is explicitly a string literal.

2. Explicit boolean literal:

```vcl
is_covered=bool:true
```

The value is explicitly boolean true.

3. Explicit numeric literal:

```vcl
risk_score=num:2
```

The value is explicitly numeric.

4. Bare token remains code:

```vcl
is_covered=true
```

`true` is interpreted as a code token unless prefixed with `bool:`.

---

## 3) Multi-line Authoring Form + Canonical Compact Form

### New rule

VCL source may include:

- Newlines
- Indentation
- Extra spaces/tabs

All insignificant whitespace is ignored by parser.

Optional comment support can be added (`# ...` line comments) if desired.

### Canonicalization

For implicit ValueSet URLs:

1. Parse authoring-form input to AST.
2. Serialize to canonical compact VCL text.
3. Percent-encode canonical compact text into `http://fhir.org/VCL?v1=...`.

This ensures stable URLs independent of formatting style.

### Example authoring form

```vcl
TTY=SBD,
tradename_of.has_dose_form=317541;
(
  TTY=SCD,
  consists_of.has_ingredient=5640
)
```

Canonical compact equivalent:

```vcl
TTY=SBD,tradename_of.has_dose_form=317541;(TTY=SCD,consists_of.has_ingredient=5640)
```

### Example queries

1. Multi-line authoring query:

```vcl
TTY=SBD,
tradename_of.has_dose_form=317541;
(
  TTY=SCD,
  consists_of.has_ingredient=5640
)
```

Authors can format for readability in docs and editors.

2. Equivalent canonical compact query for URI embedding:

```vcl
TTY=SBD,tradename_of.has_dose_form=317541;(TTY=SCD,consists_of.has_ingredient=5640)
```

Formatter emits this stable compact form before percent-encoding.

---

## 4) Consistent Logical Separators + Parenthesized Set Expressions

### Global operator meaning

- `,` means AND
- `;` means OR

This meaning is global and context-independent.

### Set expression syntax

- `(...)` = set expression container
- `;` = OR and `,` = AND globally, including inside nested expressions

### Examples

Code-set membership:

```vcl
has_ingredient^(161;5640;1191)
```

Nested expression membership:

```vcl
consists_of^(has_ingredient=161,TTY=SCDC)
```

Nested expression with OR:

```vcl
consists_of^(has_ingredient=161;has_ingredient=5640)
```

Mixed AND/OR with explicit grouping:

```vcl
TTY=SCD,(has_ingredient=161;has_ingredient=5640)
```

This means: SCD and (acetaminophen or ibuprofen).

### Example queries

1. Clear OR code set membership syntax:

```vcl
has_ingredient^(161;5640;1191)
```

`(...)` is a set expression and `;` always means OR.

2. Clear nested expression membership syntax:

```vcl
consists_of^(has_ingredient=161,TTY=SCDC)
```

`(...)` can hold nested expressions, and `,` always means AND.

3. OR inside nested expression:

```vcl
consists_of^(has_ingredient=161;has_ingredient=5640)
```

Semicolon remains OR in nested context too.

### Rationale

This removes the current cognitive trap where list separators can imply different semantics depending on context.

---

## Draft Grammar (ANTLR-Style)

Parser grammar:

```grammar
vcl            : expr EOF ;
expr           : disjunction ;
disjunction    : conjunction (SEMI conjunction)* ;
conjunction    : exclusion (COMMA exclusion)* ;
exclusion      : primary (DASH primary)? ;

primary        : scoped? (simple | OPEN expr CLOSE) ;
scoped         : OPEN URI CLOSE ;

simple         : STAR
               | includeVs
               | valueNav
               | filter
               | codeValue ;

includeVs      : IN URI ;

filter         : propertyPath operator filterValue ;
propertyPath   : codeValue (DOT codeValue)* ;

valueNav       : navSource DOT codeValue ;
navSource      : codeValue
               | STAR
               | OPEN expr CLOSE ;

operator       : EQ | IS_A | IS_NOT_A | DESC_OF | CHILD_OF
               | GENERALIZES | DESC_LEAF | IN | NOT_IN
               | REGEX | EXISTS ;

filterValue    : codeValue
               | stringValue
               | numberValue
               | booleanValue
               | OPEN expr CLOSE
               | URI ;

codeValue      : SCODE | SQUOTE_CODE ;
stringValue    : DQUOTE_STRING ;
numberValue    : NUM_PREFIX NUMBER ;
booleanValue   : BOOL_TRUE | BOOL_FALSE ;
```

Lexer tokens:

```grammar
DASH         : '-' ;
OPEN         : '(' ;
CLOSE        : ')' ;
SEMI         : ';' ;
COMMA        : ',' ;
DOT          : '.' ;
STAR         : '*' ;

IS_NOT_A     : '~<<' ;
DESC_LEAF    : '!!<' ;
NOT_IN       : '~^' ;
IS_A         : '<<' ;
GENERALIZES  : '>>' ;
CHILD_OF     : '<!' ;

EQ           : '=' ;
DESC_OF      : '<' ;
REGEX        : '/' ;
IN           : '^' ;
EXISTS       : '?' ;

NUM_PREFIX   : 'num:' ;
BOOL_TRUE    : 'bool:true' ;
BOOL_FALSE   : 'bool:false' ;

URI          : [a-zA-Z]+ ':' [a-zA-Z0-9?=:;&_%+\\-.@#$^!{}/]+ ;
SCODE        : [a-zA-Z0-9] [-_a-zA-Z0-9]* ;
SQUOTE_CODE  : '\'' (~['\\] | '\\' ['\\])* '\'' ;
DQUOTE_STRING: '"' (~["\\] | '\\' ["\\])* '"' ;
NUMBER       : '-'? [0-9]+ ('.' [0-9]+)? ;

WS           : [ \\t\\r\\n]+ -> skip ;
```

Notes:

1. `propertyPath` and `valueNav` are intentionally distinct constructs.
2. Parser disambiguation rule: if a dotted sequence is followed by a filter operator, parse as `propertyPath`.
3. A code set is written as a parenthesized expression with OR separators (for example, `(161;5640;1191)`).
4. Parser rules use token names only; literal symbols are defined in the lexer token section.

---

## Compose Lowering Model

All expressions lower to compose-safe constructs via these rules:

1. **Direct filters** map to standard `filter` entries.
2. **Path filters** lower to nested membership form (`a.b OP x` -> `a^(b OP x)`), then standard lowering.
3. **Nested expression operands** in `^`, `~^`, and complex `of` lower to dependency ValueSet URLs (`http://fhir.org/VCL?v1=...`) where needed.
4. **String/number/boolean literal kinds** lower to canonical textual `filter.value` unless typed extensions are adopted.

This preserves the "representable as `ValueSet.compose`" expectation.

---

## Query Cookbook

### 1) Property-path comparisons

```vcl
TTY=SCD,consists_of.has_ingredient=5640
```

Find SCD concepts whose component ingredient is ibuprofen.

```vcl
consists_of.has_ingredient<<5640
```

Apply subsumption at the terminal path segment.

### 2) Explicit value kinds

RxNorm-grounded string example:

```vcl
RXTERM_FORM="Oral Tablet"
```

String literal.

Synthetic demonstration vocabulary examples:

```vcl
is_covered=bool:true
```

Boolean literal.

```vcl
risk_score=num:2
```

Numeric literal.

```vcl
is_covered=true
```

Bare token as code (not boolean).

### 3) Multi-line form and compact canonical form

Authoring form:

```vcl
TTY=SBD,
tradename_of.has_dose_form=317541;
(
  TTY=SCD,
  consists_of.has_ingredient=5640
)
```

Canonical compact form:

```vcl
TTY=SBD,tradename_of.has_dose_form=317541;(TTY=SCD,consists_of.has_ingredient=5640)
```

### 4) Consistent separators + parenthesized set expressions

```vcl
has_ingredient^(161;5640;1191)
```

Set-expression OR membership (`(...)`, `;`).

```vcl
consists_of^(has_ingredient=161,TTY=SCDC)
```

Nested-expression AND (`(...)`, `,`).

```vcl
TTY=SCD,(has_ingredient=161;has_ingredient=5640)
```

Explicit OR grouping with global separator semantics.

---

## Open Questions for WG/Editors

1. Should typed literal kind be preserved in compose via a standard extension?
2. Should authoring-form comments be included in this same revision (`#` line comments), or deferred?
3. Should single-quoted explicit-code syntax be mandatory for non-SCODE codes, or is unquoted+quoted-code dual support sufficient?

---

## Suggested Acceptance Criteria

1. Grammar and parser tests cover path filters, typed literals, parenthesized set expressions, and multi-line whitespace handling.
2. Canonical formatter emits stable compact output.
3. Every new construct has deterministic lowering to compose.
4. Spec examples include both authoring form and canonical compact form.

---

## Draft PR Body (Reusable)

### What this PR proposes

This PR proposes a VCL syntax refresh that improves authoring clarity and expressiveness while preserving compose compatibility:

- Property-path comparisons (`a.b OP x`)
- Explicit value kinds (code/string/number/boolean)
- Multi-line authoring form + canonical compact serialization
- Consistent separators (`','` AND, `';'` OR)
- Uniform parenthesized set expressions (`(...)`)

### Why

- Reduces ambiguity and cognitive load
- Aligns syntax with how authors think about graph constraints
- Improves readability for complex expressions
- Retains the core "maps to `ValueSet.compose`" contract

### Notable design point

Typed literals are explicit in VCL, but compose round-trip typing may be lossy unless extension metadata is adopted. This remains an open design discussion item.
