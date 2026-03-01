---
name: PrdExecutor
description: "Execute all user stories from a prd-<feature>.json file sequentially. Spawns one subagent per complex task (implement, verify, commit, update-prd), each with a fresh context window. Triggers on: execute prd, run prd, execute stories, run all stories, start prd execution."
user-invocable: true
---

# PrdExecutor — Orchestrator

Pure orchestrator: does not write code, does not run tests. Iterates stories, spawns subagents, reads results from disk, decides advance/retry/halt.

| Role | Agent | Context |
|---|---|---|
| Implement story | **Subagent A — Implementor** | Fresh per story |
| Verify criteria | **Subagent B — Verifier** | Fresh per story |
| Commit changes | **Subagent C — GitUser** | Fresh per story |
| Update prd-<feature>.json | **Subagent D — PrdUpdater** | Fresh per story |

---

## Step 0 — Locate PRD
Search for file: `.ai-workflow/ralph/prd-<feature>.json` — name provided by user

Set `<ralph-dir>` = directory where the prd-<feature>.json was found. All temp files are written inside `<ralph-dir>`.

Validate: every story has `id`, `title`, `description`, `acceptanceCriteria[]`; at least one has `passes: false`. If not found: stop execution.

---

## Step 1 — Derive Branch

The `branchName` field in prd-<feature>.json is authoritative. Use it directly as `WORKING_BRANCH`.

Derive `COMMIT_TYPE` from the prefix:

| `branchName` prefix | `COMMIT_TYPE` |
|---|---|
| `feature/` | `feat` |
| `fix/` | `fix` |
| `refactor/` | `refactor` |
| anything else | `feat` |

---

## Step 2 — Checkout Branch

```bash
git status --porcelain   # non-empty → HALT (commit or stash first)
git pull
git checkout -b <WORKING_BRANCH>   # or checkout if it already exists
```

Never reset a branch that already has commits. Skip stories with `passes: true`.

---

## Step 3 — Story Loop

For each story in ascending `priority` where `passes === false`:

### Write `<ralph-dir>/current-story.txt`

```
STORY SNAPSHOT
==============
PRD file      : <path>
Project       : <project>
Working branch: <WORKING_BRANCH>
Commit type   : <COMMIT_TYPE>

Story ID      : <id>
Title         : <title>
Description   : <description>

Acceptance Criteria:
  1. <criterion>
  ...
```

---

### Subagent A — Implementor

**Load:** `current-story.txt`, `CLAUDE.md`, relevant source files only. On retry: also `verify-report.txt`.

**Prompt:**
```
You are the Implementor for story <id>: "<title>".
Implement ONLY what the acceptance criteria require. Do not touch out-of-scope code.
Follow CLAUDE.md conventions. Do not implement future stories.
[if retry] Read <ralph-dir>/verify-report.txt to understand what failed.

On blocker → write <ralph-dir>/implementor-error.txt (one line). Stop.
On success → write <ralph-dir>/changed-files.txt (one path per line, relative). Stop.
```

**Orchestrator checks:**

| File | Action |
|---|---|
| `implementor-error.txt` | HALT — surface error |
| `changed-files.txt` | → Subagent B |
| neither | HALT — "no output" |

---

### Subagent B — Verifier

**Load:** `current-story.txt`, `changed-files.txt`, each listed file, `CLAUDE.md`.

**Prompt:**
```
You are the Verifier for story <id>: "<title>".
Check every acceptance criterion. Do not write code. Do not commit.

Criterion checks:
  "Typecheck passes"   → pnpm typecheck (or --filter <pkg>)
  "Tests pass"         → pnpm test (or --filter <pkg>)
  "Verify in browser"  → invoke dev-browser skill
  file/field existence → read + grep
  behaviour assertion  → run the relevant command

Write <ralph-dir>/verify-report.txt:
  STATUS: PASS | FAIL
  CRITERIA:
    [PASS] <criterion>
    [FAIL] <criterion> — <reason>
  CHANGED_FILES:
    <contents of changed-files.txt, unchanged>
Stop.
```

