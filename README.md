# Wer forscht mit wem in Wien?

A 3D model of the collaboration map from the [Vienna Research Radar](https://research.wwtf.at/collaboration.html) (WWTF),
built as a prototype for an exhibition on science literacy aimed at children and adolescents.

Live: https://benwwtf.github.io/forschungsnetz-wien/

- **Network view**: every sphere is a research institution in Vienna, every line stands for jointly authored publications.
- **City map view**: the same spheres float above their addresses, on a map of Vienna's districts.
- **Tour**: six steps that teach how to read the graphic, ending with what it leaves out.
- German and English, touch first, resets itself after 90 seconds without input (`?idle=30` changes the seconds).

No build step for the site itself: plain HTML, CSS and ES modules, three.js vendored in `vendor/`.

## Design

The look follows the Q. brand. `design/tokens.css` holds the brand values as CSS variables; `style.css` assigns
them to roles and `app.js` reads its colours from there.

Typefaces: Clash Display and Clash Grotesk come from Fontshare; local copies in `fonts/` (gitignored, their
licence does not allow public hosting) take precedence when present, so the page also works offline.
PP Radio Grotesk in `fonts/` is a licensed Pangram Pangram typeface, used here with the Q.'s consent.
It is not free to reuse.

## Hidden things

Easter eggs sit next to their spheres and appear when a visitor opens that place (`EGGS` in `texts.js`: icon,
place, story, search words, stage). Four are there from the start; a fifth appears once those are found, and a last
one then opens at the Q. on the city map.

## Updating the data

The numbers come from the Radar's API, `https://research.wwtf.at/api/v1/collaboration.json`, which the Radar
rewrites every Tuesday morning with the same code as its collaboration page. A GitHub Action
(`.github/workflows/update-data.yml`) runs the build every day at 07:43 UTC and commits `data/graph.json` when
the numbers changed, which redeploys the page. By hand:

```sh
node build/build.mjs            # fetches the current numbers from the API
node build/build.mjs --cached   # rebuilds from build/cache/
```

The script adds names, addresses and both layouts and writes `data/graph.json`; `data/wien.json` (district
outlines, waters) is rewritten only when the map layers are present in `build/`.

A new institution in the dataset stops the build (the Action fails and GitHub sends a mail) until it has an entry in `build/institutions.json` (full name, type, address), then
`python3 build/geocode.py` to refresh `build/coords.json`. The map layers come from the City of Vienna's WFS; `sh build/fetch-map.sh` downloads them into `build/` (they are not committed, and only change when the city redraws a district).

## Sources

Research data: Vienna Research Radar (WWTF), OpenAlex. District borders and waters: Stadt Wien, data.wien.gv.at (CC BY 4.0).
Addresses geocoded with Nominatim, © OpenStreetMap contributors. three.js is MIT licensed.
