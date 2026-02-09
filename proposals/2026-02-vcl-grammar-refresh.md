# Proposal: VCL Grammar Refresh (vs `main`)

Status: Draft for review

## Intent

This proposal introduces a focused set of VCL grammar updates relative to `main`, while keeping a complete mapping into `ValueSet.compose`.

Spec branch docs:

- Spec: https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/index.html
- Tutorial + playground: https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/tutorial.html

## New Capabilities

| Capability (vs `main`) | Spec docs | Playground examples |
|---|---|---|
| Parenthesized set operands for `in` / `not-in` (code sets and nested expressions) | [The "in" Operator](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/index.html#expr-in) | [Code-set membership](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/tutorial.html#example=in-code-list) · [Nested membership](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/tutorial.html#example=in-filter-list) |
| Full nested set expressions inside membership operands (including exclusion) | [Compose Mapping](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/index.html#compose-mapping) | [Nested exclusion example](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/tutorial.html#expr=consists_of%5E((has_ingredient%3D161)-(has_ingredient%3D5489))) |
| Dotted property-path comparisons on filter lhs (`a.b.c OP x`) | [The "in" Operator](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/index.html#expr-in) | [Dotted rewrite](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/tutorial.html#example=in-filter-list-dotted) · [Multi-hop property filter](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/tutorial.html#expr=tradename_of.has_ingredient.TTY%3DSCD) |
| Hierarchy shorthand on `*` (`*<<x`, `*<x`, `*>>x`, etc.) | [Operators](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/index.html#operators) | [Hierarchy shorthand](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/tutorial.html#example=star-concept-hierarchy) |
| Newline-friendly expanded form (whitespace does not change meaning) | [Formal Grammar](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/index.html#grammar) | [Multiline query](https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/tutorial.html#expr=TTY%3DSCD%2C%0Aconsists_of%5E(has_ingredient%3D5640)%2C%0Ahas_dose_form%3D317541) |

## Example Explained

Expression:

```vcl
consists_of^((has_ingredient=161)-(has_ingredient=5489))
```

Meaning:

- build set `A`: concepts with `has_ingredient=161`
- build set `B`: concepts with `has_ingredient=5489`
- use set difference `A-B` as the operand set for `consists_of^(...)`

How this maps to `ValueSet.compose`:

- convert inner expression `((has_ingredient=161)-(has_ingredient=5489))` into a dependency ValueSet
- reference that dependency URL from the outer `consists_of` `in` filter value

This preserves the exact nested set semantics while keeping emitted `compose` structures flat.

## Formal Grammar Source

The normative grammar text is published from the checked-in ANTLR source and rendered in the spec:

- https://joshuamandel.com/vcl-playground/branches/proposal-vcl-refresh/index.html#grammar
- source file: `grammar/VCL.g4`

## Implementation and Validation

- hand parser + evaluator: `vcl.js`
- ANTLR parse-tree mapping: `antlr-to-ast.ts`
- conformance tests: `antlr-conformance.test.js`
- grammar generation/check scripts: `scripts/update-antlr-generated.sh`, `scripts/check-antlr-generated.sh`
