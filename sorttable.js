// sorttable.js: click any column header of a data table to sort by it; click again to reverse.
// One shared file instead of a copy per page (no build step: each page includes it with <script src>).
//
// - Values are read from what the cell SHOWS, so every table works without changes:
//   ₹1,23,456 · −₹45.6k · ₹2.50L · ₹1.2Cr · +19.1% · 16 Oct 2026 · 2026-10-16 · 24 · ACME.
//   A cell may carry data-sort="…" to override that (e.g. a hidden exact value).
// - Number and date columns sort biggest/latest first on the first click; text sorts A→Z.
// - Blank, "—" and masked ("•••") cells always go last, in either direction.
// - Only <tbody> rows move: a <tfoot> total stays put.
// - The pages redraw tables (the Dashboard every 30 s), so the chosen sort is remembered per table
//   and re-applied to the redrawn one.
// - A table with data-nosort is left alone (worked examples whose order is the point).
(() => {
  const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const MULT = { cr: 1e7, l: 1e5, k: 1e3 };

  function value(cell) {
    const raw = cell ? (cell.dataset.sort ?? cell.textContent) : '';
    const t = raw.replace(/\s+/g, ' ').trim();
    if (!t || t === '—' || t === '-' || /•/.test(t)) return { kind: 'empty' };
    let m = t.match(/^(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})$/);              // 16 Oct 2026
    if (m && MON[m[2].toLowerCase()] !== undefined) return { kind: 'num', v: Date.UTC(+m[3], MON[m[2].toLowerCase()], +m[1]) };
    if (/^\d{4}-\d\d-\d\d/.test(t)) return { kind: 'num', v: Date.parse(t.slice(0, 10)) };
    const n = t.replace(/[,₹+\s]/g, '').replace(/−/g, '-');
    m = n.match(/^(-?\d+(?:\.\d+)?)(cr|l|k|%)?$/i);
    if (m) return { kind: 'num', v: parseFloat(m[1]) * (MULT[(m[2] || '').toLowerCase()] || 1) };
    return { kind: 'text', v: t.toLowerCase() };
  }

  const state = new Map();                        // table key -> { col, dir }
  function heading(table) {                       // nearest heading above, so two same-shaped tables differ
    for (let el = table; el && el !== document.body; el = el.parentElement) {
      for (let p = el.previousElementSibling; p; p = p.previousElementSibling) {
        if (/^(H2|H3|SUMMARY)$/.test(p.tagName) || p.classList.contains('mvh')) return p.textContent.trim();
        const h = p.querySelector && p.querySelector('h2,h3,.mvh');
        if (h) return h.textContent.trim();
      }
    }
    return '';
  }
  const keyOf = t => t.dataset.sortKey ||
    heading(t) + '|' + [...t.tHead.rows[0].cells].map(c => c.textContent.trim()).join('|');

  function apply(table, col, dir) {
    const body = table.tBodies[0];
    const rows = [...body.rows].map((r, i) => ({ r, i, x: value(r.cells[col]) }));
    rows.sort((a, b) => {
      if (a.x.kind === 'empty' || b.x.kind === 'empty')
        return (a.x.kind === 'empty') - (b.x.kind === 'empty') || a.i - b.i;
      const c = a.x.kind === 'num' && b.x.kind === 'num' ? a.x.v - b.x.v
        : String(a.x.v).localeCompare(String(b.x.v), undefined, { numeric: true });
      return c * dir || a.i - b.i;
    });
    rows.forEach(o => body.appendChild(o.r));
    [...table.tHead.rows[0].cells].forEach((th, i) =>
      th.setAttribute('aria-sort', i === col ? (dir > 0 ? 'ascending' : 'descending') : 'none'));
  }

  function arm(table) {
    if (table.dataset.sortArmed || table.hasAttribute('data-nosort')) return;
    if (!table.tHead || !table.tHead.rows.length || !table.tBodies.length) return;
    table.dataset.sortArmed = '1';
    [...table.tHead.rows[0].cells].forEach((th, i) => {
      th.tabIndex = 0;
      th.setAttribute('aria-sort', 'none');
      th.title = 'Sort by ' + th.textContent.trim().toLowerCase();
      const go = () => {
        const k = keyOf(table), s = state.get(k);
        const numeric = [...table.tBodies[0].rows].some(r => value(r.cells[i]).kind === 'num');
        const dir = s && s.col === i ? -s.dir : (numeric ? -1 : 1);
        state.set(k, { col: i, dir });
        apply(table, i, dir);
      };
      th.addEventListener('click', go);
      th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    const s = state.get(keyOf(table));
    if (s) apply(table, s.col, s.dir);            // a redrawn table keeps the reader's sort
  }

  const css = document.createElement('style');
  css.textContent = 'th[aria-sort]{cursor:pointer;user-select:none;white-space:nowrap}' +
    'th[aria-sort]:hover{color:var(--tx,#0f0f0f)}' +
    'th[aria-sort="ascending"]::after,th[aria-sort="descending"]::after{content:"";display:inline-block;' +
    'margin-left:6px;border:4px solid transparent;vertical-align:middle}' +
    'th[aria-sort="ascending"]::after{border-bottom-color:currentColor;margin-top:-4px}' +
    'th[aria-sort="descending"]::after{border-top-color:currentColor;margin-top:4px}';
  document.head.appendChild(css);

  let timer;
  const scan = () => { clearTimeout(timer); timer = setTimeout(() => document.querySelectorAll('table').forEach(arm), 30); };
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
