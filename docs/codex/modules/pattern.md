# Pattern And Useful-Element Module

## Goal

Produce evidence-based strength, main pattern, pattern condition, special-pattern
status, useful elements, and favorable/unfavorable interaction conclusions.

The normative level-score, audit-percentile, high-grade qualification, and output contract
is `pattern-percentile-design.md`.

## Primary File

Start with `bazi-engine.js`. Search only these anchors:

```powershell
rg -n "analyzePattern|strength|pattern|useful|special|comboConflict|remedy" bazi-engine.js check-bazi-page.js
```

## Decision Boundary

- `命格` is the principal conventional pattern supported by the chart.
- `格局层次` describes completion, defects, rescue, and stability; it is not a
  duplicate list of candidate patterns.
- Only the highest-weight main pattern is displayed as the principal pattern.
- From/transform/special patterns require their full conditions. If conditions are
  incomplete, label them as a reference clue, not an established pattern.
- Favorable and damaging combinations may coexist. Preserve main structure, damage,
  rescue, and luck-trigger evidence instead of forcing one good/bad verdict.

## Current Professional-Term Rules

- `ZP-QX-002` to `ZP-QX-005` cover resource-excess phenomena only when the
  affected element is the day master, the resource clearly dominates, and the
  day master lacks a usable main root. A visible main root is a direct rejection.
- `ZP-CG-09` forms 食神生财 only with month-command food, clear rooted wealth,
  a reachable food-to-wealth link, and day-master capacity. Otherwise it is a clue.
- `ZP-TS-01` 杀重身轻 requires a weak day master, forceful killing, and no
  forceful food-control or seal-transform rescue. `ZP-TS-02` 身旺无依 excludes
  true special patterns and any clear finance, officer/killing, or seal outlet.
- Positive terms `ZP-ZX-01` to `ZP-ZX-04` require season, proportion, visibility,
  roots, flow, and counter-evidence checks. They never form from element counts alone.
- 清浊 conclusions must state professional terms, active actors, obstruction,
  rescue, keep/remove result, and rule IDs. Natal conclusions come before luck effects.
- `ZP-NET-01` settles each defect as `disease -> matching medicine -> medicine
  strength -> residual disease`. The same weak-carrying defect is counted once;
  rooted but hidden medicine is partial rescue, and a medicine only removes the
  defect it actually treats.
- 食神制杀必须同时核验食杀根透、日主承载、官杀清纯、作用距离和
  财星是否使食神贪生忘克。藏支食神只能作药意或线索，不能因为
  真人反馈而放宽成格；食伤分工也只能建立在食神制杀已经严格成立之后。
- An element required by strength support but restricted by pattern or climate
  is `conditional use`, not a pure favorable or unfavorable element. State both
  its benefit and its ten-god risk.
- `natalPatternLevel` is immutable natal structure output. Luck evaluation has
  a separate current activation status and grade; it may say `运中补格`, but it
  must not rewrite the natal grade.
- `ZP-LV-03` to `ZP-LV-05` settle the public five-grade result as
  `偏低 / 中等 / 偏高 / 高 / 顶级`: the one-decimal structure score directly
  gives the candidate grade; high requires a formed structure or effective rescue,
  and top requires the complete strict qualification set. Percentiles are audit-only.
- The active `PAT-208` implementation below is the reproducible comparison
  baseline, not the approved target weight set. The formal design audits
  `10/25/25/15/20/5` before any replacement or freeze. The current baseline is
  a six-dimensional weighted ranking: classical pattern potential 20%,
  formation 25%, action flow 20%, clarity 15%, disease-remedy 15%, and
  elemental-balance correction 5%.
  A displayed pattern name never earns points by itself. Only the verified main
  pattern identified by a stable rule ID receives one classical-potential
  component; secondary names and compatible combinations do not stack it.
- Classical potential uses coarse, traceable tiers rather than simulated
  precision: strict `S` structures score 100, `A` structures score 85, and a
  verified ordinary month-command pattern scores 70 (`B`). Its theoretical
  potential remains distinct from current success or failure: a broken ordinary
  pattern keeps that ceiling, while formation, remedy, and hard gates settle the
  actual defects. An unverified or pending month-command pattern receives zero.
  If a named noble structure fails strict formation—for example, wealth damages
  the seal in an injury-output-with-seal candidate—it falls back to the verified
  ordinary month-command rule instead of retaining the noble-pattern potential.
