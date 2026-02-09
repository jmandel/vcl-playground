import { parseVCL, astToComposeCollection } from './vcl.js';
import { hydrateExpressionSnippets } from './expression-catalog.ts';
import { VCL_GRAMMAR_SOURCE } from './generated/vcl-grammar-source.ts';

const DEFAULT_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';

hydrateExpressionSnippets(document);

const grammarEl = document.querySelector<HTMLElement>('[data-antlr-grammar]');
if (grammarEl) {
  grammarEl.textContent = VCL_GRAMMAR_SOURCE;
}

document.querySelectorAll<HTMLElement>('[data-vcl-compose]').forEach(el => {
  const expr = el.dataset.vclCompose!;
  const system = el.dataset.vclSystem || DEFAULT_SYSTEM;
  try {
    const ast = parseVCL(expr);
    const { valueSets } = astToComposeCollection(ast, system);

    if (valueSets.length === 1) {
      el.textContent = JSON.stringify(valueSets[0].compose, null, 2);
    } else {
      // Multi-VS: render top-level then dependencies
      const parts: string[] = [];
      for (const vs of valueSets) {
        if (vs.url !== null) {
          parts.push(`── ${vs.url} ──`);
        }
        parts.push(JSON.stringify(vs.compose, null, 2));
      }
      el.textContent = parts.join('\n\n');
    }
  } catch (e: any) {
    el.textContent = `Error: ${e.message}`;
  }
});
