# Export Expenses — Period Overview

A redesign of the Traqspera **Export Expenses** page that solves the "can't load
every unexported expense at once" problem.

Built with **React + TypeScript + Vite** and the **Modus Web Components** design
system (v1.9.1).

## The problem

The original page tried to load every expense that still needs to be exported.
That is slow, so users were forced to pick a date range up front — but they have
no way of knowing *which* periods actually contain pending expenses.

## The solution: a Period Overview

Instead of a blank page that demands a date filter, users land on a lightweight
**year → month tile grid**:

- **Year selector** switches between the years that have data.
- A **summary strip** shows the year totals (expenses, employees, total cost).
- A grid of **month tiles** shows, per month, the count of expenses ready to
  export, the number of employees, and the total dollar amount. Months with
  nothing pending are visually muted.
- Clicking a tile **drills into just that month** and lazily loads the full
  expense table (grouped by employee, with filters and export actions).

Why this fixes it: the overview only needs cheap **aggregate counts per month**,
so nothing heavy loads up front. The full expense rows are fetched **one period
at a time**, and users instantly see where the pending expenses are.

The same pattern powers both the **Ready to be Exported** and **Exported
Expenses** tabs.

## Project structure

```
src/
  data/expenses.ts          Mock data + aggregation helpers (counts per period)
  components/
    PeriodOverview.tsx      Year selector, summary strip, tile grid
    MonthTile.tsx           A single month tile (count / employees / total)
    MonthDetail.tsx         Employee-grouped expense table + filters + export
  App.tsx                   App shell: navbar, tabs, view routing
```

> The data layer is mock data generated on the client. To connect it to the real
> system, replace the functions in `src/data/expenses.ts` with API calls — keep
> `getPeriodSummaries` as a cheap aggregate endpoint and `getExpensesForPeriod`
> as the per-month detail endpoint.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview the production build
```

## Deploying to GitHub Pages

`vite.config.ts` uses `base: './'` so the build works under any GitHub Pages
path without extra configuration.

### Option A — GitHub Actions (recommended)

A workflow is included at `.github/workflows/deploy.yml`. After pushing to
GitHub:

1. Create the repo and push to the `main` branch.
2. In the repo, go to **Settings → Pages → Build and deployment** and set the
   **Source** to **GitHub Actions**.
3. Every push to `main` builds and publishes automatically.

### Option B — manual, from your machine

```bash
npm run deploy   # builds and pushes dist/ to the gh-pages branch
```

Then set **Settings → Pages → Source** to the `gh-pages` branch.
