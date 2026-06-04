import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "docs", "screenshots");
const BASE = process.env.WEB_BASE ?? "http://localhost:5173";
const HOUSEHOLD_ID = process.env.HOUSEHOLD_ID ?? "cmpzslru40000xz5ejq5k3jrr";

const shots = [
  { file: "01-households.png", url: `${BASE}/households` },
  {
    file: "02-dashboard.png",
    url: `${BASE}/households/${HOUSEHOLD_ID}/dashboard`,
  },
  {
    file: "03-tenants.png",
    url: `${BASE}/households/${HOUSEHOLD_ID}/tenants`,
  },
  {
    file: "04-expenses.png",
    url: `${BASE}/households/${HOUSEHOLD_ID}/expenses`,
  },
  {
    file: "05-balances.png",
    url: `${BASE}/households/${HOUSEHOLD_ID}/balances`,
  },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });

  for (const { file, url } of shots) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const outPath = path.join(OUT_DIR, file);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log("wrote", outPath);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
