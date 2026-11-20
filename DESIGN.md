# sharecase: CRED Money light, NeoPOP controls

Portfolio analytics and shareable stock baskets for Indian equity investors. The look is a
**statement on a white sheet**: one serif figure that answers "how am I doing", plain rows under it,
and a few heavy, tactile buttons for the things you actually do.

This replaces "Mineral Paper, Blue Signal (Direction B)", the warm-paper, blue-action world of Aug 2026.
**Rollout:** done 20 Nov 2026. Every page is on this world: Dashboard, Tracker (`baskets.html`), Basket Workbench
(`basket.html`), landing, setup, guide and method. All of them share the same nav markup and CSS (inner width 1180px), so the nav
doesn't reshape between pages. Change it in one page and you must change it in all seven. `designs/` keeps the Aug 2026 A/B
exploration pages, and the Plex/Barlow font files exist only for them.

Exception to "green and red mean money only": BUY is green and SELL is red in order and rebalance action columns. That
convention is near-universal in trading, and mistaking a sell for a buy can't be undone.

Credits:
- The buttons are a CSS redraw of **NeoPOP**, CRED's open-source design system
  (github.com/CRED-CLUB/neopop-web, Apache-2.0). No CRED logos, marks, fonts or app assets are used.
- **Gloock** and **Figtree** are self-hosted under the SIL Open Font License (`fonts/OFL-*.txt`).
- The tokens come from the StatementLens port of the same world.

Hard constraints, unchanged:
1. **No build step.** Standalone HTML files, vanilla CSS and JS, no npm, no framework. Pages open
   from `file://`.
2. **No accounts, no telemetry.** The one server piece is `api/price.js`, a keyless Yahoo price proxy.
   Portfolio data stays in the browser.

## Surfaces
| token | value | use |
|---|---|---|
| `--bg` | `#efefee` | the band behind the sheet; nav sits on it |
| `--panel` | `#ffffff` | the sheet; corners 18px at the top only |
| `--panel2` / `--bg2` | `#f5f5f4` | hover rows, the drop zone, the net cell |
| `--hair` | `#e7e7e7` | hairlines |
| `--hair2` | `#cfcfcf` | dashed row separators, pill borders |

## Ink and meaning
- `--tx #0f0f0f` text, **and selection and action**: the current nav page, the open tab, chosen
  filters, primary buttons. Blue is no longer the action colour.
- `--tx2 #555555` and `--tx3 #6b6b6b` for secondary text and labels. Both pass 4.5:1 on white and on the band.
- `--gain #077f47` and `--ox #c2352d` **only for money up and money down.** A loaded file, a live feed or
  a success state is ink, never green.
- `--gold #8a5f0f` on `--goldbg #fcf8ee` with a 1px `--goldline #e8d6a4` border: **notices only**
  (losing chips, the verdict, missing-data warnings).
- Chart series keep their validated pair: `#2B5FC4` you, `#B7791F` Nifty (dataviz validator, light).

## Type
- **Gloock 400** (display, one weight, no italic): the page title (1.75rem), section headings
  (1.5rem), and **one hero figure per screen** (2.75rem; 2.5rem on a phone). Never synthesise bold
  or italic on it.
- **Figtree 400–700** for everything else, tabular figures on the body:
  - body .9375rem;
  - figures 700;
  - labels .75rem 600, uppercase, tracked .12–.16em, `--tx3`.
- A section heading's subtitle is a caption **under** it (.875rem `--tx3`). Never put an eyebrow above it.
- Floor: nothing visible under 11px. `Stocks/ui_check.js` counts it.

## Geometry and depth
- **No boxed cards and no blur shadows.** Sections sit on the sheet.
  - Figure rows are statement lines: a 1.5px ink rule on top, dashed separators between items and below.
  - Tables and lists use dashed `--hair2` rows.
- Sharp corners on things you act on (NeoPOP buttons, inputs). Pills are fully rounded (filters,
  toggles, chips, nav items). The sheet's top corners are 18px. Nothing else is rounded.
- Depth is NeoPOP's solid extruded edge, and nothing else. No `box-shadow` stand-ins, no thick
  coloured left borders.
- Controls are at least 44px tall.

## Components
- `.np`: the plunk button.
  - Ink face, with right and bottom edges skewed 45° (`--npr #6f6f6f`, `--npb #3b3b3b`).
  - On press, the face translates into the edge and the edges vanish.
  - `.np.ghost` is a white face with a 2px ink inset and ink edges. Disabled is grey with no edges.
- Tabs: uppercase tracked labels, with a 3px ink bar under the open one.
- `.hero` + `.hl`: the overview's serif figure, then three statement-line figures.
- `.drop`: a full drop zone when nothing is loaded. `.drop.mini` is one line once data is in, still the
  same `<label>` so dragging a file onto it still works.

## Motion
170ms ease-out colour transitions. The NeoPOP press (120ms) is the one tactile moment. No hover lift.
`prefers-reduced-motion` turns transitions off.

## Verify every change
Render on **real data** (`node Stocks/_devserver.mjs`, :8899) in real Chrome at 1440 and 390, on every
tab. `ui_check.js` must report 0 overlaps, 0 outside, 0 tiny and no `pageWide`. Public screenshots
use `samples/` data only, never :8899.
