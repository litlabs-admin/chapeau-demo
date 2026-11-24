/* Seekworthy launch: motion-graphics timeline.
 *
 * Every frame is a pure function of the frame number: window.renderFrame(f)
 * sets the DOM for that frame and nothing else reads a clock. Two layers:
 *   #back  - behind Ben (the compositor puts Ben's matte over it)
 *   #front - over Ben (cards, full-screen product UI, captions)
 * Times are seconds on the edit timeline (pipeline/cutlist.py), 30 fps.
 */
(() => {
  const FPS = 30;
  const W = 1920, H = 1080;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const E = {
    lin: (x) => x,
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inCubic: (x) => x * x * x,
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    outQuint: (x) => 1 - Math.pow(1 - x, 5),
    outBack: (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  };
  const tw = (t, t0, t1, e = E.outCubic) => e(clamp((t - t0) / (t1 - t0)));

  const $ = (tag, cls, parent, html) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html !== undefined) el.innerHTML = html;
    if (parent) parent.appendChild(el);
    return el;
  };
  const css = (el, o) => { for (const k in o) el.style[k] = o[k]; return el; };
  const BACK = document.getElementById("back");
  const FRONT = document.getElementById("front");
  const A = "../../assets/";
  const icon = (k, s) => `<img src="${A}engines/${k}.svg" style="width:${s}px;height:${s}px;display:block">`;
  const MARK = `${A}brand/mark.png`;
  const ENG = [["chatgpt", "ChatGPT"], ["claude", "Claude"], ["perplexity", "Perplexity"], ["gemini", "Gemini"], ["grok", "Grok"], ["deepseek", "DeepSeek"]];

  // ---------- shared motion vocabulary ----------
  /** Entrance/exit envelope for one element: rise + unblur in, lift + fade out. */
  function show(el, t, tin, tout, o = {}) {
    const din = o.din ?? 0.36, dout = o.dout ?? 0.22, dy = o.dy ?? 46, blur = o.blur ?? 10;
    const p = tw(t, tin, tin + din, o.ein || E.outExpo);
    const q = tout == null ? 0 : tw(t, tout - dout, tout, E.inCubic);
    const s0 = o.scale ?? 1;
    const sc = lerp(s0, 1, p) * (o.outScale ? lerp(1, o.outScale, q) : 1);
    el.style.opacity = (p * (1 - q)).toFixed(4);
    el.style.transform = `translate(${(o.dx ?? 0) * (1 - p)}px, ${dy * (1 - p) - (o.dyOut ?? 30) * q}px) scale(${sc})`;
    const b = blur * (1 - p) + (o.blurOut ?? 6) * q;
    el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none";
    return p * (1 - q);
  }
  /** Kinetic headline: lines of words, each word with its own entry time. */
  function headline(parent, lines, o) {
    const box = $("div", "abs", parent);
    css(box, { left: `${o.x}px`, top: `${o.y}px`, width: o.w ? `${o.w}px` : "auto", textAlign: o.align || "left",
      fontSize: `${o.size}px`, fontWeight: o.weight || 700, letterSpacing: o.ls || "-0.035em", lineHeight: o.lh || "1.0",
      color: o.color || "#fff", textShadow: o.shadow === false ? "none" : "0 0 70px rgba(10,19,56,0.45), 0 2px 24px rgba(10,19,56,0.25)" });
    const words = [];
    for (const line of lines) {
      const ln = $("div", "", box);
      css(ln, { whiteSpace: "nowrap", marginBottom: `${o.gap ?? 0}px` });
      line.forEach(([txt, at, kind], i) => {
        let w;
        if (kind === "hl") {
          w = $("span", "word hl", ln, `<span class="hl-bg"></span><span class="hl-tx">${txt}</span>`);
          w.querySelector(".hl-tx").style.color = "var(--navy)";
          w.style.textShadow = "none";
        } else {
          w = $("span", "word", ln, txt);
          if (kind === "lime") w.style.color = "var(--lime)";
        }
        words.push({ el: w, at, kind });
        if (i < line.length - 1) $("span", "word", ln, " ");
      });
    }
    return {
      box,
      update(t, tout) {
        for (const w of words) {
          const p = tw(t, w.at, w.at + 0.34, E.outExpo);
          w.el.style.opacity = p.toFixed(4);
          w.el.style.transform = `translateY(${(1 - p) * 0.42 * o.size}px) scale(${lerp(1.06, 1, p)})`;
          const b = 12 * (1 - p);
          w.el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none";
          if (w.kind === "hl") {
            const h = tw(t, w.at + 0.08, w.at + 0.36, E.outExpo);
            w.el.querySelector(".hl-bg").style.transform = `scaleX(${h})`;
          }
        }
        const q = tout == null ? 0 : tw(t, tout - 0.22, tout, E.inCubic);
        box.style.opacity = (1 - q).toFixed(4);
        box.style.transform = `translateY(${-40 * q}px)`;
        box.style.filter = q > 0.01 ? `blur(${(8 * q).toFixed(2)}px)` : "none";
      },
    };
  }
  /** Full-screen panel that grows out of a rect and leaves by zooming through. */
  function panel(parent, bg) {
    const p = $("div", "screen", parent);
    p.style.background = bg;
    const world = $("div", "abs", p);
    css(world, { left: 0, top: 0, width: `${W}px`, height: `${H}px`, transformOrigin: "50% 50%" });
    return {
      el: p, world,
      update(t, tin, tout, o = {}) {
        let cl = "none", op = 1, sc = 1, bl = 0;
        if (o.from) {
          const k = tw(t, tin, tin + (o.din ?? 0.42), E.outExpo);
          const r = o.from;
          const top = lerp(r.y, 0, k), left = lerp(r.x, 0, k);
          const right = lerp(W - r.x - r.w, 0, k), bottom = lerp(H - r.y - r.h, 0, k);
          cl = `inset(${top}px ${right}px ${bottom}px ${left}px round ${lerp(r.r ?? 40, 0, k)}px)`;
          sc = lerp(1.08, 1, k);
        } else if (o.slideFrom) {
          const k = tw(t, tin, tin + 0.4, E.outExpo);
          p.style.transform = `translateX(${(1 - k) * o.slideFrom}px)`;
        } else if (o.fade) {
          op = tw(t, tin, tin + 0.25, E.outCubic);
        }
        if (o.iris) {
          const k = tw(t, tin, tin + (o.din ?? 0.45), E.inOutCubic);
          cl = `circle(${lerp(0, 1200, k)}px at ${o.iris[0]}px ${o.iris[1]}px)`;
        }
        if (tout != null) {
          const q = tw(t, tout - (o.dout ?? 0.24), tout, E.inCubic);
          if (o.slideOut) {
            p.style.transform = `translateX(${q * o.slideOut}px)`;
          } else {
            op *= 1 - q;
            sc *= lerp(1, 1.18, q);
            bl += 18 * q;
          }
        }
        p.style.clipPath = cl;
        p.style.opacity = op.toFixed(4);
        world.style.transform = `scale(${sc})` + (o.cam || "");
        world.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : "none";
      },
    };
  }
  /** Cursor: arrow that glides to a point and clicks. */
  function cursor(parent) {
    const c = $("div", "abs", parent,
      `<svg width="46" height="56" viewBox="0 0 23 28"><path d="M1.5 1.5 L1.5 22 L7 17 L10.5 25.5 L14 24 L10.5 15.8 L18 15.8 Z" fill="#fff" stroke="#0f1b4c" stroke-width="1.8" stroke-linejoin="round"/></svg>`);
    css(c, { left: 0, top: 0, filter: "drop-shadow(0 6px 10px rgba(16,22,55,.35))" });
    return {
      el: c,
      update(t, path, clickAt) {
        // path: [[t, x, y], ...]
        let x = path[0][1], y = path[0][2];
        for (let i = 1; i < path.length; i++) {
          const [t1, x1, y1] = path[i], [t0, x0, y0] = path[i - 1];
          if (t >= t0) { const k = tw(t, t0, t1, E.inOutCubic); x = lerp(x0, x1, k); y = lerp(y0, y1, k); }
        }
        const press = clickAt != null ? 1 - 0.18 * Math.sin(Math.PI * clamp((t - clickAt) / 0.16)) : 1;
        c.style.transform = `translate(${x}px, ${y}px) scale(${press})`;
        c.style.opacity = tw(t, path[0][0] - 0.15, path[0][0]).toFixed(3);
      },
    };
  }
  const typed = (txt, t, t0, t1) => txt.slice(0, Math.round(clamp((t - t0) / (t1 - t0)) * txt.length));
  const caretOn = (t) => Math.floor(t * 2.2) % 2 === 0;
  const fav = (letter, color, s) => `<span class="fav" style="width:${s}px;height:${s}px;background:${color};font-size:${Math.round(s * 0.56)}px">${letter}</span>`;
  const count = (t, t0, t1, v) => Math.round(lerp(0, v, tw(t, t0, t1, E.outQuint)));

  const beats = [];
  const beat = (layer, t0, t1, build) => {
    const root = $("div", "abs", layer === "back" ? BACK : FRONT);
    css(root, { left: 0, top: 0, width: `${W}px`, height: `${H}px` });
    beats.push({ t0, t1, root, update: build(root) });
  };

  // ---------- ambience: brand glows (always on under the footage) ----------
  beat("back", 0, 99, (r) => {
    const g1 = $("div", "abs", r), g2 = $("div", "abs", r);
    css(g1, { left: "-520px", top: "520px", width: "1400px", height: "1000px", borderRadius: "50%",
      background: "radial-gradient(closest-side, rgba(63,94,251,0.62), rgba(63,94,251,0.22) 55%, rgba(63,94,251,0) 100%)" });
    css(g2, { left: "1180px", top: "600px", width: "1300px", height: "900px", borderRadius: "50%",
      background: "radial-gradient(closest-side, rgba(100,124,244,0.42), rgba(100,124,244,0.14) 55%, rgba(100,124,244,0) 100%)" });
    return (t) => {
      g1.style.transform = `translate(${Math.sin(t * 0.21) * 60}px, ${Math.cos(t * 0.17) * 30}px)`;
      g2.style.transform = `translate(${Math.cos(t * 0.19) * 70}px, ${Math.sin(t * 0.23) * 30}px)`;
    };
  });
  beat("front", 0, 99, (r) => {
    const haze = $("div", "abs", r), g = $("div", "abs", r);
    css(haze, { left: 0, top: "720px", width: `${W}px`, height: "360px",
      background: "linear-gradient(180deg, rgba(10,19,56,0) 0%, rgba(10,19,56,0.22) 55%, rgba(10,19,56,0.42) 100%)" });
    css(g, { left: "-420px", top: "760px", width: "1100px", height: "700px", borderRadius: "50%",
      background: "radial-gradient(closest-side, rgba(63,94,251,0.32), rgba(63,94,251,0) 100%)" });
    return (t) => { g.style.transform = `translate(${Math.sin(t * 0.21) * 60}px, 0)`; };
  });

  // ---------- B0 hook (0 - 5.1) ----------
  beat("back", 0, 5.2, (r) => {
    const a = headline(r, [[["Your", 0.0], ["next", 0.16]], [["customer", 0.42]], [["asks", 1.28], ["AI.", 1.5, "hl"]]],
      { x: 118, y: 150, size: 118, gap: 8 });
    const b = headline(r, [[["Never", 4.0], ["hears", 4.28]], [["your", 4.54], ["name.", 4.72]]], { x: 118, y: 200, size: 112, gap: 8 });
    const strike = $("div", "abs", r);
    css(strike, { left: "112px", top: "376px", width: "500px", height: "12px", background: "var(--lime)", borderRadius: "6px", transformOrigin: "left center" });
    return (t) => {
      a.update(t, 3.98);
      b.update(t, 5.12);
      strike.style.transform = `scaleX(${tw(t, 4.86, 5.06, E.outExpo)})`;
      strike.style.opacity = (1 - tw(t, 5.0, 5.12)).toFixed(3);
    };
  });
  const PROMPT = "Which PR agency should we hire?";
  const PROMPT_RECT = { x: 1236, y: 690, w: 630, h: 104, r: 52 };
  beat("front", 1.1, 5.2, (r) => {
    const card = $("div", "pill abs", r);
    css(card, { left: `${PROMPT_RECT.x}px`, top: `${PROMPT_RECT.y}px`, width: `${PROMPT_RECT.w}px`, height: `${PROMPT_RECT.h}px`, padding: "0 18px 0 26px", fontSize: "30px", fontWeight: 500 });
    card.innerHTML = `${icon("chatgpt", 44)}<span class="tx" style="flex:1;white-space:nowrap;overflow:hidden"></span>
      <span class="send" style="width:64px;height:64px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center">
      <svg width="28" height="28" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke="#b8ff3c" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
    const tx = card.querySelector(".tx"), send = card.querySelector(".send");
    return (t) => {
      show(card, t, 1.28, null, { dy: 60, scale: 0.92 });
      const s = typed(PROMPT, t, 1.45, 2.85);
      tx.innerHTML = s + (t < 3.0 && caretOn(t) ? '<span style="color:var(--blue)">|</span>' : "");
      tx.style.color = s.length ? "var(--ink)" : "var(--faint)";
      const pr = 1 - 0.12 * Math.sin(Math.PI * clamp((t - 3.05) / 0.2));
      send.style.transform = `scale(${pr})`;
      send.style.background = t > 3.05 ? "var(--blue)" : "var(--navy)";
    };
  });

  // ---------- B1-B3 AI shortlist (5.1 - 11.43) ----------
  beat("front", 5.08, 11.45, (r) => {
    const P = panel(r, "var(--surface)");
    P.el.classList.add("grid-bg");
    const w = P.world;
    const col = $("div", "abs", w);
    css(col, { left: "370px", top: "70px", width: "1180px", height: `${H}px`, transformOrigin: "50% 45%" });
    const head = $("div", "abs", col, `${icon("chatgpt", 50)}<span style="font-size:34px;font-weight:600;color:var(--ink)">ChatGPT</span>`);
    css(head, { left: 0, top: "92px", display: "flex", alignItems: "center", gap: "16px" });
    const uline = $("div", "abs", col);
    css(uline, { left: "66px", top: "146px", width: "138px", height: "6px", borderRadius: "3px", background: "var(--lime)", transformOrigin: "left" });
    const bubble = $("div", "abs", col, PROMPT);
    css(bubble, { right: "0", top: "84px", background: "var(--navy)", color: "#fff", fontSize: "36px", fontWeight: 500, padding: "20px 34px", borderRadius: "30px 30px 8px 30px" });
    const ans = $("div", "abs", col);
    css(ans, { left: 0, top: "196px", fontSize: "36px", color: "var(--body)", fontWeight: 500, display: "flex", alignItems: "center", gap: "18px" });
    ans.innerHTML = `<span class="dots" style="display:flex;gap:10px"></span><span class="lead"></span>`;
    const dots = ans.querySelector(".dots"), lead = ans.querySelector(".lead");
    const dd = [0, 1, 2].map(() => { const d = $("span", "", dots); css(d, { width: "14px", height: "14px", borderRadius: "50%", background: "var(--faint)", display: "block" }); return d; });
    const rows = [
      ["1", "N", "var(--c-n)", "Northlight PR", "Well-known in tech media"],
      ["2", "B", "var(--c-b)", "Brightwell", "Clear, flexible monthly plans"],
      ["3", "C", "var(--c-c)", "Cedar & Pine", "Strong B2B trade press"],
    ].map(([n, l, c, name, desc], i) => {
      const row = $("div", "card abs", col);
      css(row, { left: 0, top: `${280 + i * 128}px`, width: "1180px", height: "108px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "24px", padding: "0 30px", boxShadow: "var(--shadow-float)" });
      row.innerHTML = `<span class="num" style="font-size:38px;color:var(--faint);width:44px">#${n}</span>${fav(l, c, 56)}
        <span class="nm hl" style="font-size:38px;font-weight:600"><span class="hl-bg" style="transform:scaleX(0)"></span><span class="hl-tx">${name}</span></span>
        <span style="font-size:30px;color:var(--muted);margin-left:8px">${desc}</span><span style="flex:1"></span>`;
      return row;
    });
    const comp = $("span", "", rows[0], "Competitor");
    css(comp, { fontSize: "28px", fontWeight: 600, color: "var(--blue-deep)", background: "#eef2fe", border: "2px solid var(--accent-line)", padding: "6px 18px", borderRadius: "999px" });
    const ghost = $("div", "abs", col);
    css(ghost, { left: 0, top: `${280 + 3 * 128}px`, width: "1180px", height: "108px", borderRadius: "20px", border: "3px dashed #b4b9cc", background: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: "24px", padding: "0 30px" });
    ghost.innerHTML = `<span class="num" style="font-size:38px;color:#b4b9cc;width:44px">–</span>${fav("V", "#b4b9cc", 56)}
      <span style="font-size:38px;font-weight:600;color:#8d93ab">Venture PR</span><span style="font-size:30px;color:var(--faint)">(you)</span><span style="flex:1"></span>`;
    const nm = $("span", "", ghost, "Not mentioned");
    css(nm, { fontSize: "28px", fontWeight: 600, color: "var(--danger)", background: "#fde8eb", border: "2px solid #f6b7c1", padding: "6px 18px", borderRadius: "999px" });
    return (t) => {
      const push = tw(t, 9.45, 10.25, E.inOutCubic);
      P.update(t, 5.1, 11.43, { from: PROMPT_RECT, cam: ` translate(0px, ${-24 * push}px) scale(${lerp(1, 1.05, push)})` });
      show(head, t, 5.3, null, { dy: 20 });
      uline.style.transform = `scaleX(${tw(t, 5.46, 5.8, E.outExpo)})`;
      show(bubble, t, 5.12, null, { dy: 30, blur: 0, din: 0.3 });
      const thinking = t > 5.9 && t < 8.24;
      dots.style.display = thinking ? "flex" : "none";
      dd.forEach((d, i) => { d.style.transform = `translateY(${Math.sin((t * 7) - i * 0.9) * 6}px)`; d.style.opacity = 0.5 + 0.5 * Math.sin(t * 7 - i * 0.9); });
      lead.textContent = typed("Here's a shortlist of strong options:", t, 8.24, 8.6);
      rows.forEach((row, i) => show(row, t, 8.5 + i * 0.16, null, { dy: 50, scale: 0.97 }));
      rows[0].querySelector(".hl-bg").style.transform = `scaleX(${tw(t, 9.6, 9.9, E.outExpo)})`;
      show(comp, t, 9.95, null, { dy: 0, dx: 30, blur: 4, scale: 0.8, ein: E.outBack, din: 0.3 });
      show(ghost, t, 10.62, null, { dy: 60, blur: 6 });
      const shake = Math.sin((t - 10.86) * 60) * 10 * Math.exp(-Math.max(0, t - 10.86) * 9) * (t > 10.86 ? 1 : 0);
      show(nm, t, 10.84, null, { dy: 0, scale: 0.7, ein: E.outBack, din: 0.26, blur: 0 });
      nm.style.transform += ` translateX(${shake}px)`;
    };
  });

  // ---------- B4 would you know (11.43 - 12.53) ----------
  beat("back", 11.4, 12.6, (r) => {
    const h = headline(r, [[["Would", 11.47], ["you", 11.58], ["know?", 11.7]]], { x: 0, y: 118, w: W, align: "center", size: 212, ls: "-0.045em" });
    return (t) => h.update(t, 12.52);
  });

  // ---------- B5 lower third (12.53 - 15.3) ----------
  beat("front", 12.5, 15.4, (r) => {
    const box = $("div", "abs", r);
    css(box, { left: "110px", top: "736px", display: "flex", alignItems: "center", gap: "26px", background: "rgba(10,19,56,0.78)", padding: "26px 40px 26px 30px", borderRadius: "22px", boxShadow: "0 20px 60px -20px rgba(10,19,56,.7)" });
    const bar = $("div", "", box);
    css(bar, { width: "8px", height: "112px", borderRadius: "4px", background: "var(--lime)", transformOrigin: "50% 100%" });
    const txt = $("div", "", box);
    const name = $("div", "", txt, "Ben");
    css(name, { fontSize: "66px", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: "1" });
    const role = $("div", "", txt, `<img src="${MARK}" style="width:38px;height:36px"><span>Founder, Seekworthy</span>`);
    css(role, { display: "flex", alignItems: "center", gap: "12px", fontSize: "34px", color: "#dfe4f7", marginTop: "12px", fontWeight: 500 });
    return (t) => {
      show(box, t, 12.6, 15.3, { dy: 30, dx: -40, blur: 8, din: 0.4 });
      bar.style.transform = `scaleY(${tw(t, 12.65, 13.0, E.outExpo)})`;
      show(name, t, 12.86, null, { dy: 24, blur: 6 });
      show(role, t, 13.84, null, { dy: 20, blur: 6 });
    };
  });

  // ---------- B6 engines around Ben (15.0 - 18.75) ----------
  beat("back", 15.0, 18.8, (r) => {
    const pos = [[118, 170], [236, 336], [96, 500], [1440, 150], [1530, 318], [1452, 486]];
    const chips = ENG.map(([k, n], i) => {
      const c = $("div", "pill abs", r, `${icon(k, 48)}<span>${n}</span>`);
      css(c, { left: `${pos[i][0]}px`, top: `${pos[i][1]}px`, padding: "16px 30px 16px 18px", fontSize: "36px", fontWeight: 600 });
      const dot = $("span", "", c);
      css(dot, { width: "18px", height: "18px", borderRadius: "50%", background: "var(--lime)", boxShadow: "0 0 0 6px rgba(184,255,60,.25)" });
      return { c, dot };
    });
    return (t) => chips.forEach(({ c, dot }, i) => {
      const at = 15.42 + [0, 2, 4, 1, 3, 5][i] * 0.13;
      show(c, t, at, 18.74, { dy: 30, scale: 0.7, ein: E.outBack, din: 0.42, blur: 6 });
      c.style.transform += ` translateY(${Math.sin(t * 1.4 + i * 1.7) * 7}px)`;
      const d = tw(t, 17.62 + i * 0.05, 17.9 + i * 0.05, E.outBack);
      dot.style.transform = `scale(${d})`;
      dot.style.opacity = d > 0 ? 1 : 0;
    });
  });

  // ---------- B7 buyer asks AI (18.71 - 21.39) ----------
  beat("back", 18.7, 21.45, (r) => {
    const h = headline(r, [[["When", 18.84], ["a", 18.92], ["buyer", 19.06]], [["asks", 19.4], ["AI", 20.2]], [["for advice", 20.6, "hl"]]],
      { x: 118, y: 150, size: 96, gap: 10 });
    return (t) => h.update(t, 21.4);
  });
  beat("front", 19.3, 21.45, (r) => {
    const c = $("div", "pill abs", r, `${icon("claude", 42)}<span>Best PR agency for startups?</span>`);
    css(c, { left: "1300px", top: "250px", padding: "20px 34px 20px 22px", fontSize: "30px", fontWeight: 500 });
    return (t) => { show(c, t, 19.5, 21.38, { dy: 40, scale: 0.92 }); c.style.transform += ` translateY(${Math.sin(t * 1.3) * 6}px)`; };
  });

  // ---------- B8 part of the answer (21.39 - 23.89) ----------
  beat("back", 21.38, 23.95, (r) => {
    const h = headline(r, [[["Are", 21.98], ["you", 22.16]], [["part", 22.92], ["of", 23.04]], [["the answer?", 23.16, "hl"]]],
      { x: 118, y: 150, size: 96, gap: 10 });
    return (t) => h.update(t, 23.9);
  });

  // ---------- B9-B11 logo reveal + dashboard (24.7 - 32.1) ----------
  beat("front", 24.7, 32.15, (r) => {
    // mark that appears beside Ben, then becomes the centre of the reveal
    const P = panel(r, "radial-gradient(1200px 800px at 50% 45%, #1a2a6e 0%, #0f1b4c 55%, #0a1338 100%)");
    P.el.classList.add("grid-bg-dark");
    const w = P.world;
    const lock = $("div", "abs", r);
    css(lock, { left: 0, top: 0, width: "0", height: "0" });
    const mark = $("img", "abs", lock);
    mark.src = MARK;
    css(mark, { width: "180px", height: "167px", left: "-90px", top: "-84px" });
    const wm = $("div", "abs", lock, "Seekworthy");
    css(wm, { left: "40px", top: "-72px", fontSize: "136px", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: "1", color: "#fff", whiteSpace: "nowrap" });
    const ul = $("div", "abs", lock);
    css(ul, { left: "46px", top: "86px", width: "200px", height: "10px", borderRadius: "5px", background: "var(--lime)", transformOrigin: "left" });
    const sweep = $("div", "abs", lock);
    css(sweep, { left: "-140px", top: "-120px", width: "160px", height: "260px", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))", mixBlendMode: "overlay", transform: "skewX(-18deg)" });

    // dashboard
    const card = $("div", "card abs", w);
    css(card, { left: "200px", top: "176px", width: "1520px", height: "740px", padding: "40px 48px" });
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:18px">${fav("V", "var(--c-v)", 60)}
        <span style="font-size:42px;font-weight:600;letter-spacing:-0.02em">Venture PR</span><span style="flex:1"></span>
        <span style="width:14px;height:14px;border-radius:50%;background:#10b981"></span><span style="font-size:28px;color:var(--muted)">Updated 2h ago</span></div>
      <div class="stats" style="display:flex;gap:24px;margin-top:32px"></div>
      <div style="display:flex;gap:40px;margin-top:34px">
        <div style="flex:1.15"><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:32px;font-weight:600">Visibility trend</span><span style="font-size:28px;color:var(--muted)">Past 14 days</span></div>
          <svg class="chart" width="720" height="250" viewBox="0 0 720 250" style="margin-top:12px;overflow:visible">
            <defs><linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f5efb" stop-opacity=".28"/><stop offset="1" stop-color="#3f5efb" stop-opacity="0"/></linearGradient></defs>
            <g stroke="#e9ecf3" stroke-width="2"><line x1="0" y1="40" x2="720" y2="40"/><line x1="0" y1="125" x2="720" y2="125"/><line x1="0" y1="210" x2="720" y2="210"/></g>
            <path class="area" fill="url(#gfill)" d=""/>
            <path class="line" fill="none" stroke="#3f5efb" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" d=""/>
            <circle class="dot" r="11" fill="#3f5efb" stroke="#fff" stroke-width="5"/></svg></div>
        <div style="flex:1"><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:32px;font-weight:600">By model</span><span style="font-size:28px;color:var(--muted)">Visibility score</span></div>
          <div class="models" style="margin-top:24px;display:flex;flex-direction:column;gap:26px"></div></div>
      </div>`;
    const stats = card.querySelector(".stats");
    const S = [["Visibility", 68, "", "+3"], ["Rank", 3, "#", "+2", "/10"], ["Mentions", 142, "", "+12"]].map(([lab, v, pre, d, suf]) => {
      const s = $("div", "", stats);
      css(s, { flex: 1, border: "2px solid var(--line-soft)", borderRadius: "20px", padding: "22px 28px", background: "#fbfcff" });
      s.innerHTML = `<div class="eyebrow">${lab}</div><div style="display:flex;align-items:baseline;gap:14px;margin-top:6px">
        <span class="num v" style="font-size:104px;line-height:1;color:var(--ink)"></span>${suf ? `<span class="num" style="font-size:40px;color:var(--faint)">${suf}</span>` : ""}
        <span class="chip-lime d" style="font-size:32px;margin-left:auto">↗ ${d}</span></div>`;
      return { s, v, pre, val: s.querySelector(".v"), d: s.querySelector(".d") };
    });
    const pts = [52, 55, 54, 58, 57, 60, 59, 61, 63, 62, 64, 66, 65, 68];
    const xy = pts.map((v, i) => [i * (720 / 13), 230 - (v - 45) * 7.6]);
    const dline = "M" + xy.map((p) => p.join(",")).join(" L");
    const line = card.querySelector(".line"), area = card.querySelector(".area"), dot = card.querySelector(".dot");
    line.setAttribute("d", dline);
    area.setAttribute("d", dline + ` L720,250 L0,250 Z`);
    const L = 1400; // generous dash length for the polyline
    line.style.strokeDasharray = `${L}`;
    const models = card.querySelector(".models");
    const M = [["chatgpt", "ChatGPT", 78], ["claude", "Claude", 64], ["perplexity", "Perplexity", 52], ["gemini", "Gemini", 47]].map(([k, n, v]) => {
      const row = $("div", "", models);
      css(row, { display: "flex", alignItems: "center", gap: "16px" });
      row.innerHTML = `${icon(k, 36)}<span style="width:170px;font-size:30px;font-weight:500">${n}</span>
        <span style="flex:1;height:16px;border-radius:8px;background:#eef0f5;overflow:hidden"><span class="b" style="display:block;height:100%;border-radius:8px;background:linear-gradient(90deg,#2743c9,#647cf4);transform-origin:left"></span></span>
        <span class="num nv" style="width:60px;text-align:right;font-size:40px"></span>`;
      return { row, v, b: row.querySelector(".b"), nv: row.querySelector(".nv") };
    });
    const ms = $("div", "abs", r);
    return (t) => {
      // mark beside Ben, then the iris opens from it
      const appear = tw(t, 24.76, 25.1, E.outBack);
      const toC = tw(t, 25.3, 25.85, E.inOutCubic);
      const mx = lerp(1500, 960, toC), my = lerp(300, 470, toC);
      P.update(t, 25.3, 32.1, { iris: [mx, my], din: 0.5 });
      // lockup position: centred at reveal, then flies to the dashboard header
      const toDash = tw(t, 27.0, 27.5, E.inOutCubic);
      const lockX = lerp(mx, 160, toDash), lockY = lerp(my, 98, toDash);
      const sc = lerp(lerp(0.55, 1, toC), 0.36, toDash);
      const open = tw(t, 25.95, 26.45, E.outExpo); // wordmark slides out of the mark
      lock.style.transform = `translate(${lockX - lerp(0, 430, open) * sc * (1 - toDash) - 0}px, ${lockY}px) scale(${sc})`;
      mark.style.opacity = appear.toFixed(3);
      mark.style.transform = `scale(${appear}) rotate(${(1 - appear) * -20}deg)`;
      wm.style.clipPath = `inset(0 ${lerp(100, 0, open)}% 0 0)`;
      wm.style.transform = `translateX(${lerp(-60, 0, open) + 150}px)`;
      mark.style.left = `${-90 + 0}px`;
      ul.style.transform = `translateX(150px) scaleX(${tw(t, 26.3, 26.65, E.outExpo) * (1 - toDash)})`;
      sweep.style.display = "none";
      lock.style.opacity = (1 - tw(t, 31.88, 32.1)).toFixed(3);
      // dashboard
      show(card, t, 27.05, null, { dy: 90, scale: 0.96, din: 0.5 });
      const cam = tw(t, 27.5, 32.1, E.inOutCubic);
      card.style.transform += ` scale(${lerp(1, 1.035, cam)})`;
      S.forEach((s, i) => {
        show(s.s, t, 27.3 + i * 0.1, null, { dy: 30, blur: 4 });
        s.val.textContent = s.pre + count(t, 27.45 + i * 0.1, 28.6, s.v);
        show(s.d, t, 28.45 + i * 0.1, null, { dy: 0, scale: 0.6, ein: E.outBack, din: 0.3, blur: 0 });
      });
      const k = tw(t, 28.1, 29.6, E.inOutCubic);
      line.style.strokeDashoffset = `${L * (1 - k)}`;
      area.style.opacity = tw(t, 28.6, 29.8).toFixed(3);
      const di = Math.min(13, Math.floor(k * 13.999));
      const pf = k * 13 - Math.floor(k * 13);
      const pa = xy[Math.min(13, Math.floor(k * 13))], pb = xy[Math.min(13, Math.floor(k * 13) + 1)] || pa;
      dot.setAttribute("cx", lerp(pa[0], pb[0], di === 13 ? 0 : pf));
      dot.setAttribute("cy", lerp(pa[1], pb[1], di === 13 ? 0 : pf));
      dot.style.opacity = k > 0.01 ? 1 : 0;
      M.forEach((m, i) => {
        const f = tw(t, 29.95 + i * 0.12, 30.6 + i * 0.12, E.outQuint);
        m.b.style.transform = `scaleX(${f * m.v / 100})`;
        m.nv.textContent = Math.round(m.v * f);
      });
      P.update(t, 25.3, 32.1, { iris: [mx, my], din: 0.5 });
      ms.style.display = "none";
    };
  });

  // ---------- B13a website input beside Ben (32.1 - 33.43) ----------
  function websiteCard(r, x, y, url, tType, tClick) {
    const card = $("div", "card abs", r);
    css(card, { left: `${x}px`, top: `${y}px`, width: "680px", padding: "30px 32px 34px" });
    card.innerHTML = `<div class="eyebrow">Your website</div>
      <div style="margin-top:16px;height:88px;border:2px solid var(--line);border-radius:16px;display:flex;align-items:center;gap:16px;padding:0 24px">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#5b6386" stroke-width="1.8"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 3.2 3 15.8 0 19M12 2.5c-3 3.2-3 15.8 0 19"/></svg>
        <span class="u" style="font-size:36px;font-weight:500;color:var(--ink)"></span></div>
      <div class="btn" style="margin-top:20px;height:86px;border-radius:14px;background:var(--lime);color:var(--navy);display:flex;align-items:center;justify-content:center;gap:14px;font-size:34px;font-weight:600">See my AI rank
        <svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" stroke="#0f1b4c" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
    const u = card.querySelector(".u"), btn = card.querySelector(".btn");
    const cur = cursor(r);
    return {
      card,
      update(t, tin, tout) {
        show(card, t, tin, tout, { dy: 50, scale: 0.96 });
        const s = typed(url, t, tType, tType + 0.6);
        u.innerHTML = s ? s + (t < tClick - 0.3 && caretOn(t) ? '<span style="color:var(--blue)">|</span>' : "") : '<span style="color:var(--faint)">yourbrand.com</span>';
        const pr = 1 - 0.05 * Math.sin(Math.PI * clamp((t - tClick) / 0.2));
        btn.style.transform = `scale(${pr})`;
        btn.style.background = t > tClick && t < tClick + 0.35 ? "#a6f01f" : "var(--lime)";
        const bx = x + 340, by = y + 250;
        cur.update(t, [[tType + 0.15, bx + 360, by + 260], [tClick - 0.05, bx + 40, by + 20]], tClick);
        cur.el.style.opacity = (parseFloat(cur.el.style.opacity) * (tout ? 1 - tw(t, tout - 0.2, tout) : 1)).toFixed(3);
      },
    };
  }
  beat("front", 32.05, 33.6, (r) => {
    const c = websiteCard(r, 110, 300, "venturepr.com", 32.3, 33.1);
    return (t) => c.update(t, 32.12, null);
  });

  // ---------- B13b buyer questions wall (33.43 - 36.7) ----------
  beat("front", 33.4, 36.95, (r) => {
    const P = panel(r, "var(--surface)");
    P.el.classList.add("grid-bg");
    const w = P.world;
    const ey = $("div", "eyebrow abs", w, "Buyer questions");
    css(ey, { left: 0, right: 0, top: "120px", textAlign: "center", color: "var(--blue-deep)" });
    const ttl = $("div", "abs", w, "What your buyers ask AI");
    css(ttl, { left: 0, right: 0, top: "166px", textAlign: "center", fontSize: "76px", fontWeight: 700, letterSpacing: "-0.035em", color: "var(--ink)" });
    const R = [
      [["chatgpt", "Best PR agency for a Series A startup?"], ["gemini", "Which PR firm is best for B2B tech?"], ["perplexity", "Top PR agencies for AI startups"], ["claude", "Who handles launch PR for SaaS?"]],
      [["claude", "PR agency or freelancer for a seed round?"], ["chatgpt", "How much does startup PR cost?"], ["grok", "Best PR agencies for fintech"], ["gemini", "Who gets startups into TechCrunch?"]],
      [["perplexity", "Is Venture PR good for startups?"], ["deepseek", "Venture PR vs Northlight PR"], ["chatgpt", "PR firms that work with early teams"], ["claude", "Best PR for a product launch"]],
    ];
    const tracked = [[0, 0, 34.3], [1, 1, 34.62], [2, 0, 34.95]];
    const rows = R.map((items, ri) => {
      const row = $("div", "abs", w);
      css(row, { left: 0, top: `${330 + ri * 132}px`, display: "flex", gap: "24px", whiteSpace: "nowrap" });
      const chips = [...items, ...items].map(([k, q]) => {
        const c = $("div", "pill", row, `${icon(k, 40)}<span>${q}</span>`);
        css(c, { padding: "20px 34px 20px 22px", fontSize: "32px", fontWeight: 500, border: "2px solid transparent" });
        const chk = $("span", "", c, `<svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#0f1b4c" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
        css(chk, { width: "44px", height: "44px", borderRadius: "50%", background: "var(--lime)", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "6px" });
        return { c, chk };
      });
      return { row, chips };
    });
    const off = [-120, -620, -300];
    return (t) => {
      P.update(t, 33.43, null, { from: { x: 110, y: 300, w: 680, h: 420, r: 24 }, din: 0.45 });
      show(ey, t, 33.6, null, { dy: 20 });
      show(ttl, t, 33.66, null, { dy: 40 });
      rows.forEach((rw, ri) => {
        const dir = ri % 2 ? 1 : -1;
        rw.row.style.transform = `translateX(${off[ri] + dir * (t - 33.4) * 70}px)`;
        rw.row.style.opacity = tw(t, 33.7 + ri * 0.1, 34.1 + ri * 0.1).toFixed(3);
        rw.chips.forEach(({ c, chk }, ci) => {
          const tr = tracked.find(([a, b]) => a === ri && b === ci);
          const on = tr ? tw(t, tr[2], tr[2] + 0.3, E.outBack) : 0;
          chk.style.transform = `scale(${on})`;
          chk.style.width = tr ? "44px" : "0px";
          chk.style.marginLeft = tr ? "6px" : "0px";
          c.style.borderColor = on > 0.5 ? "var(--lime)" : "transparent";
          c.style.boxShadow = on > 0.5 ? "0 0 0 6px rgba(184,255,60,.35), var(--shadow-float)" : "var(--shadow-float)";
        });
      });
      // out: slide left as the next screen pushes in
      const q = tw(t, 36.55, 36.95, E.inOutCubic);
      P.el.style.transform = `translateX(${-W * 0.35 * q}px)`;
      P.el.style.filter = q > 0.01 ? `brightness(${1 - 0.4 * q})` : "none";
    };
  });

  // ---------- B15 engines check the question (36.6 - 41.07) ----------
  const Q = "Best PR agency for a Series A startup?";
  beat("front", 36.5, 41.35, (r) => {
    const P = panel(r, "radial-gradient(1400px 900px at 50% 30%, #1a2a6e 0%, #0f1b4c 55%, #0a1338 100%)");
    P.el.classList.add("grid-bg-dark");
    const w = P.world;
    const q = $("div", "pill abs", w, `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3f5efb" stroke-width="2.4"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4" stroke-linecap="round"/></svg><span>${Q}</span>`);
    css(q, { left: "50%", top: "110px", padding: "22px 40px 22px 30px", fontSize: "38px", fontWeight: 500, marginLeft: "-430px" });
    const tiles = ENG.map(([k, n], i) => {
      const tl = $("div", "abs", w);
      css(tl, { left: `${180 + i * 268}px`, top: "248px", width: "236px", height: "190px", borderRadius: "22px", background: "rgba(255,255,255,0.06)", border: "2px solid rgba(255,255,255,0.12)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" });
      tl.innerHTML = `<span style="width:84px;height:84px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;position:relative">${icon(k, 50)}
        <svg class="spin" width="104" height="104" viewBox="0 0 104 104" style="position:absolute;left:-10px;top:-10px"><circle cx="52" cy="52" r="48" stroke="#b8ff3c" stroke-width="5" fill="none" stroke-dasharray="80 300" stroke-linecap="round"/></svg>
        <span class="ok" style="position:absolute;right:-10px;bottom:-8px;width:40px;height:40px;border-radius:50%;background:#b8ff3c;display:flex;align-items:center;justify-content:center;border:4px solid #0f1b4c"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#0f1b4c" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>
        <span style="font-size:30px;font-weight:600;color:#fff">${n}</span>`;
      return { tl, spin: tl.querySelector(".spin"), ok: tl.querySelector(".ok") };
    });
    const ans = $("div", "card abs", w);
    css(ans, { left: "300px", top: "492px", width: "1320px", padding: "34px 44px 38px" });
    ans.innerHTML = `<div style="display:flex;align-items:center;gap:16px">${icon("chatgpt", 44)}<span style="font-size:32px;font-weight:600">ChatGPT</span><span style="flex:1"></span>
        <span class="chip-lime mm" style="font-size:32px">Mentioned · #2</span></div>
      <div style="margin-top:22px;font-size:36px;line-height:1.45;color:var(--body);font-weight:450">
        For a Series A launch, Northlight PR is a well-known name in tech media.
        <span class="hl vp"><span class="hl-bg" style="transform:scaleX(0)"></span><span class="hl-tx" style="color:var(--navy);font-weight:600">Venture PR</span></span>
        focuses on fast press results for startups and pairs launches with founder-led stories.</div>`;
    const vp = ans.querySelector(".vp .hl-bg"), mm = ans.querySelector(".mm");
    return (t) => {
      P.update(t, 36.55, 41.3, { slideFrom: W, slideOut: -W * 0.35 });
      show(q, t, 36.75, null, { dy: 30 });
      tiles.forEach((x, i) => {
        show(x.tl, t, 36.85 + i * 0.07, null, { dy: 40, scale: 0.9 });
        const done = 37.35 + i * 0.19;
        x.spin.style.transform = `rotate(${t * 520 + i * 40}deg)`;
        x.spin.style.opacity = t < done ? 1 : 0;
        const k = tw(t, done, done + 0.25, E.outBack);
        x.ok.style.transform = `scale(${k})`;
        x.tl.style.borderColor = t > done ? "rgba(184,255,60,0.55)" : "rgba(255,255,255,0.12)";
      });
      show(ans, t, 38.6, null, { dy: 80, scale: 0.97, din: 0.45 });
      vp.style.transform = `scaleX(${tw(t, 39.6, 39.95, E.outExpo)})`;
      show(mm, t, 39.98, null, { dy: 0, scale: 0.6, ein: E.outBack, din: 0.3, blur: 0 });
    };
  });

  // ---------- B17 competitors + citations (41.0 - 47.2) ----------
  beat("front", 40.95, 47.25, (r) => {
    const P = panel(r, "var(--surface)");
    P.el.classList.add("grid-bg");
    const w = P.world;
    const rail = $("div", "abs", w);
    css(rail, { left: 0, top: 0, width: `${W * 2}px`, height: `${H}px` });
    // competitors
    const A1 = $("div", "card abs", rail);
    css(A1, { left: "260px", top: "120px", width: "1400px", padding: "36px 44px 30px" });
    A1.innerHTML = `<div style="display:flex;align-items:baseline;gap:20px"><span style="font-size:44px;font-weight:700;letter-spacing:-0.03em">Competitors</span><span style="flex:1"></span><span class="eyebrow">Share of AI answers</span></div>
      <div class="rows" style="margin-top:22px"></div>`;
    const rowsEl = A1.querySelector(".rows");
    const C = [["N", "var(--c-n)", "Northlight PR", 54, 68], ["V", "var(--c-v)", "Venture PR", 52, 64, true], ["B", "var(--c-b)", "Brightwell", 46, 59], ["C", "var(--c-c)", "Cedar & Pine", 33, 41], ["M", "var(--c-m)", "Marlow Partners", 30, 38]];
    const crow = C.map(([l, c, n, v, m, you], i) => {
      const row = $("div", "", rowsEl);
      css(row, { display: "flex", alignItems: "center", gap: "22px", height: "100px", padding: "0 22px", borderRadius: "16px", borderTop: i ? "2px solid var(--line-soft)" : "none", background: you ? "var(--lime-tint)" : "transparent" });
      row.innerHTML = `<span class="num" style="width:40px;font-size:36px;color:var(--faint)">${i + 1}</span>${fav(l, c, 52)}
        <span style="width:330px;font-size:36px;font-weight:600">${n}${you ? ' <span class="chip-lime" style="font-size:26px;padding:2px 10px;vertical-align:middle">You</span>' : ""}</span>
        <span style="flex:1;height:18px;border-radius:9px;background:#eef0f5;overflow:hidden"><span class="b" style="display:block;height:100%;border-radius:9px;background:${you ? "linear-gradient(90deg,#2743c9,#3f5efb)" : "#b4bdd9"};transform-origin:left"></span></span>
        <span class="num pv" style="width:90px;text-align:right;font-size:42px"></span>`;
      return { row, v, b: row.querySelector(".b"), pv: row.querySelector(".pv") };
    });
    // citations
    const B1 = $("div", "card abs", rail);
    css(B1, { left: `${W + 260}px`, top: "120px", width: "1400px", padding: "36px 44px 34px" });
    B1.innerHTML = `<div style="display:flex;align-items:baseline;gap:20px"><span style="font-size:44px;font-weight:700;letter-spacing:-0.03em">Citation footprint</span><span style="flex:1"></span><span class="eyebrow">Where AI finds you</span></div>
      <div style="display:flex;align-items:baseline;gap:16px;margin-top:14px"><span class="num n23" style="font-size:120px;line-height:1"></span><span style="font-size:34px;color:var(--muted)">sources cited</span></div>
      <div class="stack" style="display:flex;height:30px;border-radius:15px;overflow:hidden;margin-top:18px;background:#eef0f5"></div>
      <div class="legend" style="display:flex;gap:40px;margin-top:18px;font-size:30px;color:var(--body)"></div>
      <div class="doms" style="margin-top:22px"></div>`;
    const SEG = [["Reviews", 43, "#0f1b4c"], ["Social", 24, "#3f5efb"], ["News", 20, "#8ea0ff"], ["Other", 13, "#c9d2ff"]];
    const stack = B1.querySelector(".stack"), legend = B1.querySelector(".legend");
    const segs = SEG.map(([n, v, c]) => { const s = $("span", "", stack); css(s, { width: `${v}%`, background: c, transformOrigin: "left", display: "block" }); legend.insertAdjacentHTML("beforeend", `<span style="display:flex;align-items:center;gap:10px"><span style="width:18px;height:18px;border-radius:5px;background:${c}"></span>${n} <b style="font-weight:600">${v}%</b></span>`); return s; });
    const D = [["in", "#0a66c2", "linkedin.com", "Social", 38], ["T", "#0f9d58", "techcrunch.com", "News", 31], ["C", "#ff3d2e", "clutch.co", "Reviews", 27]];
    const doms = B1.querySelector(".doms");
    const drow = D.map(([l, c, d, ty, v], i) => {
      const row = $("div", "", doms);
      css(row, { display: "flex", alignItems: "center", gap: "20px", height: "84px", borderTop: "2px solid var(--line-soft)" });
      row.innerHTML = `${fav(l, c, 46)}<span style="flex:1;font-size:34px;font-weight:500">${d}</span>
        <span style="font-size:28px;color:var(--muted);background:var(--surface);padding:4px 16px;border-radius:999px">${ty}</span>
        <span class="num" style="width:120px;text-align:right;font-size:40px">${v}%</span>`;
      return row;
    });
    const n23 = B1.querySelector(".n23");
    return (t) => {
      P.update(t, 41.0, 47.2, { slideFrom: W });
      show(A1, t, 41.15, null, { dy: 60, scale: 0.97 });
      crow.forEach((c, i) => {
        show(c.row, t, 41.72 + i * 0.1, null, { dy: 26, blur: 4 });
        const f = tw(t, 41.85 + i * 0.1, 42.6 + i * 0.1, E.outQuint);
        c.b.style.transform = `scaleX(${f * c.v / 60})`;
        c.pv.textContent = Math.round(c.v * f) + "%";
      });
      const pan = tw(t, 44.15, 44.8, E.inOutCubic);
      rail.style.transform = `translateX(${-W * pan}px)`;
      A1.style.opacity = (parseFloat(A1.style.opacity) * (1 - 0.6 * pan)).toFixed(3);
      n23.textContent = count(t, 44.45, 45.1, 23);
      segs.forEach((s, i) => { s.style.transform = `scaleX(${tw(t, 44.6 + i * 0.1, 45.0 + i * 0.1, E.outQuint)})`; });
      drow.forEach((d, i) => show(d, t, 45.3 + i * 0.16, null, { dy: 24, blur: 4 }));
      B1.style.transform = `scale(${lerp(1, 1.03, tw(t, 44.8, 47.2, E.inOutCubic))})`;
    };
  });

  // ---------- B19 beyond one check (47.17 - 50.85) ----------
  beat("back", 47.1, 50.95, (r) => {
    const a = headline(r, [[["Not", 47.72], ["one", 48.45]], [["check.", 48.92]]], { x: 118, y: 160, size: 120, gap: 8 });
    const b = headline(r, [[["The", 50.02], ["whole", 50.18]], [["story.", 50.28, "hl"]]], { x: 118, y: 160, size: 120, gap: 8 });
    return (t) => { a.update(t, 49.98); b.update(t, 50.84); };
  });
  // ---------- B20 fix the gaps (50.85 - 52.73) ----------
  beat("back", 50.8, 52.8, (r) => {
    const h = headline(r, [[["Check.", 51.28]], [["Fix", 51.64], ["the", 51.82]], [["gaps.", 52.0, "hl"]]],
      { x: 118, y: 130, size: 120, gap: 8 });
    return (t) => h.update(t, 52.74);
  });

  // ---------- B21 next actions (52.73 - 58.67) ----------
  beat("front", 52.7, 58.95, (r) => {
    const card = $("div", "card abs", r);
    css(card, { left: "100px", top: "150px", width: "730px", padding: "36px 40px 26px" });
    card.innerHTML = `<div class="eyebrow" style="color:var(--blue-deep)">Next actions</div>
      <div style="font-size:52px;font-weight:700;letter-spacing:-0.035em;margin-top:6px">Close the gaps</div><div class="ls" style="margin-top:18px"></div>`;
    const ls = card.querySelector(".ls");
    const items = [["Correct an inaccurate description", 52.81], ["Improve a page", 54.46], ["Answer a missing question", 55.45], ["Check again", 57.88]].map(([txt, at], i) => {
      const row = $("div", "", ls);
      css(row, { display: "flex", alignItems: "center", gap: "22px", height: "96px", borderTop: "2px solid var(--line-soft)" });
      row.innerHTML = `<span class="bx" style="width:48px;height:48px;border-radius:12px;border:3px solid #c9cedb;display:flex;align-items:center;justify-content:center;flex:none">
        <svg class="ck" width="28" height="28" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#0f1b4c" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span class="tx" style="font-size:34px;font-weight:500">${txt}</span>`;
      return { row, at, bx: row.querySelector(".bx"), ck: row.querySelector(".ck"), tx: row.querySelector(".tx") };
    });
    return (t) => {
      show(card, t, 52.76, null, { dy: 40, dx: -60, scale: 0.97 });
      const q = tw(t, 58.62, 58.86, E.inCubic);
      card.style.opacity = (parseFloat(card.style.opacity) * (1 - q)).toFixed(3);
      items.forEach((it, i) => {
        show(it.row, t, it.at, null, { dy: 26, dx: -20, blur: 5 });
        const done = it.at + (i === 3 ? 0.6 : 0.5);
        const k = tw(t, done, done + 0.22, E.outBack);
        it.bx.style.background = k > 0.05 ? "var(--lime)" : "#fff";
        it.bx.style.borderColor = k > 0.05 ? "var(--lime)" : "#c9cedb";
        it.bx.style.transform = `scale(${1 + 0.12 * Math.sin(Math.PI * clamp((t - done) / 0.25))})`;
        it.ck.style.transform = `scale(${k})`;
        it.tx.style.color = k > 0.5 && i < 3 ? "var(--muted)" : "var(--ink)";
      });
    };
  });

  // ---------- B22 visibility up (58.67 - 60.4) ----------
  beat("front", 58.6, 60.45, (r) => {
    const P = panel(r, "radial-gradient(1400px 900px at 50% 30%, #1a2a6e 0%, #0f1b4c 55%, #0a1338 100%)");
    P.el.classList.add("grid-bg-dark");
    const w = P.world;
    const ttl = $("div", "abs", w, `Venture PR's visibility<br>is <span style="color:var(--lime)">up 5 points</span> this month`);
    css(ttl, { left: "200px", top: "150px", fontSize: "76px", fontWeight: 700, letterSpacing: "-0.035em", lineHeight: "1.05" });
    const big = $("div", "abs", w, `<span class="num v" style="font-size:220px;line-height:1"></span><span class="chip-lime" style="font-size:44px;margin-left:18px;vertical-align:top;margin-top:30px">↗ +5</span>`);
    css(big, { left: "1310px", top: "130px", display: "flex", alignItems: "flex-start" });
    const v = big.querySelector(".v");
    const svg = $("div", "abs", w, `<svg width="1520" height="440" viewBox="0 0 1520 440" style="overflow:visible">
      <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8ff3c" stop-opacity=".30"/><stop offset="1" stop-color="#b8ff3c" stop-opacity="0"/></linearGradient></defs>
      <g stroke="rgba(255,255,255,.1)" stroke-width="2"><line x1="0" y1="60" x2="1520" y2="60"/><line x1="0" y1="220" x2="1520" y2="220"/><line x1="0" y1="380" x2="1520" y2="380"/></g>
      <path class="ar" fill="url(#g2)"/><path class="ln" fill="none" stroke="#b8ff3c" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle class="dt" r="16" fill="#b8ff3c" stroke="#0f1b4c" stroke-width="6"/></svg>`);
    css(svg, { left: "200px", top: "470px" });
    const pts = [47, 47.5, 47.2, 48.1, 48.0, 48.9, 49.4, 49.1, 50.2, 50.8, 50.6, 51.4, 52];
    const xy = pts.map((p, i) => [i * (1520 / 12), 400 - (p - 46) * 52]);
    const d = "M" + xy.map((p) => p.join(",")).join(" L");
    const ln = svg.querySelector(".ln"), ar = svg.querySelector(".ar"), dt = svg.querySelector(".dt");
    ln.setAttribute("d", d); ar.setAttribute("d", d + " L1520,440 L0,440 Z");
    ln.style.strokeDasharray = "2400";
    return (t) => {
      P.update(t, 58.67, 60.4, { from: { x: 100, y: 150, w: 730, h: 620, r: 24 }, din: 0.4 });
      show(ttl, t, 58.8, null, { dy: 40 });
      show(big, t, 58.95, null, { dy: 40, scale: 0.9 });
      const k = tw(t, 58.85, 59.75, E.inOutCubic);
      v.textContent = Math.round(lerp(47, 52, k));
      ln.style.strokeDashoffset = `${2400 * (1 - k)}`;
      ar.style.opacity = tw(t, 59.2, 59.9).toFixed(3);
      const seg = Math.min(11.999, k * 12), i = Math.floor(seg), f = seg - i;
      dt.setAttribute("cx", lerp(xy[i][0], xy[i + 1][0], f));
      dt.setAttribute("cy", lerp(xy[i][1], xy[i + 1][1], f));
      dt.setAttribute("r", 16 + 3 * Math.sin(t * 6));
    };
  });

  // ---------- B24 stop guessing (63.22 - 66.43) ----------
  beat("back", 63.2, 66.5, (r) => {
    const a = headline(r, [[["Stop", 63.82]], [["guessing.", 64.04]]], { x: 118, y: 160, size: 120, gap: 6 });
    const b = headline(r, [[["Start", 64.92]], [["working from", 65.12]], [["evidence.", 65.6, "hl"]]], { x: 118, y: 150, size: 92, gap: 12 });
    return (t) => { a.update(t, 64.86); b.update(t, 66.4); };
  });
  // ---------- B25 URL (66.43 - 68.12) ----------
  beat("back", 66.4, 68.2, (r) => {
    const u = $("div", "abs", r);
    css(u, { left: "118px", top: "190px", fontSize: "94px", fontWeight: 700, letterSpacing: "-0.045em", lineHeight: "1", textShadow: "0 0 70px rgba(10,19,56,0.45), 0 2px 24px rgba(10,19,56,0.25)" });
    return (t) => {
      const s = typed("seekworthy.ai", t, 66.72, 67.3);
      const dot = s.indexOf(".");
      u.innerHTML = (dot >= 0 ? s.slice(0, dot) + `<span style="color:var(--lime)">${s.slice(dot)}</span>` : s) +
        (t < 67.9 ? `<span style="display:inline-block;width:8px;height:84px;margin-left:8px;vertical-align:-10px;background:var(--lime);opacity:${caretOn(t) || t < 67.3 ? 1 : 0}"></span>` : "");
      const q = tw(t, 67.92, 68.12, E.inCubic);
      u.style.opacity = (tw(t, 66.5, 66.7) * (1 - q)).toFixed(3);
      u.style.transform = `translateY(${-40 * q}px)`;
    };
  });
  // ---------- B26-B27 free check (68.12 - 71.6) ----------
  beat("front", 68.05, 71.7, (r) => {
    const c = websiteCard(r, 110, 250, "yourbrand.com", 68.32, 70.02);
    const chip = $("div", "abs", r, `<svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#b8ff3c" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Free plan · No card required</span>`);
    css(chip, { left: "110px", top: "700px", display: "flex", alignItems: "center", gap: "12px", background: "rgba(10,19,56,0.82)", color: "#fff", fontSize: "32px", fontWeight: 500, padding: "16px 28px", borderRadius: "999px" });
    return (t) => {
      c.update(t, 68.15, 71.55);
      show(chip, t, 70.62, 71.55, { dy: 30, scale: 0.9, ein: E.outBack });
    };
  });
  // ---------- B28 is AI recommending your business (71.6 - 74.9) ----------
  beat("back", 71.55, 75.0, (r) => {
    const h = headline(r, [[["Is", 71.7], ["AI", 72.32]], [["recommending", 73.16]], [["your business?", 73.56, "hl"]]],
      { x: 118, y: 150, size: 82, gap: 12 });
    return (t) => h.update(t, 74.9);
  });

  // ---------- B29 end card (74.55 - end) ----------
  beat("front", 74.5, 99, (r) => {
    const P = panel(r, "radial-gradient(1400px 900px at 50% 40%, #1a2a6e 0%, #0f1b4c 55%, #0a1338 100%)");
    P.el.classList.add("grid-bg-dark");
    const w = P.world;
    const lock = $("div", "abs", w, `<img src="${MARK}" style="width:112px;height:104px"><span>Seekworthy</span>`);
    css(lock, { left: 0, width: `${W}px`, top: "170px", display: "flex", justifyContent: "center", alignItems: "center", gap: "26px", fontSize: "84px", fontWeight: 700, letterSpacing: "-0.04em" });
    const hd = $("div", "abs", w, `Find out whether AI is<br>recommending <span style="color:var(--lime)">your business.</span>`);
    css(hd, { left: 0, width: `${W}px`, top: "350px", textAlign: "center", fontSize: "88px", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: "1.05" });
    const url = $("div", "abs", w, `<span style="background:var(--lime);color:var(--navy);padding:20px 46px;border-radius:18px">seekworthy.ai</span>`);
    css(url, { left: 0, width: `${W}px`, top: "600px", textAlign: "center", fontSize: "54px", fontWeight: 700, letterSpacing: "-0.02em" });
    const sub = $("div", "abs", w, "Start with a free check · No card needed");
    css(sub, { left: 0, width: `${W}px`, top: "730px", textAlign: "center", fontSize: "34px", color: "#c9d2ff", fontWeight: 500 });
    const ic = $("div", "abs", w);
    css(ic, { left: 0, width: `${W}px`, top: "830px", display: "flex", justifyContent: "center", gap: "26px" });
    const icons = ENG.map(([k]) => { const s = $("span", "", ic, icon(k, 40)); css(s, { width: "76px", height: "76px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }); return s; });
    return (t) => {
      P.update(t, 74.5, null, { iris: [960, 420], din: 0.45 });
      show(lock, t, 74.95, null, { dy: 30, scale: 0.92 });
      show(hd, t, 75.12, null, { dy: 50 });
      show(url, t, 75.4, null, { dy: 30, scale: 0.9, ein: E.outBack });
      show(sub, t, 75.6, null, { dy: 20 });
      icons.forEach((s, i) => show(s, t, 75.7 + i * 0.06, null, { dy: 20, scale: 0.6, ein: E.outBack }));
      w.style.transform = `scale(${lerp(1, 1.025, tw(t, 74.9, 77.3, E.lin))})`;
    };
  });

  // ---------- captions (always on top) ----------
  const capWrap = $("div", "", FRONT);
  capWrap.id = "captions";
  const cap = $("div", "", capWrap);
  cap.id = "cap";
  const CAP_OFF = [[25.6, 26.95], [74.75, 99]];

  window.renderFrame = (f) => {
    const t = f / FPS;
    for (const b of beats) {
      const on = t >= b.t0 && t <= b.t1;
      b.root.style.display = on ? "block" : "none";
      if (on) b.update(t);
    }
    const c = window.CAPTIONS.find((x) => t >= x.s && t < x.e);
    const off = CAP_OFF.some(([a, b]) => t >= a && t < b);
    if (c && !off) {
      cap.textContent = c.t;
      const p = tw(t, c.s, c.s + 0.12, E.outCubic);
      capWrap.style.opacity = p.toFixed(3);
      capWrap.style.transform = `translateY(${(1 - p) * 10}px)`;
    } else {
      capWrap.style.opacity = "0";
    }
  };
  window.TOTAL = window.TOTAL_FRAMES;
})();
