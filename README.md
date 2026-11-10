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

## Updating the data

```sh
node build/build.mjs            # fetches the current dataset from research.wwtf.at
node build/build.mjs --cached   # rebuilds from build/cache/
```

The script runs the Radar's own `radar-collab.js`, so the collaboration rule and the numbers match the Radar page.
It writes `data/graph.json` (institutions, lines, both layouts) and `data/wien.json` (district outlines, waters).

A new institution in the dataset needs an entry in `build/institutions.json` (full name, type, address), then
`python3 build/geocode.py` to refresh `build/coords.json`. The map layers come from the City of Vienna's WFS; `sh build/fetch-map.sh` downloads them into `build/` (they are not committed, and only change when the city redraws a district).

## Sources

Research data: Vienna Research Radar (WWTF), OpenAlex. District borders and waters: Stadt Wien, data.wien.gv.at (CC BY 4.0).
Addresses geocoded with Nominatim, © OpenStreetMap contributors. three.js is MIT licensed.
