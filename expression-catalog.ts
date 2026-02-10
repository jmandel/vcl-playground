import EXAMPLES from './examples.json';
import DOC_EXPRESSIONS from './doc-expressions.json';

type ExampleDef = { label: string; expr: string };
type ExpressionCatalog = Record<string, string>;

const catalog: ExpressionCatalog = {};

for (const [key, value] of Object.entries(EXAMPLES as Record<string, ExampleDef>)) {
  catalog[key] = value.expr;
}

for (const [key, expr] of Object.entries(DOC_EXPRESSIONS as Record<string, string>)) {
  if (catalog[key] && catalog[key] !== expr) {
    throw new Error(`Expression key conflict for '${key}'`);
  }
  catalog[key] = expr;
}

function expressionByKey(key: string): string {
  const expr = catalog[key];
  if (!expr) throw new Error(`Unknown expression key: ${key}`);
  return expr;
}

function hydrateExpressionSnippets(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-vcl-expr-key]').forEach((el) => {
    const key = el.dataset.vclExprKey;
    if (!key) return;
    try {
      el.textContent = expressionByKey(key);
    } catch (e: any) {
      el.textContent = `Error: ${e.message}`;
      el.style.color = 'red';
    }
  });

  root.querySelectorAll<HTMLElement>('[data-vcl-compose-key]').forEach((el) => {
    const key = el.dataset.vclComposeKey;
    if (!key) return;
    try {
      el.dataset.vclCompose = expressionByKey(key);
    } catch (e: any) {
      el.textContent = `Error: ${e.message}`;
      el.style.color = 'red';
    }
  });
}

export { catalog as expressionCatalog, expressionByKey, hydrateExpressionSnippets };
