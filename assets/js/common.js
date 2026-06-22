/* ============================================================
   common.js — CSV cache, shared helpers, footer injection
   ============================================================ */

/* ── CSV cache ──────────────────────────────────────────── */
const _csvCache = {};
function csv(url) {
  if (_csvCache[url]) return _csvCache[url];
  _csvCache[url] = new Promise((resolve, reject) =>
    Papa.parse(url, {
      download: true, header: true, skipEmptyLines: true,
      complete: r => resolve(r.data),
      error:    e => reject(e)
    })
  );
  return _csvCache[url];
}

/* ── JSON cache ─────────────────────────────────────────── */
const _jsonCache = {};
function fetchJSON(url) {
  if (_jsonCache[url]) return _jsonCache[url];
  _jsonCache[url] = fetch(url)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
      return r.json();
    })
    .catch(err => {
      delete _jsonCache[url];
      throw err;
    });
  return _jsonCache[url];
}

/* ── Color palette ──────────────────────────────────────── */
const MAT_COLORS = {
  "Composition":              "#5496CE",
  "Microstructure":           "#5EB342",
  "Processing":               "#E9C54E",
  "Testing & characterisation": "#DC6464",
  "Property prediction":      "#DC6464",
  "Materials design":         "#5496CE",
  "Multimodal AI":            "#1a56db",
  "Generative AI":            "#e05c2a",
  "Multimodal Generative AI": "#5EB342"
};

/* ── Number helper ──────────────────────────────────────── */
function num(x) {
  const n = Number(String(x).match(/-?\d+(\.\d+)?/)?.[0]);
  return Number.isFinite(n) ? n : null;
}
function fmt(n) { return (n ?? 0).toLocaleString(); }

/* ── Loading / error helpers ────────────────────────────── */
function showSkeleton(chartId) {
  const el = document.getElementById(chartId); if (!el) return;
  if (el.querySelector('.skeleton-wrap')) return;
  const sk = document.createElement('div');
  sk.className = 'skeleton-wrap'; sk.id = `sk-${chartId}`;
  sk.innerHTML = [.28,.45,.18,.38].map(f =>
    `<div class="skeleton" style="height:${Math.round(460 * f)}px;flex:1"></div>`
  ).join('');
  el.style.position = 'relative';
  el.appendChild(sk);
}
function hideSkeleton(chartId) {
  document.getElementById(`sk-${chartId}`)?.remove();
}
function showChartError(chartId, msg = 'Failed to load data.') {
  hideSkeleton(chartId);
  const el = document.getElementById(chartId); if (!el) return;
  el.innerHTML = `
    <div class="chart-error" role="alert">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <circle cx="12" cy="16" r=".5" fill="currentColor"/>
      </svg>
      <div><strong>Could not load chart</strong><br><span style="font-size:12px">${msg}</span></div>
    </div>`;
}

/* ── Download helpers ───────────────────────────────────── */
function downloadPNG(chartId, filename) {
  Plotly.downloadImage(chartId, { format: 'png', filename, width: 1200, height: 700, scale: 2 });
}
function downloadCSVFile(filename, data) {
  const blob = new Blob([Papa.unparse(data)], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

/* ── Shared Plotly layout base ──────────────────────────── */
function baseLayout(overrides = {}) {
  return Object.assign({
    font:  { family: 'system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif', size: 12 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor:  'rgba(0,0,0,0)',
    margin: { l: 60, r: 20, t: 40, b: 52 },
    xaxis: { gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 } },
    yaxis: { gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 } },
    legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: 1.06, yanchor: 'bottom', font: { size: 11 } },
    hoverlabel: { bgcolor: '#1e293b', font: { color: '#f1f5f9', size: 12 } }
  }, overrides);
}

const PLOTLY_CONFIG = {
  responsive: true,
  displayModeBar: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['select2d','lasso2d','autoScale2d'],
  toImageButtonOptions: { format: 'png', scale: 2, width: 1000, height: 560 }
};

/* ── Date helper ─────────────────────────────────────────── */
function _fmtDate(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d)) return null;
    return d.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  } catch (_) { return null; }
}

