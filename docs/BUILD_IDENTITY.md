# Build Identity

## Contract

`release.json` is the authoritative version/codename record. The imported `v0.1`
is normalized to `0.1.0`, retaining **First Light** as the current development
milestone. Progress remains in memory, with no persistent save contract changed.

Run `node scripts/build.mjs`. It creates
`builds/<version>_<codename>_<scope>_build-<ordinal>_<UTC>_g<revision>[_dirty]_web/`.
The real dirty suffix is `-dirty-<fingerprint>` after the revision. It captures
UTC once before copying sources and injecting the manifest and visible label.

CI reserves ordinals atomically using append-only Git refs named
`build-ledger/pr-N/000001` or `build-ledger/main/000001`. Duplicate creation is
retried; failures retain their reservation. Never delete or rewrite ledger tags.
The workflow is serialized per branch, and ref creation also protects parallel
reservations. Fork PRs cannot write this ledger and must use an explicitly local
review build; no fake PR ordinal is substituted.

Local builds use a UUID scope and an exclusive lock around the counter in
`.git/multiview-builds/ledger.json`. A new checkout has a new local scope. These
never claim to be PR builds. Full Git revision, dirty status, input SHA-256,
target, PR head where applicable, and release status are in the manifest.

## Location Inventory

| Surface | Path Or Location | State |
| --- | --- | --- |
| Release | `release.json` | Authoritative |
| Ordinal | Git ledger refs (CI); `.git/multiview-builds/ledger.json` (local) | Atomic; failures consume reservations |
| Builder And Console | `scripts/build.mjs` | Start, success, failure carry complete ID |
| Output | `builds/<full-id>/` | ID is the folder name |
| Manifest | Output `build-manifest.json` | Immutable for each invocation |
| Prominent UI | `#build-identity` in floating footer | Injected during build; wraps and is selectable |
| Live Source Preview | `dist/index.html` | Explicitly marked Live Development |
| Current Local Build | `builds/latest.json` | Generated pointer, not committed |
| Build Report | Output `BUILD-REPORT.md` | Same ID and source; caller adds verification evidence |
| CI Summary And Artifact | `.github/workflows/pages.yml` | Same manifest, identified downloadable artifact |
| Deployment | Same workflow, main only | Publishes already-built folder; never rebuilds during deploy |
| Current Review Evidence | `docs/REVIEW.md` and PR body | Updated after checks |
| Controls Review Archive | `docs/review/compact-controls/` | Exact tested ZIP, original manifest/report, four browser reports, and screenshots |
| Tooltip Review Archive | `docs/review/issue-4/` | Exact tested ZIP, original manifest/report, browser results, and screenshots |
| Floating Workspace Review | `.github/workflows/workspace-review.yml` | Builds and tests stacked PRs; identified artifact and screenshots; never deploys |
| Contributor Guidance | `AGENTS.md` and PR template | Links to this contract |
| IDE Entrypoint | None | No separate IDE build entrypoint |

The live GitHub Pages deployment remains the old unmodified main build until the
teacher accepts and merges the PR. Review artifacts do not prove deployment.
