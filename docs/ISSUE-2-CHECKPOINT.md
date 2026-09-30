# Issue 2 Checkpoint

## Completed

Issue #2 is implemented on `codex/issue-2-floating-workspace` in PR #9,
stacked on the still-open PR #1. The full-browser scene, floating panels,
responsive portrait/landscape layouts, scrolling, and interaction separation
are complete. All three workshop purposes and the existing design are retained.

**837 checks passed** (167 logic, 629 workspace, 41 regression browser).
Desktop and phone screenshots were inspected. Exact runtime sources and build
identity were verified against the downloaded CI artifact.

Reviewed build: `0.1.0_First-Light_pr-9_build-005_20260930T011129Z_g65d4a74ebce1_web`.
See [Review And Verification](REVIEW.md) for screenshots, results, and a saved ZIP.

## Next Step

Teacher review. Accept PR #1 first, then retarget/review PR #9 against main.
Do not merge or deploy without teacher direction. The classroom-ready live site
is unchanged. Issues #3–#8 have not been started; #3 is next only when requested.

## Recovery

All implementation and evidence are committed to the review branch. Browser
checks run in `.github/workflows/workspace-review.yml`, which never deploys.
Local browser installation was unavailable in this session; GitHub Actions ran
both suites on the exact identified artifact. No curriculum scope was expanded.
