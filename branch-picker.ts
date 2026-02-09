type BranchEntry = {
  name: string;
  slug: string;
  path: string;
  sha: string;
};

type BranchManifest = {
  generatedAt: string;
  defaultBranch: string;
  branches: BranchEntry[];
};

function currentFileName(pathname: string): string {
  const base = pathname.split('/').pop() || '';
  if (!base || !base.includes('.')) return 'index.html';
  return base;
}

function currentBranchSlug(pathname: string): string | null {
  const m = pathname.match(/\/branches\/([^/]+)\//);
  return m ? decodeURIComponent(m[1]) : null;
}

function buildTargetHref(
  selected: BranchEntry,
  currentSlug: string | null,
  defaultBranch: string,
  fileName: string,
  search: string,
  hash: string
): string {
  let rel: string;
  if (selected.name === defaultBranch) {
    rel = currentSlug ? `../../${fileName}` : fileName;
  } else if (currentSlug) {
    rel = `../${selected.slug}/${fileName}`;
  } else {
    rel = `branches/${selected.slug}/${fileName}`;
  }
  return rel + search + hash;
}

async function initBranchPicker() {
  const slot = document.getElementById('branch-picker-slot');
  if (!slot) return;

  const manifestHref = /\/branches\/[^/]+\//.test(window.location.pathname)
    ? '../../branches.json'
    : './branches.json';

  let manifest: BranchManifest;
  try {
    const resp = await fetch(manifestHref, { cache: 'no-store' });
    if (!resp.ok) return;
    manifest = (await resp.json()) as BranchManifest;
  } catch (_e) {
    return;
  }

  if (!manifest.branches || manifest.branches.length === 0) return;

  const pathname = window.location.pathname;
  const fileName = currentFileName(pathname);
  const slug = currentBranchSlug(pathname);
  const currentName = slug
    ? (manifest.branches.find((b) => b.slug === slug)?.name || manifest.defaultBranch)
    : manifest.defaultBranch;

  const label = document.createElement('label');
  label.htmlFor = 'branch-picker';
  label.textContent = 'Branch';

  const select = document.createElement('select');
  select.id = 'branch-picker';
  select.setAttribute('aria-label', 'Branch');

  for (const b of manifest.branches) {
    const option = document.createElement('option');
    option.value = b.name;
    option.textContent = b.name;
    if (b.name === currentName) option.selected = true;
    select.appendChild(option);
  }

  select.addEventListener('change', () => {
    const selected = manifest.branches.find((b) => b.name === select.value);
    if (!selected) return;
    const href = buildTargetHref(
      selected,
      slug,
      manifest.defaultBranch,
      fileName,
      window.location.search,
      window.location.hash
    );
    window.location.href = href;
  });

  slot.replaceChildren(label, select);
}

initBranchPicker();
