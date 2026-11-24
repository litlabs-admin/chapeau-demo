// Capture the graphics timeline as transparent PNG frames.
//   node pipeline/capture.cjs [--frames a-b | --at f1,f2,...] [--workers 4] [--out build/gfx]
// Writes <out>/{back,front,glass}/NNNNN.png (RGBA, 1920x1080) and <out>/plate.json.
// glass = white where frosted panels sit (the compositor blurs the picture there).
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const out = opt("--out", "build/gfx");
const workers = parseInt(opt("--workers", "4"), 10);
const page = "file://" + path.resolve(__dirname, "gfx/index.html");

(async () => {
  const total = (() => {
    const src = fs.readFileSync(path.join(__dirname, "gfx/data.js"), "utf8");
    return parseInt(src.match(/TOTAL_FRAMES = (\d+)/)[1], 10);
  })();
  let frames;
  if (opt("--at")) frames = opt("--at").split(",").map(Number);
  else {
    const [a, b] = (opt("--frames", `0-${total - 1}`)).split("-").map(Number);
    frames = [];
    for (let f = a; f <= b; f++) frames.push(f);
  }
  for (const l of ["back", "front", "glass"]) fs.mkdirSync(path.join(out, l), { recursive: true });
  const browser = await chromium.launch();
  const chunk = Math.ceil(frames.length / workers);
  const t0 = Date.now();
  let done = 0;
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const mine = frames.slice(w * chunk, (w + 1) * chunk);
    if (!mine.length) return;
    const p = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    await p.goto(page);
    await p.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
    });
    for (const f of mine) {
      await p.evaluate((f) => window.renderFrame(f), f);
      for (const l of ["back", "front", "glass"]) {
        await p.evaluate((l) => { document.body.dataset.layer = l; }, l);
        await p.screenshot({ path: path.join(out, l, String(f).padStart(5, "0") + ".png"), omitBackground: true });
      }
      done++;
      if (done % 100 === 0) console.log(`${done}/${frames.length} frames, ${(done / ((Date.now() - t0) / 1000)).toFixed(1)} fps`);
    }
    await p.close();
  }));
  // plate track (Ben's framing / card / blur per frame) for the compositor
  const pp = await browser.newPage();
  await pp.goto(page);
  const plate = await pp.evaluate((n) => { const out = []; for (let f = 0; f < n; f++) out.push(window.plate ? window.plate(f) : null); return out; }, total);
  fs.writeFileSync(path.join(out, "plate.json"), JSON.stringify(plate));
  // sound cues placed by the timeline on the same events
  fs.writeFileSync(path.join(out, "sfx.json"), JSON.stringify(await pp.evaluate(() => window.SFX || []), null, 0));
  await browser.close();
  console.log(`captured ${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
