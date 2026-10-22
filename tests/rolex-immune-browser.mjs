/* Test the isolated ROLEX Immune prototype against a local static server. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { chromium, devices } from "playwright";

const BASE = "http://127.0.0.1:8765";
const SHARE_URL = "https://humanincpractice.com/observations/rolex/immune/";
const SOURCE = "https://newsroom.rolex.com/about-rolex/rolex-certified-pre-owned-programme";
const artifacts = new URL("./artifacts/", import.meta.url);
await mkdir(artifacts, { recursive: true });
const server = spawn("python3", ["-m", "http.server", "8765", "--bind", "127.0.0.1"], {
  cwd: new URL("../", import.meta.url), stdio: "ignore"
});
let browser;
const errors = [];
function check(ok, label) {
  assert.ok(ok, label);
  console.log("PASS " + label);
}
function collect(page) {
  page.on("pageerror", error => errors.push(error.message));
}
try {
  let ready = false;
  for (let n = 0; n < 50; n++) {
    try {
      ready = (await fetch(BASE + "/hiobs.html")).ok;
      if (ready) break;
    } catch {}
    await new Promise(done => setTimeout(done, 200));
  }
  check(ready, "Local prototype server started");
  const response = await fetch(BASE + "/observations/rolex/immune/");
  check(response.ok, "ROLEX static route resolves");
  const html = await response.text();
  check(html.includes('<meta property="og:title" content="ROLEX — Immune | Human Inc. Observations">'),
    "Open Graph title exists in server-delivered HTML");
  check(html.includes('<meta property="og:url" content="' + SHARE_URL + '">'),
    "Open Graph URL is the approved individual permalink");
  check(html.includes('property="og:image" content="https://humanincpractice.com/observations/assets/rolex-immune-og.png"') &&
        html.includes('name="twitter:card" content="summary_large_image"'),
    "The approved typographic preview appears in static social metadata");
  const imageResponse = await fetch(BASE + "/observations/assets/rolex-immune-og.png");
  check(imageResponse.ok && imageResponse.headers.get("content-type")?.startsWith("image/png"),
    "Static server delivers the ROLEX preview PNG to social crawlers");
  const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
  check(imageBytes.length > 4000 && imageBytes.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10",
    "Preview asset has valid PNG signature and content");
  check(html.includes("Identity preserved through change.") && html.includes(SOURCE),
    "Canonical observation and source are present without JavaScript");

  browser = await chromium.launch({ headless: true });
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ["clipboard-read", "clipboard-write"]
  });
  const page = await desktop.newPage();
  collect(page);
  await page.goto(BASE + "/hiobs.html", { waitUntil: "networkidle" });
  check(await page.locator("#hiobs-grid .observation-card").count() === 12,
    "Existing initial HIOBS grid renders all twelve cards");
  await page.locator("#hiobs-selector .hiobs-selector-button").filter({ hasText: "ROLEX" }).click();
  check(await page.locator("#hiobs-grid .observation-card").count() === 12,
    "Existing ROLEX subject selection renders all twelve systems");
  const card = page.locator("#hiobs-grid .observation-card.system-immune");
  check((await card.locator(".observation-subject").innerText()).trim() === "ROLEX",
    "Correct ROLEX Immune card identified");
  check(!(await card.locator(".observation-share-region").isVisible()),
    "Share control is hidden until observation opens");
  await card.locator(".observation-card-trigger").click();
  check(await card.locator(".observation-share-region").isVisible(),
    "Expanded observation contains the minimal sharing control");
  check(await page.locator("#hiobs-grid .observation-share-button").count() === 1,
    "Other eleven ROLEX observations have no new share control");
  const colors = await card.evaluate(el => {
    const s = getComputedStyle(el);
    return [s.backgroundColor, s.color];
  });
  check(colors[0] === "rgb(253, 253, 253)" && colors[1] === "rgb(77, 120, 136)",
    "Original HIOBS Immune palette is unchanged");
  await card.locator(".observation-share-button").click();
  check((await page.evaluate(() => navigator.clipboard.readText())) === SHARE_URL,
    "Desktop Copy link copies exactly the approved permalink");

  await page.goto(BASE + "/observations/rolex/immune/", { waitUntil: "networkidle" });
  check((await page.title()) === "ROLEX — Immune | Human Inc. Observations",
    "Standalone title is correct");
  check((await page.locator(".observation-system").textContent()).trim() === "Immune",
    "Standalone visible label omits the word System");
  check((await page.locator(".observation-source-link").getAttribute("href")) === SOURCE,
    "Standalone public citation is preserved");
  check((await page.locator(".observation-card").evaluate(el => getComputedStyle(el).backgroundColor)) ===
    "rgb(253, 253, 253)", "Standalone card inherits original Immune background");
  await page.screenshot({ path: new URL("desktop.png", artifacts).pathname, fullPage: true });
  await page.getByRole("link", { name: /View within HIOBS/ }).click();
  check(new URL(page.url()).searchParams.get("subject") === "ROLEX" &&
        new URL(page.url()).searchParams.get("system") === "immune",
    "Returning URL targets the original observation");
  check(await page.locator("#hiobs-grid .observation-card.system-immune.open").count() === 1,
    "Returning visitor finds ROLEX Immune already expanded");
  await page.goto(BASE + "/hiobs.html", { waitUntil: "networkidle" });
  await page.locator(".observe-mode[data-mode=system]").first().click();
  check(await page.locator("#hiobs-grid .observation-card").count() === 12,
    "Existing system-mode toggle continues to work");
  check(await page.locator("#hiobs-grid .observation-share-button").count() === 0,
    "Unrelated system cards remain unchanged");
  await desktop.close();

  const { browserName: _browserName, ...phoneSettings } = devices["iPhone 13"];
  const mobile = await browser.newContext(phoneSettings);
  await mobile.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async payload => { window.__sharedPayload = payload; }
    });
  });
  const phone = await mobile.newPage();
  collect(phone);
  await phone.goto(BASE + "/hiobs.html", { waitUntil: "networkidle" });
  await phone.locator("#hiobs-selector .hiobs-selector-button").filter({ hasText: "ROLEX" }).click();
  const mobileCard = phone.locator("#hiobs-grid .observation-card.system-immune");
  await mobileCard.locator(".observation-card-trigger").click();
  await mobileCard.locator(".observation-share-button").click();
  check((await phone.evaluate(() => window.__sharedPayload))?.url === SHARE_URL,
    "Mobile native share receives exact ROLEX permalink");
  await phone.goto(BASE + "/observations/rolex/immune/", { waitUntil: "networkidle" });
  check(await phone.locator(".observation-source-link").isVisible(),
    "Mobile standalone page exposes the observation source");
  await phone.screenshot({ path: new URL("mobile.png", artifacts).pathname, fullPage: true });
  await phone.getByRole("link", { name: /View within HIOBS/ }).click();
  check(await phone.locator("#hiobs-grid .observation-card.system-immune.open").count() === 1,
    "Mobile link returns to expanded ROLEX Immune card");
  await mobile.close();
  assert.deepEqual(errors, [], "No unexpected JavaScript errors");
  console.log("PASS Browser reported no JavaScript errors");
  console.log("Browser tests passed; nothing published.");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
