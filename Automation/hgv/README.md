# QA Blueprint Playwright Suite

This folder is a standalone Playwright project generated from `blueprint.json`.

## First-time setup

```bash
npm install
npx playwright install chromium
```

## Run

```bash
npm test
```

Useful variants:

```bash
npm run test:headed
npm run test:ui
npm run report
```

## Maintain

- Keep `blueprint.json` as the source of truth.
- Update selectors in `support/selectors.ts` only when a field cannot be found reliably.
- Update shared flow behavior in `support/flow-runner.ts`.
- Keep individual files under `tests/` small; they should call helpers, not hold infrastructure.
