/* ============================================================
   explore.js — chart renderers for material-landscape
   All data loaded from CSV files via PapaParse (csv() helper
   defined in common.js).
   ============================================================ */

const DATA_ROOT = './data/material-landscape/';

/* ── Shared year tick config ──────────────────────────────── */
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
const xAxisYears = {
  tickvals: YEARS,
  ticktext: YEARS.map(String),
  title: { text: 'Year', font: { size: 11 }, standoff: 6 },
  gridcolor: '#e2e8f0',
  linecolor: '#cbd5e1',
  tickfont: { size: 11 }
};

/* ── Download button wiring ───────────────────────────────── */
function wirePNG(btnId, chartId, filename) {
  const btn = document.getElementById(btnId);
  if (btn) btn.addEventListener('click', () => downloadPNG(chartId, filename));
}
function wireCSV(btnId, data, filename) {
  const btn = document.getElementById(btnId);
  if (btn) btn.addEventListener('click', () => downloadCSVFile(filename, data));
}

/* ── Fig 1a — proportions line chart ─────────────────────── */
async function drawFig1a() {
  const chartId = 'chart1a';
  showSkeleton(chartId);
  try {
    const rows = await csv(DATA_ROOT + 'fig1a-proportions.csv');
    const years = rows.map(r => num(r.year));
    const mmPct = rows.map(r => num(r.multimodal_ai_pct));
    const gePct = rows.map(r => num(r.generative_ai_pct));
    const mgPct = rows.map(r => num(r.mm_generative_ai_pct));

    const traces = [
      {
        x: years, y: mmPct,
        name: 'Multimodal AI',
        mode: 'lines+markers',
        line:   { color: '#1a56db', width: 2.5 },
        marker: { size: 7, color: '#1a56db' },
        hovertemplate: 'Multimodal AI<br>%{x}: %{y:.2f}%<extra></extra>'
      },
      {
        x: years, y: gePct,
        name: 'Generative AI',
        mode: 'lines+markers',
        line:   { color: '#e05c2a', width: 2.5, dash: 'dash' },
        marker: { size: 7, color: '#e05c2a' },
        hovertemplate: 'Generative AI<br>%{x}: %{y:.2f}%<extra></extra>'
      },
      {
        x: years, y: mgPct,
        name: 'Multimodal Generative AI',
        mode: 'lines+markers',
        line:   { color: '#5EB342', width: 2, dash: 'dot' },
        marker: { size: 6, color: '#5EB342' },
        hovertemplate: 'Multimodal Generative AI<br>%{x}: %{y:.3f}%<extra></extra>'
      }
    ];

    const layout = baseLayout({
      xaxis: xAxisYears,
      yaxis: {
        title: { text: 'Proportion in AI for materials papers (%)', font: { size: 11 }, standoff: 8 },
        gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 },
        ticksuffix: '%'
      }
    });

    hideSkeleton(chartId);
    Plotly.newPlot(chartId, traces, layout, PLOTLY_CONFIG);
    wirePNG('dl-png-fig1a', chartId, 'fig1a-proportions');
    wireCSV('dl-csv-fig1a', rows, 'fig1a-proportions.csv');
  } catch (e) {
    showChartError(chartId, e.message);
  }
}

/* ── Fig 1b — grouped bar: property prediction vs design ─── */
async function drawFig1b() {
  const chartId = 'chart1b';
  showSkeleton(chartId);
  try {
    const rows = await csv(DATA_ROOT + 'fig1b-property-design.csv');
    const years   = rows.map(r => num(r.year));
    const propPred = rows.map(r => num(r.property_prediction));
    const matDes   = rows.map(r => num(r.materials_design));

    const traces = [
      {
        x: years, y: propPred,
        name: 'Property prediction',
        type: 'bar',
        marker: { color: '#DC6464', opacity: 0.88 },
        hovertemplate: 'Property prediction<br>%{x}: %{y:,}<extra></extra>'
      },
      {
        x: years, y: matDes,
        name: 'Materials design',
        type: 'bar',
        marker: { color: '#5496CE', opacity: 0.88 },
        hovertemplate: 'Materials design<br>%{x}: %{y:,}<extra></extra>'
      }
    ];

    const layout = baseLayout({
      barmode: 'group',
      bargap: 0.28,
      xaxis: xAxisYears,
      yaxis: {
        title: { text: 'Multimodal AI paper count', font: { size: 11 }, standoff: 8 },
        gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 }
      }
    });

    hideSkeleton(chartId);
    Plotly.newPlot(chartId, traces, layout, PLOTLY_CONFIG);
    wirePNG('dl-png-fig1b', chartId, 'fig1b-property-design');
    wireCSV('dl-csv-fig1b', rows, 'fig1b-property-design.csv');
  } catch (e) {
    showChartError(chartId, e.message);
  }
}

