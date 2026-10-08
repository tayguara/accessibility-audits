// Automated WCAG 2.2 A/AA scan (axe-core) over a list of pages.
// Usage: node scan.mjs <pages.json> [--auth .auth/state.json] [--out <dir>]
// pages.json: [{ "name": "Login", "url": "https://...", "waitFor": "optional selector",
//                "click": "optional selector clicked before the scan (opens a panel or dialog)" }]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const [file, ...rest] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node scan.mjs <pages.json> [--auth .auth/state.json] [--out <dir>]');
  process.exit(1);
}
const option = (flag) => {
  const i = rest.indexOf(flag);
  return i >= 0 ? rest[i + 1] : undefined;
};
const auth = option('--auth');
const outDir = option('--out') ?? 'results';
if (auth && !existsSync(auth)) {
  console.error(`Session not found: ${auth}. Create it with: npm run login -- <url>`);
  process.exit(1);
}

const pages = JSON.parse(readFileSync(file, 'utf8'));
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  ...(auth ? { storageState: auth } : {}),
});
const page = await context.newPage();
const report = { date: new Date().toISOString(), tags: TAGS, pages: [] };

const summarize = (list) =>
  list.map((v) => ({
    rule: v.id,
    impact: v.impact,
    criteria: v.tags.filter((t) => /^wcag\d{3,4}$/.test(t)),
    nodes: v.nodes.length,
    examples: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
    help: v.help,
  }));

for (const { name, url, waitFor, click } of pages) {
  // SPAs that poll never reach "networkidle": wait for the page's own selector plus a short render pause.
  await page.goto(url, { waitUntil: 'load' });
  if (waitFor) await page.locator(waitFor).first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(2_000);
  if (click) {
    await page.locator(click).first().click();
    await page.waitForTimeout(2_000);
  }
  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const entry = {
    name,
    url,
    finalUrl: page.url(),
    title: await page.title(),
    axe: result.testEngine.version,
    violations: summarize(result.violations),
    needsReview: summarize(result.incomplete),
  };
  report.pages.push(entry);

  console.log(`\n## ${name} — ${entry.finalUrl}`);
  console.log(`Title: ${entry.title}`);
  for (const v of entry.violations) {
    console.log(`  ✗ ${v.rule} [${v.impact}] ${v.criteria.join(',')} — ${v.nodes} node(s): ${v.help}`);
  }
  for (const v of entry.needsReview) {
    console.log(`  ? ${v.rule} ${v.criteria.join(',')} — ${v.nodes} to review: ${v.help}`);
  }
}

await browser.close();
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${basename(file, '.json')}-${report.date.slice(0, 10)}.json`);
writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
console.log(`\nFull result: ${out}`);
