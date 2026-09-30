# Compact Controls Checkpoint

PR #11: `codex/compact-tools-and-fullscreen`, stacked on unmerged PR #10.
The September 29 follow-up authorizes #6/#7 plus fullscreen and collapsible headers
ahead of remaining issues #3, #5, and #8.

Complete: shared Add/Remove styles and selection, Rotate View removal, native
fullscreen, and integrated collapsible Workshop/Drawing Board headers. Mouse and
touch drags preserve the selected tool and do not edit on release.

Verified build:
`0.1.0_First-Light_pr-11_build-002_20260930T022518Z_g5ffa40ea8efa_web`

1,080 checks pass: 167 logic, 138 controls, 74 tooltip, 659 workspace, and
42 full-playthrough assertions. No browser errors; desktop/phone evidence
inspected. Runtime head: `950273282c16f3bf54f4d7739dc95168152b8d74`.
[Review And Verification](REVIEW.md) links the exact build, original manifest,
reports, screenshots, and retest steps. Final commit adds documentation/evidence
only. Ready for teacher review; no merge or deployment.

PR order: #1 → #9 → #10 → #11. Retarget after each predecessor is accepted.
