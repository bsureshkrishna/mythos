# Mythos Notebook

A comparative-mythology notebook: **51 big ideas, 192 short tellings, 19 culture collections**.
The Great Flood is No. 1, followed by fifty more ideas about creation, gods, death, heroes and renewal.

[Read the notebook](https://bsureshkrishna.github.io/mythos/).

Static site; no framework and no build step in the browser.

## Reading it

The book always shows **one page per screen**, and has two levels:

- **Concept pages.** A concept, a short note on the shared idea, and the cultures that tell it.
  ← / → move between concepts.
- **Culture pages.** Click a culture to read its telling. ← / → then stay in that culture and move to
  its next or previous concept, skipping concepts it has no version of. ↑ (or the **Up** button, or the
  link at the top of the page) returns to the concept page, where you can pick another culture.
- ↓ on a concept page opens it in the culture you read last.
- Each culture also has a contents page (`#culture/norse`), reachable from the intro page or the index.
- **Browse** (`g`) shows every concept as a card; **Book** (`b`) returns. `/` focuses search.
- On touch screens, swipe to turn pages; with a mouse, use the arrow keys, the buttons, or drag a corner.

URLs track the page: `#great-flood` is an idea page, `#great-flood/indian` a culture's telling.
When a collection has multiple tellings of one idea, `/2` addresses its second telling.
Browser Back/Forward works, and a bookmarked URL opens directly in Book view.
Only the current sheet is interactive; long sheets scroll internally on small screens.
Each telling has comparison buttons and links to online texts or clearly labelled background reading.

## Data

`myths.js` is what the browser loads; `myths.json` is the same data as plain JSON. Both are generated:

    python tools/build.py

`data/edition.json` selects and orders this first edition, chooses tellings from the drafts, and supplies
the short idea summaries and motif references. `data/outline.json` keeps the larger 100-idea plan;
unused drafts in `data/content/*.json` are retained for later editions.

`data/motifs.json` contains checked Thompson and Berezkin–Duvakin codes with catalogue links.
`data/sources.json` supplies the online reading links. Printed citations remain separate from links to
background articles or edition information. A reference can match only some tellings on a page:
these are comparison pointers, not claims that the catalogue assigns every version that code.

The build is offline and fails on missing content, invalid IDs/selections, missing reading links,
missing motif references, unspecified umbrella traditions, or retellings outside 60–210 words.
It emits this text edition without the drafts' optional images. To check generated files are current:

    python tools/build.py --check

`tools/CONTENT_BRIEF.md` is the style and accuracy guide for writing entries.

## Sources and approach

Ideas are organised with references to Stith Thompson's *Motif-Index of Folk-Literature* and Yuri
Berezkin and Evgeny Duvakin's *Analytical Catalogue*. Each telling names its textual or recorded sources.
Loose parallels carry a note. Similar myths are not assumed to share an origin. Collection names such
as Indian and Indigenous North American are navigation umbrellas; individual tellings identify the
specific tradition. Some links use older public-domain translations; others lead to modern scholarship,
museum explanations, background articles or Chinese texts, as indicated in their labels.

## Run

Open `index.html` directly, or serve this directory:

    python -m http.server 8000

Then open http://localhost:8000. It can also be served from GitHub Pages as-is.
StPageFlip 2.0.7 (MIT) and Fuse.js 7.1.0 (Apache-2.0) are bundled in `vendor/`, with their licences. Reading, page turns
and search work offline. Google Fonts is optional and falls back to system fonts; external reading links
need a connection.

GitHub Pages publishes from the root of `main`. The `.nojekyll` file serves these static files directly.
After changing content, run `python tools/build.py`, check the generated files with
`python tools/build.py --check`, and commit and push to `main` to update the live notebook.

## Verification

The browser smoke test requires an installed Playwright package and Chromium:

    node tools/test_browser.cjs
    node tools/test_touch.cjs

Or pass an existing Playwright package path as the first argument. The test opens the local HTML file
with network requests blocked, checks all 51 idea pages and 192 tellings, navigation at both levels,
comparison links, history, index, motif search, boundary pages and 390/320-pixel layouts. The touch test
checks native vertical scrolling, horizontal swipes, and page turns with animation enabled. Screenshots
are written to `tools/screenshots/` (ignored by Git).

    python tools/check_links.py

This optional online check writes `tools/link-report.json`. HTTP 403/429 and timeouts need manual
review: they can be automated-access restrictions rather than broken pages.
