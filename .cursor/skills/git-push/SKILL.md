---
name: git-push
description: Stage all changes, commit with an auto-generated one-line message, push to the current branch. Use when the user types /git-push, says "push", "commit and push", "ship it", or "save to git".
disable-model-invocation: true
---

# git-push

Clone/sync this skill on another PC or project: see [SYNC.md](SYNC.md).

status → add → commit → push. One shell call per step. Stop at first failure, print the error, do nothing further.

Scripts live in this repo (relative to workspace root). Works on any PC after clone/pull — no hardcoded drive letter.

## Steps

1. `git status --short`
   - Empty → reply "nothing to commit", stop.
   - Show output.

2. Secrets guard. If any changed path matches `secrets.env`, `*.env`, `accounts.csv`, `*.pem`, `*.key`, `id_rsa*`: stop, list them, ask "add to .gitignore or commit anyway?". Never auto-commit these.

3. `git add .`

4. Message:
   - Slash arg given (`/git-push fix typo`) → use verbatim, skip the rest of this step.
   - Else detect the repo's style:

     `powershell -NoProfile -ExecutionPolicy Bypass -File git-commit-mesage-structure_explorer_and_develop\classify.ps1 -RepoPath .`

     Output is one word. Anything else, or no output → treat as `conventional`.
   - Generate one line from `git diff --cached --stat` + file names, ≤ 72 chars, in the detected style:
     - `conventional` → `feat: add x` (types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`)
     - `imperative-caps` → `Add x`
     - `imperative-lower` → `add x`
   - Cannot infer → `update`.
   - `git commit -q -m "<msg>"`

4b. Strip AI attribution trailers:

    `powershell -NoProfile -ExecutionPolicy Bypass -File git-commit-mesage-structure_explorer_and_develop\strip-trailers.ps1 -RepoPath .`

    - `stripped <n>` → include `trailers: stripped <n>` in the step 6 report.
    - `clean` or `skipped: ...` → carry on, nothing to report.
    - Script missing, error, or no output → carry on and push anyway. Never block.

5. `git push`
   - No upstream → `git push -u origin HEAD`.
   - Rejected (non-fast-forward) → stop, print error, suggest `git pull --rebase`. Do not force.

6. Open the commit in the browser: `start <remote-url-without-.git>/commit/<short-sha>` (derive remote from `git remote get-url origin`, converting SSH `git@github.com:x/y.git` → `https://github.com/x/y`).

7. Report, in this order:
   - detected style on its own line (`style: <word>`) — omit when a slash arg was given
   - `trailers: stripped <n>` if step 4b stripped any
   - `<short-sha> <msg> → <remote>/<branch>`
   - one caveman WHAT/WHY line explaining the change, format: `WHAT: <thing done>. WHY: <reason>.`
     Keep it short. Fragments OK. No filler. Say what landed and why it mattered this session.

## Rules

- Never `--force`, never `--no-verify`. Never amend except via step 4b (`strip-trailers.ps1`).
- Never commit if `git status` shows a merge/rebase in progress.
- No git repo → ask "init git?" once; on yes: `git init -q` then continue.

## Example

```
$ /git-push
 M deploy.ps1
?? test.ps1
style: conventional
trailers: stripped 1
4676dd4 feat: write result md on exit → origin/master
WHAT: write result md on exit. WHY: keep deploy run record without manual notes.
```
