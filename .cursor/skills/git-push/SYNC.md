# Sync git-push skill

## What this is

Project skill that stages, commits (auto message via classify), strips AI trailers, and pushes. Canonical copy lives in this repo. Other PCs/projects need the skill **plus** its two PowerShell helpers.

## What must travel together

- [ ] `.cursor/skills/git-push/SKILL.md` (required)
- [ ] `.cursor/skills/git-push/SYNC.md` (this file; optional but useful)
- [ ] `git-commit-mesage-structure_explorer_and_develop/classify.ps1` (required)
- [ ] `git-commit-mesage-structure_explorer_and_develop/strip-trailers.ps1` (required)
- [ ] `test/run.ps1` (optional harness)

**WHY:** SKILL.md alone fails — steps 4/4b call those `.ps1` files by relative path from workspace root.

**Source repo:** `git@github.com:vitou-vitou/render_explore_and_develop_rd01.git`  
**Local (PC1):** `D:\render_explorer_and_development_001`

## Option A: Same repo, new PC

**WHAT:** Clone/pull this repo; open it as the Cursor workspace. `/git-push` just works.

```powershell
git clone git@github.com:vitou-vitou/render_explore_and_develop_rd01.git
cd render_explore_and_develop_rd01
# or if already cloned:
git pull
```

Open that folder in Cursor. Skill path: `.cursor/skills/git-push/SKILL.md`.

## Option B: Other project

**WHAT:** Install skill into another repo. Scripts must resolve.

1. Copy skill folder into target:

```powershell
$src = "D:\render_explorer_and_development_001"   # or clone path
$dst = "<TARGET_REPO_ROOT>"
New-Item -ItemType Directory -Force -Path "$dst\.cursor\skills\git-push" | Out-Null
Copy-Item "$src\.cursor\skills\git-push\*" "$dst\.cursor\skills\git-push\" -Force
```

2. Scripts — pick one:

- **Copy scripts** (same relative paths as SKILL.md expects):

```powershell
New-Item -ItemType Directory -Force -Path "$dst\git-commit-mesage-structure_explorer_and_develop" | Out-Null
Copy-Item "$src\git-commit-mesage-structure_explorer_and_develop\classify.ps1" "$dst\git-commit-mesage-structure_explorer_and_develop\"
Copy-Item "$src\git-commit-mesage-structure_explorer_and_develop\strip-trailers.ps1" "$dst\git-commit-mesage-structure_explorer_and_develop\"
```

- **Or** edit target `SKILL.md`: replace relative `-File git-commit-mesage-structure_explorer_and_develop\...` with absolute paths to this tooling repo (stable on that PC).

3. Commit in the target repo (skill + scripts, or skill + path edits).

## Option C: User-global on one PC

**WHAT:** Fallback when a workspace has no project skill.

```powershell
$src = "D:\render_explorer_and_development_001"
$dst = "$env:USERPROFILE\.cursor\skills\git-push"
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item "$src\.cursor\skills\git-push\*" $dst -Force
```

Edit `%USERPROFILE%\.cursor\skills\git-push\SKILL.md` so classify/strip `-File` paths are **absolute** and point at a stable tooling location (e.g. this repo’s `git-commit-mesage-structure_explorer_and_develop\`). Prefer project skill (Option A/B) when possible.

## Verify

From the workspace that should run `/git-push` (repo root):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File git-commit-mesage-structure_explorer_and_develop\classify.ps1 -RepoPath .
powershell -NoProfile -ExecutionPolicy Bypass -File git-commit-mesage-structure_explorer_and_develop\strip-trailers.ps1 -RepoPath .
# optional, if harness present:
powershell -NoProfile -ExecutionPolicy Bypass -File test\run.ps1
```

Expect: classify prints one style word; strip prints `clean` / `stripped <n>` / `skipped: ...`. Then try `/git-push` on a tiny change.

## Agent handoff block

```
TASK: Install git-push skill into this workspace.
SOURCE: git@github.com:vitou-vitou/render_explore_and_develop_rd01.git
  (or local path: D:\render_explorer_and_development_001)
READ: SOURCE/.cursor/skills/git-push/SYNC.md then SKILL.md
STEPS:
  1. Copy .cursor/skills/git-push/ into this repo (include SYNC.md).
  2. Ensure classify.ps1 + strip-trailers.ps1 resolve:
     - same relative path under this repo, OR
     - absolute paths in SKILL.md to SOURCE tooling folder.
  3. Verify with classify.ps1 -RepoPath . and strip-trailers.ps1 -RepoPath .
  4. Commit the install in this repo if files were added.
DONE WHEN: /git-push works and classify+strip scripts resolve (no missing-file errors).
```