/* ── Fig 3a — stacked bar: absolute counts by category ───── */
async function drawFig3a() {
  const chartId = 'chart3a';
  showSkeleton(chartId);
  try {
    const rows = await csv(DATA_ROOT + 'fig3a-category-counts.csv');
    const years = rows.map(r => num(r.year));

    const categories = [
      { key: 'composition',             label: 'Composition',               color: '#5496CE' },
      { key: 'microstructure',          label: 'Microstructure',            color: '#5EB342' },
      { key: 'processing',              label: 'Processing',                color: '#E9C54E' },
      { key: 'testing_characterisation',label: 'Testing & characterisation',color: '#DC6464' }
    ];

    const traces = categories.map(c => ({
      x: years,
      y: rows.map(r => num(r[c.key])),
      name: c.label,
      type: 'bar',
      marker: { color: c.color, opacity: 0.9 },
      hovertemplate: `${c.label}<br>%{x}: %{y}<extra></extra>`
    }));

    const layout = baseLayout({
      barmode: 'stack',
      bargap: 0.28,
      xaxis: xAxisYears,
      yaxis: {
        title: { text: 'Multimodal AI paper count', font: { size: 11 }, standoff: 8 },
        gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 }
      }
    });

    hideSkeleton(chartId);
    Plotly.newPlot(chartId, traces, layout, PLOTLY_CONFIG);
    wirePNG('dl-png-fig3a', chartId, 'fig3a-category-counts');
    wireCSV('dl-csv-fig3a', rows, 'fig3a-category-counts.csv');
  } catch (e) {
    showChartError(chartId, e.message);
  }
}

/* ── Fig 3b — 100% stacked bar: proportions by category ──── */
async function drawFig3b() {
  const chartId = 'chart3b';
  showSkeleton(chartId);
  try {
    const rows = await csv(DATA_ROOT + 'fig3b-category-proportions.csv');
    const years = rows.map(r => num(r.year));

    const categories = [
      { key: 'composition_pct',              label: 'Composition',               color: '#5496CE' },
      { key: 'microstructure_pct',           label: 'Microstructure',            color: '#5EB342' },
      { key: 'processing_pct',               label: 'Processing',                color: '#E9C54E' },
      { key: 'testing_characterisation_pct', label: 'Testing & characterisation',color: '#DC6464' }
    ];

    const traces = categories.map(c => ({
      x: years,
      y: rows.map(r => num(r[c.key])),
      name: c.label,
      type: 'bar',
      marker: { color: c.color, opacity: 0.9 },
      hovertemplate: `${c.label}<br>%{x}: %{y:.2f}%<extra></extra>`
    }));

    const layout = baseLayout({
      barmode: 'stack',
      bargap: 0.28,
      xaxis: xAxisYears,
      yaxis: {
        title: { text: 'Proportion (%)', font: { size: 11 }, standoff: 8 },
        gridcolor: '#e2e8f0', linecolor: '#cbd5e1', tickfont: { size: 11 },
        ticksuffix: '%',
        range: [0, 101]
      }
    });

    hideSkeleton(chartId);
    Plotly.newPlot(chartId, traces, layout, PLOTLY_CONFIG);
    wirePNG('dl-png-fig3b', chartId, 'fig3b-category-proportions');
    wireCSV('dl-csv-fig3b', rows, 'fig3b-category-proportions.csv');
  } catch (e) {
    showChartError(chartId, e.message);
  }
}

/* ── Stats loader ────────────────────────────────────────── */
async function loadStats() {
  const container = document.getElementById('datasets-stats');
  if (!container) return;

  function card(label, value, sub) {
    return `<div class="stat-card" role="listitem">
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-sub">${sub}</div>
    </div>`;
  }

  try {
    const manifest = await fetchJSON('./data/datasets.json');
    const ds = manifest.datasets[0];
    const meta    = await fetchJSON(ds.meta);
    const summary = await fetchJSON(`./data/${meta.id}/summary.json`);
    const s = summary;

    container.innerHTML = `
      <div class="stats-strip" role="list">
        ${card(`Multimodal AI papers in ${s.end_year}`,
               s.total_latest_year.toLocaleString(),
               `Up from ${s.total_start_year} in ${s.start_year}`)}
        ${card(`Growth (${s.start_year} → ${s.end_year})`,
               `${s.growth_multiplier}×`,
               'Year-on-year increase')}
        ${card('Data categories tracked', s.modalities_count,
               'Composition, Microstructure, Processing, T&amp;C')}
        ${card('Interactive figures', s.figures_count,
               'Downloadable PNG &amp; CSV')}
      </div>`;
  } catch (_) {
    container.innerHTML = `
      <div class="stats-strip" role="list">
        <div class="stat-card"><div class="stat-label">Multimodal AI papers in 2025</div>
          <div class="stat-value">676</div><div class="stat-sub">Up from 43 in 2020</div></div>
        <div class="stat-card"><div class="stat-label">Growth (2020 → 2025)</div>
          <div class="stat-value">16×</div><div class="stat-sub">Year-on-year increase</div></div>
        <div class="stat-card"><div class="stat-label">Data categories tracked</div>
          <div class="stat-value">4</div><div class="stat-sub">Composition, Microstructure, Processing, T&amp;C</div></div>
        <div class="stat-card"><div class="stat-label">Interactive figures</div>
          <div class="stat-value">4</div><div class="stat-sub">Downloadable PNG &amp; CSV</div></div>
      </div>`;
  }
}

/* ── Boot all charts ──────────────────────────────────────── */
loadStats();
drawFig1a();
drawFig1b();
drawFig3a();
drawFig3b();
