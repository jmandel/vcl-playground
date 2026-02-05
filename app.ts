import { parseVCL, indexData, createEvaluator, astToCompose, prettyAST } from './vcl.js';
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
  const url = new URL(window.location.href);
  url.searchParams.set('expr', expr);
  url.hash = '#playground';
  navigator.clipboard.writeText(url.toString()).then(() => {
    const btn = document.getElementById('copy-link-btn')!;
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy link'; btn.classList.remove('copied'); }, 1500);
  });
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
    <tr>
      <td class="code-cell" onclick="tryVCL('${c.code}')">${esc(c.code)}</td>
      <td>${esc(c.display)}</td>
      <td><span class="tty tty-${c.tty}">${c.tty}</span></td>
    </tr>
  `).join('');
  if (sorted.length > maxShow) {
    resultsBody.innerHTML += `<tr><td colspan="3" style="color:#94a3b8">...and ${sorted.length - maxShow} more</td></tr>`;
  }

  // Compose JSON
  try {
    const compose = astToCompose(ast, system);
    composeEl.textContent = JSON.stringify(compose, null, 2);
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

// Expose functions globally for onclick handlers in HTML
(window as any).tryVCL = tryVCL;
(window as any).tryExample = tryExample;
(window as any).copyLink = copyLink;
(window as any).showTab = showTab;

// Pick up expression from URL ?expr= param or localStorage "Try it" links
{
  const params = new URLSearchParams(location.search);
  const urlExpr = params.get('expr');
  const lsExpr = localStorage.getItem('vcl-try');
  const expr = urlExpr || (location.hash === '#playground' ? lsExpr : null);
  if (expr) {
    localStorage.removeItem('vcl-try');
    input.value = expr;
    setTimeout(() => { runQuery(); input.focus(); }, 100);
  } else if (location.hash === '#playground') {
    setTimeout(() => input.focus(), 100);
  }
}
