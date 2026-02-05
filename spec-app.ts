import { parseVCL, astToComposeCollection } from './vcl.js';

const DEFAULT_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';

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
