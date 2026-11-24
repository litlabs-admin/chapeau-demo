---
skill: video-editing
format: launch cut
aspect: 16:9 (1920x1080)
fps: 30
length: 77.3 s
---

# Seekworthy launch video — Script 1, "Does AI Recommend Your Business?"

Two deliverables cut from Ben's one-take recording (`raw/IMG_1133.MOV`, not in git):

| File | Look |
|---|---|
| `exports/seekworthy-launch-v1-studio.mp4` | Ben cut out of his room (RobustVideoMatting) onto a Seekworthy-navy studio backdrop, cooled and rim-lit to sit in it |
| `exports/seekworthy-launch-v2-room.mp4` | Ben in his own room, graded and relit: white balance pulled back from the lamp's orange, subject lifted, background darkened/desaturated/softened, filmic S-curve, navy split-tone, vignette |

Both share the same edit, graphics, captions and mix. Rebuild everything with `pipeline/build.sh`.

## How it is built (and why not GenMotion scenes)

GenMotion's Three.js engine renders footage at ~10–15 s per second of video on this 4-core,
GPU-less machine, and the CLI can't scaffold its HTML engine. The video therefore uses a scripted
pipeline that lives in this project: ffmpeg for the editorial, an HTML/CSS graphics timeline
(`pipeline/gfx/`, pure function of the frame number, captured by Playwright as transparent PNGs in
two layers: behind Ben and in front of him), and a numpy/OpenCV compositor for grade, matte and
layering. The text-behind-the-speaker look comes from compositing Ben's matte over the back layer.

## Footage log

| File | Dur | Size | fps (r/avg) | Codec | Audio | Notes |
|---|---|---|---|---|---|---|
| IMG_1133.MOV | 5:54 | 1280x720 | 30/29.98 VFR | hevc | 48k stereo (phone mic) | one long take, many retakes per line; lamp-lit room; crown touches top of frame; desk edge at bottom |

Conformed to CFR 30 first (`build/src30.mp4`). Enlargement: 1.5x base (720p -> 1080p), up to 1.83x on
punch-ins (v2) and 1.74–2.0x in v1 (tighter so the cut desk line stays out of frame); sharpened.

## Paper edit (best take per line; last complete take unless a flub)

Source times are in `pipeline/cutlist.py`; the conformed cut list is `build/cutlist.json`.

| # | Line | Take | Visual |
|---|---|---|---|
| 1 | "Your next customer could ask AI for a recommendation and never hear your name." | 2nd (0:42) | kinetic type behind Ben, AI prompt being typed |
| 2 | "They ask ChatGPT which company to work with. It gives them a shortlist." | 2nd (1:03) | full-screen AI answer with a shortlist |
| 3 | "Your competitor's on it. You're not. Would you know?" | only (1:12) | competitor highlighted; "Venture PR — Not mentioned"; "Would you know?" behind Ben |
| 4 | "I'm Ben, founder of Seekworthy. We help businesses see how they show up in AI answers." | 1:19 / 1:28 | lower third; AI engine chips around Ben |
| 5 | "But when a buyer asks AI for advice, you need to know if you show up as part of the answer." | 3rd (1:58), 0.8 s pause tightened | kinetic type, prompt chip |
| 6 | "That's why we built Seekworthy. It helps you understand how your business shows up across AI platforms." | 2:13 | iris into logo reveal on the music lift; dashboard |
| 7 | "You start with your website and review the questions your buyers are likely to ask." | 2nd (2:30) | website field + click; buyer-questions wall |
| 8 | "Seekworthy checks those questions and shows you where your brand gets mentioned." | 2nd half of 2:52 take | engines checking; answer with brand mention highlighted |
| 9 | "It also shows which competitors appear and which sources the answers cite." | last (4:00) | competitor table; citation footprint |
| 10 | "So you can go beyond checking your name once… You've got to check and fix the gaps." | 4:26 / 4:31 | kinetic type |
| 11 | "Correct an inaccurate description. Improve a page. Create content… And check again to see what's changed." | 4:44–4:58 | checklist ticking; visibility trend up |
| 12 | "No one can promise you a place in every AI answer. The point is to stop guessing and start working from evidence." | 5:04 / 5:14 | clean, then kinetic type |
| 13 | "Go to seekworthy.ai. Enter your website and start with a free check. No card needed. Find out whether AI is recommending your business." | last (5:39–5:51) | URL, website field, "No card required", end card |

No line was spliced into a statement Ben didn't make; joins are between whole sentences or at
natural pauses, ~0.13 s gaps kept (launch-cut pause table).

## Look: copied from the reference, coloured Seekworthy

Reference: "Best AI Product Launch Video | Arist" (ObiN Studio). YouTube blocks downloads from this
environment, so the style was read from YouTube's four public frames of the film and the studio's
public showreels on obinstudio.com (study only; nothing from them is in the video):

