import { parseVCL, indexData, createEvaluator, astToComposeCollection, prettyAST } from './vcl.js';
import RXNORM_DATA from './rxnorm-subset.json';
import EXAMPLES from './examples.json';

// ==================== DATA INDEX ====================
const DB = indexData(RXNORM_DATA);
const evaluate = createEvaluator(DB);
const system = RXNORM_DATA.system;

// ==================== EXAMPLES LOOKUP ====================
function exampleExpr(name: string): string {
  const ex = (EXAMPLES as Record<string, {label: string; expr: string}>)[name];
  if (!ex) throw new Error(`Unknown example: ${name}`);
  return ex.expr;
}

// ==================== UI ====================
const input = document.getElementById('playground-input') as HTMLInputElement;
const errorEl = document.getElementById('playground-error')!;
const infoEl = document.getElementById('playground-info')!;
const resultsBody = document.getElementById('results-body')!;
const resultsCount = document.getElementById('results-count')!;
const composeEl = document.getElementById('compose-json')!;
const treeEl = document.getElementById('parse-tree')!;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
input.addEventListener('input', () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runQuery, 150);
});

function tryVCL(expr: string) {
  input.value = expr;
  input.focus();
  runQuery();
  if (window.innerWidth < 1100) {
    document.getElementById('playground')!.scrollIntoView({behavior: 'smooth'});
  }
}

function tryExample(name: string) {
  tryVCL(exampleExpr(name));
}

function copyLink() {
  const expr = input.value.trim();
  if (!expr) return;
  const base = window.location.href.replace(/#.*$/, '').replace(/\?.*$/, '');
  const linkUrl = base + '#expr=' + encodeURIComponent(expr);
  const btn = document.getElementById('copy-link-btn')!;
  const showCopied = () => {
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share'; btn.classList.remove('copied'); }, 1500);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(linkUrl).then(showCopied).catch(() => {
      // Fallback for insecure contexts
      const ta = document.createElement('textarea');
      ta.value = linkUrl; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); showCopied();
    });
  } else {
    const ta = document.createElement('textarea');
    ta.value = linkUrl; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); showCopied();
  }
}

function runQuery() {
  const expr = input.value.trim();
  errorEl.textContent = '';
  infoEl.textContent = '';
  resultsBody.innerHTML = '';
  resultsCount.textContent = '';
  composeEl.textContent = '';
  treeEl.textContent = '';

  if (!expr) return;

  let ast: any, results: Set<string>;
  try {
    ast = parseVCL(expr);
  } catch (e: any) {
    errorEl.textContent = e.message + (e.pos !== undefined ? ` (at position ${e.pos})` : '');
    return;
  }

  try {
    results = evaluate(ast);
  } catch (e: any) {
    errorEl.textContent = 'Evaluation error: ' + e.message;
    return;
  }

  // Results table
  const sorted = [...results]
    .map(code => DB.byCode.get(code))
    .filter(Boolean)
    .sort((a: any, b: any) => {
      const ttyOrder = ['IN','PIN','DF','MIN','SCDC','SCDF','SCD','BN','SBDC','SBD'];
      const ai = ttyOrder.indexOf(a.tty), bi = ttyOrder.indexOf(b.tty);
      if (ai !== bi) return ai - bi;
      return a.display.localeCompare(b.display);
    });

  resultsCount.textContent = `${sorted.length} result${sorted.length !== 1 ? 's' : ''}`;
  const maxShow = 200;
  const showing = sorted.slice(0, maxShow);
  resultsBody.innerHTML = showing.map((c: any) => `
    <tr data-code="${esc(c.code)}">
      <td class="code-cell">${esc(c.code)}</td>
      <td>${esc(c.display)}</td>
      <td><span class="tty tty-${c.tty}">${c.tty}</span></td>
    </tr>
  `).join('');
  if (sorted.length > maxShow) {
    resultsBody.innerHTML += `<tr><td colspan="3" style="color:#94a3b8">...and ${sorted.length - maxShow} more</td></tr>`;
  }

  // Compose JSON — multi-ValueSet output
  try {
    const { valueSets } = astToComposeCollection(ast, system);
    composeEl.innerHTML = '';
    for (const vs of valueSets) {
      const header = document.createElement('div');
      header.style.cssText = 'font-weight:600;font-size:0.85em;color:#64748b;margin:0.75em 0 0.25em;padding:0.3em 0;border-bottom:1px solid #e2e8f0;';
      if (vs.url === null) {
        if (valueSets.length > 1) header.textContent = 'Top-level ValueSet';
        // Skip header for single VS
      } else {
        header.textContent = vs.url;
        header.style.wordBreak = 'break-all';
      }
      if (vs.url !== null || valueSets.length > 1) composeEl.appendChild(header);
      const pre = document.createElement('div');
      pre.style.cssText = 'white-space:pre;margin-bottom:0.5em;';
      pre.textContent = JSON.stringify(vs.compose, null, 2);
      composeEl.appendChild(pre);
    }
  } catch(e: any) {
    composeEl.textContent = 'Error generating compose: ' + e.message;
  }

  // Parse tree
  treeEl.textContent = prettyAST(ast);

  infoEl.textContent = `Parsed OK. Evaluated against ${DB.allCodes.size} concepts.`;
}

