// Vercel serverless function — NSE last prices, no API key, no credentials.
//
// WHY THIS EXISTS
// Yahoo serves NSE prices free and unmetered, but sends no Access-Control-Allow-Origin, so a browser
// refuses to hand the response to page JavaScript. That restriction applies to browsers only: this
// function is not a browser, so it can read Yahoo directly and re-serve the answer with the header
// attached. Nothing here is authenticated — that is the whole point. Compare the alternative, a Kite
// proxy, which would need an access_token that can PLACE AND CANCEL ORDERS.
//
// Deploy: import this repo into Vercel. Vercel serves the static pages AND this function from one
// origin, which means the page's price call is same-origin and the CORS dance below is only needed
// for other hosts (a local dev server, or a GitHub Pages mirror). No env vars, no secrets, nothing
// to rotate.
//
//   GET /api/price?symbols=RELIANCE,TCS,NOTREAL
//   -> {"prices":{"RELIANCE":2965.5,"TCS":3702.1},"prev":{"RELIANCE":2950.1,"TCS":3711},
//       "missing":["NOTREAL"],"asof":"2026-01-01T…"}
// `prev` is the previous session's close, so a page can say what moved TODAY from the same fetch.

const MAX_SYMBOLS = 60;      // one basket is ~25; a cap keeps a stray loop from burning the free tier
const TIMEOUT_MS  = 8000;

// Only these origins may read the response. A wildcard would be safe — there are no credentials to
// protect — but naming origins stops other sites casually using this as free infrastructure.
// Vercel serves the pages and this function from the same origin, so the page's own call sends no
// Origin header and needs nothing from this list. It exists only for a page served from ELSEWHERE:
// a local static server, or a mirror. VERCEL_URL is injected by Vercel itself — it is not a variable
// anyone configures — so a renamed project keeps working without editing this file.
const ALLOWED = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
  'http://localhost:8899',
  'http://localhost:3000',
].filter(Boolean);

// NSE series suffixes. The broker's tradeable symbol carries them (ACME-BE, FOO-BE) but Yahoo
// indexes only the base name — ACME-BE.NS is a 404 while ACME.NS returns a price. Verified
// against Yahoo, not assumed. The list is an allowlist on purpose: InvIT series such as FOO-IV.NS DO
// resolve, so stripping everything after a hyphen would break an instrument that currently works.
const SERIES = /-(BE|BZ|BL|SM|ST|IL|GB|GS)$/;

async function yahooPrice(sym) {
  // Ask for exactly what the caller named first, then fall back to the de-suffixed base. Order
  // matters: anything Yahoo does carry under its full name keeps working untouched.
  const r = await yahooOne(sym);
  if (r !== null || !SERIES.test(sym)) return r;
  return yahooOne(sym.replace(SERIES, ''));
}

async function yahooOne(sym) {
  // v8 chart, not v7 quote: v7 batch now demands a crumb/cookie, v8 needs nothing. One symbol per
  // request, which is fine — they run in parallel and Yahoo is not metering us.
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}.NS`
            + `?range=1d&interval=1d`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      signal: ctl.signal,
      // Yahoo 401s requests with no User-Agent
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; sharecase/1.0)' },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const meta = j?.chart?.result?.[0]?.meta;
    const px = meta?.regularMarketPrice;
    // Reject anything that is not a positive number, and anything not priced in rupees — a wrong
    // currency silently mixed into a basket is worse than a missing price.
    if (typeof px !== 'number' || !(px > 0) || meta?.currency !== 'INR') return null;
    const pc = meta?.chartPreviousClose ?? meta?.previousClose;
    return { px: Math.round(px * 100) / 100, prev: typeof pc === 'number' && pc > 0 ? Math.round(pc * 100) / 100 : null };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// GET /api/price?hist=SYMBOL&from=YYYY-MM-DD -> {s, ticker, d:[dates], c:[closes], splits:[{d,r}]}
// Daily closes for one stock, for the Dashboard's per-stock chart. Yahoo's closes are split- and
// bonus-ADJUSTED, so `splits` comes back too: a page plotting its own (raw) trade prices on this series
// must divide each by the splits that happened after it.
async function yahooChart(ticker, qs) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?${qs}`,
      { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; sharecase/1.0)' } });
    return r.ok ? await r.json() : null;
  } catch { return null; } finally { clearTimeout(timer); }
}
const ist = sec => new Date((sec + 19800) * 1000).toISOString().slice(0, 10);   // Yahoo stamps sessions in UTC
async function history(req, res) {
  const sym = String(req.query.hist).trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9&.\-]{0,19}$/.test(sym)) return res.status(400).json({ error: 'bad symbol' });
  const now = Math.floor(Date.now() / 1000);
  const from = /^\d{4}-\d\d-\d\d$/.test(String(req.query.from || '')) ? Math.floor(Date.parse(req.query.from) / 1000) : now - 365 * 86400;
  const b = sym.replace(SERIES, '');
  for (const ticker of [`${sym}.NS`, `${b}.NS`, `${b}.BO`]) {        // NSE first, BSE for BSE-only stocks
    const r = (await yahooChart(ticker, `period1=${from}&period2=${now}&interval=1d&events=split`))?.chart?.result?.[0];
    if (!r || r.meta?.currency !== 'INR') continue;
    const cl = r.indicators?.quote?.[0]?.close || [], d = [], c = [];
    (r.timestamp || []).forEach((t, i) => { if (typeof cl[i] === 'number' && cl[i] > 0) { d.push(ist(t)); c.push(Math.round(cl[i] * 100) / 100); } });
    if (d.length < 2) continue;
    const splits = Object.values(r.events?.splits || {}).map(x => ({ d: ist(x.date), r: x.numerator / x.denominator }));
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).json({ s: sym, ticker, d, c, splits });
  }
  return res.status(404).json({ error: 'no price history', s: sym });
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  if (req.query.hist) return history(req, res);
  const raw = String(req.query.symbols || '').trim();
  if (!raw) return res.status(400).json({ error: 'pass ?symbols=A,B,C' });

  // Uppercase, dedupe, and keep only plausible NSE tradingsymbols. Series suffixes are real
  // instruments (ACME-BE), so hyphens are allowed through.
  const symbols = [...new Set(
    raw.split(',').map(s => s.trim().toUpperCase()).filter(s => /^[A-Z0-9][A-Z0-9&.\-]{0,19}$/.test(s))
  )];
  if (!symbols.length) return res.status(400).json({ error: 'no valid symbols' });
  if (symbols.length > MAX_SYMBOLS) {
    return res.status(400).json({ error: `at most ${MAX_SYMBOLS} symbols per request`, got: symbols.length });
  }

  const results = await Promise.all(symbols.map(async s => [s, await yahooPrice(s)]));
  const prices = {}, prev = {}, missing = [];
  for (const [s, r] of results) {
    if (r === null) { missing.push(s); continue; }
    prices[s] = r.px;
    if (r.prev !== null) prev[s] = r.prev;
  }

  // Short cache: prices move, but a page that refetches on every keystroke should not hit Yahoo each
  // time. 60s is well inside "current" for sizing a basket you are about to place by hand.
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
  return res.status(200).json({
    prices,
    prev,
    missing,
    asof: new Date().toISOString(),
    source: 'query1.finance.yahoo.com/v8/finance/chart',
  });
}
