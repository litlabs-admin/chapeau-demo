---
skill: video-editing
format: launch cut
aspect: 16:9 (1920x1080)
fps: 30
length: 68.8 s
---

# Seekworthy launch video — Script 1, "Does AI Recommend Your Business?"

Deliverable: `exports/seekworthy-launch-v2-room.mp4` — Ben in his own room, graded and relit, with the
motion design rebuilt on the reference film's language. Rebuild with `pipeline/build.sh`.

## How it is built

ffmpeg does the editorial (`pipeline/cutlist.py`, `conform.py`); an HTML/CSS timeline
(`pipeline/gfx/timeline.js`, a pure function of the frame number, keyed to the spoken words) is captured
by Playwright as three transparent layers — behind Ben, in front of him, and a *glass* mask — plus a
per-frame *plate track* that says where the footage sits (full frame, punch-in, inside a card, blurred).
`pipeline/composite.py` grades the footage, places it from the plate track, re-composites Ben over the back
layer from his matte (type behind him), blurs the picture under the glass panels, and lays the front layer
on top. The same timeline exports the sound cues (`build/gfx/sfx.json`) the mix uses.

## Footage log

| File | Dur | Size | fps (r/avg) | Codec | Audio | Notes |
|---|---|---|---|---|---|---|
| IMG_1133.MOV | 5:54 | 1280x720 | 30/29.98 VFR | hevc | 48k stereo (phone mic) | one long take, many retakes per line; lamp-lit room; crown touches top of frame; desk edge at bottom |

Conformed to CFR 30 first (`build/src30.mp4`). Enlargement: 1.5x base (720p -> 1080p), up to 1.83x on
punch-ins (v2) and 1.74–2.0x in v1 (tighter so the cut desk line stays out of frame); sharpened.

## Paper edit

Best take per line (source times in `pipeline/cutlist.py`). The cut is tightened for pace: pauses inside a
line longer than 0.30 s are trimmed to 0.18 s, tails and graphic holds shortened (77.3 s -> 68.8 s). No
words were removed; no line was spliced into a statement Ben didn't make. One short spoken "it" ("work with,
it gives them a shortlist") is restored in the transcript data because the recogniser misses it on the
tighter cut.

## Look: the reference film's language, in Seekworthy colours

Reference: "Best AI Product Launch Video | Arist" (`raw/ref/arist.mp4`, supplied by the user), studied
frame by frame. What was taken from it:

- **Type** — regular weight, ~66 px, each word appearing as it is spoken, in a corner, one key word in the
  brand colour (lime on footage, blue on white). Söhne in the reference (commercial); Inter Tight here.
- **0:00–0:11 chain** (their 0:04–0:10): brand tiles fade in behind Ben with icon tiles popping -> cut to
  white with the same tiles scattered around "They ask ChatGPT which company to work with." -> the tiles fly
  into a grid and condense into the AI shortlist card -> the card collapses into one blue square between
  "Would you ■ know?" -> the square becomes a thumbnail of Ben and opens to full frame.
- **Glass** — dark frosted icon squares, stat chips and a prompt pill over the footage; a light frosted
  action-plan panel over blurred footage.
- **Footage in cards** — Ben drops into a card on the brand canvas, the camera pulls back over a wall of UI
  cards, which resolves into a dot grid with the Seekworthy app icon (their 0:43–0:47); a split screen with
  Ben in a tall card while a numbered UI list updates as he talks (their 0:44–0:50).
- **Canvases** — flat brand colour (their red -> Seekworthy blue `#3f5efb`) with white report cards; soft
  blue/cyan/white gradients with frosted panels; white.
- **Close-up "second angle"** via punch-ins on the key lines.
- **Ending** — flat blue, "Is yours?" (Seekworthy's own hero line), a gradient bloom, then the logo
  (their "Ask away" -> "Arist").

Example customer is a fictional B2B sales SaaS, **Closewise**, with fictional competitors (Revora,
Leadsmith, Pipeworks, Salesgrid). Colours: Seekworthy blue `#3f5efb` / `#2743c9`, cyan `#5fd0ff`, lime
`#b8ff3c`, ink `#0f1b4c`. Logo and AI-engine icons from seekworthy.ai.

## Sound

- **Dialogue** (`pipeline/enhance_voice.py`): WPE de-reverberation (classical, cannot invent speech) ->
  Resemble Enhance denoise-only (its generative mode was rejected: it changed words) -> every line levelled
  to the same loudness (takes differed by up to 4.6 dB) -> harmonic exciter to rebuild the top end the phone
  cut -> match EQ toward the reference film's voice (Demucs-separated), 80 %, ±8 dB -> gentle compression,
  de-ess. Checked with a speech recogniser against the transcript: no word changes introduced.
- **Balance** taken from the reference's stems (music + effects ~5 LU under the voice, barely ducked): here
  the bed sits ~10.5 LU under Ben while he talks (was 16), lifting ~4 dB between lines, with its
  250 Hz–5 kHz band carved a further 5 dB under speech.
- **Music**: "march 2" by Ondrosik — [Free Music Archive](https://freemusicarchive.org/music/Ondrosik/burnout/march-2-1/),
  CC0 1.0. Starts on the bar so its section change lands on "Meet Seekworthy"; one bar-matched jump lands
  its own ending on the last frame.
- **SFX**: placed by the graphics timeline on the visual events they belong to (tile cascades, whooshes on
  every transition, keystrokes per typed character, clicks on button presses, chimes on checks, a reverse
  swell + sub drop + shimmer on the app-icon and logo moments). All Freesound, CC0:
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
- **Master**: −14 LUFS integrated, −1.2 dBTP.

## Assumptions / open items

- Ben's surname isn't in the brief, so the lower third reads "Ben — Founder, Seekworthy".
- The word-by-word type doubles as captions, as in the reference.