- **Type:** the film uses Söhne (Klim, commercial; Arist's site loads Söhne Buch/Leicht). Used here:
  **Inter Tight** (light 300 / regular 400, tight tracking), the closest open-licence match, plus
  **Instrument Serif Italic** for the one emphasised word, the studio's signature. To use a licensed
  Söhne, change `--sans` in `pipeline/gfx/index.html`.
- **Hero frame:** a huge light word ("Meet") behind the speaker with a white-to-brand gradient
  fill, and the product name in two lines over his body, as in the reference's "Meet / Arist Diagnostic".
- **Colour bloom:** two-colour light rising from the bottom corners over the picture (the reference's
  blue + brand red becomes the Seekworthy logo's cyan + deep blue, with a lime accent), swelling on
  every title moment.
- **Motion:** words focus-pull in one at a time (blur to sharp, slight rise, expo ease); exits blur away.
- **Product beats:** deep near-black navy spaces with glow, thin frame lines and grain; light UI cards
  floating in 3D; a hand cursor; a large prompt field with a round send button.
- **Captions:** small, quiet, word by word, no box.

Colours (Seekworthy only): navy `#0f1b4c`, lime `#b8ff3c`, blue `#3f5efb` (`#2743c9` / `#647cf4`),
logo gradient `#002afe` -> `#00baff`, mist `#c9d2ff`, surface `#f3f5fa`. Logo `assets/brand/mark.png`
and AI engine icons `assets/engines/*.svg` from seekworthy.ai. Product UI uses the site's own sample
data (Venture PR, Northlight PR, Brightwell, Cedar & Pine, Marlow Partners).

## Sound

- **Dialogue** (`pipeline/enhance_voice.sh`): the phone take was muffled and boxy (energy piled up at
  100–800 Hz, steep loss above 1.5 kHz) with room noise at −56 dBFS. Resemble Enhance in denoise-only
  mode removes noise and room tone (floor now below −90 dBFS); corrective EQ removes the low-mid
  build-up and restores presence and air; a gentle harmonic exciter above 3.5 kHz rebuilds the top end
  the phone cut off. Resemble's full "enhance" mode was tested and **rejected**: it changed words
  ("a shortlist" heard as "chocolates with"). Each candidate was checked with a speech recogniser
  against the original transcript; the final chain adds no word changes. Then light compression,
  de-ess, −16 LUFS.
- **Music:** "march 2" by Ondrosik — [Free Music Archive](https://freemusicarchive.org/music/Ondrosik/burnout/march-2-1/),
  **CC0 1.0** (no attribution required). Starts on the bar at 8.73 s so its section change lands on the
  Seekworthy reveal; one bar-aligned jump (44.21 s -> 75.51 s, picked by chroma/MFCC similarity) lands
  the track's own ending on the end card. Ducked ~16 dB under speech, ~7 dB between lines.
- **SFX** (all Freesound, CC0, licence checked on each sound page), placed by each sound's loudest
  point on its visual event; typing is one keystroke per character as it appears:
  - whoosh_light: "Whoosh stereo light (transition)" by xkeril (freesound.org/s/701104) CC0
  - woosh_slide: "Sliding Trailer Woosh" by qubodup (freesound.org/s/171255) CC0
  - whoosh_short: "Whoosh" by qubodup (freesound.org/s/60013) CC0
  - woosh_quick: "quick woosh" by florianreichelt (freesound.org/s/683101) CC0
  - swoosh_halgrimm: "swoosh" by Halgrimm (freesound.org/s/169867) CC0
  - riser_short: "Riser sound effect short.wav" by syntheffects (freesound.org/s/685256) CC0
  - revcym_glassy: "cymbal-reversed-glassy-resonance.wav" by burnttoys (freesound.org/s/9523) CC0
  - subdrop: "Sub Drop Smooth.wav" by newagesoup (freesound.org/s/428073) CC0
  - impact_low: "Cinematic Low Pitch Impact" by Jofae (freesound.org/s/408141) CC0
  - shimmer_success: "Ui sounds - Shimmering success" by Philip_Berger (freesound.org/s/648212) CC0
  - shimmer_coin: "Coin Flip Shimmer" by dpren (freesound.org/s/248143) CC0
  - ui_click: "SFX UI Button Click" by suntemple (freesound.org/s/253168) CC0
  - ui_select: "Menu Scroll/ Selection Sound" by CS279 (freesound.org/s/200469) CC0
  - ui_menu_click: "Menu Selection Click" by NenadSimic (freesound.org/s/171697) CC0
  - ui_hint: "hint.wav" by dland (freesound.org/s/320181) CC0
  - chime: "Chime Notification" by Jofae (freesound.org/s/380482) CC0
  - notify: "Notification Sound" by yfjesse (freesound.org/s/235911) CC0
  - pop: "Pop sound" by deraj (freesound.org/s/202230) CC0
  - keys_single: "Single clicks Keyboard Sound" by StrikeWhistler (freesound.org/s/580786) CC0
  - mouse_click: "computer mouse click" by florianreichelt (freesound.org/s/683099) CC0
- **Master:** −14.0 LUFS integrated, −1.2 dBTP.

## Assumptions / open items

- The full reference film could not be downloaded here, so its pacing and exact transitions were
  inferred from four frames and the studio's reels. Dropping the MP4 into the Drive folder would let
  the timing be matched cut for cut.
- Ben's surname isn't in the brief, so the lower third reads "Ben — Founder, Seekworthy".
- Captions are burned in (the brief says captions will be added).
