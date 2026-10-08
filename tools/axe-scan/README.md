# axe-scan

Automated WCAG 2.2 A/AA scan of a list of pages with [Playwright](https://playwright.dev) and
[axe-core](https://github.com/dequelabs/axe-core).

```bash
npm ci
node scan.mjs pages.json                                   # public pages
npm run login -- https://app.example/login                 # log in by hand, then close the window
node scan.mjs pages.json --auth .auth/state.json           # authenticated pages
node scan.mjs pages.json --auth .auth/state.json --out results
```

`pages.json`:

```json
[
  { "name": "Home", "url": "https://app.example/home", "waitFor": "main" },
  { "name": "Vitals form", "url": "https://app.example/chart", "waitFor": "text=Vitals", "click": "role=button[name=\"Add\" s]" }
]
```

- `waitFor` is a selector to wait for. Single-page apps that poll never reach "network idle",
  so the scan waits for the page's own content instead.
- `click` is clicked before scanning, to audit side panels and dialogs.
- The login step is manual on purpose: the tool never stores or types credentials. The session
  is saved in `.auth/` (git-ignored).
- Output: a summary in the terminal and a JSON file with violations and items that need manual
  review, per page.

Rules: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`.
