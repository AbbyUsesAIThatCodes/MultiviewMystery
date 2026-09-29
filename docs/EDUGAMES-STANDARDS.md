# Shared Edugames Standards

Teacher direction, September 29, 2026. These standards apply to new work in our
educational games; recording them does not imply that every existing game has
already been updated.

## Typography And Reference

- Use Comic Sans throughout: interface, controls, canvas, SVG, and reference.
  Prefer installed Comic Sans MS / Comic Sans; bundle licensed Comic Neue as
  the explicit cross-platform fallback rather than silently using a serif font.
- Start every word in authored titles and headings with an uppercase letter.
  Keep ordinary instructional sentences in natural sentence case.
- Bold vocabulary terms and provide accessible definitions. Definitions must
  support nested terms without losing the parent explanation.
- Every definition must link to a searchable reference containing curriculum
  vocabulary and useful digital-tool terminology. Mark original local definitions
  honestly; they are not verbatim official curriculum glossary text.
- Tooltips must work with mouse, keyboard, and touch, stay open for reading, and
  close predictably. Tooltips must not capture an action button's normal click.

## Three Required Purposes

| Purpose | Student Experience | Multiview Mystery |
| --- | --- | --- |
| Free Exploration | Use all of the game's mechanics freely, without a prescribed answer. | Free Explore: separate cube construction, live drawings, camera controls, coordinate tools, undo/reset, optional construction-rule feedback. |
| Lessons | Learn through guided tutorials using those same mechanics. | Learn: Explore → Predict → Build, with stage-specific instructions and a first-cube prompt. |
| Comprehension | Demonstrate learning through the mechanics. | Challenge: five drawings-to-model puzzles, with the target model hidden until solved. |

Names and order may vary with the subject. A timer or score is not required.
Learning feedback is not a validated summative assessment or evidence that all
curricular goals have been mastered. Alternate correct constructions remain valid.

## Curriculum First

Design each mechanic from the respective lesson's Curricular Goals Document.
Record the exact document edition, goal, student action, feedback, and evidence
in a separate game-design mapping. Do not add gameplay plans to curriculum audits.
If a required document is missing, record that dependency; do not invent official
alignment. See [Curricular Mapping](CURRICULAR-MAPPING.md) for the current gap.

## Graphics

Use vivid, cartoony 3D objects and a camera students can move. Preserve legible
shapes and fixed drawing conventions when visual polish is added.
Store every original game graphic—including procedural generators, SVGs, palettes,
and reusable source—in [Edugames Graphics Storage](https://github.com/AbbyUsesAIThatCodes/EdugamesGraphicsStorage).
Keep provenance, editable sources, notices, and pinned revisions. Copy approved
assets into the game so classrooms do not depend on live external asset URLs.

This pass retains Multiview's 3D-coordinate Canvas renderer and adds a brighter
column palette. It does not replace it with the Levers physically lit WebGL renderer.

## Builds

Follow [Build Identity](BUILD_IDENTITY.md), preserve review artifacts, and leave
merging and production acceptance to the teacher.
