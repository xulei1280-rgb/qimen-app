# P1 P2 Device Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make P1 and P2 share one GitHub-backed project state without copying chat history between computers.

**Architecture:** `main` is the shared serial-work branch. `PROJECT-STATUS.md` carries the current handoff while Git commits carry detailed history. Dedicated module worktrees stay isolated until coordinator integration.

**Tech Stack:** Git, GitHub, Markdown, existing Bazi validation scripts.

## Global Constraints

- Do not include API keys or browser-local records in Git.
- Preserve existing uncommitted Bazi implementation changes.
- Do not push from module worktrees.

---

### Task 1: Add the shared handoff contract

**Files:**
- Create: `docs/codex/PROJECT-STATUS.md`
- Modify: `AGENTS.md`
- Test: `git diff --check -- AGENTS.md docs/codex/PROJECT-STATUS.md`

**Interfaces:**
- Consumes: P1/P2 GitHub collaboration and existing Bazi module documents.
- Produces: one short official handoff entry point for every device.

- [x] Define `main` as the shared source of truth and retain module worktrees for parallel edits.
- [x] Record owner, last shared commit, changed module, checks, next task, and caution in one status file.
- [x] Verify document integrity with `git diff --check -- AGENTS.md docs/codex/PROJECT-STATUS.md`.
- [ ] Commit only the three collaboration documents with message `docs: add P1 P2 device handoff`.
