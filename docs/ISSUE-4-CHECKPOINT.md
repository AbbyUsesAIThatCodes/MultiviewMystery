# Tooltip Interaction Checkpoint

The September 29 follow-up authorizes this focused usability fix ahead of #3.
Branch: `codex/issue-4-tooltip-interactions`, based on unmerged PR #9.

Implemented: remove action-button vocabulary annotations (including stale labels),
hover-family lifetime with descendant retention, 120 ms fade and reduced motion,
nearby placement that prefers space outside panels and protects controls,
and persistent keyboard/touch access. Pure hover cards no longer stay indefinitely.

167 existing logic checks and syntax checks pass. Next: run targeted browser
regressions and the existing suites, inspect desktop/phone evidence, save a
review build, and mark the separate fix PR ready. No merge or deployment.