/* ── Last-updated resolver ───────────────────────────────── */
async function setLastUpdated() {
  try {
    const manifest = await fetchJSON('./data/datasets.json');
    const ds = manifest.datasets?.[0];
    const meta = ds?.meta ? await fetchJSON(ds.meta) : null;
    const iso = meta?.last_updated
      ? `${meta.last_updated}-01T00:00:00Z`
      : (await fetchJSON('./assets/meta/build.json'))?.built_at;
    const label = _fmtDate(iso);
    if (label) {
      ['last-updated', 'footer-last-updated'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = label;
      });
    }
  } catch (_) {}
}

/* ── Footer HTML ────────────────────────────────────────── */
const FOOTER_HTML = `
<footer class="site-footer" role="contentinfo">
  <div class="container-wide">
    <div class="footer-citation-section">
      <div class="footer-cite-info">
        <a href="index.html" class="nav-logo" style="text-decoration:none">
          <img src="./assets/img/multimodalai-logo.png" alt="" class="nav-logo-img"
               width="28" height="28" aria-hidden="true" onerror="this.style.display='none'">
          Multimodal AI for Material Science
        </a>
        <p>Interactive data visualisations from the paper
        <em>Generative and multimodal AI for materials prediction and design</em>
        by Liu et al. (IOP Publishing, J. Phys. Mater., in preparation).
        Coverage: Scopus 2020–2025. Last updated <span id="footer-last-updated">March 2026</span>.</p>
      </div>
      <div class="footer-cite-bibtex">
        <div class="bibtex-wrap">
          <div class="bibtex-header">
            <span class="bibtex-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              BibTeX (provisional)
            </span>
            <span class="bibtex-hint">To be updated upon publication</span>
          </div>
          <div class="bibtex-block"><button class="bibtex-copy-btn" onclick="navigator.clipboard.writeText(this.nextElementSibling.textContent.trim()).then(()=>{this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',1500)})" aria-label="Copy BibTeX to clipboard">Copy</button><code>@article{liu2026generative,
  title   = {Generative and multimodal AI for materials prediction and design:
             Progress, challenges, and perspectives},
  author  = {Liu, Xianyuan and Anjah, Charles and Jolly, Benjamin E. and
             Markanday, Jonathon F. S. and Berry, Joshua and Wang, Haolin and
             Morley, Nicola and Zhang, Delvin Ce and Christofidou, Katerina A.
             and Lu, Haiping},
  journal = {Journal of Physics: Materials},
  year    = {2026},
  note    = {In preparation}
}</code></div>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span class="footer-bottom-text">
        &copy; <span id="copyright-year">2026</span> University of Sheffield &mdash;
        <a href="LICENSE" target="_blank" rel="noopener">MIT Licence</a> &mdash;
        Built with
        <a href="https://plotly.com/javascript/" target="_blank" rel="noopener">Plotly.js</a>
        and
        <a href="https://www.papaparse.com/" target="_blank" rel="noopener">Papa Parse</a>.
      </span>
      <div class="footer-bottom-links">
        <a href="LICENSE" target="_blank" rel="noopener">Licence</a>
      </div>
    </div>
  </div>
</footer>`;

/* ── Bootstrap ───────────────────────────────────────────── */
(function bootstrap() {
  const footerEl = document.getElementById('site-footer');
  if (footerEl) footerEl.outerHTML = FOOTER_HTML;

  const yearEl = document.getElementById('copyright-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Sub-nav collapsible toggle
  const toggle = document.getElementById('fig-menu-toggle');
  const panel  = document.getElementById('fig-menu-panel');
  const nav    = document.getElementById('figure-nav');
  if (toggle && panel && nav) {
    const closeNav = () => { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
    const openNav  = () => { nav.classList.add('open');    toggle.setAttribute('aria-expanded', 'true');  };
    toggle.addEventListener('click', e => { e.stopPropagation(); nav.classList.contains('open') ? closeNav() : openNav(); });
    panel.addEventListener('click',  e => { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('click',   e => { if (!nav.contains(e.target)) closeNav(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
  }

  // Active sub-nav link on scroll
  const sections = Array.from(document.querySelectorAll('.explore-section[id]'));
  const links    = Array.from(document.querySelectorAll('.sub-nav-link'));
  if (sections.length && links.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const link = links.find(l => l.getAttribute('href') === '#' + e.target.id);
        if (link) link.classList.toggle('active', e.isIntersecting);
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(s => observer.observe(s));
  }

  setLastUpdated();
})();
