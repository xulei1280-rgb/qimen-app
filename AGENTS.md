# Project Agent Entry

Do not send optional commentary.

## P1/P2 Cross-Device Handoff

`main` is the shared, publishable source of truth for P1 and P2. Before any
cross-device code work, read `docs/codex/PROJECT-STATUS.md` after pulling the
latest `main`.

- P1 and P2 may directly commit and push `main` only for serialized work: never
  edit the same branch from both computers at the same time.
- At the end of a work session, run the relevant checks, update the active
  handoff in `PROJECT-STATUS.md`, then commit and push both the code and status.
- Commit messages are the detailed immutable history; the status file is only a
  short current-state and next-step summary.
- Dedicated module worktrees remain isolated: they do not push or merge. Their
  coordinator reviews and integrates them into `main` before publishing.

Before changing Bazi code, read `docs/codex/bazi-module-guide.md`, then read only
the document for the module assigned to this worktree:

- AI analysis: `docs/codex/modules/ai.md`
- Pattern and useful elements: `docs/codex/modules/pattern.md`
- Luck cycles, years, and months: `docs/codex/modules/luck.md`
- Bazi UI and responsive layout: `docs/codex/modules/ui.md`

Do not scan the whole repository when the module guide names the relevant files
and search anchors. The coordinator window reviews, integrates, verifies, and
publishes module-worktree changes.
