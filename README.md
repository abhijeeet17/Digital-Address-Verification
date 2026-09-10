# Digital Address Verification

Address verification form with a Node.js/Express API and browser UI.

## Setup

```bash
npm install
npm start
```

Open http://localhost:3002 in a browser.

## Tests

Run the Phase 2 regression tests with:

```bash
npm test -- --runInBand
```

The test suite intentionally fails because it documents and detects the 12 confirmed bugs from the Phase 2 bug report. A result of `12 failed, 12 total` is expected until the optional production fixes are implemented.

## Project Structure

- `server.js` - Express server and address API
- `public/` - Browser form and UI assets
- `__tests__/phase2-regressions.test.js` - Automated regression tests
- `data.js` - Seed submission data
- `isolation.js` - Per-session in-memory data store

## Tools Used

VS Code, Node.js, npm, Jest, Supertest, and jsdom.
