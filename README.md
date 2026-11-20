# sharecase

**Someone shares a stock basket. You get your own buy list.**

sharecase is a set of browser pages for sharing stock baskets and following them on Zerodha. A basket
travels as a list of NSE stocks and target percentages. Whoever receives it types what they want to
invest, or drops what they already hold, and gets whole-share orders for their own money. If you run
several baskets, the Tracker shows what each one has made, from your own Console tradebooks. It is for
retail investors in India who share baskets with friends, or follow a platform's baskets, and want to
check the arithmetic themselves.

**[Open it](https://sharecase-mu.vercel.app/)** · **[Full guide: docs/GUIDE.md](docs/GUIDE.md)** · **[How it works: docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** · Not investment advice

## The pages

| Page | Nav label | What it is for |
|---|---|---|
| [index](https://sharecase-mu.vercel.app/) | sharecase | Why one shared file works for any amount of money |
| [basket](https://sharecase-mu.vercel.app/basket.html) | Baskets | The Workbench: size a basket, rebalance, build a sheet, hand orders to Kite |
| [baskets](https://sharecase-mu.vercel.app/baskets.html) | Tracker | Value, invested, unrealised and realised P&L per basket |
| [dashboard](https://sharecase-mu.vercel.app/dashboard.html) | Dashboard | Whole-account view from a tradebook and/or holdings |
| [onboarding](https://sharecase-mu.vercel.app/onboarding.html) | One-click setup | About five minutes of Kite app setup, so **Place in Kite** appears |
| [friends](https://sharecase-mu.vercel.app/friends.html) | Guide | Plain-English steps for someone who has been sent a basket |
| [method](https://sharecase-mu.vercel.app/method.html) | Method | Why baskets travel as weights, with the arithmetic worked out |

`basket.html` (one basket) and `baskets.html` (all of yours) differ by one letter, and the nav label
**Baskets** points at the Workbench, not the Tracker.

## Features

- Type an amount and get whole-share orders for every stock, with the remainder, or the overshoot, stated.
- Shows the basket's minimum; below it, refuses, names the stock that sets it, and offers 1×, 2× and 3×.
- Signed drift per stock, and suggested amounts that land closer to the target weights.
- Builds a sheet from an order-confirmation email, a typed list or a holdings export.
- Rebalances from a broker holdings export or pasted rows; unsettled T1 shares count as held.
- Adds or withdraws cash in the same step, moves part of the way, or snaps to an exact multiple.
- Marks EXITED stocks for sale and leaves holdings unrelated to the basket alone.
- Applies a rebalance email, and refuses or flags one sized for someone else's position.
- Tracker: value, invested, unrealised, realised and total return per basket, FIFO from your tradebooks.
- Dashboard: realised curve, open positions by basket, win/loss statistics and a "never sold" view.
- **Place in Kite** opens Kite with every order pre-filled; nothing is placed until you confirm there.
- **show what gets sent** displays the exact order JSON first; without a Kite key, copy orders as text or CSV.

## Screenshots

![The Workbench at step 5 on the sample basket: ₹4,00,000, 4 stocks, ₹3,98,055 deployed, ₹1,945 left. Below it a ledger of RELIANCE 40, TCS 27, HDFCBANK 58 and NTPC 228 shares with target weight, price, shares, cost, actual weight and signed drift, and a "get closer to the target weights" panel suggesting ₹4,44,000](docs/img/workbench.png)

![The Tracker with samples/sample_map.json loaded: the Large Cap Core basket expanded with invested, value, unrealised, return, realised and total, a holdings table where RELIANCE carries a CORE + POWER chip, and its recorded INFY sale; Power & Utilities and Hand-picked collapsed below it](docs/img/tracker.png)

![The dashboard on a demo account built from samples/sample_tradebook.csv and samples/sample_holdings.json: the tabs Overview, Live Holdings, Realised, Never Sold and The Paradox, the drop zone, then Combined profit over tiles for Realised, Unrealised and Worth now](docs/img/dashboard.png)

Every figure in these shots comes from the built-in sample or the files in [`samples/`](samples/), and
all of it is invented.

## Quick start

**Try it in 30 seconds.** Open [the Workbench](https://sharecase-mu.vercel.app/basket.html), click
**Try it with sample data**, pick **No — this is my first buy**, type an amount and press
**Calculate orders**. For the Tracker, drop [`samples/sample_map.json`](samples/sample_map.json) on
[the Tracker page](https://sharecase-mu.vercel.app/baskets.html): three invented baskets, one stock
shared by two of them, and a hand-kept sales ledger.

**Run it locally.**

```bash
git clone https://github.com/udaysrinu/sharecase.git && cd sharecase
npx vercel dev               # pages and /api/price, as in production -> http://localhost:3000/basket.html
python3 -m http.server 8899  # or any static server   -> http://localhost:8899/basket.html
```

A static server has no `/api/price`, so the **Refresh prices from the market** button, and the
Tracker's current value, need `npx vercel dev`. Sizing, rebalancing and the Kite handoff still work
from the prices in the sheet.

**Deploy your own copy.** `npx vercel` from the repo root, or on vercel.com **Add New → Project →
import the repo → Deploy**. There are no environment variables and no secrets. For one-click
ordering, register your own deployment's address as the redirect URL in your Kite app.

## Privacy

No account, no analytics, no key in this repo. Files you drop are read in the browser; only stock
symbols go to the app's own `/api/price`, and orders and your `api_key` go only to Kite, when you
press **Place in Kite**. A sheet built from an order email or holdings file carries your real share
counts, so sharing it shares them. The full list is in [the guide](docs/GUIDE.md#what-leaves-your-browser).

[MIT](LICENSE) · not investment advice