**Orchestrator checks:**

| Result | Action |
|---|---|
| `STATUS: PASS` | → Subagent C |
| `STATUS: FAIL`, retries < 2 | Re-spawn Subagent A with `verify-report.txt` |
| `STATUS: FAIL`, retries = 2 | HALT — show report, ask user |

---

### Subagent C — GitUser

**Load:** `current-story.txt`, `verify-report.txt`.

**Prompt:**
```
You are GitUser. Stage and commit the CHANGED_FILES. Do not read source files. Do not run tests.

Commit message:
  <COMMIT_TYPE>: <story title>

  Story: <id>
  <story description — first sentence>

Steps:
  1. git add <each changed file — never git add .>
  2. git status  ← confirm staged files
  3. git commit -m "<message>"
  4. git log --oneline -1
  5. Write 7-char SHA to <ralph-dir>/commit-sha.txt
Do not push. Stop.

CHANGED_FILES:
<paste CHANGED_FILES block from verify-report.txt>
```

**Orchestrator checks:** `commit-sha.txt` present → Subagent D; else HALT.

---

### Subagent D — PrdUpdater

**Load:** `prd-<feature>.json`, `current-story.txt`, `commit-sha.txt`, `verify-report.txt`.

**Prompt:**
```
You are PrdUpdater. Find the story matching the id in current-story.txt.
Update ONLY:
  "passes": true,
  "notes": "Completed in commit <SHA>. Criteria: <comma-separated PASS list>."
Write prd-<feature>.json back. Do not change any other field. Stop.
```

**Orchestrator checks:** Re-read `prd-<feature>.json`; confirm `passes === true`. If not: HALT.

**On success — update progress.txt, then delete temp files:**

Append to `<ralph-dir>/progress.txt`:
```
[<timestamp>] <id> ✓  <title>  [<sha>]
```

Delete:
```
<ralph-dir>/current-story.txt   <ralph-dir>/changed-files.txt
<ralph-dir>/verify-report.txt   <ralph-dir>/commit-sha.txt
<ralph-dir>/implementor-error.txt  (if exists)
```

→ Next story.

---

## Step 4 — Final Validation

```bash
pnpm typecheck && pnpm test
```

Fails → HALT (cross-story regression; manual review).

---

## Step 5 — Push

```bash
git push -u origin <WORKING_BRANCH>
```

---

## Step 6 — Summary

```
PrdExecutor — Execution Complete
==================================
Project : <project>
Branch  : <WORKING_BRANCH>
Stories : <N> completed

  US-001  ✓  <title>  [<sha>]
  US-002  ✓  <title>  [<sha>]

Status: READY FOR PULL REQUEST
```

---

## Resuming an Interrupted Run

Re-read `prd-<feature>.json` — `passes: true` stories are done. Check leftover temp files in `<ralph-dir>`:

| Temp files present | Resume from |
|---|---|
| `commit-sha.txt`, story not yet `passes: true` | Subagent D |
| `verify-report.txt` PASS, no `commit-sha.txt` | Subagent C |
| `changed-files.txt`, no `verify-report.txt` | Subagent B |
| none | Subagent A (first `passes: false` story) |

---

## Error Reference

| Situation | Action |
|---|---|
| `prd-<feature>.json` not found | HALT — run PrdParser |
| Working tree dirty | HALT — commit or stash |
| `implementor-error.txt` exists | HALT — surface error |
| Verifier FAIL ×2 | HALT — ask user |
| No `commit-sha.txt` | HALT — check git log |
| PrdUpdater didn't persist | HALT — fix manually, re-run |
| Final typecheck/test fail | HALT — cross-story regression |
| Checkout conflict | HALT — user resolves |
| Story too large | HALT — split with PrdParser |

---

## Pre-flight Checklist

- [ ] `prd-<feature>.json` valid, at least one `passes: false` story
- [ ] Stories in dependency order (backend before frontend)
- [ ] Working tree clean (`git status`)
- [ ] Base branch up to date (`git pull`)
- [ ] Baseline build passes (`pnpm install && pnpm build`)