- Broken formation preserves its satisfied positive checks instead of replacing
  the whole dimension with one status anchor. Disease-remedy scoring is
  proportional to unresolved and partial residual severity; rooted hidden
  medicine is partial rescue, while medicine with neither visibility nor root is
  absent. These rules prevent potential, formation, and remedy from repeatedly
  charging the same defect as if it were three independent failures.
- Raw-score evidence uses pre-phenomenon structural clarity, treats a
  disease-owned negative clarity result as neutral in the clarity dimension,
  and gives no extra reward for a disease that is fully solved versus no disease.
- Strict noble patterns no longer receive an extra `偏高` quality floor after
  their potential has already entered the raw score. `顶级` still requires P95
  candidacy plus the independent hard gates: verified complete formation,
  reachable flow, clear purity, and no residual disease or elemental pathology.
- True from, transform, and dedicated-strength patterns expose structured
  qualification evidence (`checks`, `flowChecks`, evidence, and
  counter-evidence) under their own context. Once a special pattern is strictly
  verified, ordinary-pattern diseases and phenomena move to
  `patternDisease.ignored` with numeric ownership assigned to special formation;
  they do not remain active merely to deduct the same condition a second time.
  A no-root check means no hidden stem of the day master's element in either
  polarity; for example, a hidden `丙` is still a fire root that blocks a `丁`
  day master's transform qualification. Public special-pattern fields use only
  the verified special context: the ordinary month pattern is marked as
  background, ordinary combinations and positive phenomena are retained only in
  `ordinaryContext`, and balance/climate layers remain validation-only rather
  than emitting advice that contradicts the special pattern.
- Pattern level covers natal potential and luck activation only. Reality also
  depends on family, education, era, region, industry, and personal choices;
  level is not human value or a guaranteed outcome.
- `ZP-HC-01` to `ZP-HC-06` arbitrate natal interactions before they feed
  strength and pattern flow: contested stem combines do not transform; complete
  supported three-meetings and three-harmonies outrank overlapping six-combines
  and lower-priority punishment/harm/break; a clash sharing the combined branch
  remains `冲合并见`; partial groups remain clues. Transformation requires the
  target qi to be seasonally supported or clearly established in the whole chart.
- Clash remains the primary branch attack. Punishment, harm, and break are
  conservative secondary evidence; only relations still effective after
  arbitration may reduce a root or obstruct a pattern chain.
- The visible structure page is a concise report: show the main pattern,
  formation result, final useful-element decision, public level, and current
  luck conclusion with the one-decimal structure score, but without `ZP-*` IDs,
  engine versions, weights, percentile positions, or duplicated
  status/factor cards. The AI context keeps the complete rule IDs, checks,
  structure-score evidence and exact ten-god decisions from the same analysis object.

## Out of Scope

- UI layout beyond rendering fields already returned by the engine.
- AI prompt/history and saved-record behavior.
- Luck selector interaction.

## Required Checks

```powershell
node --check .\bazi-engine.js
node .\check-bazi-page.js
node .\check-baselines.js
```

## Optimization Tracking

Before continuing pattern/useful-element optimization, read and update
[`pattern-optimization-backlog.md`](pattern-optimization-backlog.md). Every item
has a stable ID and status so completed, deferred, and selected work remains
visible across module windows.

## Theoretical Baseline

Read [`pattern-theoretical-baseline.md`](pattern-theoretical-baseline.md) before
changing raw-score weights, percentile boundaries, sampling dates, or the
five-grade mapping. Any such change requires a new baseline version and matching
tests; never silently reuse the old histogram.

For `PAT-208`, also read [`pattern-score-backup.md`](pattern-score-backup.md).
It is the single active rollback checkpoint and may be overwritten only after the
user explicitly approves a new scoring version.

## Source Library

Before adding or changing a classical rule, read
[`pattern-sources/README.md`](pattern-sources/README.md), then use
[`pattern-sources/rule-crosswalk.md`](pattern-sources/rule-crosswalk.md) to locate
the accepted source layer. Raw texts and scans are archived in the same folder.
Do not turn an isolated quotation into a default rule without formation
conditions, counter-evidence, a stable rule ID, and matching tests.

Before using any user, friend, practitioner, or public-person chart during rule
development, read
[`pattern-confirmation-bias-postmortem.md`](pattern-confirmation-bias-postmortem.md).
Such feedback may open a hypothesis, but it cannot define the expected pattern,
useful element, level, score, or behavior.
