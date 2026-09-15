---
name: pgi-core
description: Answer any question about the pgi-core-frontend project — stack, architecture, auth, permissions, routing, PL Direct Book products, PDF print, dev setup, conventions. Read this before exploring the repo blind.
---

# pgi-core — project fundamentals

Laravel + Vue insurance admin for Phillip General Insurance (Cambodia). Read this first; it maps the repo so you can jump straight to the right file instead of grepping.

Asked "give me a high-level overview"? Read [references/overview.md](references/overview.md) — the answer is already written.
Asked about the 7pj **user** journey (quote → policy → endorsement as staff see it)? Read [references/journey-7pj.md](references/journey-7pj.md).

## What this app is

**A BFF, not a system of record.** Laravel owns auth, session, permissions, blade shell, and PDF print. Business data lives in a remote insurance API (PAI). Laravel controllers call it over HTTP and reshape the response for Vue.

- Remote base URL: `config('pgi.api_insurance_service_url')` → `.env` `API_INSURANCE_SERVICE_URL`
- HTTP client entry: `app/Services/GlobalBaseService.php` (`Http::timeout(60)->get(...)`, `handleApiError` → `InsException`)
- So: no Eloquent CRUD for quotes/policies. A missing field is usually a PAI payload gap, not a migration.

## Stack

| Layer | What |
|---|---|
| PHP | 8.2, Laravel 12 |
| Vendor auth | `plb/security_management` (`dev-latest`) — routes + `LoginController` live in `vendor/` |
| SSO | `laravel/socialite` + `socialiteproviders/keycloak` (Microsoft 365 button) |
| Frontend | Vue 3 `<script setup>`, vue-router 4, **no Vuex/Pinia** |
| UI kit | PrimeVue 3 + Tailwind (`@left4code/tw-starter` Midone theme) |
| Tables | `tabulator-tables` 4.9 (not PrimeVue DataTable) |
| Rich text | CKEditor 5 + Quill |
| PDF | `barryvdh/laravel-snappy` + `mpdf/mpdf` |
| Excel | `maatwebsite/excel`, `exceljs` |
| Build | Vite (`npm run dev` / `npm run build`) |
| E2E | Playwright — **archived**, do not run (`.cursor/rules/16-playwright-archived.mdc`) |

## Request path (memorize this)

```
Browser
  └─ resources/views/app.blade.php   ← blade shell, mounts #app
       └─ resources/js/app.js        ← createApp, registers ~40 PrimeVue components globally
            └─ router/router.js      ← ~44k, plus per-module route files
                 └─ views/<Module>/*.vue
                      └─ services/<module>/*.service.js  (axios)
                           └─ routes/*.php → app/Http/Controllers/**
                                └─ app/Services/**  → PAI over HTTP
```

Global components are registered in `app.js`, so `<Button>`, `<Dropdown>`, `<Calendar>`, `<TabView>` need no import in a view.

## Auth + permissions

Two different things — don't confuse them.

**1. Session auth** — vendor owned.

```
vendor/plb/security_management/routes/web.php
  GET  /auth/login   → security_login
  POST /auth/login   → security_auth
  POST /auth/logout  → security_logout
```

Login view resolves via `app('AuthLoginView') ?? 'security.login'`, so this repo's `resources/views/security/login.blade.php` overrides it. Guard: `web-security`. Middlewares: `no-auth:security`, `authenticated:security`.

**2. Function permissions** — server-rendered, then read by JS.

```9:10:resources/views/app.blade.php
        <input type="hidden" id="authorized-functions"
            value="{{App\Http\Controllers\UserManagement\User\UserServiceController::getAuthorizedFunctions()}}">
```

`resources/js/services/auth.service.js` parses that hidden input once at load → `authorizedFunctions`, `hasPermission(code, permission)`, `can(code)`.

Router guard in `app.js` (`router.beforeEach`): empty permissions → `/403`. Route `meta.code` + `meta.permission` checked; PL routes add `func_connector` + `level` + `productCode` → `resolvePlFunctionCode` in `resources/js/authorization.js`.

Permission code maps per product: `resources/js/permissions.js` (`PER_QUOTE_BY_PRO_CODE`, `PER_POLICY_BY_PRO_CODE`, `PER_ENDORSEMENT_BY_PRO_CODE`).

**Consequence:** a page that 403s is usually a missing SM permission for that user, not broken code. Check the map before touching Vue.

## Modules

Views under `resources/js/views/`, services under `resources/js/services/`, routes under `routes/`.

| Module | Views | Routes |
|---|---|---|
| Property & Liability | `PropertyLiability/` | `routes/pl.php` |
| Personal Accident | — | `routes/pa.php` |
| Health / HS | — | `routes/hs.php`, `hs_routes.php` |
| Travel | — | `routes/travel.php` |
| Motor / Auto | — | `routes/auto.php` |
| Claim, Payment, Renewal, Endorsement, MasterReport, ProductConfiguration, SecurityManagement, CustomerManagement, BusinessManagement, Reinsurance, AuditTrail | same-named dirs | `routes/web.php` (~449 routes) |

Most agent work lands in **PropertyLiability**.

## PL Direct Book — the active work

Scope is locked: **7 product lines only**. Full rule: `.cursor/rules/02-pl-seven-product-scope.mdc`.

| Code(s) | Line |
|---|---|
| `0189` + twin `0206` | Marine Cargo (one journey) |
| `0191` | Burglary |
| `0192` | Money |
| `0193` | Plate Glass |
| `0194` | Construction All Risks |
| `0195` | Bond |
| `0196` | Professional Indemnity |

Authority: `app/Constants/ProductCode.php` (`directBookCodes()`, `isDirectBook()`, `isMarine()`) and `resources/js/services/property_liability/burglary/scope.js`.

