# Tooltip Interaction Checkpoint

The September 29 follow-up authorizes this focused usability fix ahead of #3.
PR #10: `codex/issue-4-tooltip-interactions`, based on unmerged PR #9.

Completed: action-button vocabulary exemption and stale-label cleanup;
hover-family lifetime with descendant retention; 120 ms fade and reduced motion;
nearby placement that prefers space outside panels and protects controls;
persistent keyboard/touch access; stable scrolling on short phone cards.

Verified build:
`0.1.0_First-Light_pr-10_build-004_20260930T015345Z_g584e3370f9eb_web`

911 checks pass: 167 logic, 74 tooltip, 629 workspace, and 41 existing browser
assertions. No browser errors; desktop and phone screenshots inspected.
Runtime head: `7bfd54b195953c0364ff7da375860cc26f655816`.
[Review, Download, And Retest Steps](REVIEW.md) contains the saved exact build,
manifest, reports, and screenshots. Final commit adds documentation/evidence only.

Ready for teacher review. PR chain remains #1 → #9 → #10. No merge or deployment.
Classroom scene (#3) and issues #5–#8 remain separate.