function showTab(name: string) {
  document.querySelectorAll('.pg-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.pg-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.pg-tab[onclick*="${name}"]`)!.classList.add('active');
  document.getElementById('panel-' + name)!.classList.add('active');
}

function esc(s: string) {
  return s ? s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
}

function conceptJson(code: string): string {
  const c = DB.byCode.get(code);
  if (!c) return '';
  const concept: any = { code: c.code, display: c.display };
  concept.designation = [];
  const property: any[] = [];
  if (c.tty) property.push({ code: 'tty', valueString: c.tty });
  if (c.active !== undefined) property.push({ code: 'status', valueString: c.active ? 'active' : 'inactive' });
  const edges = DB.edgesBySource.get(code) || [];
  for (const e of edges) {
    const target = DB.byCode.get(e.target);
    property.push({
      code: e.property,
      valueCoding: { code: e.target, display: target ? target.display : undefined }
    });
  }
  concept.property = property;
  return JSON.stringify(concept, null, 2);
}

function showPropertiesModal(code: string) {
  const c = DB.byCode.get(code);
  if (!c) return;
  const overlay = document.createElement('div');
  overlay.className = 'prop-overlay';
  const modal = document.createElement('div');
  modal.className = 'prop-modal';
  modal.innerHTML = `
    <div class="prop-modal-header">
      <span>${esc(c.code)} &mdash; ${esc(c.display)}</span>
      <button class="prop-modal-close">&times;</button>
    </div>
    <div class="prop-modal-body"></div>`;
  modal.querySelector('.prop-modal-body')!.textContent = conceptJson(code);
  overlay.appendChild(modal);
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  modal.querySelector('.prop-modal-close')!.addEventListener('click', close);
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
  });
  document.body.appendChild(overlay);
}

resultsBody.addEventListener('click', (e) => {
  const row = (e.target as HTMLElement).closest('tr[data-code]') as HTMLElement | null;
  if (row?.dataset.code) showPropertiesModal(row.dataset.code);
});

// Generate compose examples from data-vcl-compose attributes
document.querySelectorAll<HTMLElement>('[data-vcl-compose]').forEach(el => {
  const expr = el.dataset.vclCompose!;
  const sys = el.dataset.vclSystem || system;
  try {
    const ast = parseVCL(expr);
    const { valueSets } = astToComposeCollection(ast, sys);
    if (valueSets.length === 1) {
      el.textContent = JSON.stringify(valueSets[0].compose, null, 2);
    } else {
      const parts: string[] = [];
      for (const vs of valueSets) {
        if (vs.url !== null) parts.push(`── ${vs.url} ──`);
        parts.push(JSON.stringify(vs.compose, null, 2));
      }
      el.textContent = parts.join('\n\n');
    }
  } catch (e: any) {
    el.textContent = `Error: ${e.message}`;
  }
});

// Expose functions globally for onclick handlers in HTML
(window as any).tryVCL = tryVCL;
(window as any).tryExample = tryExample;
(window as any).copyLink = copyLink;
(window as any).showTab = showTab;

// Pick up expression from URL hash (#example=NAME or #expr=ENCODED) or legacy ?expr= param
{
  let expr: string | null = null;
  const hash = location.hash.replace(/^#/, '');
  if (hash.startsWith('example=')) {
    const name = decodeURIComponent(hash.slice(8));
    const ex = (EXAMPLES as Record<string, {label: string; expr: string}>)[name];
    if (ex) expr = ex.expr;
  } else if (hash.startsWith('expr=')) {
    expr = decodeURIComponent(hash.slice(5));
  } else {
    const params = new URLSearchParams(location.search);
    expr = params.get('expr');
  }
  if (expr) {
    input.value = expr;
    setTimeout(() => { runQuery(); input.focus(); }, 100);
  } else if (hash === 'playground') {
    setTimeout(() => input.focus(), 100);
  }
}