Journey shorthand `7pj` = L1 Quote → L2 Policy → L3 Endorsement.

**Never** refactor legacy `0121`–`0125` (Public Liability, Fire, Property, Home Package, Business Package).

Note: `ProductCode.php` and `scope.js` also list `0197`–`0202` (BBB, D&O, EAR, EE, Trade Credit, Fidelity). Those are later expansion, wired but outside the locked 7-line scope — confirm with the user before working on them.

### Naming inside `burglary/`

Everything Direct Book shares one folder despite the "burglary" name: `resources/js/services/property_liability/burglary/`. Short files, short exports (`fillPlan`, `showErr`, `checkTab1`). Rules: `.cursor/rules/05-pl-db-naming.mdc`, quality bar `06-pl-quality-bar.mdc`.

### Backend resolution

`app/Resolvers/{Quote,Policy,Endorsement}ServiceResolver.php` map product code → service class. All Direct Book codes → `App\Services\PL\Quote\DirectBook` (+ `Quote/Concerns/*` traits). Legacy codes → their own classes.

### Structure doc

Component-by-component frontend map already written: `docs/PL-Direct-Book-Frontend-Structure.md`. Read it before asking where a Vue file lives.

## PDF print

Blades: `resources/views/pdf/quotations/pl/direct_book/`

- `partials/` — shell, header, insured, interest, clause blocks (shared)
- `sections/<product>_body.blade.php` — one per product
- View pick: `ProductCode::directBookPrintView($code)` → e.g. `pdf.quotations.pl.direct_book.directors_officers`; Marine short-circuits first, default falls back to `burglary`
- View models: `app/Services/PL/Pdf/DirectBook/` (`VmFactory`, `DefaultVm`, `Concerns/Builds*`)
- Print CSS is separate: `npm run css` builds `resources/css/print.css` → `public/css/print.css`

Print fidelity (black borders, table grid) is **exempt** from UI polish rules.

## Dev setup — Windows + Herd + Git Bash

```bash
export PATH="/c/Users/PGI/.config/herd/bin:$PATH"
cd /d/vitou/projects/pgi-core-frontend
php artisan test
npm run build
```

- App URL: `.env` `APP_URL` = `http://pgi-core-frontend.test` — **not** `localhost:5173`
- `php` alone fails in Git Bash without the PATH export; or use `/c/Users/PGI/.config/herd/bin/php.bat`
- Missing `vendor/autoload.php` → `composer install`
- Full table: `.cursor/rules/windows-herd-gitbash.mdc`

### Production CSS trap

`core.css` loads **last** and has unscoped `.grid-cols-1` / `.grid-cols-2` with no `md:grid-cols-2`. So `grid-cols-1 md:grid-cols-2` stays one column in production even though `npm run dev` looks right. Use the `Create.vue` pattern: `grid-cols-4` + `col-span-2` — helper `resources/js/services/property_liability/burglary/pair-grid.js`. A local `npm run build` with Vite stopped reproduces it.

### Toast

`vue3-toastify` — use `toast.remove()`, **not** `toast.dismiss()` (that's react-toastify). Helper: `resources/js/notify.js`, announce util `resources/js/utils/announce.js`.

## Conventions that get enforced

| Rule | File |
|---|---|
| No comments on new/changed code | `.cursor/rules/no-commented-code.mdc` |
| Commit titles = "Adjective Noun", no AI trailers | `AGENTS.md` |
| Short names, small methods | `.cursor/rules/04-simple-code-voice.mdc` |
| Code only when must + most benefit | `.cursor/rules/14-code-must-benefit.mdc` |
| Spec before code (G1 gate) | `.cursor/rules/00-spec-first-superpowers.mdc` |
| Smoke payloads human EN+KM, no `test`/`asdf` | `.cursor/rules/11-smoke-data-humanizer.mdc` |
| No Playwright / agent-browser | `.cursor/rules/16-playwright-archived.mdc` |

## Where to look for state

| Question | File |
|---|---|
| What was I doing? | `docs/SESSION_STATE.md` |
| Active spec change | `openspec/changes/phase-ii-quotation-slice-only/` (`progress.md`, `tasks.md`, `BLOCKERS.md`) |
| PL frontend file map | `docs/PL-Direct-Book-Frontend-Structure.md` |
| UAT cases | `docs/UAT-PL-Direct-Book-*` |
| Endorsement onboarding steps | `.cursor/rules/07-endt-direct-book-onboard.mdc` |
| Known edge cases before "done" | `.cursor/rules/17-concern-edgecase.mdc` |

## Common gotchas

- **Empty tab, data exists in DB** — PAI v2 response omits nested commission/RI. Check the payload, not the Vue.
- **Works on 0121, empty on Direct Book** — a `isBurglaryProductCode` gate skipped a GET that legacy still uses.
- **Share shows 0.52 vs 52** — DB stores fraction, PAI wants percent.
- **First paint skips load** — `productCode` / `dataId` arrive after mount.
- **403 on a page you can see in the menu** — SM permission map, `resources/js/permissions.js`.
- Full list: `.cursor/rules/17-concern-edgecase.mdc`.

## Verification before claiming done

1. `php artisan test` for PHP changes
1b. `composer analyse` — Larastan level 4 on `app/`. `phpstan-baseline.neon` freezes 4398 legacy errors, so **only your new code is checked**. Green = no new issues. Never regenerate the baseline to silence your own error; fix it. Claim + Travel excluded (known unfixed bugs, out of PL scope).
2. `npm run build` only when JS/Vue/CSS changed (skip otherwise — it is slow)
3. `node scripts/verify-burglary-routing.mjs` for Direct Book routing
4. Manual/API check — browser automation is archived
5. Helper naming check: `node scripts/check-pl-php-helper-humanizer.mjs`
