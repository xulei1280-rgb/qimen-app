// Shared setup for the local Playwright UI checks (check-*.cjs).
// Env (all optional):
//   PLAYWRIGHT_PATH  folder/module path of playwright if it isn't resolvable via require('playwright')
//   BASE_URL         where the site is served, default http://127.0.0.1:8000
//   PW_CHANNEL       browser channel, e.g. msedge or chrome (default: Playwright's bundled Chromium)
// If Playwright can't be loaded, prints SKIP and exits 0.
let chromium;
for (const id of [process.env.PLAYWRIGHT_PATH, 'playwright'].filter(Boolean)) {
  try { chromium = require(id).chromium; break; } catch (e) {}
}
if (!chromium) {
  console.log('SKIP ' + require('node:path').basename(process.argv[1]) + ': Playwright not found' + (process.env.PLAYWRIGHT_PATH ? ' at PLAYWRIGHT_PATH=' + process.env.PLAYWRIGHT_PATH : '') + '. Install it (npm i -D playwright) or set PLAYWRIGHT_PATH.');
  process.exit(0);
}
const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const launchOptions = { headless: true };
if (process.env.PW_CHANNEL) launchOptions.channel = process.env.PW_CHANNEL;
module.exports = { chromium, launchOptions, url: (page) => BASE_URL + '/' + page };
