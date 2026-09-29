# Graphics Provenance

## Shared Typography

Comic Neue regular/bold were copied from
EdugamesGraphicsStorage commit `b021165ad9e140adbd06921ed359aed1228e9881`,
`packs/levers-load-effort-distance/fonts/`. The corresponding original SIL OFL
notice is preserved in `dist/fonts/LICENSE.txt`. Comic Sans remains the preferred
system font and is not redistributed.

## Original Multiview Artwork

The shared pack is
[packs/multiview-mystery](https://github.com/AbbyUsesAIThatCodes/EdugamesGraphicsStorage/tree/codex/multiview-graphics-and-standards/packs/multiview-mystery).
Its provenance identifies exact source commits and checksums, including the
imported original and this review's current graphics source. Merge the graphics
PR to make the pack available on that repository's main branch.

| Graphic | Editable Source |
| --- | --- |
| Cube Geometry, Shading, Floor Grid, Front Marker | `dist/scene.mjs` |
| Top/Front/Right Diagrams And Prediction Drawings | `dist/app.js`, `dist/logic.mjs` |
| Brand Cube, Orientation Icon, Favicon | Embedded SVG in `dist/index.html` |
| Palette, Panels, Definition Cards, Completion Animation | `dist/style.css` |
| Fonts | `dist/fonts/`, with license |

Objects use cube units (one cube per cell), Y up, X right in the Front drawing,
Z toward Front, and a 4×4×4 workspace. The original Canvas renderer projects
actual 3D coordinates with an orthographic camera and free arcball rotation;
it uses flat face shading, not physically based lighting or a WebGL scene.
Rainbow columns make the model vivid without changing projection/matching logic.

No raster sprite, texture, mesh file, or third-party artwork is needed at runtime.
The shared pack preserves procedural sources rather than mislabeling screenshots
as reusable 3D models. Original game-source licensing is unspecified; the pack
must not infer an open license solely because the repository is public.
