/* Seekworthy launch: motion-graphics timeline, in the reference's language.
 *
 * Reference (ObiN Studio's Arist launch + their reels): light/regular
 * grotesk set big and quiet, an italic serif for the one word that matters,
 * words that blur into focus one at a time, a huge word behind the speaker
 * with a two-line name over his body, soft two-colour light blooming from
 * the bottom corners, deep near-black spaces with glow and thin frame lines,
 * light UI cards floating in 3D, a hand cursor, small captions.
 * Only Seekworthy's colours and logo are used.
 *
 * Every frame is a pure function of the frame number (window.renderFrame).
 * #back renders behind Ben (the compositor lays his matte over it), #front
 * over him. Times are seconds on the edit timeline, 30 fps.
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
    inExpo: (x) => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    outQuint: (x) => 1 - Math.pow(1 - x, 5),
    inOutQuint: (x) => (x < 0.5 ? 16 * Math.pow(x, 5) : 1 - Math.pow(-2 * x + 2, 5) / 2),
    outBack: (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
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
  const fav = (l, c, s) => `<span class="fav" style="width:${s}px;height:${s}px;background:${c};font-size:${Math.round(s * 0.46)}px">${l}</span>`;
  const typed = (txt, t, t0, t1) => txt.slice(0, Math.round(clamp((t - t0) / (t1 - t0)) * txt.length));
  const caretOn = (t) => Math.floor(t * 2.2) % 2 === 0;
  const count = (t, t0, t1, v) => Math.round(lerp(0, v, tw(t, t0, t1, E.outQuint)));
  const blur = (el, b) => { el.style.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : "none"; };

  /** Focus-pull entrance (the reference's signature): blur -> sharp, slight rise. */
  function focus(el, t, tin, tout, o = {}) {
    const din = o.din ?? 0.55, dout = o.dout ?? 0.32;
    const p = tw(t, tin, tin + din, E.outExpo);
    const q = tout == null ? 0 : tw(t, tout - dout, tout, E.inCubic);
    el.style.opacity = (p * (1 - q)).toFixed(4);
    const s = lerp(o.scale ?? 1.0, 1, p) * lerp(1, o.outScale ?? 1.02, q);
    el.style.transform = `translate(${(o.dx ?? 0) * (1 - p)}px, ${(o.dy ?? 26) * (1 - p) - (o.dyOut ?? 0) * q}px) scale(${s})`;
    blur(el, (o.blur ?? 18) * (1 - p) + (o.blurOut ?? 14) * q);
    return p * (1 - q);
  }

  /** Kinetic title: lines of [text, at, style] words; style: "", "serif", "grad", "serif grad", "mist". */
  function kinetic(parent, lines, o) {
    const box = $("div", "abs", parent);
    css(box, { left: `${o.x}px`, top: `${o.y}px`, fontSize: `${o.size}px`, fontWeight: o.weight ?? 300,
      letterSpacing: o.ls ?? "-0.045em", lineHeight: o.lh ?? "0.98", color: "#fff", textAlign: o.align || "left",
      width: o.w ? `${o.w}px` : "auto",
      textShadow: o.shadow === false ? "none" : "0 0 80px rgba(5,10,34,0.35)" });
    const words = [];
    lines.forEach((line) => {
      const ln = $("div", "", box);
      css(ln, { whiteSpace: "nowrap" });
      line.forEach(([txt, at, st = ""], i) => {
        const w = $("span", "word " + st, ln, txt);
        if (st.includes("serif")) { w.style.fontSize = "1.12em"; w.style.lineHeight = "0.9"; }
        if (st.includes("mist")) w.style.color = "var(--mist)";
        if (st.includes("lime")) w.style.color = "var(--lime)";
        if (st.includes("grad")) w.style.textShadow = "none";
        words.push({ el: w, at });
        if (i < line.length - 1) $("span", "word", ln, " ");
      });
    });
    return {
      box,
      update(t, tout, dissolveAt) {
        for (const w of words) {
          const p = tw(t, w.at - 0.04, w.at + 0.6, E.outExpo);
          w.el.style.opacity = p.toFixed(4);
          w.el.style.transform = `translateY(${(1 - p) * 0.18 * o.size}px)`;
          blur(w.el, 22 * (1 - p));
        }
        const q = tout == null ? 0 : tw(t, tout - 0.34, tout, E.inCubic);
        box.style.opacity = (1 - q).toFixed(4);
        blur(box, 16 * q);
        box.style.transform = `scale(${lerp(1, 1.03, q)})`;
      },
    };
  }

  const beats = [];
  const beat = (layer, t0, t1, build) => {
    const root = $("div", "abs", layer === "back" ? BACK : FRONT);
    css(root, { left: 0, top: 0, width: `${W}px`, height: `${H}px` });
    beats.push({ t0, t1, root, update: build(root) });
  };

  /** Full-frame dark space with glow and thin frame lines; enters/leaves as a focus dissolve or a light bloom. */
  function space(parent, o = {}) {
    const p = $("div", "screen night", parent);
    const fr = $("div", "frames", p);
    (o.frames || [[240, "v"], [1680, "v"], [150, "h"], [930, "h"]]).forEach(([pos, d]) => {
      const i = $("i", "", fr);
      if (d === "v") css(i, { left: `${pos}px`, top: 0, width: "1.5px", height: `${H}px` });
      else css(i, { top: `${pos}px`, left: 0, height: "1.5px", width: `${W}px` });
    });
    const world = $("div", "abs", p);
    css(world, { left: 0, top: 0, width: `${W}px`, height: `${H}px`, perspective: "2200px", perspectiveOrigin: "50% 40%" });
    const stage = $("div", "abs", world);
    css(stage, { left: 0, top: 0, width: `${W}px`, height: `${H}px`, transformStyle: "preserve-3d" });
    return {
      el: p, stage, fr,
      update(t, tin, tout, k = {}) {
        let op = 1, bl = 0, sc = 1;
        const a = tw(t, tin, tin + (k.din ?? 0.5), E.outQuint);
        const q = tout == null ? 0 : tw(t, tout - (k.dout ?? 0.35), tout, E.inCubic);
        if (k.from) {
          const r = k.from, e = tw(t, tin, tin + 0.55, E.outExpo);
          p.style.clipPath = `inset(${lerp(r.y, 0, e)}px ${lerp(W - r.x - r.w, 0, e)}px ${lerp(H - r.y - r.h, 0, e)}px ${lerp(r.x, 0, e)}px round ${lerp(r.r ?? 30, 0, e)}px)`;
        } else {
          op = a;
          bl = 24 * (1 - a);
          sc = lerp(1.06, 1, a);
          p.style.clipPath = "none";
        }
        op *= 1 - q;
        bl += 22 * q;
        sc *= lerp(1, 1.05, q);
        p.style.opacity = op.toFixed(4);
        world.style.transform = `scale(${sc})`;
        blur(world, bl);
        fr.style.transform = `translateX(${Math.sin(t * 0.3) * 8}px)`;
      },
    };
  }

  /** Hand cursor (the reels use a pointing hand) that glides and taps. */
  function hand(parent) {
    const c = $("div", "abs", parent, `<svg width="64" height="72" viewBox="0 0 32 36">
      <path d="M11 3.5c1.4 0 2.5 1.1 2.5 2.5v9.2l1-.2V12c0-1.3 1.1-2.4 2.4-2.4s2.4 1.1 2.4 2.4v3l.9-.1v-1.6c0-1.3 1.1-2.3 2.3-2.3s2.3 1 2.3 2.3v2.4l.6-.1c1.3 0 2.3 1 2.3 2.3v6.6c0 5-3.6 9-8.6 9h-2.3c-2.6 0-5-1.2-6.6-3.3l-5.7-7.5c-.8-1.1-.6-2.6.5-3.4 1-.7 2.4-.6 3.2.3l1.3 1.4V6c0-1.4 1.1-2.5 2.5-2.5z"
        fill="#fff" stroke="#0f1b4c" stroke-width="1.6" stroke-linejoin="round"/></svg>`);
    css(c, { left: 0, top: 0, filter: "drop-shadow(0 10px 14px rgba(5,10,34,.4))", transformOrigin: "30% 10%" });
    return {
      el: c,
      update(t, path, tapAt, tout) {
        let x = path[0][1], y = path[0][2];
        for (let i = 1; i < path.length; i++) {
          const [t1, x1, y1] = path[i], [t0, x0, y0] = path[i - 1];
          if (t >= t0) { const k = tw(t, t0, t1, E.inOutCubic); x = lerp(x0, x1, k); y = lerp(y0, y1, k); }
        }
        const tap = tapAt != null ? 1 - 0.14 * Math.sin(Math.PI * clamp((t - tapAt) / 0.18)) : 1;
        c.style.transform = `translate(${x}px, ${y}px) scale(${tap})`;
        let o = tw(t, path[0][0] - 0.2, path[0][0]);
        if (tout != null) o *= 1 - tw(t, tout - 0.25, tout);
        c.style.opacity = o.toFixed(3);
      },
    };
  }

  // ------------------------------------------------------------ aura
  // Two-colour light blooming from the bottom corners over the picture,
  // exactly where the reference puts it; it swells with every title moment.
  const TITLE_MOMENTS = [[0, 5.15], [11.43, 12.55], [12.55, 15.3], [15.0, 18.7], [18.7, 23.9], [24.2, 25.9], [47.17, 52.75], [63.2, 66.45], [66.43, 71.6], [71.6, 75.0]];
  const auraLevel = (t) => {
    let v = 0.18;
    for (const [a, b] of TITLE_MOMENTS) v = Math.max(v, tw(t, a - 0.1, a + 0.7, E.outCubic) * (1 - tw(t, b - 0.3, b + 0.2, E.inOutCubic)));
    return v;
  };
  beat("front", 0, 99, (r) => {
    const L = $("div", "abs", r), R = $("div", "abs", r), Lm = $("div", "abs", r);
    css(L, { left: "-700px", top: "560px", width: "1500px", height: "1000px", borderRadius: "50%",
      background: "radial-gradient(closest-side, rgba(0,186,255,0.70), rgba(0,186,255,0.30) 50%, rgba(0,186,255,0) 100%)" });
    css(R, { left: "1000px", top: "470px", width: "1600px", height: "1100px", borderRadius: "50%",
      background: "radial-gradient(closest-side, rgba(0,42,254,0.78), rgba(63,94,251,0.40) 50%, rgba(63,94,251,0) 100%)" });
    css(Lm, { left: "1450px", top: "790px", width: "900px", height: "600px", borderRadius: "50%",
      background: "radial-gradient(closest-side, rgba(184,255,60,0.42), rgba(184,255,60,0) 100%)" });
    return (t) => {
      const v = auraLevel(t);
      L.style.opacity = (v * 0.95).toFixed(3);
      R.style.opacity = v.toFixed(3);
      Lm.style.opacity = (v * 0.8).toFixed(3);
      L.style.transform = `translate(${Math.sin(t * 0.37) * 70}px, ${(1 - v) * 160 + Math.cos(t * 0.29) * 30}px)`;
      R.style.transform = `translate(${Math.cos(t * 0.31) * 80}px, ${(1 - v) * 180 + Math.sin(t * 0.23) * 30}px)`;
      Lm.style.transform = `translate(${Math.sin(t * 0.41) * 60}px, ${(1 - v) * 200}px)`;
    };
  });

  // ------------------------------------------------------------ B0 hook (0 - 5.1)
  beat("back", 0, 5.2, (r) => {
    const a = kinetic(r, [[["Your", 0.0], ["next", 0.16]], [["customer", 0.42]], [["asks", 1.28], ["AI.", 1.5, "serif grad"]]], { x: 100, y: 120, size: 150 });
    const b = kinetic(r, [[["Never", 4.0], ["hears", 4.28]], [["your", 4.54], ["name.", 4.72, "serif"]]], { x: 100, y: 150, size: 124 });
    return (t) => {
      a.update(t, 3.98);
      b.update(t, 5.12);
      // "your name." dissolves away: the point of the line
      const g = tw(t, 4.85, 5.1, E.inOutCubic);
      b.box.lastChild.style.opacity = (1 - 0.75 * g).toFixed(3);
      blur(b.box.lastChild, 10 * g);
    };
  });
  const PROMPT = "Which PR agency should we hire?";
  const PROMPT_RECT = { x: 1080, y: 640, w: 780, h: 180, r: 34 };
  beat("front", 1.1, 5.25, (r) => {
    const card = $("div", "card abs", r);
    css(card, { left: `${PROMPT_RECT.x}px`, top: `${PROMPT_RECT.y}px`, width: `${PROMPT_RECT.w}px`, height: `${PROMPT_RECT.h}px`, padding: "30px 34px", borderRadius: "34px" });
    card.innerHTML = `<div class="tx" style="font-size:42px;font-weight:400;letter-spacing:-0.02em;color:var(--ink);white-space:nowrap"></div>
      <div style="position:absolute;left:34px;bottom:26px;display:flex;align-items:center;gap:12px;font-size:28px;color:var(--muted)">${icon("chatgpt", 34)}<span>ChatGPT</span></div>
      <div class="send" style="position:absolute;right:26px;bottom:22px;width:72px;height:72px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center">
        <svg width="32" height="32" viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
    const tx = card.querySelector(".tx"), send = card.querySelector(".send");
    const h = hand(r);
    return (t) => {
      focus(card, t, 1.28, null, { dy: 50, scale: 0.94, blur: 16 });
      const s = typed(PROMPT, t, 1.5, 2.85);
      tx.innerHTML = (s || '<span style="color:var(--faint)">Ask anything</span>') + (t < 3.1 && caretOn(t) ? '<span style="color:var(--blue);font-weight:300">|</span>' : "");
      send.style.transform = `scale(${1 - 0.1 * Math.sin(Math.PI * clamp((t - 3.05) / 0.2))})`;
      send.style.background = t > 3.05 ? "var(--blue-deep)" : "var(--blue)";
      h.update(t, [[2.4, 1900, 980], [3.0, 1800, 790]], 3.05, 5.0);
    };
  });

  // ------------------------------------------------------------ B1-B3 the shortlist (5.1 - 11.43)
  beat("front", 5.08, 11.48, (r) => {
    const S = space(r);
    const win = $("div", "card abs", S.stage);
    css(win, { left: "330px", top: "110px", width: "1260px", height: "800px", padding: "40px 52px", transformOrigin: "50% 40%" });
    win.innerHTML = `
      <div style="display:flex;align-items:center;gap:14px;font-size:30px;font-weight:500;color:var(--ink)">${icon("chatgpt", 40)}ChatGPT</div>
      <div class="q" style="position:absolute;right:52px;top:32px;background:var(--surface);color:var(--ink);font-size:36px;font-weight:400;letter-spacing:-0.015em;padding:18px 30px;border-radius:28px 28px 8px 28px">${PROMPT}</div>
      <div class="lead" style="margin-top:70px;font-size:34px;color:var(--body);height:44px;letter-spacing:-0.01em"></div>
      <div class="rows" style="margin-top:26px;display:flex;flex-direction:column;gap:14px"></div>`;
    const lead = win.querySelector(".lead"), q = win.querySelector(".q"), rowsEl = win.querySelector(".rows");
    const R = [["1", "N", "var(--c-n)", "Northlight PR", "Well-known in tech media"], ["2", "B", "var(--c-b)", "Brightwell", "Clear, flexible monthly plans"], ["3", "C", "var(--c-c)", "Cedar & Pine", "Strong B2B trade press"]];
    const rows = R.map(([n, l, c, name, d]) => {
      const row = $("div", "", rowsEl);
      css(row, { display: "flex", alignItems: "center", gap: "24px", height: "104px", padding: "0 28px", borderRadius: "22px", border: "1.5px solid var(--line-soft)", position: "relative" });
      row.innerHTML = `<span style="font-size:32px;color:var(--faint);width:40px;font-weight:400">${n}</span>${fav(l, c, 54)}
        <span class="nm" style="font-size:38px;font-weight:500;letter-spacing:-0.02em;position:relative">${name}<span class="ul" style="position:absolute;left:0;right:0;bottom:-4px;height:6px;border-radius:3px;background:var(--lime);transform-origin:left;transform:scaleX(0)"></span></span>
        <span style="font-size:30px;color:var(--muted)">${d}</span><span style="flex:1"></span>`;
      return row;
    });
    const comp = $("span", "", rows[0], "Competitor");
    css(comp, { fontSize: "28px", fontWeight: 500, color: "var(--blue-deep)", border: "1.5px solid var(--blue)", padding: "6px 20px", borderRadius: "999px" });
    const ghost = $("div", "", rowsEl);
    css(ghost, { display: "flex", alignItems: "center", gap: "24px", height: "104px", padding: "0 28px", borderRadius: "22px", border: "2px dashed #b4b9cc" });
    ghost.innerHTML = `<span style="font-size:32px;color:#b4b9cc;width:40px">–</span>${fav("V", "#c3c7d6", 54)}
      <span style="font-size:38px;font-weight:500;color:#8d93ab;letter-spacing:-0.02em">Venture PR</span><span style="font-size:30px;color:var(--faint)">your brand</span><span style="flex:1"></span>`;
    const nm = $("span", "", ghost, "Not mentioned");
    css(nm, { fontSize: "28px", fontWeight: 500, color: "var(--danger)", border: "1.5px solid #f0a5b0", background: "#fdecef", padding: "6px 20px", borderRadius: "999px" });
    const dots = $("div", "abs", win);
    css(dots, { left: "52px", top: "150px", display: "flex", gap: "10px" });
    const dd = [0, 1, 2].map(() => { const d = $("span", "", dots); css(d, { width: "14px", height: "14px", borderRadius: "50%", background: "var(--faint)" }); return d; });
    return (t) => {
      S.update(t, 5.1, 11.43, { from: PROMPT_RECT });
      // 3D float: settles from a tilt, then the push toward the list
      const settle = tw(t, 5.1, 6.6, E.outQuint);
      const push = tw(t, 9.4, 10.4, E.inOutCubic);
      win.style.transform = `translateZ(${lerp(-120, 0, settle) + push * 120}px) rotateX(${lerp(12, 3, settle) - push * 1.5}deg) rotateY(${lerp(-10, -2, settle) + Math.sin(t * 0.5) * 0.6}deg) translateY(${-push * 40}px)`;
      focus(q, t, 5.15, null, { dy: 20, blur: 10, din: 0.4 });
      dots.style.display = t > 5.9 && t < 8.24 ? "flex" : "none";
      dd.forEach((d, i) => { d.style.opacity = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 8 - i * 0.9)); });
      lead.textContent = typed("Here's a shortlist of strong options:", t, 8.24, 8.62);
      rows.forEach((row, i) => focus(row, t, 8.5 + i * 0.15, null, { dy: 40, blur: 14, din: 0.5 }));
      rows[0].querySelector(".ul").style.transform = `scaleX(${tw(t, 9.58, 9.95, E.outExpo)})`;
      rows[0].style.background = t > 9.6 ? `rgba(184,255,60,${0.12 * tw(t, 9.6, 9.9)})` : "transparent";
      focus(comp, t, 9.95, null, { dy: 0, dx: 24, blur: 8, din: 0.4 });
      focus(ghost, t, 10.62, null, { dy: 40, blur: 14, din: 0.5 });
      const shake = t > 10.86 ? Math.sin((t - 10.86) * 55) * 9 * Math.exp(-(t - 10.86) * 9) : 0;
      focus(nm, t, 10.84, null, { dy: 0, scale: 0.85, blur: 8, din: 0.35 });
      nm.style.transform += ` translateX(${shake}px)`;
    };
  });

  // ------------------------------------------------------------ B4 would you know (11.43 - 12.53)
  beat("back", 11.4, 12.6, (r) => {
    const k = kinetic(r, [[["Would", 11.47], ["you", 11.58]], [["know?", 11.7, "serif grad"]]], { x: 100, y: 130, size: 150 });
    return (t) => k.update(t, 12.55);
  });

  // ------------------------------------------------------------ B5 Ben (12.53 - 15.3): name over his body, like "Arist / Diagnostic"
  beat("front", 12.5, 15.4, (r) => {
    const k = kinetic(r, [[["Ben", 12.86]], [["Founder,", 13.84, "mist"], ["Seekworthy", 14.2, "mist"]]], { x: 1180, y: 640, size: 96, weight: 400, ls: "-0.035em", lh: "1.05" });
    k.box.lastChild.style.fontSize = "52px";
    k.box.lastChild.style.marginTop = "10px";
    return (t) => k.update(t, 15.3);
  });

  // ------------------------------------------------------------ B6 AI engines floating around Ben (15.0 - 18.75)
  beat("back", 15.0, 18.8, (r) => {
    // depth: far chips are smaller and softer, like the reel's floating UI
    const P = [[110, 150, 1.0], [300, 330, 0.82], [90, 500, 0.9], [1420, 120, 0.86], [1560, 300, 1.0], [1430, 470, 0.8]];
    const chips = ENG.map(([k, n], i) => {
      const c = $("div", "pill abs", r, `${icon(k, 46)}<span>${n}</span>`);
      css(c, { left: `${P[i][0]}px`, top: `${P[i][1]}px`, padding: "18px 34px 18px 20px", fontSize: "38px", fontWeight: 400, letterSpacing: "-0.02em" });
      return c;
    });
    return (t) => chips.forEach((c, i) => {
      const at = 15.42 + [0, 2, 4, 1, 3, 5][i] * 0.13, z = P[i][2];
      focus(c, t, at, 18.74, { dy: 40, scale: 0.85, blur: 16, din: 0.6 });
      c.style.transform += ` scale(${z}) translateY(${Math.sin(t * 1.1 + i * 1.7) * 9}px)`;
      const extra = (1 - z) * 9;
      if (extra > 0.3) c.style.filter = `blur(${(parseFloat((c.style.filter.match(/[\d.]+/) || [0])[0]) + extra).toFixed(2)}px)`;
    });
  });

  // ------------------------------------------------------------ B7 / B8 (18.71 - 23.89)
  beat("back", 18.7, 21.45, (r) => {
    const k = kinetic(r, [[["When", 18.84], ["a", 18.92], ["buyer", 19.06]], [["asks", 19.4], ["AI", 20.2]], [["for", 20.54, "serif"], ["advice.", 20.8, "serif grad"]]], { x: 100, y: 130, size: 108 });
    return (t) => k.update(t, 21.42);
  });
  beat("front", 19.3, 21.45, (r) => {
    const c = $("div", "pill abs", r, `${icon("claude", 40)}<span>Best PR agency for startups?</span>`);
    css(c, { left: "1230px", top: "700px", padding: "22px 36px 22px 24px", fontSize: "34px", fontWeight: 400, letterSpacing: "-0.015em" });
    return (t) => { focus(c, t, 19.5, 21.4, { dy: 40, scale: 0.94 }); c.style.transform += ` translateY(${Math.sin(t * 1.2) * 6}px)`; };
  });
  beat("back", 21.38, 23.95, (r) => {
    const k = kinetic(r, [[["Are", 21.98], ["you", 22.16]], [["part", 22.92], ["of", 23.04]], [["the", 23.14, "serif"], ["answer?", 23.24, "serif grad"]]], { x: 100, y: 130, size: 112 });
    return (t) => k.update(t, 23.9);
  });

  // ------------------------------------------------------------ B9 "Meet Seekworthy" (23.9 - 25.8): the reference's hero frame
  beat("back", 23.9, 25.95, (r) => {
    const k = kinetic(r, [[["Meet", 24.3, "grad"]]], { x: 40, y: 40, size: 290, ls: "-0.055em" });
    return (t) => k.update(t, 25.9);
  });
  beat("front", 23.9, 25.95, (r) => {
    const box = $("div", "abs", r);
    css(box, { left: "1150px", top: "650px" });
    const l1 = $("div", "", box, `<img src="${MARK}" style="width:92px;height:86px;margin-right:22px;vertical-align:-6px"><span>Seekworthy</span>`);
    css(l1, { fontSize: "124px", fontWeight: 400, letterSpacing: "-0.045em", whiteSpace: "nowrap", lineHeight: "1" });
    const l2 = $("div", "", box, "AI visibility tracking");
    css(l2, { fontSize: "52px", fontWeight: 300, color: "var(--mist)", letterSpacing: "-0.02em", marginTop: "14px", marginLeft: "116px" });
    return (t) => { focus(l1, t, 24.78, 25.9, { dy: 30, blur: 20, din: 0.6 }); focus(l2, t, 25.0, 25.9, { dy: 20, blur: 14 }); };
  });

  // ------------------------------------------------------------ B10-B11 brand + dashboard (25.75 - 32.1)
  beat("front", 25.7, 32.15, (r) => {
    const S = space(r, { frames: [[240, "v"], [1680, "v"], [140, "h"], [940, "h"]] });
    const lock = $("div", "abs", S.stage, `<img src="${MARK}" style="width:150px;height:140px"><span>Seekworthy</span>`);
    css(lock, { left: 0, top: "460px", width: `${W}px`, display: "flex", justifyContent: "center", alignItems: "center", gap: "34px",
      fontFamily: "Geist", fontSize: "128px", fontWeight: 600, letterSpacing: "-0.045em", transformOrigin: "50% 50%" });
    const glow = $("div", "abs", S.stage);
    css(glow, { left: "460px", top: "260px", width: "1000px", height: "560px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(63,94,251,.55), rgba(63,94,251,0))" });
    S.stage.insertBefore(glow, lock);
    // dashboard
    const card = $("div", "card abs", S.stage);
    css(card, { left: "210px", top: "180px", width: "1500px", height: "740px", padding: "40px 50px", transformOrigin: "50% 30%" });
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:18px">${fav("V", "var(--c-v)", 56)}
        <span style="font-size:40px;font-weight:500;letter-spacing:-0.025em">Venture PR</span><span style="flex:1"></span>
        <span style="width:12px;height:12px;border-radius:50%;background:#10b981"></span><span style="font-size:28px;color:var(--muted)">Updated 2h ago</span></div>
      <div class="stats" style="display:flex;gap:22px;margin-top:30px"></div>
      <div style="display:flex;gap:44px;margin-top:30px">
        <div style="flex:1.15"><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:32px;font-weight:500;letter-spacing:-0.02em">Visibility trend</span><span style="font-size:28px;color:var(--muted)">14 days</span></div>
          <svg class="chart" width="720" height="250" viewBox="0 0 720 250" style="margin-top:12px;overflow:visible">
            <defs><linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f5efb" stop-opacity=".22"/><stop offset="1" stop-color="#3f5efb" stop-opacity="0"/></linearGradient></defs>
            <g stroke="#eef0f5" stroke-width="2"><line x1="0" y1="40" x2="720" y2="40"/><line x1="0" y1="125" x2="720" y2="125"/><line x1="0" y1="210" x2="720" y2="210"/></g>
            <path class="area" fill="url(#gfill)" d=""/><path class="line" fill="none" stroke="#3f5efb" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" d=""/>
            <circle class="dot" r="10" fill="#3f5efb" stroke="#fff" stroke-width="5"/></svg></div>
        <div style="flex:1"><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:32px;font-weight:500;letter-spacing:-0.02em">By model</span><span style="font-size:28px;color:var(--muted)">Visibility</span></div>
          <div class="models" style="margin-top:26px;display:flex;flex-direction:column;gap:28px"></div></div></div>`;
    const stats = card.querySelector(".stats");
    const ST = [["Visibility", 68, "", "+3"], ["Rank", 3, "#", "+2", "/10"], ["Mentions", 142, "", "+12"]].map(([lab, v, pre, d, suf]) => {
      const s = $("div", "", stats);
      css(s, { flex: 1, borderRadius: "22px", padding: "22px 28px", background: "var(--surface)" });
      s.innerHTML = `<div class="label">${lab}</div><div style="display:flex;align-items:baseline;gap:12px;margin-top:4px">
        <span class="v" style="font-size:104px;font-weight:300;letter-spacing:-0.05em;line-height:1"></span>${suf ? `<span style="font-size:36px;color:var(--faint);font-weight:300">${suf}</span>` : ""}
        <span class="d" style="margin-left:auto;font-size:30px;font-weight:500;color:var(--navy);background:var(--lime);padding:4px 14px;border-radius:999px">↗ ${d}</span></div>`;
      return { s, v, pre, val: s.querySelector(".v"), d: s.querySelector(".d") };
    });
    const pts = [52, 55, 54, 58, 57, 60, 59, 61, 63, 62, 64, 66, 65, 68];
    const xy = pts.map((v, i) => [i * (720 / 13), 230 - (v - 45) * 7.6]);
    const dl = "M" + xy.map((p) => p.join(",")).join(" L");
    const line = card.querySelector(".line"), area = card.querySelector(".area"), dot = card.querySelector(".dot");
    line.setAttribute("d", dl); area.setAttribute("d", dl + " L720,250 L0,250 Z");
    line.style.strokeDasharray = "1400";
    const models = card.querySelector(".models");
    const M = [["chatgpt", "ChatGPT", 78], ["claude", "Claude", 64], ["perplexity", "Perplexity", 52], ["gemini", "Gemini", 47]].map(([k, n, v]) => {
      const row = $("div", "", models);
      css(row, { display: "flex", alignItems: "center", gap: "16px" });
      row.innerHTML = `${icon(k, 36)}<span style="width:170px;font-size:30px">${n}</span>
        <span style="flex:1;height:12px;border-radius:6px;background:#eef0f5;overflow:hidden"><span class="b" style="display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,#002afe,#00baff);transform-origin:left"></span></span>
        <span class="nv" style="width:64px;text-align:right;font-size:36px;font-weight:300;letter-spacing:-0.03em"></span>`;
      return { v, b: row.querySelector(".b"), nv: row.querySelector(".nv") };
    });
    return (t) => {
      S.update(t, 25.72, 32.1, { din: 0.45 });
      // brand moment: mark + wordmark focus in on the music lift, then lift away to make room
      const ln = tw(t, 25.85, 26.6, E.outExpo);
      const away = tw(t, 26.9, 27.45, E.inOutQuint);
      lock.style.opacity = (ln * (1 - away)).toFixed(3);
      lock.style.transform = `translateY(${lerp(30, 0, ln) - away * 120}px) scale(${lerp(0.94, 1, ln) * lerp(1, 0.8, away)})`;
      blur(lock, 20 * (1 - ln) + 16 * away);
      glow.style.opacity = (0.6 + 0.4 * Math.sin(t * 2)) * (1 - away * 0.6);
      // dashboard floats in from depth and settles while the camera drifts
      const a = tw(t, 27.15, 28.1, E.outQuint);
      const drift = tw(t, 27.2, 32.1, E.inOutCubic);
      card.style.opacity = a.toFixed(3);
      blur(card, 18 * (1 - a));
      card.style.transform = `translateZ(${lerp(-400, 0, a)}px) translateY(${lerp(80, 0, a)}px) rotateX(${lerp(18, 6, a) - drift * 4}deg) rotateY(${lerp(-16, -5, a) + drift * 7}deg)`;
      ST.forEach((s, i) => {
        s.val.textContent = s.pre + count(t, 27.5 + i * 0.1, 28.7, s.v);
        focus(s.d, t, 28.5 + i * 0.1, null, { dy: 0, scale: 0.8, blur: 8, din: 0.4 });
      });
      const k = tw(t, 28.15, 29.6, E.inOutCubic);
      line.style.strokeDashoffset = `${1400 * (1 - k)}`;
      area.style.opacity = tw(t, 28.6, 29.8).toFixed(3);
      const seg = Math.min(12.999, k * 13), i0 = Math.floor(seg), f = seg - i0;
      dot.setAttribute("cx", lerp(xy[i0][0], xy[i0 + 1][0], f));
      dot.setAttribute("cy", lerp(xy[i0][1], xy[i0 + 1][1], f));
      dot.style.opacity = k > 0.01 ? 1 : 0;
      M.forEach((m, i) => {
        const g = tw(t, 29.95 + i * 0.12, 30.7 + i * 0.12, E.outQuint);
        m.b.style.transform = `scaleX(${g * m.v / 100})`;
        m.nv.textContent = Math.round(m.v * g);
      });
    };
  });

  // ------------------------------------------------------------ website card (used twice)
  function websiteCard(r, x, y, url, tType, tTap) {
    const card = $("div", "card abs", r);
    css(card, { left: `${x}px`, top: `${y}px`, width: "720px", padding: "34px 34px 30px", borderRadius: "34px" });
    card.innerHTML = `<div style="font-size:30px;color:var(--muted);letter-spacing:-0.01em">Your website</div>
      <div style="margin-top:16px;height:104px;border-radius:999px;background:var(--surface);display:flex;align-items:center;gap:18px;padding:0 16px 0 34px">
        <span class="u" style="flex:1;font-size:42px;font-weight:400;letter-spacing:-0.02em;color:var(--ink)"></span>
        <span class="btn" style="width:76px;height:76px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center">
          <svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 12h14M13 5.5l6.5 6.5-6.5 6.5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
      <div style="margin-top:18px;display:flex;align-items:center;gap:12px;font-size:28px;color:var(--muted)">See your AI rank on every major AI
        <span style="display:flex;gap:6px;margin-left:auto">${ENG.slice(0, 4).map(([k]) => icon(k, 28)).join("")}</span></div>`;
    const u = card.querySelector(".u"), btn = card.querySelector(".btn");
    const h = hand(r);
    return (t, tin, tout) => {
      focus(card, t, tin, tout, { dy: 50, scale: 0.95, blur: 16 });
      const s = typed(url, t, tType, tType + 0.6);
      u.innerHTML = s ? s + (t < tTap - 0.25 && caretOn(t) ? '<span style="color:var(--blue);font-weight:300">|</span>' : "") : '<span style="color:var(--faint)">yourbrand.com</span>';
      btn.style.transform = `scale(${1 - 0.1 * Math.sin(Math.PI * clamp((t - tTap) / 0.2))})`;
      btn.style.background = t > tTap && t < tTap + 0.4 ? "var(--blue-deep)" : "var(--blue)";
      const bx = x + 620, by = y + 140;
      h.update(t, [[tType + 0.2, bx + 300, by + 380], [tTap - 0.05, bx, by]], tTap, tout);
    };
  }
  beat("front", 32.0, 33.6, (r) => { const u = websiteCard(r, 100, 330, "venturepr.com", 32.3, 33.1); return (t) => u(t, 32.12, null); });

  // ------------------------------------------------------------ B13b buyer questions (33.43 - 36.95)
  beat("front", 33.4, 36.95, (r) => {
    const S = space(r);
    const ttl = $("div", "abs", S.stage, `What your buyers <span class="serif grad" style="font-size:1.14em">ask AI</span>`);
    css(ttl, { left: 0, width: `${W}px`, top: "120px", textAlign: "center", fontSize: "96px", fontWeight: 300, letterSpacing: "-0.045em" });
    const plane = $("div", "abs", S.stage);
    css(plane, { left: "-200px", top: "330px", width: `${W + 400}px`, height: "560px", transformOrigin: "50% 0%", transform: "rotateX(24deg)" });
    const Rr = [
      [["chatgpt", "Best PR agency for a Series A startup?"], ["gemini", "Which PR firm is best for B2B tech?"], ["perplexity", "Top PR agencies for AI startups"], ["claude", "Who handles launch PR for SaaS?"]],
      [["claude", "PR agency or freelancer for a seed round?"], ["chatgpt", "How much does startup PR cost?"], ["grok", "Best PR agencies for fintech"], ["gemini", "Who gets startups into TechCrunch?"]],
      [["perplexity", "Is Venture PR good for startups?"], ["deepseek", "Venture PR vs Northlight PR"], ["chatgpt", "PR firms that work with early teams"], ["claude", "Best PR for a product launch"]],
    ];
    const tracked = [[0, 0, 34.3], [1, 1, 34.62], [2, 0, 34.95]];
    const rows = Rr.map((items, ri) => {
      const row = $("div", "abs", plane);
      css(row, { left: 0, top: `${ri * 150}px`, display: "flex", gap: "26px", whiteSpace: "nowrap" });
      const chips = [...items, ...items].map(([k, q]) => {
        const c = $("div", "pill", row, `${icon(k, 40)}<span>${q}</span>`);
        css(c, { padding: "24px 38px 24px 24px", fontSize: "36px", fontWeight: 400, letterSpacing: "-0.015em", border: "2px solid transparent" });
        const chk = $("span", "", c, `<svg width="26" height="26" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#0f1b4c" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
        css(chk, { width: "0px", height: "46px", borderRadius: "50%", background: "var(--lime)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" });
        return { c, chk };
      });
      return { row, chips };
    });
    const off = [-80, -640, -280];
    return (t) => {
      S.update(t, 33.43, null, { from: { x: 100, y: 330, w: 720, h: 330, r: 34 } });
      focus(ttl, t, 33.7, null, { dy: 30, blur: 20 });
      rows.forEach((rw, ri) => {
        const dir = ri % 2 ? 1 : -1;
        rw.row.style.transform = `translateX(${off[ri] + dir * (t - 33.4) * 64}px)`;
        rw.row.style.opacity = tw(t, 33.75 + ri * 0.12, 34.3 + ri * 0.12).toFixed(3);
        rw.chips.forEach(({ c, chk }, ci) => {
          const tr = tracked.find(([a, b]) => a === ri && b === ci);
          const on = tr ? tw(t, tr[2], tr[2] + 0.35, E.outBack) : 0;
          chk.style.width = `${46 * clamp(on)}px`;
          chk.style.marginLeft = `${8 * clamp(on)}px`;
          c.style.borderColor = on > 0.4 ? "var(--lime)" : "transparent";
          c.style.boxShadow = on > 0.4 ? "0 0 0 8px rgba(184,255,60,.22), 0 20px 50px -18px rgba(5,10,34,.55)" : "0 20px 50px -18px rgba(5,10,34,.55)";
        });
      });
      plane.style.transform = `rotateX(${lerp(30, 20, tw(t, 33.43, 36.9, E.outCubic))}deg)`;
      const q = tw(t, 36.55, 36.95, E.inOutCubic);
      S.el.style.opacity = (parseFloat(S.el.style.opacity) * (1 - q)).toFixed(3);
      blur(S.el, 18 * q);
    };
  });

  // ------------------------------------------------------------ B15 the engines check (36.55 - 41.35)
  const Q = "Best PR agency for a Series A startup?";
  beat("front", 36.5, 41.4, (r) => {
    const S = space(r);
    const q = $("div", "pill abs", S.stage, `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#3f5efb" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4" stroke-linecap="round"/></svg><span>${Q}</span>`);
    css(q, { left: "50%", top: "100px", padding: "24px 42px 24px 30px", fontSize: "40px", fontWeight: 400, letterSpacing: "-0.02em", marginLeft: "-440px" });
    const tiles = ENG.map(([k, n], i) => {
      const tl = $("div", "glass abs", S.stage);
      css(tl, { left: `${178 + i * 268}px`, top: "248px", width: "236px", height: "196px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" });
      tl.innerHTML = `<span style="width:86px;height:86px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;position:relative">${icon(k, 50)}
        <svg class="spin" width="108" height="108" viewBox="0 0 108 108" style="position:absolute;left:-11px;top:-11px"><circle cx="54" cy="54" r="50" stroke="#00baff" stroke-width="4" fill="none" stroke-dasharray="70 330" stroke-linecap="round"/></svg>
        <span class="ok" style="position:absolute;right:-12px;bottom:-8px;width:42px;height:42px;border-radius:50%;background:var(--lime);display:flex;align-items:center;justify-content:center;border:4px solid #050a22"><svg width="20" height="20" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#0f1b4c" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>
        <span style="font-size:30px;font-weight:400">${n}</span>`;
      return { tl, spin: tl.querySelector(".spin"), ok: tl.querySelector(".ok") };
    });
    const ans = $("div", "card abs", S.stage);
    css(ans, { left: "300px", top: "500px", width: "1320px", padding: "36px 46px 40px" });
    ans.innerHTML = `<div style="display:flex;align-items:center;gap:14px;font-size:30px;font-weight:500">${icon("chatgpt", 40)}ChatGPT<span style="flex:1"></span>
        <span class="mm" style="font-size:30px;font-weight:500;color:var(--navy);background:var(--lime);padding:6px 20px;border-radius:999px">Mentioned · #2</span></div>
      <div style="margin-top:22px;font-size:38px;line-height:1.42;color:var(--body);letter-spacing:-0.015em">
        For a Series A launch, Northlight PR is a well-known name in tech media.
        <span class="vp" style="position:relative;color:var(--navy);font-weight:500;white-space:nowrap"><span class="hb" style="position:absolute;left:-6px;right:-6px;top:4px;bottom:2px;background:var(--lime);border-radius:8px;transform-origin:left;transform:scaleX(0);z-index:-1"></span>Venture PR</span>
        focuses on fast press results for startups and pairs launches with founder-led stories.</div>`;
    ans.querySelector(".vp").parentElement.style.position = "relative";
    ans.querySelector(".vp").parentElement.style.zIndex = "0";
    const hb = ans.querySelector(".hb"), mm = ans.querySelector(".mm");
    return (t) => {
      S.update(t, 36.55, 41.3, { din: 0.45 });
      focus(q, t, 36.75, null, { dy: 26, blur: 16 });
      tiles.forEach((x, i) => {
        focus(x.tl, t, 36.85 + i * 0.07, null, { dy: 40, scale: 0.92, blur: 14 });
        const done = 37.35 + i * 0.19;
        x.spin.style.transform = `rotate(${t * 480 + i * 40}deg)`;
        x.spin.style.opacity = t < done ? 1 : 0;
        const k = tw(t, done, done + 0.3, E.outBack);
        x.ok.style.transform = `scale(${k})`;
        x.tl.style.borderColor = t > done ? "rgba(184,255,60,0.5)" : "rgba(255,255,255,0.16)";
      });
      const a = tw(t, 38.6, 39.3, E.outQuint);
      ans.style.opacity = a.toFixed(3);
      blur(ans, 16 * (1 - a));
      ans.style.transform = `perspective(2000px) translateY(${lerp(90, 0, a)}px) rotateX(${lerp(14, 0, a)}deg)`;
      hb.style.transform = `scaleX(${tw(t, 39.6, 39.98, E.outExpo)})`;
      focus(mm, t, 39.98, null, { dy: 0, scale: 0.85, blur: 8, din: 0.4 });
    };
  });

  // ------------------------------------------------------------ B17 competitors + citations (40.95 - 47.25)
  beat("front", 40.95, 47.25, (r) => {
    const S = space(r);
    const rail = $("div", "abs", S.stage);
    css(rail, { left: 0, top: 0, width: `${W * 2}px`, height: `${H}px`, transformStyle: "preserve-3d" });
    const A1 = $("div", "card abs", rail);
    css(A1, { left: "260px", top: "120px", width: "1400px", padding: "38px 46px 30px" });
    A1.innerHTML = `<div style="display:flex;align-items:baseline"><span style="font-size:52px;font-weight:300;letter-spacing:-0.04em">Who AI <span class="serif" style="font-size:1.12em">recommends</span></span><span style="flex:1"></span><span class="label">Share of answers</span></div>
      <div class="rows" style="margin-top:18px"></div>`;
    const C = [["N", "var(--c-n)", "Northlight PR", 54], ["V", "var(--c-v)", "Venture PR", 52, true], ["B", "var(--c-b)", "Brightwell", 46], ["C", "var(--c-c)", "Cedar & Pine", 33], ["M", "var(--c-m)", "Marlow Partners", 30]];
    const crow = C.map(([l, c, n, v, you], i) => {
      const row = $("div", "", A1.querySelector(".rows"));
      css(row, { display: "flex", alignItems: "center", gap: "22px", height: "100px", padding: "0 22px", borderRadius: "18px", borderTop: i ? "1.5px solid var(--line-soft)" : "none", background: you ? "rgba(184,255,60,0.16)" : "transparent" });
      row.innerHTML = `<span style="width:36px;font-size:32px;color:var(--faint)">${i + 1}</span>${fav(l, c, 50)}
        <span style="width:360px;font-size:38px;font-weight:${you ? 500 : 400};letter-spacing:-0.02em">${n}${you ? ' <span style="font-size:26px;font-weight:500;background:var(--lime);color:var(--navy);padding:3px 12px;border-radius:999px;vertical-align:middle">You</span>' : ""}</span>
        <span style="flex:1;height:12px;border-radius:6px;background:#eef0f5;overflow:hidden"><span class="b" style="display:block;height:100%;border-radius:6px;background:${you ? "linear-gradient(90deg,#002afe,#00baff)" : "#c3c9de"};transform-origin:left"></span></span>
        <span class="pv" style="width:100px;text-align:right;font-size:42px;font-weight:300;letter-spacing:-0.03em"></span>`;
      return { row, v, b: row.querySelector(".b"), pv: row.querySelector(".pv") };
    });
    const B1 = $("div", "card abs", rail);
    css(B1, { left: `${W + 260}px`, top: "120px", width: "1400px", padding: "38px 46px 36px" });
    B1.innerHTML = `<div style="display:flex;align-items:baseline"><span style="font-size:52px;font-weight:300;letter-spacing:-0.04em">Where AI <span class="serif" style="font-size:1.12em">finds you</span></span><span style="flex:1"></span><span class="label">Citations</span></div>
      <div style="display:flex;align-items:baseline;gap:16px;margin-top:10px"><span class="n23" style="font-size:132px;font-weight:300;letter-spacing:-0.05em;line-height:1"></span><span style="font-size:36px;color:var(--muted)">sources cited</span></div>
      <div class="stack" style="display:flex;height:22px;border-radius:11px;overflow:hidden;margin-top:18px;background:#eef0f5;gap:4px"></div>
      <div class="legend" style="display:flex;gap:40px;margin-top:18px;font-size:30px;color:var(--body)"></div>
      <div class="doms" style="margin-top:20px"></div>`;
    const SEG = [["Reviews", 43, "#0f1b4c"], ["Social", 24, "#002afe"], ["News", 20, "#00baff"], ["Other", 13, "#c9d2ff"]];
    const segs = SEG.map(([n, v, c]) => {
      const s = $("span", "", B1.querySelector(".stack"));
      css(s, { width: `${v}%`, background: c, transformOrigin: "left", display: "block", borderRadius: "11px" });
      B1.querySelector(".legend").insertAdjacentHTML("beforeend", `<span style="display:flex;align-items:center;gap:10px"><span style="width:16px;height:16px;border-radius:50%;background:${c}"></span>${n} ${v}%</span>`);
      return s;
    });
    const D = [["in", "#0a66c2", "linkedin.com", "Social", 38], ["T", "#0f9d58", "techcrunch.com", "News", 31], ["C", "#ff3d2e", "clutch.co", "Reviews", 27]];
    const drow = D.map(([l, c, d, ty, v]) => {
      const row = $("div", "", B1.querySelector(".doms"));
      css(row, { display: "flex", alignItems: "center", gap: "20px", height: "86px", borderTop: "1.5px solid var(--line-soft)" });
      row.innerHTML = `${fav(l, c, 46)}<span style="flex:1;font-size:36px;letter-spacing:-0.015em">${d}</span>
        <span style="font-size:28px;color:var(--muted);border:1.5px solid var(--line);padding:4px 16px;border-radius:999px">${ty}</span>
        <span style="width:120px;text-align:right;font-size:40px;font-weight:300;letter-spacing:-0.03em">${v}%</span>`;
      return row;
    });
    const n23 = B1.querySelector(".n23");
    return (t) => {
      S.update(t, 41.0, 47.2, { din: 0.45 });
      const a = tw(t, 41.05, 41.9, E.outQuint);
      const pan = tw(t, 44.1, 44.85, E.inOutQuint);
      rail.style.transform = `translateX(${-W * pan}px) translateZ(${-260 * Math.sin(Math.PI * pan)}px) rotateY(${-6 * Math.sin(Math.PI * pan)}deg)`;
      A1.style.opacity = (a * (1 - 0.7 * pan)).toFixed(3);
      A1.style.transform = `translateZ(${lerp(-300, 0, a)}px) rotateX(${lerp(14, 2, a)}deg) rotateY(${lerp(-10, -2, a)}deg)`;
      blur(A1, 16 * (1 - a));
      crow.forEach((c, i) => {
        focus(c.row, t, 41.72 + i * 0.1, null, { dy: 24, blur: 10, din: 0.45 });
        const f = tw(t, 41.85 + i * 0.1, 42.7 + i * 0.1, E.outQuint);
        c.b.style.transform = `scaleX(${f * c.v / 60})`;
        c.pv.textContent = Math.round(c.v * f) + "%";
      });
      B1.style.transform = `rotateY(${lerp(8, 2, pan)}deg) rotateX(${lerp(6, 2, pan)}deg) scale(${lerp(1, 1.025, tw(t, 44.8, 47.2, E.inOutCubic))})`;
      n23.textContent = count(t, 44.45, 45.1, 23);
      segs.forEach((s, i) => { s.style.transform = `scaleX(${tw(t, 44.6 + i * 0.1, 45.05 + i * 0.1, E.outQuint)})`; });
      drow.forEach((d, i) => focus(d, t, 45.3 + i * 0.16, null, { dy: 22, blur: 10, din: 0.45 }));
    };
  });

  // ------------------------------------------------------------ B19 / B20 (47.17 - 52.73)
  beat("back", 47.1, 50.95, (r) => {
    const a = kinetic(r, [[["Not", 47.72], ["one", 48.45]], [["check.", 48.92, "serif grad"]]], { x: 100, y: 140, size: 150 });
    const b = kinetic(r, [[["The", 50.02], ["whole", 50.18]], [["story.", 50.28, "serif grad"]]], { x: 100, y: 140, size: 150 });
    return (t) => { a.update(t, 50.0); b.update(t, 50.85); };
  });
  beat("back", 50.8, 52.8, (r) => {
    const k = kinetic(r, [[["Check.", 51.28]], [["Fix", 51.64], ["the", 51.82]], [["gaps.", 52.0, "serif grad"]]], { x: 100, y: 110, size: 150 });
    return (t) => k.update(t, 52.75);
  });

  // ------------------------------------------------------------ B21 next actions (52.73 - 58.67)
  beat("front", 52.7, 58.95, (r) => {
    const card = $("div", "card abs", r);
    css(card, { left: "100px", top: "150px", width: "760px", padding: "40px 42px 28px" });
    card.innerHTML = `<div style="font-size:30px;color:var(--muted)">Next actions</div>
      <div style="font-size:60px;font-weight:300;letter-spacing:-0.045em;margin-top:4px">Close the <span class="serif" style="font-size:1.12em">gaps</span></div><div class="ls" style="margin-top:16px"></div>`;
    const items = [["Correct an inaccurate description", 52.81], ["Improve a page", 54.46], ["Answer a missing question", 55.45], ["Check again", 57.88]].map(([txt, at]) => {
      const row = $("div", "", card.querySelector(".ls"));
      css(row, { display: "flex", alignItems: "center", gap: "22px", height: "98px", borderTop: "1.5px solid var(--line-soft)" });
      row.innerHTML = `<span class="bx" style="width:50px;height:50px;border-radius:50%;border:2.5px solid #c9cedb;display:flex;align-items:center;justify-content:center;flex:none">
        <svg class="ck" width="28" height="28" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#0f1b4c" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span class="tx" style="font-size:36px;letter-spacing:-0.015em">${txt}</span>`;
      return { row, at, bx: row.querySelector(".bx"), ck: row.querySelector(".ck"), tx: row.querySelector(".tx") };
    });
    return (t) => {
      focus(card, t, 52.76, 58.86, { dy: 40, dx: -40, scale: 0.96, blur: 18 });
      items.forEach((it, i) => {
        focus(it.row, t, it.at, null, { dy: 22, blur: 12, din: 0.45 });
        const done = it.at + (i === 3 ? 0.6 : 0.5);
        const k = tw(t, done, done + 0.25, E.outBack);
        it.bx.style.background = k > 0.05 ? "var(--lime)" : "#fff";
        it.bx.style.borderColor = k > 0.05 ? "var(--lime)" : "#c9cedb";
        it.ck.style.transform = `scale(${k})`;
        it.tx.style.color = k > 0.5 && i < 3 ? "var(--muted)" : "var(--ink)";
      });
    };
  });

  // ------------------------------------------------------------ B22 visibility up (58.6 - 60.45)
  beat("front", 58.6, 60.45, (r) => {
    const S = space(r);
    const ttl = $("div", "abs", S.stage, `Venture PR's visibility<br>is <span class="serif grad" style="font-size:1.12em">up 5 points</span>`);
    css(ttl, { left: "200px", top: "150px", fontSize: "84px", fontWeight: 300, letterSpacing: "-0.045em", width: "1100px", lineHeight: "1.04" });
    const big = $("div", "abs", S.stage, `<span class="v" style="font-size:240px;font-weight:200;letter-spacing:-0.06em;line-height:1"></span>`);
    css(big, { left: "1330px", top: "120px" });
    const v = big.querySelector(".v");
    const sv = $("div", "abs", S.stage, `<svg width="1520" height="420" viewBox="0 0 1520 420" style="overflow:visible">
      <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8ff3c" stop-opacity=".25"/><stop offset="1" stop-color="#b8ff3c" stop-opacity="0"/></linearGradient>
        <filter id="gl"><feGaussianBlur stdDeviation="8"/></filter></defs>
      <path class="ar" fill="url(#g2)"/><path class="lg" fill="none" stroke="#b8ff3c" stroke-width="14" stroke-linecap="round" filter="url(#gl)" opacity=".55"/>
      <path class="ln" fill="none" stroke="#b8ff3c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <circle class="dt" r="14" fill="#b8ff3c"/></svg>`);
    css(sv, { left: "200px", top: "480px" });
    const pts = [47, 47.5, 47.2, 48.1, 48.0, 48.9, 49.4, 49.1, 50.2, 50.8, 50.6, 51.4, 52];
    const xy = pts.map((p, i) => [i * (1520 / 12), 380 - (p - 46) * 52]);
    const d = "M" + xy.map((p) => p.join(",")).join(" L");
    const ln = sv.querySelector(".ln"), lg = sv.querySelector(".lg"), ar = sv.querySelector(".ar"), dt = sv.querySelector(".dt");
    ln.setAttribute("d", d); lg.setAttribute("d", d); ar.setAttribute("d", d + " L1520,420 L0,420 Z");
    ln.style.strokeDasharray = lg.style.strokeDasharray = "2400";
    return (t) => {
      S.update(t, 58.65, 60.4, { din: 0.4 });
      focus(ttl, t, 58.8, null, { dy: 30, blur: 18 });
      focus(big, t, 58.95, null, { dy: 30, blur: 18 });
      const k = tw(t, 58.85, 59.8, E.inOutCubic);
      v.textContent = Math.round(lerp(47, 52, k));
      ln.style.strokeDashoffset = lg.style.strokeDashoffset = `${2400 * (1 - k)}`;
      ar.style.opacity = tw(t, 59.75, 60.15).toFixed(3);
      const seg = Math.min(11.999, k * 12), i = Math.floor(seg), f = seg - i;
      dt.setAttribute("cx", lerp(xy[i][0], xy[i + 1][0], f));
      dt.setAttribute("cy", lerp(xy[i][1], xy[i + 1][1], f));
    };
  });

  // ------------------------------------------------------------ B24 stop guessing / B25 URL (63.2 - 68.12)
  beat("back", 63.2, 66.5, (r) => {
    const a = kinetic(r, [[["Stop", 63.82]], [["guessing.", 64.04, "serif"]]], { x: 100, y: 140, size: 150 });
    const b = kinetic(r, [[["Start", 64.92]], [["working", 65.12], ["from", 65.4]], [["evidence.", 65.62, "serif grad"]]], { x: 100, y: 120, size: 110 });
    return (t) => { a.update(t, 64.9); b.update(t, 66.4); };
  });
  beat("back", 66.4, 68.2, (r) => {
    const u = $("div", "abs", r);
    css(u, { left: "100px", top: "200px", fontSize: "112px", fontWeight: 300, letterSpacing: "-0.045em", textShadow: "0 0 80px rgba(5,10,34,0.35)" });
    return (t) => {
      const s = typed("seekworthy.ai", t, 66.72, 67.3);
      const dot = s.indexOf(".");
      u.innerHTML = (dot >= 0 ? s.slice(0, dot) + `<span class="serif grad" style="font-size:1.1em">${s.slice(dot)}</span>` : s) +
        `<span style="display:inline-block;width:5px;height:104px;margin-left:10px;vertical-align:-14px;background:var(--lime);opacity:${t < 67.3 || caretOn(t) ? 1 : 0}"></span>`;
      const q = tw(t, 67.8, 68.12, E.inCubic);
      u.style.opacity = (tw(t, 66.5, 66.75) * (1 - q)).toFixed(3);
      blur(u, 14 * q);
    };
  });
  // ------------------------------------------------------------ B26/27 free check (68.12 - 71.6)
  beat("front", 68.05, 71.7, (r) => {
    const u = websiteCard(r, 100, 230, "yourbrand.com", 68.32, 70.02);
    const chip = $("div", "abs", r, `<span style="width:12px;height:12px;border-radius:50%;background:var(--lime)"></span><span>Free plan · No card required</span>`);
    css(chip, { left: "100px", top: "640px", display: "flex", alignItems: "center", gap: "14px", border: "1.5px solid rgba(255,255,255,0.45)", background: "rgba(5,10,34,0.45)", color: "#fff", fontSize: "34px", fontWeight: 400, padding: "16px 30px", borderRadius: "999px" });
    return (t) => { u(t, 68.15, 71.55); focus(chip, t, 70.62, 71.55, { dy: 24, blur: 12 }); };
  });
  // ------------------------------------------------------------ B28 (71.6 - 74.9)
  beat("back", 71.55, 75.0, (r) => {
    const k = kinetic(r, [[["Is", 71.7], ["AI", 72.32]], [["recommending", 73.16]], [["your", 73.54, "serif"], ["business?", 73.86, "serif grad"]]], { x: 100, y: 130, size: 98 });
    return (t) => k.update(t, 74.9);
  });

  // ------------------------------------------------------------ B29 end card (74.55 - end)
  beat("front", 74.5, 99, (r) => {
    const S = space(r);
    const lock = $("div", "abs", S.stage, `<img src="${MARK}" style="width:104px;height:97px"><span>Seekworthy</span>`);
    css(lock, { left: 0, width: `${W}px`, top: "170px", display: "flex", justifyContent: "center", alignItems: "center", gap: "24px", fontFamily: "Geist", fontSize: "84px", fontWeight: 600, letterSpacing: "-0.045em" });
    const hd = $("div", "abs", S.stage, `Find out whether AI is recommending<br><span class="serif grad" style="font-size:1.14em">your business.</span>`);
    css(hd, { left: 0, width: `${W}px`, top: "360px", textAlign: "center", fontSize: "88px", fontWeight: 300, letterSpacing: "-0.045em", lineHeight: "1.08" });
    const url = $("div", "abs", S.stage, `<span style="border:1.5px solid rgba(255,255,255,.5);padding:18px 46px;border-radius:999px">seekworthy.ai</span>`);
    css(url, { left: 0, width: `${W}px`, top: "640px", textAlign: "center", fontSize: "48px", fontWeight: 400, letterSpacing: "-0.02em" });
    const sub = $("div", "abs", S.stage, "Start with a free check · No card needed");
    css(sub, { left: 0, width: `${W}px`, top: "760px", textAlign: "center", fontSize: "32px", color: "var(--mist)" });
    const ic = $("div", "abs", S.stage);
    css(ic, { left: 0, width: `${W}px`, top: "850px", display: "flex", justifyContent: "center", gap: "24px" });
    const icons = ENG.map(([k]) => { const s = $("span", "", ic, icon(k, 38)); css(s, { width: "72px", height: "72px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }); return s; });
    return (t) => {
      S.update(t, 74.55, null, { din: 0.5 });
      focus(lock, t, 74.9, null, { dy: 20, blur: 22, din: 0.7 });
      focus(hd, t, 75.15, null, { dy: 30, blur: 22, din: 0.7 });
      focus(url, t, 75.45, null, { dy: 20, blur: 16 });
      focus(sub, t, 75.6, null, { dy: 16, blur: 12 });
      icons.forEach((s, i) => focus(s, t, 75.7 + i * 0.06, null, { dy: 16, scale: 0.8, blur: 10 }));
      S.stage.style.transform = `scale(${lerp(1, 1.025, tw(t, 74.9, 77.3, E.lin))})`;
    };
  });

  // ------------------------------------------------------------ captions: small, quiet, word by word (as in the reference)
  const capWrap = $("div", "", FRONT);
  capWrap.id = "captions";
  const cap = $("div", "", capWrap);
  cap.id = "cap";
  const CAP_OFF = [[25.6, 27.0], [74.6, 99]];
  const W8 = window.WORDS;

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
      // reveal the chunk word by word on the spoken word times
      const parts = c.t.split(" ");
      const start = c.i;
      cap.innerHTML = parts.map((p, i) => {
        const w = start >= 0 ? W8[start + i] : null;
        const k = w ? tw(t, w.s - 0.06, w.s + 0.2, E.outCubic) : 1;
        return `<span style="display:inline-block;opacity:${k.toFixed(3)};filter:blur(${(5 * (1 - k)).toFixed(2)}px);transform:translateY(${(6 * (1 - k)).toFixed(1)}px)">${p}</span>`;
      }).join(" ");
      capWrap.style.opacity = tw(t, c.s, c.s + 0.1).toFixed(3);
    } else {
      capWrap.style.opacity = "0";
    }
  };
})();
