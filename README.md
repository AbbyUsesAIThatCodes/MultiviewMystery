# Multiview Mystery

An original browser workshop for Design and Modeling: one guided example, five cube-building puzzles, and Explore / Predict / Build modes.

## Play and publish

The complete game is in this repository and runs independently of ChatGPT. The earlier private ChatGPT Sites preview was hosted separately.

The GitHub Pages address, once Pages is enabled and deployment succeeds, is:

https://AbbyUsesAIThatCodes.github.io/MultiviewMystery/

### One-time GitHub Pages setup

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open **Actions → Deploy Multiview Mystery → Run workflow**, choose `main`, and run it.
4. Wait for a successful deployment; its summary provides the live address.

Subsequent pushes to `main` validate and publish the game automatically. Pull requests run the checks without publishing. No student login, installation, external assets, or secrets are required. Progress lives in memory in the current browser tab and clears on refresh.

### Run locally

Serve `dist/` over HTTP rather than opening the HTML file directly:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in a browser. With Node.js 22 or newer, run the checks with `node verify.mjs` from this repository's root.

## Teaching

Start in Learn. Explore the object with free arcball rotation or Front / Top / Right / 3D buttons. Predict a view, then build from three drawings. Each numbered puzzle opens in Build. Coordinate controls provide an alternative to pointer placement. The paper connection is to construct a model with physical snap cubes, sketch the views, and explain which information each view contributes.

Top is above Front, Right is beside Front. The diagram in the remaining quadrant is an orientation key. Front looks toward negative Z; Right toward negative X; Top toward negative Y. X increases toward the right of Front; Z increases toward the front. Depth 1 is the back row. The amber base edge identifies Front during rotation.

## Matching

`logic.mjs` projects occupied cubes to a 4×4 grid and derives the outside outline and visible edges where adjacent visible surface depths differ. Coplanar cube seams are suppressed. The checker compares projected occupancy and visible edge locations, not a hidden target cube list. Alternative supported, connected constructions are accepted when all three drawings agree. Hidden edges are intentionally omitted. Build rules require one face-connected construction, supported columns, and 0–3 coordinates.

Original puzzles are conceptually aligned with PLTW DM 1.2 multiview work and 2.1 drawing-to-model work; no PLTW worksheets, images, or assessment answers are bundled.

## Files

- `dist/index.html`, `dist/style.css`: interface and responsive layout.
- `dist/app.js`: shared UI actions and optional WebMCP tools.
- `dist/scene.mjs`: quaternion arcball, orthographic 3D drawing, visible-face picking.
- `dist/logic.mjs`: puzzles, projections, validity, matching.
- `verify.mjs`: focused checks for spatial rules, matching, and puzzle data.
- `.github/workflows/pages.yml`: validation and GitHub Pages deployment.

## Verification status

The imported first version passes 167 spatial, input-math, and asset checks plus JavaScript syntax checks. A live browser playthrough and visual layout review have not yet been completed in the authoring environment.

Version 0.1 — First Light.
