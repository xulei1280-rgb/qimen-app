# Bazi Engine Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the highest-risk 八字 rules into a testable engine layer and expand 神煞、旺衰、格局判断 without changing the current page workflow.

**Architecture:** Add `bazi-engine.js` as a browser/global module that consumes existing `qimen.js` constants and provides deterministic helpers. Keep `bazi.html` UI intact and make existing functions delegate to the engine so the page can be verified incrementally.

**Tech Stack:** Plain HTML, plain JavaScript, Node assert-style checks in `check-bazi-page.js`.

## Global Constraints

- Do not push 八字 changes to GitHub until the user explicitly approves.
- Keep current 奇门 page behavior unchanged.
- Avoid adding dependencies; use plain JavaScript.
- Treat “所有神煞” as a broad common-rule table aligned toward 问真 style, but mark rule output as local reference because 神煞流派不完全统一。
- Preserve current local verification commands: `node .\check-bazi-page.js` and `node .\check-baselines.js`.

---

### Task 1: Engine Module Shell

**Files:**
- Create: `I:\奇门起盘分析\bazi-engine.js`
- Modify: `I:\奇门起盘分析\bazi.html`
- Test: `I:\奇门起盘分析\check-bazi-page.js`

**Interfaces:**
- Produces: `window.BaziEngine` with `tenGod`, `scoreWuxing`, `assessStrength`, `usefulElements`, `patternName`, `shenShaForPillar`, `analyzePattern`.
- Consumes: global `TIAN_GAN`, `DI_ZHI`, `GZ60`, `HIDDEN`, `STEM_WX`, `BRANCH_WX`, `NAYIN`, `KONG_BY_XUN`, `MA_XING_MAP`.

- [ ] Add a failing test that requires `bazi-engine.js` and asserts `BaziEngine` exists.
- [ ] Run `node .\check-bazi-page.js` and confirm it fails before adding the file.
- [ ] Add `bazi-engine.js` with the exported object.
- [ ] Load `bazi-engine.js` in `bazi.html` after `qimen.js`.
- [ ] Run `node .\check-bazi-page.js` and confirm it passes.

### Task 2: Expanded ShenSha Rules

**Files:**
- Modify: `I:\奇门起盘分析\bazi-engine.js`
- Modify: `I:\奇门起盘分析\bazi.html`
- Test: `I:\奇门起盘分析\check-bazi-page.js`

**Interfaces:**
- Produces: `BaziEngine.shenShaForPillar(data, gz)` returning `string[]`.
- Consumes: `data.pillars`, `data.dayStem`, `gz`.

- [ ] Add failing tests for a larger 问真参考盘神煞 list.
- [ ] Implement rule tables for common 年干、日干、年支、日支、月令、旬空神煞.
- [ ] Update `bazi.html` rendering to join the engine array with `<br>`.
- [ ] Run `node .\check-bazi-page.js`.

### Task 3: Pattern and Useful-God Evidence

**Files:**
- Modify: `I:\奇门起盘分析\bazi-engine.js`
- Modify: `I:\奇门起盘分析\bazi.html`
- Test: `I:\奇门起盘分析\check-bazi-page.js`

**Interfaces:**
- Produces: `BaziEngine.analyzePattern(data)` returning `{pattern, strength, useful, evidence}`.
- Consumes: pillars, scores, day stem, month branch.

- [ ] Add failing tests that pattern output includes month-command, reveal, root, strength, and useful evidence.
- [ ] Implement deterministic month-command pattern detection.
- [ ] Preserve existing display strings while adding evidence for AI prompt/report.
- [ ] Run `node .\check-bazi-page.js`.

### Task 4: Verification Sweep

**Files:**
- Test: `I:\奇门起盘分析\check-bazi-page.js`
- Test: `I:\奇门起盘分析\check-baselines.js`

- [ ] Run `node .\check-bazi-page.js`.
- [ ] Run `node .\check-baselines.js`.
- [ ] Do not push to GitHub.
