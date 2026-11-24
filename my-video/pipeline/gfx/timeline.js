/* Seekworthy launch: motion timeline, rebuilt on the reference film's language
 * (Arist launch, studied frame by frame):
 *  - small regular-weight type, word by word as he speaks, in a corner, one
 *    key word in the brand colour;
 *  - chained match-cut transitions: tile mosaic -> white canvas -> tiles
 *    assemble -> collapse to one square -> the square becomes a thumbnail
 *    of the speaker -> expands to full frame; footage shrinks into cards
 *    among UI; split screens whose UI list updates as he talks;
 *  - frosted-glass panels over (blurred) footage, white UI cards on flat
 *    brand-colour or soft gradient canvases, a dot-grid app-icon moment,
 *    and a gradient "Is yours?" ending into the logo.
 * Seekworthy colours replace Arist's: flat blue for the red, blue/cyan/white
 * gradients, lime as the accent on footage.
 *
 * Exports per frame: window.renderFrame(f) (DOM for layers back/front/glass),
 * window.plate(f) (where the footage sits: zoom, card rect, blur) and
 * window.SFX (sound cues placed on the same events).
 */
(() => {
  const FPS = 30, W = 1920, H = 1080;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const E = {
    lin: (x) => x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inCubic: (x) => x * x * x,
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    outQuint: (x) => 1 - Math.pow(1 - x, 5),
    inOutQuint: (x) => (x < 0.5 ? 16 * Math.pow(x, 5) : 1 - Math.pow(-2 * x + 2, 5) / 2),
    outBack: (x) => { const c1 = 1.3, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  };
  const tw = (t, t0, t1, e = E.outCubic) => e(clamp((t - t0) / Math.max(1e-6, t1 - t0)));
  const $ = (tag, cls, parent, html) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html !== undefined) el.innerHTML = html;
    if (parent) parent.appendChild(el);
    return el;
  };
  const css = (el, o) => { for (const k in o) el.style[k] = o[k]; return el; };
  const blur = (el, b) => { el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none"; };
  const BACK = document.getElementById("back");
  const FRONT = document.getElementById("front");
  const A = "../../assets/";
  const icon = (k, s) => `<img src="${A}engines/${k}.svg" style="width:${s}px;height:${s}px;display:block">`;
  const MARK = `${A}brand/mark.png`;
  const ENG = [["chatgpt", "ChatGPT"], ["claude", "Claude"], ["perplexity", "Perplexity"], ["gemini", "Gemini"], ["grok", "Grok"], ["deepseek", "DeepSeek"]];
  const fav = (l, c, s, r = 12) => `<span class="fav" style="width:${s}px;height:${s}px;background:${c};font-size:${Math.round(s * 0.46)}px;border-radius:${r}px">${l}</span>`;
  const typed = (txt, t, t0, t1) => txt.slice(0, Math.round(clamp((t - t0) / (t1 - t0)) * txt.length));
  const caretOn = (t) => Math.floor(t * 2.2) % 2 === 0;
  const count = (t, t0, t1, v0, v1) => Math.round(lerp(v0, v1, tw(t, t0, t1, E.outQuint)));
  function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; }

  // ---------------------------------------------------------------- the spoken words drive every cue
  const WORDS = window.WORDS;
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, "");
  function find(phrase, after = 0) {
    const toks = phrase.split(" ").map(norm);
    for (let i = 0; i < WORDS.length; i++) {
      if (WORDS[i].s < after - 0.01) continue;
      let ok = true;
      for (let j = 0; j < toks.length; j++) if (!WORDS[i + j] || norm(WORDS[i + j].w) !== toks[j]) { ok = false; break; }
      if (ok) return i;
    }
    throw new Error("phrase not found: " + phrase + " after " + after);
  }
  const P = (ph, after) => WORDS[find(ph, after)].s;
  const PE = (ph, after) => { const i = find(ph, after); return WORDS[i + ph.split(" ").length - 1].e; };
  const SEG = (prefix) => { const s = window.SEGS.filter((x) => x.label.startsWith(prefix)); if (!s.length) throw new Error("seg " + prefix); return { t0: s[0].t0, t1: s[s.length - 1].t1 }; };
  const END = window.TOTAL_FRAMES / FPS;

  // ---------------------------------------------------------------- sound cues (exported for the mix)
  const SFX = [];
  const sfx = (t, name, g = 0, extra = {}) => SFX.push(Object.assign({ t: +t.toFixed(3), name, g }, extra));
  window.SFX = SFX;

  // ---------------------------------------------------------------- plate track: where the footage is
  const FULL = { z: 1, ax: 0.5, ay: 0.38, x: 0, y: 0, w: W, h: H, r: 0, blur: 0, dim: 0, show: 1, op: 1 };
  const PK = [];
  const key = (t, st, e = "inOutCubic") => PK.push({ t, st: Object.assign({}, FULL, st), e });
  let sorted = false;
  window.plate = (f) => {
    if (!sorted) { PK.sort((a, b) => a.t - b.t); sorted = true; }
    const t = f / FPS;
    let i = 0;
    while (i + 1 < PK.length && PK[i + 1].t <= t) i++;
    const k0 = PK[i], k1 = PK[i + 1];
    if (!k1 || t < k0.t || k1.e === "step") return k0.st;
    const p = E[k1.e](clamp((t - k0.t) / (k1.t - k0.t)));
    const o = {};
    for (const n in FULL) o[n] = lerp(k0.st[n], k1.st[n], p);
    o.show = k0.st.show;
    return o;
  };

  // ---------------------------------------------------------------- beats
  const beats = [];
  const beat = (layer, t0, t1, build) => {
    const root = $("div", "abs", layer === "back" ? BACK : FRONT);
    css(root, { left: 0, top: 0, width: `${W}px`, height: `${H}px` });
    beats.push({ t0, t1, root, update: build(root) });
  };

  /** Word-by-word type, the reference's signature: each word appears as it is spoken.
   *  lines: strings, *word* = accent. o: {x,y,align,size,after,out,dark,w} */
  function say(r, lines, o) {
    const box = $("div", "abs", r);
    css(box, { top: `${o.y}px`, fontSize: `${o.size || 66}px`, fontWeight: 400, letterSpacing: "-0.022em", lineHeight: "1.1",
      color: o.dark ? "var(--ink)" : "#fff", textShadow: o.dark ? "none" : "0 2px 28px rgba(0,0,0,.35)", textAlign: o.align || "left" });
    if (o.align === "right") box.style.right = `${W - o.x}px`;
    else if (o.align === "center") { box.style.left = "0px"; box.style.width = `${W}px`; }
    else box.style.left = `${o.x}px`;
    let cursor = o.after ?? 0;
    const ws = [];
    for (const line of lines) {
      const ln = $("div", "", box);
      css(ln, { whiteSpace: "nowrap" });
      line.split(" ").forEach((raw, j, arr) => {
        const acc = raw.startsWith("*") || raw.endsWith("*");
        const txt = raw.replace(/\*/g, "");
        const i = find(txt, cursor);
        cursor = WORDS[i].s;
        const w = $("span", "w", ln, txt + (j < arr.length - 1 ? " " : ""));
        if (acc) w.style.color = o.accent || (o.dark ? "var(--blue)" : "var(--lime)");
        ws.push({ el: w, at: WORDS[i].s });
      });
    }
    return {
      box,
      update(t) {
        for (const w of ws) {
          const p = tw(t, w.at - 0.04, w.at + 0.3, E.outCubic);
          w.el.style.opacity = p.toFixed(3);
          w.el.style.transform = `translateY(${(1 - p) * 12}px)`;
          blur(w.el, 7 * (1 - p));
        }
        const q = o.out == null ? 0 : tw(t, o.out - 0.24, o.out, E.inCubic);
        box.style.opacity = (1 - q).toFixed(3);
        blur(box, 10 * q);
      },
    };
  }
  /** Focus entrance/exit for UI pieces. */
  function show(el, t, tin, tout, o = {}) {
    const din = o.din ?? 0.4, dout = o.dout ?? 0.25;
    const p = tw(t, tin, tin + din, o.e || E.outExpo);
    const q = tout == null ? 0 : tw(t, tout - dout, tout, E.inCubic);
    el.style.opacity = (p * (1 - q)).toFixed(3);
    el.style.transform = `translate(${(o.dx ?? 0) * (1 - p)}px, ${(o.dy ?? 24) * (1 - p) - (o.dyOut ?? 0) * q}px) scale(${lerp(o.scale ?? 1, 1, p) * lerp(1, o.outScale ?? 1, q)})`;
    blur(el, (o.blur ?? 10) * (1 - p) + (o.blurOut ?? 8) * q);
    return p * (1 - q);
  }
  /** Full-frame canvas. kind: white | blue | grad */
  function canvas(r, kind) {
    const c = $("div", "abs", r);
    css(c, { left: 0, top: 0, width: `${W}px`, height: `${H}px` });
    if (kind === "white") c.style.background = "#ffffff";
    if (kind === "blue") c.style.background = "radial-gradient(1400px 900px at 70% 20%, #5873ff 0%, #3f5efb 45%, #3453f2 100%)";
    if (kind === "grad") {
      c.style.background = "radial-gradient(1100px 800px at 0% 100%, rgba(63,94,251,.95), rgba(63,94,251,0) 70%), radial-gradient(1000px 760px at 100% 0%, rgba(95,208,255,.9), rgba(95,208,255,0) 70%), radial-gradient(900px 600px at 100% 100%, rgba(63,94,251,.55), rgba(63,94,251,0) 70%), #f4f7ff";
      c.classList.add("ribs");
    }
    return c;
  }
  /** Big white input field in a frosted container (the reference's prompt UI). */
  function inputPill(r, x, y, w) {
    const wrap = $("div", "abs gl glass", r);
    css(wrap, { left: `${x}px`, top: `${y}px`, width: `${w}px`, padding: "12px", borderRadius: "28px" });
    const field = $("div", "", wrap);
    css(field, { background: "#fff", borderRadius: "18px", height: "84px", display: "flex", alignItems: "center", gap: "18px", padding: "0 14px 0 26px", boxShadow: "0 6px 18px -8px rgba(15,27,76,.25)" });
    field.innerHTML = `<span style="font-size:34px;color:var(--faint);font-weight:300">+</span><span class="tx" style="flex:1;font-size:34px;color:var(--ink);letter-spacing:-0.01em;white-space:nowrap;overflow:hidden"></span>
      <span class="go" style="width:58px;height:58px;border-radius:14px;background:var(--blue);display:flex;align-items:center;justify-content:center">
      <svg width="28" height="28" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    const tx = field.querySelector(".tx"), go = field.querySelector(".go");
    return {
      wrap,
      update(t, text, t0, t1, tap, placeholder = "") {
        const s = t >= t0 ? typed(text, t, t0, t1) : "";
        tx.innerHTML = s ? s + (t < (tap ?? t1 + 0.6) && caretOn(t) ? '<span style="color:var(--blue);font-weight:300">|</span>' : "") : `<span style="color:var(--faint)">${placeholder}</span>`;
        const k = tap == null ? 0 : Math.sin(Math.PI * clamp((t - tap) / 0.22));
        go.style.transform = `scale(${1 - 0.12 * k})`;
        go.style.background = tap != null && t > tap && t < tap + 0.4 ? "var(--blue-deep)" : "var(--blue)";
      },
    };
  }
  /** Soft brand bloom over the footage (the reference's colour wash). */
  function aura(r, t0, t1, side = "left", strength = 0.75) {
    const g = $("div", "abs", r);
    const L = side === "left";
    css(g, { left: L ? "-600px" : "900px", top: "300px", width: "1700px", height: "1200px", borderRadius: "50%",
      background: `radial-gradient(closest-side, rgba(${L ? "63,94,251" : "95,208,255"},${strength}), rgba(${L ? "95,208,255" : "63,94,251"},${strength * 0.35}) 55%, rgba(63,94,251,0) 100%)` });
    return (t) => {
      const v = tw(t, t0, t0 + 0.7, E.outCubic) * (1 - tw(t, t1 - 0.4, t1, E.inCubic));
      g.style.opacity = v.toFixed(3);
      g.style.transform = `translate(${(L ? 1 : -1) * (Math.sin(t * 0.5) * 50 - (1 - v) * 120)}px, ${(1 - v) * 120}px)`;
    };
  }

  // ================================================================ SCENES
  const tHookEnd = SEG("they ask").t0;
  const tLine3 = SEG("your competitor").t0;
  const tWould = P("Would");
  const tBen = SEG("I'm Ben").t0;
  const tThumb = PE("Would you know?") + 0.05;
  const tExpand = tBen + 0.04;
  key(0, {});

  // ---------------- 1. Hook: type + prompt + mosaic behind him
  beat("front", 0, tHookEnd + 0.05, (r) => {
    const a = say(r, ["Your next customer", "could ask *AI*"], { x: 1810, y: 770, align: "right", out: P("for") - 0.05 });
    const b = say(r, ["for a recommendation"], { x: 1810, y: 840, align: "right", after: P("for"), out: P("never") - 0.05 });
    const c = say(r, ["never hear", "your *name.*"], { x: 1810, y: 770, align: "right", after: P("never") - 0.05, out: tHookEnd + 0.02 });
    const inp = inputPill(r, 1130, 70, 700);
    const PROMPT = "Best sales platform for a B2B startup?";
    const t0 = P("ask") + 0.1;
    sfx(P("ask") - 0.05, "whoosh_short", -20);
    sfx(t0 + 0.05, "type", -21, { text: PROMPT, dur: 1.2 });
    sfx(t0 + 1.35, "ui_click", -12);
    return (t) => {
      a.update(t); b.update(t); c.update(t);
      show(inp.wrap, t, P("ask") - 0.08, P("never") + 0.25, { dy: -20, scale: 0.96, din: 0.45 });
      inp.update(t, PROMPT, t0, t0 + 1.2, t0 + 1.35, "Ask anything");
    };
  });
  // mosaic of brand tiles fading in behind Ben, with icon tiles popping
  const TS = 118, TG = 12, COLS = 15, ROWS = 8;
  const TOX = (W - (COLS * (TS + TG) - TG)) / 2, TOY = (H - (ROWS * (TS + TG) - TG)) / 2;
  const R = rng(42);
  const TILES = [];
  for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) {
    TILES.push({ x: TOX + cc * (TS + TG), y: TOY + rr * (TS + TG), a: [0, 0.16, 0.28, 0.42, 0.55][Math.floor(R() * 5)], d: R() });
  }
  const ICON_TILES = [3, 17, 26, 40, 52, 66, 73, 87, 98, 110].map((i, n) => ({ i, k: ENG[n % 6][0], n }));
  const LETTERS = [["R", "#d6608a"], ["L", "#2aa5b0"], ["P", "#e0913a"], ["S", "#8b5cf6"]];
  const tileFace = (ic, s) => (ic.n % 3 === 2 ? fav(LETTERS[ic.n % 4][0], LETTERS[ic.n % 4][1], Math.round(s * 0.62), 14) : icon(ic.k, Math.round(s * 0.52)));
  const tMosaic = P("never") - 0.15;
  beat("back", tMosaic - 0.05, tHookEnd + 0.05, (r) => {
    const els = TILES.map((tl) => {
      const e = $("div", "abs", r);
      css(e, { left: `${tl.x}px`, top: `${tl.y}px`, width: `${TS}px`, height: `${TS}px`, borderRadius: "10px", background: "#3f5efb" });
      return e;
    });
    const icons = ICON_TILES.map((ic) => {
      const e = $("div", "abs", r, tileFace(ic, TS));
      css(e, { left: `${TILES[ic.i].x}px`, top: `${TILES[ic.i].y}px`, width: `${TS}px`, height: `${TS}px`, borderRadius: "14px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px -10px rgba(0,0,0,.35)" });
      return e;
    });
    for (let n = 0; n < 7; n++) sfx(tMosaic + 0.15 + n * 0.09, "ui_select", -27, { pan: (n % 2 ? 0.4 : -0.4) });
    return (t) => {
      els.forEach((e, i) => { const tl = TILES[i]; e.style.opacity = (tl.a * tw(t, tMosaic + tl.d * 0.5, tMosaic + tl.d * 0.5 + 0.35)).toFixed(3); });
      icons.forEach((e, n) => {
        const k = tw(t, tMosaic + 0.15 + n * 0.08, tMosaic + 0.5 + n * 0.08, E.outBack);
        e.style.opacity = clamp(k * 1.5).toFixed(3);
        e.style.transform = `scale(${0.6 + 0.4 * k})`;
      });
    };
  });

  // ---------------- 2. White canvas: scattered tiles + "They ask ChatGPT..." -> tiles assemble -> shortlist card
  const tGives = P("It gives");
  const tCard = tGives + 0.55;
  beat("back", tHookEnd, tThumb + 0.6, (r) => { canvas(r, "white"); return () => {}; });
  const CARD = { w: 980, h: 760 };
  beat("front", tHookEnd, tLine3 + 0.1, (r) => {
    const clearZone = (tl) => tl.x + TS > 380 && tl.x < 1540 && tl.y + TS > 380 && tl.y < 660;
    const keep = TILES.map((tl, i) => ({ tl, i })).filter(({ tl, i }) => !clearZone(tl) && (tl.a > 0.2 || ICON_TILES.some((x) => x.i === i)));
    const cols = 12, size = 64, gap = 10;
    const gx = W / 2 - (cols * (size + gap)) / 2, gy = H / 2 - (Math.ceil(keep.length / cols) * (size + gap)) / 2;
    const els = keep.map(({ tl, i }, n) => {
      const ic = ICON_TILES.find((x) => x.i === i);
      const e = $("div", "abs", r, ic ? tileFace(ic, TS) : "");
      const solid = tl.a > 0.4;
      css(e, { left: 0, top: 0, width: `${TS}px`, height: `${TS}px`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", transformOrigin: "0 0",
        background: ic ? "#fff" : solid ? "#3f5efb" : "#d9e1ff", boxShadow: ic ? "0 10px 26px -12px rgba(15,27,76,.35)" : "none", border: ic ? "1.5px solid #e6e9f2" : "none" });
      return { e, tl, n, px: gx + (n % cols) * (size + gap), py: gy + Math.floor(n / cols) * (size + gap) };
    });
    const txt = say(r, ["They ask *ChatGPT*", "which company to work with."], { x: 0, y: 450, align: "center", size: 64, dark: true, after: tHookEnd - 0.2, out: tGives - 0.02 });
    sfx(tHookEnd - 0.04, "woosh_quick", -14);
    sfx(tGives + 0.02, "whoosh_light", -15);
    for (let n = 0; n < 8; n++) sfx(tGives + 0.05 + n * 0.035, "ui_select", -28, { pan: (n % 2 ? 0.3 : -0.3) });
    return (t) => {
      txt.update(t);
      const drift = t - tHookEnd;
      const asm = tw(t, tGives, tGives + 0.45, E.inOutQuint);
      const gone = tw(t, tCard - 0.1, tCard + 0.25, E.inCubic);
      els.forEach(({ e, tl, n, px, py }) => {
        const jx = Math.sin(n * 1.7 + drift * 0.6) * 6, jy = Math.cos(n * 1.3 + drift * 0.5) * 6;
        const x = lerp(tl.x + jx, px, asm), y = lerp(tl.y + jy, py, asm);
        const s = lerp(1, size / TS, asm) * lerp(1, 0.2, gone);
        const fx = lerp(x, W / 2 + (x - W / 2) * 0.4, gone), fy = lerp(y, H / 2 + (y - H / 2) * 0.4, gone);
        e.style.transform = `translate(${fx}px, ${fy}px) scale(${s})`;
        e.style.opacity = (tw(t, tHookEnd - 0.02, tHookEnd + 0.12) * (1 - gone)).toFixed(3);
      });
    };
  });

  // ---------------- 3. Shortlist card -> competitor / not mentioned -> collapses to one square -> thumbnail of Ben
  beat("front", tGives, tThumb + 0.15, (r) => {
    const glowA = $("div", "abs", r), glowB = $("div", "abs", r);
    css(glowA, { left: "-500px", top: "560px", width: "1300px", height: "900px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(63,94,251,.32), rgba(63,94,251,0))" });
    css(glowB, { left: "1250px", top: "-400px", width: "1200px", height: "900px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(95,208,255,.38), rgba(95,208,255,0))" });
    const card = $("div", "abs card", r);
    css(card, { padding: "40px 46px", overflow: "hidden", transformOrigin: "50% 50%" });
    const inner = $("div", "", card);
    css(inner, { width: `${CARD.w - 92}px` });
    inner.innerHTML = `
      <div style="display:flex;justify-content:flex-end"><span style="background:var(--surface);border-radius:22px 22px 6px 22px;padding:16px 26px;font-size:30px;color:var(--ink)">Best sales platform for a B2B startup?</span></div>
      <div style="display:flex;align-items:center;gap:14px;margin-top:26px;font-size:28px;color:var(--muted)">${icon("chatgpt", 38)}<span>ChatGPT</span></div>
      <div style="font-size:32px;color:var(--body);margin-top:16px">Here's a shortlist worth comparing:</div>
      <div class="rows" style="margin-top:22px;display:flex;flex-direction:column;gap:14px"></div>`;
    const rows = [["1", "R", "#d6608a", "Revora", "Enterprise outbound"], ["2", "L", "#2aa5b0", "Leadsmith", "Data enrichment"], ["3", "P", "#e0913a", "Pipeworks", "Pipeline automation"]].map(([n, l, c, name, d]) => {
      const row = $("div", "", inner.querySelector(".rows"));
      css(row, { display: "flex", alignItems: "center", gap: "22px", height: "96px", padding: "0 24px", borderRadius: "18px", border: "1.5px solid var(--line)" });
      row.innerHTML = `<span style="width:30px;font-size:30px;color:var(--faint)">${n}</span>${fav(l, c, 52)}
        <span style="font-size:36px;font-weight:500;letter-spacing:-0.02em;position:relative;z-index:0">${name}<span class="mk" style="position:absolute;left:-6px;right:-6px;bottom:2px;height:14px;background:var(--lime);border-radius:4px;z-index:-1;transform-origin:left;transform:scaleX(0)"></span></span>
        <span style="font-size:28px;color:var(--muted)">${d}</span><span style="flex:1"></span>`;
      return row;
    });
    const tagC = $("span", "", rows[0], "Competitor");
    css(tagC, { fontSize: "26px", color: "var(--blue)", border: "1.5px solid var(--blue)", padding: "5px 16px", borderRadius: "999px" });
    const ghost = $("div", "", inner.querySelector(".rows"));
    css(ghost, { display: "flex", alignItems: "center", gap: "22px", height: "96px", padding: "0 24px", borderRadius: "18px", border: "2px dashed #c3c8d8" });
    ghost.innerHTML = `<span style="width:30px;font-size:30px;color:#c3c8d8">–</span>${fav("C", "#c3c8d8", 52)}<span style="font-size:36px;font-weight:500;color:#9aa1ba;letter-spacing:-0.02em">Closewise</span><span style="font-size:28px;color:var(--faint)">your brand</span><span style="flex:1"></span>`;
    const nm = $("span", "", ghost, "Not mentioned");
    css(nm, { fontSize: "26px", color: "var(--danger)", background: "#fdecef", padding: "6px 16px", borderRadius: "999px" });
    const wl = $("div", "abs", r, "Would you"), wr = $("div", "abs", r, "know?");
    css(wl, { right: `${W / 2 + 90}px`, top: "500px", fontSize: "64px", color: "var(--ink)", letterSpacing: "-0.02em" });
    css(wr, { left: `${W / 2 + 90}px`, top: "500px", fontSize: "64px", color: "var(--blue)", letterSpacing: "-0.02em" });
    sfx(tCard - 0.05, "pop", -20);
    sfx(P("competitor's") + 0.05, "shimmer_coin", -19);
    sfx(P("you're") + 0.05, "whoosh_short", -24);
    sfx(P("not.") + 0.02, "impact_low", -19, { len: 0.8 });
    sfx(tWould - 0.12, "woosh_quick", -15);
    return (t) => {
      const a = tw(t, tCard - 0.12, tCard + 0.35, E.outExpo);
      const k = tw(t, tWould - 0.12, tWould + 0.28, E.inOutQuint);
      const w = lerp(CARD.w, 96, k), h = lerp(CARD.h, 96, k);
      css(card, { left: `${W / 2 - w / 2}px`, top: `${H / 2 - h / 2 + lerp(0, 18, k)}px`, width: `${w}px`, height: `${h}px`, borderRadius: `${lerp(22, 20, k)}px`, background: k > 0.55 ? "#3f5efb" : "#fff" });
      card.style.opacity = (a * (1 - tw(t, tThumb + 0.02, tThumb + 0.1))).toFixed(3);
      card.style.transform = `scale(${lerp(0.9, 1, a)})`;
      inner.style.opacity = (1 - tw(t, tWould - 0.12, tWould + 0.02)).toFixed(3);
      glowA.style.opacity = glowB.style.opacity = (a * (1 - k)).toFixed(3);
      rows.forEach((row, i) => show(row, t, tCard + 0.1 + i * 0.12, null, { dy: 26, blur: 8, din: 0.35 }));
      rows[0].querySelector(".mk").style.transform = `scaleX(${tw(t, P("competitor's"), P("competitor's") + 0.3, E.outExpo)})`;
      show(tagC, t, P("competitor's") + 0.15, null, { dy: 0, dx: 20, din: 0.35 });
      show(ghost, t, P("you're") - 0.05, null, { dy: 30, din: 0.35 });
      show(nm, t, P("not."), null, { dy: 0, scale: 0.85, din: 0.3, e: E.outBack });
      const sh = t > P("not.") ? Math.sin((t - P("not.")) * 50) * 8 * Math.exp(-(t - P("not.")) * 8) : 0;
      nm.style.transform += ` translateX(${sh}px)`;
      show(wl, t, tWould, tExpand + 0.05, { dy: 14, blur: 8, din: 0.3, dout: 0.2 });
      show(wr, t, P("know?"), tExpand + 0.05, { dy: 14, blur: 8, din: 0.3, dout: 0.2 });
    };
  });
  key(tHookEnd - 0.001, {}, "lin");
  key(tHookEnd, { show: 0 }, "step");
  key(tThumb, { show: 1, x: W / 2 - 48, y: H / 2 - 48 + 18, w: 96, h: 96, r: 20 }, "step");
  key(tExpand + 0.45, { z: 1.0 }, "inOutQuint");
  sfx(tThumb + 0.05, "whoosh_light", -12);

  // ---------------- 4. I'm Ben / we help businesses see how they show up in AI answers
  const tWeHelp = P("We help");
  const tBut = SEG("but when").t0;
  beat("front", tBen, tBut + 0.05, (r) => {
    const a = say(r, ["I'm Ben,", "founder of *Seekworthy.*"], { x: 110, y: 790, after: tBen - 0.1, out: tWeHelp - 0.02 });
    const b = say(r, ["We help businesses see", "how they show up in *AI answers.*"], { x: 1810, y: 790, align: "right", after: tWeHelp - 0.1, out: tBut + 0.02 });
    const chips = ENG.map(([k], i) => {
      const c = $("div", "abs gd glass", r, `<div style="width:52px;height:52px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center">${icon(k, 34)}</div>`);
      css(c, { left: `${100 + i * 108}px`, top: "96px", width: "88px", height: "88px", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center" });
      return c;
    });
    const at = (i) => P("businesses") + 0.15 + i * 0.3;
    ENG.forEach((_, i) => sfx(at(i), "ui_hint", -24, { pan: -0.6 + i * 0.1 }));
    return (t) => {
      a.update(t); b.update(t);
      chips.forEach((c, i) => show(c, t, at(i), tBut + 0.02, { dy: 10, scale: 0.7, din: 0.35, e: E.outBack, blur: 6 }));
    };
  });
  beat("back", tWeHelp - 0.2, tBut + 0.1, (r) => aura(r, tWeHelp - 0.2, tBut + 0.05, "left", 0.8));

  // ---------------- 5. when a buyer asks AI for advice / part of the answer
  const tNeed = P("you need to know");
  const tThats = SEG("that's why").t0;
  beat("front", tBut, tThats + 0.05, (r) => {
    const a = say(r, ["But when a buyer", "asks AI for *advice,*"], { x: 110, y: 96, after: tBut - 0.1, out: tNeed - 0.02 });
    const b = say(r, ["you need to know if you show up", "as *part of the answer.*"], { x: 1810, y: 800, align: "right", after: tNeed - 0.1, out: tThats + 0.02 });
    const q = $("div", "abs gd glass pill", r, `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4" stroke-linecap="round"/></svg><span>Best sales platform for a 20-rep team?</span>`);
    css(q, { right: "110px", top: "470px", padding: "20px 30px", fontSize: "32px", color: "#fff", borderRadius: "18px" });
    sfx(P("asks", tBut) - 0.08, "whoosh_short", -22);
    return (t) => { a.update(t); b.update(t); show(q, t, P("asks", tBut) - 0.05, tNeed + 0.1, { dy: 16, scale: 0.96 }); };
  });
  key(tNeed - 0.001, { z: 1.03 }, "lin");
  key(tNeed, { z: 1.2, ay: 0.3 }, "step");
  key(tThats - 0.001, { z: 1.24, ay: 0.3 }, "lin");
  key(tThats, { z: 1.0 }, "step");

  // ---------------- 6. "Meet / Seekworthy" -> footage drops into a card -> card wall -> dot grid + app icon
  const tMeet = P("built") - 0.05;
  const tShrink = PE("built Seekworthy") + 0.02;
  const tGap = SEG("GAP logo").t0, tHelps = SEG("it helps").t0;
  beat("back", tThats, tShrink + 0.3, (r) => {
    const m = $("div", "abs", r, "Meet");
    css(m, { left: "70px", top: "40px", fontSize: "250px", fontWeight: 400, letterSpacing: "-0.04em", lineHeight: "1",
      background: "linear-gradient(180deg, #dfe5ff 0%, #9fb0ff 50%, #6f88ff 100%)", webkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" });
    m.style.webkitBackgroundClip = "text";
    const au = aura(r, tThats, tShrink + 0.2, "left", 0.7);
    return (t) => { au(t); show(m, t, tMeet, tShrink + 0.05, { dy: 20, blur: 14, din: 0.5, dout: 0.2 }); };
  });
  beat("front", tThats, tShrink + 0.3, (r) => {
    const s = $("div", "abs", r, "Seekworthy");
    css(s, { right: "110px", top: "700px", fontSize: "132px", fontWeight: 400, letterSpacing: "-0.04em", color: "#fff", textShadow: "0 2px 30px rgba(0,0,0,.3)" });
    const au = aura(r, tThats + 0.2, tShrink + 0.2, "right", 0.55);
    return (t) => { au(t); show(s, t, P("Seekworthy", tThats) - 0.02, tShrink + 0.05, { dy: 20, blur: 14, din: 0.5, dout: 0.2 }); };
  });
  const CW = 720, CH = 405;
  const BENCARD = { x: W / 2 - CW / 2, y: H / 2 - CH / 2 };
  const tWall = tShrink + 0.32, tZoomEnd = tWall + 0.45, tDots = Math.max(tGap + 0.4, tZoomEnd + 0.05);
  beat("back", tShrink - 0.02, tHelps + 0.3, (r) => {
    canvas(r, "blue");
    const world = $("div", "abs", r);
    css(world, { left: 0, top: 0, width: `${W}px`, height: `${H}px`, transformOrigin: "50% 50%" });
    const frag = (i) => {
      const kinds = [
        () => `<div style="display:flex;gap:16px;align-items:center">${icon("chatgpt", 40)}<div style="height:14px;width:300px;background:#e8ecf6;border-radius:7px"></div></div><div style="margin-top:28px;display:flex;gap:10px;align-items:flex-end;height:150px">${[60, 95, 70, 120, 88, 140, 104].map((h) => `<div style="flex:1;height:${h}px;border-radius:8px;background:${h > 110 ? "#3f5efb" : "#d9e1ff"}"></div>`).join("")}</div>`,
        () => `<div style="font-size:28px;color:var(--muted)">Visibility</div><div style="font-size:120px;font-weight:300;letter-spacing:-0.05em;color:var(--ink);line-height:1.1">68%</div><div style="height:12px;border-radius:6px;background:#e8ecf6"><div style="height:12px;width:68%;border-radius:6px;background:#3f5efb"></div></div>`,
        () => ENG.slice(0, 4).map(([k, n]) => `<div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">${icon(k, 34)}<span style="font-size:26px;color:var(--ink);width:150px">${n}</span><div style="flex:1;height:10px;border-radius:5px;background:#e8ecf6"><div style="height:10px;width:${40 + (k.length * 7) % 50}%;border-radius:5px;background:#3f5efb"></div></div></div>`).join(""),
      ];
      return kinds[((i % 3) + 3) % 3]();
    };
    const minis = [];
    for (let gy = -2; gy <= 2; gy++) for (let gx = -2; gx <= 2; gx++) {
      if (gx === 0 && gy === 0) continue;
      const c = $("div", "abs card", world, frag(gx * 7 + gy * 3 + 20));
      css(c, { left: `${BENCARD.x + gx * (CW + 48)}px`, top: `${BENCARD.y + gy * (CH + 48)}px`, width: `${CW}px`, height: `${CH}px`, padding: "36px 40px", borderRadius: "28px" });
      minis.push({ c, gx, gy });
    }
    const dots = [];
    for (let yy = 0; yy < 7; yy++) for (let xx = 0; xx < 11; xx++) {
      const d = $("div", "abs", r);
      css(d, { left: `${W / 2 - 5 * 150 + xx * 150 - 18}px`, top: `${H / 2 - 3 * 150 + yy * 150 - 18}px`, width: "36px", height: "36px", borderRadius: "8px", background: "#fff" });
      dots.push({ d, k: Math.hypot(xx - 5, yy - 3) });
    }
    const app = $("div", "abs", r, `<img src="${MARK}" style="width:120px;height:112px">`);
    css(app, { left: `${W / 2 - 105}px`, top: `${H / 2 - 105}px`, width: "210px", height: "210px", borderRadius: "48px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 18px rgba(255,255,255,.18), 0 30px 60px -20px rgba(10,20,90,.5)" });
    sfx(tShrink, "woosh_slide", -12);
    sfx(tWall - 0.05, "whoosh_light", -16);
    sfx(tDots - 0.12, "revcym_glassy", -16);
    sfx(tDots + 0.08, "subdrop", -10);
    sfx(tDots + 0.1, "shimmer_success", -14);
    return (t) => {
      const zoom = tw(t, tWall, tZoomEnd, E.inOutQuint);
      world.style.transform = `scale(${lerp(1, 0.42, zoom)})`;
      minis.forEach(({ c, gx, gy }) => {
        const dd = (Math.abs(gx) + Math.abs(gy)) * 0.05;
        const k = tw(t, tShrink + 0.15 + dd, tShrink + 0.5 + dd, E.outExpo);
        c.style.opacity = (k * (1 - tw(t, tDots - 0.2, tDots + 0.05))).toFixed(3);
        c.style.transform = `translate(${(1 - k) * gx * 160}px, ${(1 - k) * gy * 90}px)`;
      });
      dots.forEach(({ d, k }) => {
        const p = tw(t, tDots - 0.1 + k * 0.03, tDots + 0.25 + k * 0.03, E.outBack);
        d.style.opacity = (p * (k < 1.1 ? 0 : 0.85 - k * 0.06) * (1 - tw(t, tHelps - 0.15, tHelps + 0.1))).toFixed(3);
        d.style.transform = `scale(${0.3 + 0.7 * p})`;
      });
      const ap = tw(t, tDots, tDots + 0.4, E.outBack);
      app.style.opacity = (clamp(ap) * (1 - tw(t, tHelps - 0.05, tHelps + 0.15))).toFixed(3);
      app.style.transform = `scale(${(0.5 + 0.5 * ap) * lerp(1, 2.2, tw(t, tHelps - 0.15, tHelps + 0.15, E.inCubic))})`;
    };
  });
  key(tShrink - 0.001, { z: 1.0 }, "lin");
  key(tWall, { x: BENCARD.x, y: BENCARD.y, w: CW, h: CH, r: 28 }, "inOutQuint");
  { const s = 0.42; key(tZoomEnd, { x: W / 2 - CW * s / 2, y: H / 2 - CH * s / 2, w: CW * s, h: CH * s, r: 28 * s }, "inOutQuint"); }
  { const s = 0.42; key(tDots - 0.05, { x: W / 2 - CW * s / 2, y: H / 2 - CH * s / 2, w: CW * s, h: CH * s, r: 28 * s, op: 1 }, "lin"); }
  { const s = 0.3; key(tDots + 0.1, { x: W / 2 - CW * s / 2, y: H / 2 - CH * s / 2, w: CW * s, h: CH * s, r: 20, op: 0 }, "inCubic"); }
  key(tDots + 0.11, { show: 0 }, "step");

  // ---------------- 7. dashboard on the gradient canvas
  const tAcross = P("across AI platforms");
  const tStart = SEG("you start").t0;
  beat("back", tHelps - 0.15, tStart + 0.02, (r) => { const c = canvas(r, "grad"); return (t) => { c.style.opacity = tw(t, tHelps - 0.15, tHelps + 0.15).toFixed(3); }; });
  beat("front", tHelps - 0.1, tStart + 0.02, (r) => {
    const panel = $("div", "abs gl", r);
    css(panel, { left: "170px", top: "110px", width: "1580px", height: "860px", padding: "34px 40px", borderRadius: "32px" });
    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:18px">${fav("C", "#2b3560", 58, 16)}<span style="font-size:40px;color:var(--ink);letter-spacing:-0.02em">Closewise</span>
        <span style="font-size:30px;color:var(--muted)">AI visibility</span><span style="flex:1"></span><span style="font-size:28px;color:var(--muted)">24 buyer questions · 6 engines</span></div>
      <div class="row1" style="display:flex;gap:24px;margin-top:30px"></div>
      <div class="row2 card" style="margin-top:24px;padding:28px 34px"></div>`;
    const row1 = panel.querySelector(".row1"), row2 = panel.querySelector(".row2");
    const ring = $("div", "card", row1);
    css(ring, { flex: "1.35", height: "330px", display: "flex", alignItems: "center", gap: "30px", padding: "0 34px" });
    ring.innerHTML = `<svg width="230" height="230" viewBox="0 0 230 230"><circle cx="115" cy="115" r="96" stroke="#e8ecf6" stroke-width="18" fill="none"/>
      <circle class="arc" cx="115" cy="115" r="96" stroke="#3f5efb" stroke-width="18" fill="none" stroke-linecap="round" stroke-dasharray="603" stroke-dashoffset="603" transform="rotate(-90 115 115)"/>
      <text class="pct" x="115" y="132" text-anchor="middle" font-size="58" font-family="Inter Tight" fill="#0f1b4c" letter-spacing="-2">0%</text></svg>
      <div><div style="font-size:28px;color:var(--muted)">Visibility score</div><div style="font-size:40px;color:var(--ink);letter-spacing:-0.02em;margin-top:8px;line-height:1.2;white-space:nowrap">Named in <b class="hits" style="font-weight:500">0</b> of 24</div><div style="font-size:28px;color:var(--muted);margin-top:4px">buyer questions</div></div>`;
    const stat = (lab, html) => { const c = $("div", "card", row1); css(c, { flex: "1", height: "330px", padding: "34px 36px" }); c.innerHTML = `<div style="font-size:28px;color:var(--muted)">${lab}</div>${html}`; return c; };
    const rank = stat("Rank vs competitors", `<div style="font-size:150px;font-weight:300;letter-spacing:-0.06em;color:var(--ink);line-height:1.15">#<span class="rk">5</span></div><div style="font-size:28px;color:var(--muted)">of 10 tracked</div>`);
    const ment = stat("Mentions", `<div style="font-size:150px;font-weight:300;letter-spacing:-0.06em;color:var(--ink);line-height:1.15"><span class="mn">0</span></div><div style="font-size:28px;color:#1d8a5f">↗ +12 this week</div>`);
    row2.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:30px;color:var(--ink)"><span>By AI platform</span><span style="color:var(--muted);font-size:28px">share of answers</span></div><div class="bars" style="display:flex;gap:30px;margin-top:22px"></div>`;
    const bars = [["chatgpt", "ChatGPT", 78], ["claude", "Claude", 64], ["perplexity", "Perplexity", 59], ["gemini", "Gemini", 47], ["grok", "Grok", 36]].map(([k, n, v]) => {
      const b = $("div", "", row2.querySelector(".bars"));
      css(b, { flex: 1 });
      b.innerHTML = `<div style="display:flex;align-items:center;gap:12px;font-size:28px;color:var(--ink)">${icon(k, 32)}${n}<span class="v" style="margin-left:auto;color:var(--muted)"></span></div>
        <div style="height:12px;border-radius:6px;background:#e8ecf6;margin-top:14px"><div class="f" style="height:12px;border-radius:6px;background:linear-gradient(90deg,#3f5efb,#5fd0ff);transform-origin:left;transform:scaleX(0)"></div></div>`;
      return { v, f: b.querySelector(".f"), vv: b.querySelector(".v") };
    });
    const arc = ring.querySelector(".arc"), pct = ring.querySelector(".pct"), hits = ring.querySelector(".hits");
    const rk = rank.querySelector(".rk"), mn = ment.querySelector(".mn");
    const tA = tHelps + 0.1, tU = P("understand");
    sfx(tHelps - 0.12, "whoosh_light", -15);
    bars.forEach((_, i) => sfx(tAcross + 0.05 + i * 0.1, "ui_select", -26));
    return (t) => {
      show(panel, t, tA - 0.1, tStart + 0.02, { dy: 60, scale: 0.97, din: 0.6, dout: 0.18, blurOut: 12, outScale: 1.03 });
      panel.style.transform += ` scale(${lerp(1, 1.03, tw(t, tA, tStart, E.lin))})`;
      [ring, rank, ment].forEach((c, i) => show(c, t, tA + 0.15 + i * 0.12, null, { dy: 26, din: 0.45 }));
      const k = tw(t, tU, tU + 1.1, E.outQuint);
      arc.setAttribute("stroke-dashoffset", (603 * (1 - 0.68 * k)).toFixed(1));
      pct.textContent = Math.round(68 * k) + "%";
      hits.textContent = Math.round(16 * k);
      rk.textContent = t > tU + 0.9 ? "3" : t > tU + 0.45 ? "4" : "5";
      mn.textContent = count(t, tU + 0.2, tU + 1.4, 0, 142);
      show(row2, t, tAcross - 0.35, null, { dy: 30, din: 0.45 });
      bars.forEach((b, i) => { const g = tw(t, tAcross + i * 0.1, tAcross + 0.6 + i * 0.1, E.outQuint); b.f.style.transform = `scaleX(${g * b.v / 100})`; b.vv.textContent = Math.round(b.v * g) + "%"; });
    };
  });

  // ---------------- 8-9. website field over Ben -> split screen: questions -> engines -> mention
  const tReview = P("and review");
  const tChecks = SEG("Seekworthy checks").t0;
  const tShows = P("and shows");
  const tComp = SEG("competitors appear").t0;
  key(tStart - 0.001, { show: 0 }, "step");
  key(tStart, { z: 1.0 }, "step");
  key(tReview - 0.02, { z: 1.03 }, "lin");
  const SPLIT = { x: 56, y: 56, w: 640, h: 968, r: 26 };
  key(tReview + 0.42, SPLIT, "inOutQuint");
  key(tComp - 0.25, SPLIT, "lin");
  key(tComp + 0.12, { x: -700, y: 56, w: 640, h: 968, r: 26, op: 0 }, "inCubic");
  key(tComp + 0.13, { show: 0 }, "step");
  beat("front", tStart, tReview + 0.5, (r) => {
    const inp = inputPill(r, 1130, 70, 700);
    const t0 = P("start with") + 0.05, tap = P("website", tStart) + 0.3;
    sfx(tStart - 0.02, "whoosh_short", -22);
    sfx(t0 + 0.05, "type", -21, { text: "closewise.com", dur: 0.6 });
    sfx(tap, "ui_click", -12);
    return (t) => { show(inp.wrap, t, tStart + 0.02, tReview + 0.3, { dy: -20, scale: 0.96 }); inp.update(t, "closewise.com", t0, t0 + 0.6, tap, "yourcompany.com"); };
  });
  beat("back", tReview - 0.05, tComp + 0.2, (r) => {
    const c = canvas(r, "white");
    return (t) => { c.style.opacity = tw(t, tReview - 0.05, tReview + 0.2).toFixed(3); };
  });
  beat("front", tReview, tComp + 0.25, (r) => {
    const X = 790;
    const line = $("div", "abs", r);
    css(line, { left: `${X + 30}px`, top: "190px", width: "2px", height: "790px", background: "linear-gradient(#3f5efb, rgba(63,94,251,.08))", transformOrigin: "top" });
    const head = $("div", "abs", r);
    css(head, { left: `${X}px`, top: "100px", width: "1100px", height: "100px", overflow: "hidden" });
    const steps = [["1", "Buyer questions", tReview], ["2", "Checking 6 AI engines", tChecks], ["3", "Where you're mentioned", tShows]].map(([n, txt, at]) => {
      const p = $("div", "abs pill", head, `<span style="color:var(--blue);font-weight:500">${n}.</span><span>${txt}</span>`);
      css(p, { left: 0, top: "6px", fontSize: "38px", color: "var(--ink)", letterSpacing: "-0.02em", border: "1.5px solid var(--line)", borderRadius: "16px", padding: "14px 26px", whiteSpace: "nowrap", background: "#fff", boxShadow: "0 8px 24px -14px rgba(15,27,76,.3)" });
      return { p, at };
    });
    const Q = ["Best sales platform for a B2B startup?", "Closewise vs Revora", "Top AI tools for outbound SDR teams", "Which tool books the most meetings?", "Is Closewise good for small teams?"];
    const qs = Q.map((q, i) => {
      const e = $("div", "abs", r, q);
      css(e, { left: `${X + 70}px`, top: `${250 + i * 106}px`, fontSize: "34px", color: "var(--ink)", border: "1.5px solid var(--line)", borderRadius: "16px", padding: "18px 26px", background: "#fff", whiteSpace: "nowrap" });
      return e;
    });
    const qAt = (i) => P("questions", tReview) + i * 0.3;
    Q.forEach((_, i) => sfx(qAt(i), "ui_select", -24));
    const eng = ENG.map(([k, n], i) => {
      const e = $("div", "abs", r);
      css(e, { left: `${X + 70}px`, top: `${250 + i * 100}px`, width: "640px", height: "82px", display: "flex", alignItems: "center", gap: "20px", border: "1.5px solid var(--line)", borderRadius: "16px", padding: "0 24px", background: "#fff" });
      e.innerHTML = `${icon(k, 40)}<span style="font-size:34px;color:var(--ink);flex:1">${n}</span>
        <svg class="sp" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="14" stroke="#3f5efb" stroke-width="3.5" fill="none" stroke-dasharray="30 70" stroke-linecap="round"/></svg>
        <span class="ok" style="width:40px;height:40px;border-radius:50%;background:var(--blue);display:none;align-items:center;justify-content:center"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
      return { e, sp: e.querySelector(".sp"), ok: e.querySelector(".ok") };
    });
    const eAt = (i) => tChecks + 0.15 + i * 0.07, eDone = (i) => P("those questions") + 0.1 + i * 0.16;
    ENG.forEach((_, i) => sfx(eDone(i), "chime", -24 + i * 0.4, { pan: 0.2 }));
    const ans = $("div", "abs card", r);
    css(ans, { left: `${X + 70}px`, top: "250px", width: "980px", padding: "34px 38px" });
    ans.innerHTML = `<div style="display:flex;align-items:center;gap:14px;font-size:28px;color:var(--muted)">${icon("chatgpt", 36)}ChatGPT<span style="flex:1"></span><span class="m4" style="font-size:26px;color:var(--ink);background:var(--lime);padding:6px 16px;border-radius:999px">Mentioned in 4 of 6 engines</span></div>
      <div style="font-size:36px;line-height:1.45;color:var(--body);margin-top:20px;letter-spacing:-0.01em">For B2B startups, Revora is a common enterprise pick.
      <span style="position:relative;z-index:0;color:var(--ink);font-weight:500;white-space:nowrap"><span class="hb" style="position:absolute;left:-6px;right:-6px;top:6px;bottom:2px;background:var(--lime);border-radius:6px;z-index:-1;transform-origin:left;transform:scaleX(0)"></span>Closewise</span>
      stands out for fast setup and automated follow-ups.</div>`;
    const hb = ans.querySelector(".hb"), m4 = ans.querySelector(".m4");
    sfx(tShows + 0.05, "whoosh_short", -22);
    sfx(P("mentioned") + 0.05, "shimmer_coin", -16);
    sfx(P("mentioned") + 0.35, "notify", -20);
    return (t) => {
      line.style.transform = `scaleY(${tw(t, tReview + 0.2, tReview + 0.9, E.outCubic)})`;
      steps.forEach((s, i) => {
        const nx = steps[i + 1];
        const inn = tw(t, s.at - 0.05, s.at + 0.3, E.outExpo), out = nx ? tw(t, nx.at - 0.05, nx.at + 0.25, E.inOutCubic) : 0;
        s.p.style.transform = `translateY(${(1 - inn) * 90 - out * 90}px)`;
        s.p.style.opacity = (inn * (1 - out)).toFixed(3);
      });
      qs.forEach((e, i) => show(e, t, qAt(i), tChecks + 0.05 + i * 0.03, { dx: 30, dy: 0, din: 0.35, dout: 0.2 }));
      eng.forEach((x, i) => {
        show(x.e, t, eAt(i), tShows + 0.02 + i * 0.02, { dx: 30, dy: 0, din: 0.35, dout: 0.2 });
        const done = t > eDone(i);
        x.sp.style.display = done ? "none" : "block";
        x.sp.style.transform = `rotate(${t * 540 + i * 50}deg)`;
        x.ok.style.display = done ? "flex" : "none";
        x.ok.style.transform = `scale(${tw(t, eDone(i), eDone(i) + 0.25, E.outBack)})`;
      });
      show(ans, t, tShows + 0.08, tComp + 0.15, { dy: 30, din: 0.45 });
      hb.style.transform = `scaleX(${tw(t, P("mentioned") - 0.05, P("mentioned") + 0.3, E.outExpo)})`;
      show(m4, t, P("mentioned") + 0.3, null, { dy: 0, scale: 0.85, din: 0.35, e: E.outBack });
      r.style.opacity = (1 - tw(t, tComp - 0.05, tComp + 0.2)).toFixed(3);
    };
  });

  // ---------------- 10. competitors + sources on the flat brand canvas
  const tSources = P("which sources");
  const tBeyond = SEG("go beyond").t0;
  beat("back", tComp - 0.12, tBeyond + 0.02, (r) => { const c = canvas(r, "blue"); return (t) => { c.style.opacity = tw(t, tComp - 0.12, tComp + 0.1).toFixed(3); }; });
  beat("front", tComp - 0.05, tBeyond + 0.02, (r) => {
    const card = $("div", "abs card", r);
    css(card, { left: "410px", top: "150px", width: "1100px", padding: "36px 42px 26px", boxShadow: "0 0 0 10px rgba(255,255,255,.18), 0 40px 90px -30px rgba(10,20,90,.55)" });
    card.innerHTML = `<div style="display:flex;align-items:baseline"><span style="font-size:24px;letter-spacing:.12em;color:var(--blue)">COMPETITORS</span><span style="flex:1"></span><span style="font-size:26px;color:var(--muted)">share of AI answers</span></div>
      <div style="font-size:48px;color:var(--ink);letter-spacing:-0.03em;margin-top:8px">Who AI recommends instead</div><div class="rows" style="margin-top:18px"></div>`;
    const C = [["R", "#d6608a", "Revora", 54], ["C", "#2b3560", "Closewise", 49, true], ["L", "#2aa5b0", "Leadsmith", 41], ["P", "#e0913a", "Pipeworks", 33], ["S", "#8b5cf6", "Salesgrid", 27]];
    const crow = C.map(([l, c, n, v, you], i) => {
      const row = $("div", "", card.querySelector(".rows"));
      css(row, { display: "flex", alignItems: "center", gap: "20px", height: "88px", padding: "0 18px", borderRadius: "16px", background: you ? "rgba(184,255,60,.22)" : "transparent", borderTop: i && !you ? "1.5px solid var(--line)" : "none" });
      row.innerHTML = `<span style="width:28px;font-size:28px;color:var(--faint)">${i + 1}</span>${fav(l, c, 46)}
        <span style="width:300px;font-size:34px;letter-spacing:-0.02em;color:var(--ink)">${n}${you ? ' <span style="font-size:22px;background:var(--lime);padding:3px 10px;border-radius:999px;vertical-align:middle">You</span>' : ""}</span>
        <span style="flex:1;height:12px;border-radius:6px;background:#eef1f8;overflow:hidden"><span class="b" style="display:block;height:12px;border-radius:6px;background:${you ? "linear-gradient(90deg,#3f5efb,#5fd0ff)" : "#c3cae0"};transform-origin:left;transform:scaleX(0)"></span></span>
        <span class="pv" style="width:84px;text-align:right;font-size:34px;color:var(--ink)"></span>`;
      return { row, v, b: row.querySelector(".b"), pv: row.querySelector(".pv") };
    });
    const card2 = $("div", "abs card", r);
    css(card2, { left: "410px", top: "150px", width: "1100px", padding: "36px 42px 30px", boxShadow: "0 0 0 10px rgba(255,255,255,.18), 0 40px 90px -30px rgba(10,20,90,.55)" });
    card2.innerHTML = `<div style="display:flex;align-items:baseline"><span style="font-size:24px;letter-spacing:.12em;color:var(--blue)">SOURCES</span><span style="flex:1"></span><span style="font-size:26px;color:var(--muted)">cited in answers about you</span></div>
      <div style="font-size:48px;color:var(--ink);letter-spacing:-0.03em;margin-top:8px">Where AI gets its answers</div>
      <div class="stack" style="display:flex;gap:5px;height:18px;margin-top:22px"></div><div class="doms" style="margin-top:14px"></div>`;
    const D = [["G2", "#ff492c", "g2.com", "Reviews", 38], ["r", "#ff4500", "reddit.com", "Community", 24], ["in", "#0a66c2", "linkedin.com", "Social", 19], ["C", "#ff9d28", "capterra.com", "Reviews", 12]];
    const segs = D.map(([, c, , , v]) => { const s = $("span", "", card2.querySelector(".stack")); css(s, { width: `${v / 0.93}%`, background: c, borderRadius: "9px", transformOrigin: "left", display: "block" }); return s; });
    const drow = D.map(([l, c, d, ty, v]) => {
      const row = $("div", "", card2.querySelector(".doms"));
      css(row, { display: "flex", alignItems: "center", gap: "18px", height: "84px", borderTop: "1.5px solid var(--line)" });
      row.innerHTML = `${fav(l, c, 44, 10)}<span style="flex:1;font-size:34px;color:var(--ink)">${d}</span><span style="font-size:26px;color:var(--muted);border:1.5px solid var(--line);padding:4px 14px;border-radius:999px">${ty}</span><span style="width:100px;text-align:right;font-size:34px;color:var(--ink)">${v}%</span>`;
      return row;
    });
    const tWC = P("which competitors");
    sfx(tComp - 0.02, "woosh_slide", -13);
    C.forEach((_, i) => sfx(tWC + 0.1 + i * 0.09, "ui_select", -26));
    sfx(tSources - 0.12, "whoosh_light", -14);
    D.forEach((_, i) => sfx(tSources + 0.4 + i * 0.14, "ui_select", -26));
    return (t) => {
      const swap = tw(t, tSources - 0.15, tSources + 0.3, E.inOutQuint);
      const a = tw(t, tComp, tComp + 0.5, E.outExpo);
      card.style.opacity = (a * (1 - swap)).toFixed(3);
      card.style.transform = `translateY(${(1 - a) * 70 - swap * 140}px) scale(${lerp(0.95, 1, a) * lerp(1, 0.94, swap)})`;
      blur(card, 10 * (1 - a) + 8 * swap);
      crow.forEach((c, i) => {
        show(c.row, t, tWC + i * 0.09, null, { dy: 18, din: 0.35 });
        const f = tw(t, tWC + 0.1 + i * 0.09, tWC + 0.8 + i * 0.09, E.outQuint);
        c.b.style.transform = `scaleX(${f * c.v / 60})`;
        c.pv.textContent = Math.round(c.v * f) + "%";
      });
      const b2 = tw(t, tSources - 0.05, tSources + 0.45, E.outExpo);
      card2.style.opacity = (b2 * (1 - tw(t, tBeyond - 0.2, tBeyond))).toFixed(3);
      card2.style.transform = `translateY(${(1 - b2) * 160}px) scale(${lerp(0.96, 1, b2)})`;
      blur(card2, 10 * (1 - b2));
      segs.forEach((s, i) => { s.style.transform = `scaleX(${tw(t, tSources + 0.2 + i * 0.08, tSources + 0.6 + i * 0.08, E.outQuint)})`; });
      drow.forEach((d, i) => show(d, t, tSources + 0.4 + i * 0.14, null, { dy: 16, din: 0.35 }));
    };
  });

  // ---------------- 11-12. beyond one check / fix the gaps (with a close-up)
  const tGot = SEG("check and fix").t0;
  const tCorrect = SEG("correct an").t0;
  key(tBeyond - 0.001, { show: 0 }, "step");
  key(tBeyond, { z: 1.0 }, "step");
  key(tGot - 0.001, { z: 1.05 }, "lin");
  key(tGot, { z: 1.26, ay: 0.29 }, "step");
  key(tCorrect - 0.001, { z: 1.29, ay: 0.29 }, "lin");
  beat("front", tBeyond, tCorrect + 0.05, (r) => {
    const a = say(r, ["So you can go beyond", "checking your name once"], { x: 110, y: 96, after: tBeyond - 0.1, out: P("and hoping") - 0.02 });
    const b = say(r, ["and hoping that tells", "the *whole story.*"], { x: 1810, y: 800, align: "right", after: P("and hoping") - 0.1, out: tGot + 0.02 });
    const c = say(r, ["You've got to check", "and *fix the gaps.*"], { x: 1810, y: 800, align: "right", after: tGot - 0.1, out: tCorrect + 0.02 });
    sfx(tBeyond - 0.03, "whoosh_short", -22);
    sfx(tGot - 0.03, "woosh_quick", -20);
    return (t) => { a.update(t); b.update(t); c.update(t); };
  });

  // ---------------- 13. action plan: glass over blurred footage -> report card on the brand canvas
  const tChanged = P("what's changed") - 0.05;
  const tPromise = SEG("no one can").t0;
  key(tCorrect, { z: 1.0, blur: 0 }, "step");
  key(tCorrect + 0.35, { z: 1.06, blur: 26, dim: 0.06 }, "inOutCubic");
  key(tChanged - 0.02, { z: 1.08, blur: 26, dim: 0.06 }, "lin");
  key(tChanged + 0.2, { z: 1.1, blur: 40, dim: 0.2 }, "inCubic");
  key(tChanged + 0.21, { show: 0 }, "step");
  beat("back", tCorrect, tChanged + 0.25, (r) => {
    const g = canvas(r, "grad");
    g.classList.remove("ribs");
    return (t) => { g.style.opacity = (0.5 * tw(t, tCorrect, tCorrect + 0.4)).toFixed(3); };
  });
  beat("front", tCorrect - 0.05, tChanged + 0.3, (r) => {
    const panel = $("div", "abs gl glass", r);
    css(panel, { left: "330px", top: "120px", width: "1260px", padding: "30px 30px 22px", borderRadius: "30px", background: "rgba(255,255,255,0.3)" });
    panel.innerHTML = `<div style="font-size:26px;letter-spacing:.12em;color:var(--ink);padding:0 8px 18px">ACTION PLAN · FIX, IMPROVE, CREATE, RE-CHECK</div><div class="ls" style="display:flex;flex-direction:column;gap:14px"></div>`;
    const items = [
      ["FIX", "#d6334a", "#fdecef", "Correct an inaccurate description", "ChatGPT says Closewise has no free plan", "Update", P("correct")],
      ["IMPROVE", "#2743c9", "#e8edff", "Improve your pricing page", "Cited by 3 engines · last updated 2023", "Edit page", P("improve")],
      ["CREATE", "#1d8a5f", "#e3f6ec", "Answer a question you're missing", "“Best tool for automated follow-ups?”", "Draft", P("create")],
      ["RE-CHECK", "#6b7394", "#eef1f8", "Check again", "Weekly re-check on 24 buyer questions", "Run", P("and check again")],
    ].map(([tag, c, bg, title, sub, btn, at]) => {
      const row = $("div", "card", panel.querySelector(".ls"));
      css(row, { display: "flex", alignItems: "center", gap: "22px", padding: "20px 24px", borderRadius: "18px" });
      row.innerHTML = `<div style="flex:1"><div style="display:flex;align-items:center;gap:14px"><span class="tag" style="color:${c};background:${bg}">${tag}</span><span style="font-size:34px;color:var(--ink);letter-spacing:-0.015em">${title}</span></div>
        <div style="font-size:26px;color:var(--muted);margin-top:8px">${sub}</div></div><span class="btn" style="font-size:28px;padding:14px 22px">${btn}</span>`;
      return { row, at, btn: row.querySelector(".btn") };
    });
    items.forEach((it) => { sfx(it.at - 0.02, "whoosh_short", -25); sfx(it.at + 0.55, "ui_click", -16); });
    sfx(tCorrect - 0.05, "whoosh_light", -16);
    return (t) => {
      show(panel, t, tCorrect, tChanged + 0.1, { dy: 50, scale: 0.97, din: 0.5, dout: 0.2, blurOut: 12, outScale: 1.04 });
      items.forEach((it) => {
        show(it.row, t, it.at - 0.05, null, { dy: 26, din: 0.4 });
        const k = Math.sin(Math.PI * clamp((t - it.at - 0.55) / 0.25));
        it.btn.style.transform = `scale(${1 - 0.08 * k})`;
        it.btn.style.background = t > it.at + 0.55 && t < it.at + 0.95 ? "var(--blue-deep)" : "var(--blue)";
      });
    };
  });
  beat("back", tChanged + 0.05, tPromise + 0.02, (r) => { const c = canvas(r, "blue"); return (t) => { c.style.opacity = tw(t, tChanged + 0.05, tChanged + 0.22).toFixed(3); }; });
  beat("front", tChanged + 0.08, tPromise + 0.02, (r) => {
    const card = $("div", "abs card", r);
    css(card, { left: "470px", top: "360px", width: "980px", padding: "34px 40px", display: "flex", gap: "40px", alignItems: "center", boxShadow: "0 0 0 10px rgba(255,255,255,.18), 0 40px 90px -30px rgba(10,20,90,.55)" });
    card.innerHTML = `<svg width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="82" stroke="#e8ecf6" stroke-width="16" fill="none"/>
      <circle class="arc" cx="100" cy="100" r="82" stroke="#3f5efb" stroke-width="16" fill="none" stroke-linecap="round" stroke-dasharray="515" stroke-dashoffset="515" transform="rotate(-90 100 100)"/>
      <text class="pct" x="100" y="116" text-anchor="middle" font-size="50" font-family="Inter Tight" fill="#0f1b4c" letter-spacing="-2">63%</text></svg>
      <div><div style="font-size:22px;letter-spacing:.12em;color:var(--blue)">VISIBILITY · CLOSEWISE</div>
      <div style="font-size:46px;color:var(--ink);letter-spacing:-0.03em;margin-top:8px">Up <span class="up">0</span> points since your fixes</div>
      <div style="display:flex;gap:12px;margin-top:20px;font-size:24px;color:var(--muted)"><span style="border:1.5px solid var(--line);border-radius:999px;padding:4px 14px">24 questions</span><span style="border:1.5px solid var(--line);border-radius:999px;padding:4px 14px">6 engines</span><span style="border:1.5px solid var(--line);border-radius:999px;padding:4px 14px">3 fixes shipped</span></div></div>`;
    const arc = card.querySelector(".arc"), pct = card.querySelector(".pct"), up = card.querySelector(".up");
    sfx(tChanged + 0.06, "woosh_slide", -14);
    sfx(tChanged + 0.35, "shimmer_coin", -18);
    return (t) => {
      show(card, t, tChanged + 0.1, tPromise + 0.02, { dy: 40, scale: 0.95, din: 0.45, dout: 0.15 });
      const k = tw(t, tChanged + 0.3, tChanged + 1.0, E.outQuint);
      const v = lerp(63, 68, k);
      arc.setAttribute("stroke-dashoffset", (515 * (1 - v / 100)).toFixed(1));
      pct.textContent = Math.round(v) + "%";
      up.textContent = Math.round(5 * k);
    };
  });

  // ---------------- 14-15. no one can promise (close) / stop guessing, start with evidence (glass stat chips)
  const tPoint = SEG("stop guessing").t0;
  const tGo = SEG("go to seekworthy").t0;
  key(tPromise - 0.001, { show: 0 }, "step");
  key(tPromise, { z: 1.2, ay: 0.3 }, "step");
  key(tPoint - 0.001, { z: 1.25, ay: 0.3 }, "lin");
  key(tPoint, { z: 1.0 }, "step");
  key(tGo - 0.001, { z: 1.04 }, "lin");
  beat("front", tPromise, tGo + 0.05, (r) => {
    const a = say(r, ["No one can promise you", "a place in every AI answer."], { x: 1810, y: 800, align: "right", after: tPromise - 0.1, out: tPoint + 0.02 });
    const chip = (x, y, top, bottom) => {
      const c = $("div", "abs gd glass", r, `<div style="font-size:66px;color:var(--lime);letter-spacing:-0.03em;line-height:1.05">${top}</div><div style="font-size:66px;color:#fff;letter-spacing:-0.03em;line-height:1.05">${bottom}</div>`);
      css(c, { left: `${x}px`, top: `${y}px`, padding: "22px 34px 26px", borderRadius: "18px" });
      return c;
    };
    const c1 = chip(130, 360, "Stop", "guessing");
    const c2 = chip(1330, 600, "Start with", "evidence");
    sfx(P("stop") - 0.05, "whoosh_short", -20);
    sfx(P("start working") - 0.05, "whoosh_short", -20);
    return (t) => {
      a.update(t);
      show(c1, t, P("stop") - 0.05, tGo + 0.02, { dy: 20, scale: 0.92, din: 0.4 });
      show(c2, t, P("start working") - 0.05, tGo + 0.02, { dy: 20, scale: 0.92, din: 0.4 });
    };
  });

  // ---------------- 16-18. go to seekworthy.ai / enter your website / no card / find out
  const tFind = SEG("find out").t0;
  const tEnd = SEG("GAP end").t0;
  beat("front", tGo, tEnd + 0.05, (r) => {
    const tEnter = SEG("enter your website").t0;
    const a = say(r, ["Go to *seekworthy.ai.*"], { x: 110, y: 880, after: tGo - 0.1, out: tEnter + 0.02 });
    const inp = inputPill(r, 1130, 70, 700);
    const no = $("div", "abs gd glass pill", r, `<svg width="28" height="28" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#b8ff3c" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><span>No card needed</span>`);
    css(no, { right: "110px", top: "214px", padding: "16px 26px", fontSize: "32px", color: "#fff", borderRadius: "16px" });
    const b = say(r, ["Find out whether AI", "is recommending", "your *business.*"], { x: 110, y: 96, size: 76, after: tFind - 0.1, out: tEnd + 0.02 });
    const u1 = P("seekworthy.ai") - 0.05, u2 = P("enter your website") + 0.05, tap = P("free check") + 0.2;
    sfx(tGo - 0.03, "whoosh_short", -21);
    sfx(u1 + 0.05, "type", -21, { text: "seekworthy.ai", dur: 0.6 });
    sfx(u2 + 0.05, "type", -21, { text: "closewise.com", dur: 0.6 });
    sfx(tap, "ui_click", -11);
    sfx(P("No card") - 0.02, "pop", -21);
    return (t) => {
      a.update(t); b.update(t);
      show(inp.wrap, t, tGo, tFind + 0.1, { dy: -20, scale: 0.96 });
      if (t < u2) inp.update(t, "seekworthy.ai", u1, u1 + 0.6, null, "");
      else inp.update(t, "closewise.com", u2, u2 + 0.6, tap, "yourcompany.com");
      show(no, t, P("No card") - 0.05, tFind + 0.1, { dy: -10, scale: 0.92, din: 0.35, e: E.outBack });
    };
  });

  // ---------------- END: flat blue -> "Is yours?" -> gradient bloom -> logo
  key(tEnd - 0.001, { z: 1.04 }, "lin");
  key(tEnd, { show: 0 }, "step");
  beat("back", tEnd - 0.02, END + 1, (r) => {
    canvas(r, "blue");
    const grad = $("div", "abs", r);
    css(grad, { left: 0, top: 0, width: `${W}px`, height: `${H}px`, background: "radial-gradient(1200px 900px at 100% 0%, rgba(95,208,255,1), rgba(95,208,255,0) 70%), radial-gradient(700px 520px at 88% 18%, rgba(255,255,255,.85), rgba(255,255,255,0) 70%), radial-gradient(900px 700px at 10% 100%, rgba(170,190,255,.55), rgba(170,190,255,0) 70%), radial-gradient(1300px 900px at 0% 100%, rgba(52,80,242,1), rgba(52,80,242,0) 75%)" });
    return (t) => {
      const g = tw(t, tEnd + 0.75, tEnd + 1.6, E.inOutCubic);
      grad.style.opacity = g.toFixed(3);
      grad.style.transform = `translate(${(1 - g) * 300}px, ${(1 - g) * -200}px) scale(${lerp(1.3, 1, g)})`;
    };
  });
  beat("front", tEnd - 0.02, END + 1, (r) => {
    const q = $("div", "abs", r, `<span class="a w">Is</span> <span class="b w">yours?</span>`);
    css(q, { left: 0, width: `${W}px`, top: "450px", textAlign: "center", fontSize: "130px", fontWeight: 400, letterSpacing: "-0.04em", color: "#fff" });
    const lock = $("div", "abs", r);
    css(lock, { left: 0, width: `${W}px`, top: "430px", display: "flex", justifyContent: "center", alignItems: "center", gap: "30px" });
    const mk = $("div", "", lock, `<img src="${MARK}" style="width:150px;height:140px;filter:brightness(0) invert(1)">`);
    const wm = $("div", "", lock, "Seekworthy");
    css(wm, { fontFamily: "Geist", fontSize: "140px", fontWeight: 600, letterSpacing: "-0.045em", color: "#fff" });
    const url = $("div", "abs", r, "Start your free check at seekworthy.ai");
    css(url, { left: 0, width: `${W}px`, top: "960px", textAlign: "center", fontSize: "30px", color: "#fff" });
    const qa = q.querySelector(".a"), qb = q.querySelector(".b");
    sfx(tEnd - 0.04, "woosh_quick", -14);
    sfx(tEnd + 0.75, "revcym_glassy", -16);
    sfx(tEnd + 1.55, "subdrop", -10);
    sfx(tEnd + 1.6, "shimmer_success", -14);
    return (t) => {
      show(qa, t, tEnd + 0.12, tEnd + 1.35, { dy: 18, blur: 10, din: 0.4, dout: 0.3, blurOut: 16 });
      show(qb, t, tEnd + 0.3, tEnd + 1.35, { dy: 18, blur: 10, din: 0.4, dout: 0.3, blurOut: 16 });
      const k = tw(t, tEnd + 1.45, tEnd + 2.05, E.outExpo);
      mk.style.opacity = k.toFixed(3);
      mk.style.transform = `scale(${lerp(0.7, 1, tw(t, tEnd + 1.45, tEnd + 1.95, E.outBack))})`;
      const w = tw(t, tEnd + 1.55, tEnd + 2.2, E.outQuint);
      wm.style.clipPath = `inset(0 ${lerp(100, 0, w)}% 0 0)`;
      wm.style.transform = `translateX(${lerp(-40, 0, w)}px)`;
      show(url, t, tEnd + 2.0, null, { dy: 12, din: 0.5 });
      lock.style.transform = `scale(${lerp(1, 1.03, tw(t, tEnd + 1.5, END, E.lin))})`;
    };
  });

  // ---------------------------------------------------------------- render
  window.renderFrame = (f) => {
    const t = f / FPS;
    for (const b of beats) {
      const on = t >= b.t0 && t <= b.t1;
      b.root.style.display = on ? "block" : "none";
      if (on) b.update(t);
    }
  };
})();
