# Multiview Mystery

An original browser workshop for Design and Modeling: Free Explore, one guided lesson, five comprehension challenges, and a nested vocabulary reference.

## Floating Workspace

The 3D scene fills the browser window without requiring fullscreen mode.
**Workshop** and **Drawing Board** toggle the floating panels. Desktop shows both;
smaller screens show one panel at a time above the footer (beside the model on
landscape phones). Choose the active
panel button again to hide it and give the model more space. The camera follows
the open space automatically.

Scroll inside each panel for its remaining content. The Workshop keeps lesson
feedback and the main action in a separate scrolling area; the Drawing Board
keeps its heading and comparison controls at the top. Panel gestures do not edit
or rotate the scene. Use uncovered scene areas to build, rotate, and zoom.

## Play And Publish

The complete game is in this repository and runs independently of ChatGPT. The earlier private ChatGPT Sites preview was hosted separately.

The GitHub Pages address, once Pages is enabled and deployment succeeds, is:

https://AbbyUsesAIThatCodes.github.io/MultiviewMystery/

### One-Time GitHub Pages Setup

1. Open **Settings → Pages** in this repository.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open **Actions → Deploy Multiview Mystery → Run workflow**, choose `main`, and run it.
4. Wait for a successful deployment; its summary provides the live address.

Subsequent pushes to `main` validate and publish the game automatically. Pull requests run the checks without publishing. No student login or external runtime assets are required. CI uses GitHub’s built-in token only to reserve build identities. Progress lives in memory in the current browser tab and clears on refresh.

### Run Locally

For live development, serve `dist/` over HTTP rather than opening the HTML file directly:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in a browser. With Node.js 22 or newer, run the checks with `node verify.mjs` from this repository's root.

For an identified review build, run `node scripts/build.mjs`, then serve the
folder named in `builds/latest.json`. See [Build Identity](docs/BUILD_IDENTITY.md).

## Teaching

- **Free Explore:** create any construction within the grid and inspect its live drawings.
- **Learn:** follow Explore → Predict → Build in the guided example.
- **Challenge:** solve five numbered drawings-to-model puzzles. The target 3D model
  stays hidden until a successful check. Feedback and optional outline comparison
  support a formative comprehension check; there is no timer or grade export.

Start in Learn. Explore the object with free arcball rotation or Front / Top / Right / 3D buttons. Predict a view, then build from three drawings. Each numbered puzzle opens in Build. Coordinate controls provide an alternative to pointer placement. The paper connection is to construct a model with physical snap cubes, sketch the views, and explain which information each view contributes.

Top is above Front, Right is beside Front. The diagram in the remaining quadrant is an orientation key. Front looks toward negative Z; Right toward negative X; Top toward negative Y. X increases toward the right of Front; Z increases toward the front. Depth 1 is the back row. The amber base edge identifies Front during rotation.

## Matching

`logic.mjs` projects occupied cubes to a 4×4 grid and derives the outside outline and visible edges where adjacent visible surface depths differ. Coplanar cube seams are suppressed. The checker compares projected occupancy and visible edge locations, not a hidden target cube list. Alternative supported, connected constructions are accepted when all three drawings agree. Hidden edges are intentionally omitted. Build rules require one face-connected construction, supported columns, and 0–3 coordinates.

Original puzzles were designed around DM 1.2 multiview work and 2.1 drawing-to-model work; formal Curricular Goals Document mapping is pending the missing audits; no PLTW worksheets, images, or assessment answers are bundled.

## Files

- `dist/index.html`, `dist/style.css`: interface and responsive layout.
- `dist/app.js`: shared UI actions and optional WebMCP tools.
- `dist/scene.mjs`: quaternion arcball, orthographic 3D drawing, visible-face picking.
- `dist/logic.mjs`: puzzles, projections, validity, matching.
- `verify.mjs`: focused checks for spatial rules, matching, and puzzle data.
- `.github/workflows/pages.yml`: validation and GitHub Pages deployment.

## Verification Status

The current review evidence is in [Review And Verification](docs/REVIEW.md).
Run `node verify.mjs` for spatial and input checks. The browser playthrough is
`tests/browser.mjs` (Playwright required); it supports `PLAYWRIGHT_MODULE`,
`CHROMIUM_EXECUTABLE`, `GAME_DIRECTORY`, and `EVIDENCE_DIRECTORY` overrides.

[Shared Edugames Standards](docs/EDUGAMES-STANDARDS.md) ·
[Curricular Mapping And Missing Audits](docs/CURRICULAR-MAPPING.md) ·
[Graphics Provenance](docs/GRAPHICS.md) · [Font Notices](THIRD_PARTY_NOTICES.md)

Version 0.1.0 — First Light (development; imported 0.1 numbering normalized).
