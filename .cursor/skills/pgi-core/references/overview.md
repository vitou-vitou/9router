# High-level overview — canned answer

Answer to: *"what's the high-level overview of this project?"*

## In one line

Web admin for a Cambodian general insurer. Staff quote, issue, endorse, and renew insurance policies across product lines.

## The shape that matters

**It's a BFF, not a database app.** Laravel doesn't own the business data. It owns the browser session, permissions, the blade shell, and PDF printing. Quotes, policies, customers all live in a remote insurance API (PAI); Laravel calls it over HTTP and reshapes responses for Vue.

```
Vue 3 SPA  →  Laravel controllers  →  PAI (remote insurance API)
              (auth, permissions, PDF)      (all business data)
```

Practical consequence: a field showing empty is usually a PAI payload gap, not a broken migration. There is no migration.

## Stack

Laravel 12 / PHP 8.2 on the server. Vue 3 `<script setup>` + vue-router 4 on the client, no Vuex/Pinia — state is component-local and props. PrimeVue 3 for widgets, Tailwind (Midone theme) for layout, tabulator for tables. PDFs via snappy + mpdf. Vite builds.

## Two auth layers, often confused

1. **Session login** — vendor package `plb/security_management`, routes live in `vendor/`. This repo only overrides the login blade.
2. **Function permissions** — Laravel renders a hidden `#authorized-functions` input; JS parses it once into `hasPermission()`. The router guard blocks on it.

So a 403 on a page you can see in the menu is almost always a missing SM permission, not a bug in the Vue.

## Modules

~20 modules: Property & Liability, Personal Accident, Health, Travel, Motor, Claim, Payment, Renewal, Endorsement, Reinsurance, Master Report, Security Management, and more. Each is a views dir + services dir + routes file.

**Nearly all active work is Property & Liability.**

## The active project — PL Direct Book

Building 7 product lines through the full lifecycle: Quote → Policy → Endorsement (shorthand `7pj`).

Marine Cargo (`0189`/`0206` twin), Burglary `0191`, Money `0192`, Plate Glass `0193`, Construction All Risks `0194`, Bond `0195`, Professional Indemnity `0196`.

Design choice worth knowing: all 7 share one set of components and one helper folder — confusingly named `burglary/`, since Burglary was first. `Plan.vue` and `Premium.vue` are config-driven per product code rather than 14 separate files. A fix in `burglary/` hits all 7; check impact before editing.

Five legacy products (`0121`–`0125`) are explicitly off-limits for refactoring.

## What's odd about this repo

- Skills, rules, and hooks under `.cursor/` and `.claude/` are gitignored — machine-local, not shared through the repo
- Heavy convention enforcement: no comments on new code, commit titles as "Adjective Noun", spec-before-code gates
- Playwright/browser automation is archived — verification is manual or API-level
- A production CSS trap: `grid-cols-1 md:grid-cols-2` silently collapses to one column in prod because `core.css` loads last with unscoped grid classes
