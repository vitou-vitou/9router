# 7pj user journey — high level

Answer to: *"what's the high-level user journey of 7pj?"*

Not the agent workflow (that's `7pj-wave` / `db-journey.md`). This is what the **underwriter sitting at the screen** actually does.

## The whole arc

```
L1 QUOTE            L2 POLICY              L3 ENDORSEMENT
price it            bind it                change it mid-term
     │                   │                       │
     └── accepted ───────┘                       └── (repeat as needed)
```

Same three levels for all 7 lines. Product code only swaps which plan/premium fields render — the path never changes.

## L1 — Quote

Underwriter prices a risk and sends a PDF to the client.

| Step | Screen | API |
|---|---|---|
| Browse | Quotation list, filter by product | `GET /quotations` |
| Start | Pick product → wizard opens | `POST /quotations/init` |
| Tab 1 | Product & Customer Info | `PATCH /{id}/init/update` |
| Tab 2 | Plan Info — sum insured, coverage rows | `POST /init/plan` |
| Tab 3 | Premium — rates, discounts, totals | `POST /quotations` |
| Review | Detail view (read-only schedule) | `GET /{id}` |
| Send | Download quotation PDF | `GET /{id}/pdf` |
| Sign-off | Approve, then Accept | `PATCH /{id}/approve` → `/accept` |
| Convert | Proceed to policy | `GET /{id}/proceed` |

Three tabs on create. Premium tab hides for some products.

## L2 — Policy

Accepted quote becomes a real contract. More tabs appear, because now money and reinsurance are real.

| Tab | What |
|---|---|
| Policy Info | Insured, period, product |
| Premium | Final figures |
| Policy Config | Instalments, payment terms |
| Insured Person | Named persons (only where the product needs it) |
| Commission | Agent/broker split |
| Reinsurance | Treaty and facultative shares |

Last three appear **only in edit mode** — you cannot fill commission on a policy that doesn't exist yet.

Then: Submit → Approve → download policy PDF + invoice.

```
POST /policies/store → PATCH /{id}/config → /submit → /approve
GET /{id}/download · /{policyId}/download-invoice
```

## L3 — Endorsement

Something changed mid-term: sum insured up, address moved, policy cancelled early.

```
POST /endorsements/{id}/generate     pick type, snapshot the policy
PATCH /{dataId}/save-info            edit the changed values
PATCH /{dataId}/submit               send for review
PATCH /{dataId}/approve              underwriter signs off
GET /{dataId}/print                  endorsement PDF
GET /{dataId}/print-invoice          additional/refund premium invoice
```

Refund endorsements produce a **credit note**, not an invoice — different document type on the same path.

## Status vocabulary

`PND` pending · `SBM` submitted · `PRG` in progress · `APV` approved · `ACP` accepted · `ACT` active · `REJ` rejected

Source: `resources/js/enum.js` → `RECORD_STATUS`. Rejection sends the record back for edit; it isn't a dead end.

## Beside the main arc

**Renewal** (`routes/pl.php` `renewals`) — batch-generate at expiry, no-claim auto-approval, then approve/accept like a quote. Nearly a fourth level, but not counted in `7pj`.

**Claim** — separate module, hangs off an active policy.

## Why it matters for code

- Same three-level path for every product means **shared components, config-driven per code** — the `burglary/` folder.
- A journey step failing on one product but not another is almost always a product-code gate, not a broken flow.
- Each level has its own PDF. View and PDF must agree on the schedule band (INSURED NAME → ISSUED BY); parity rules in `db-journey.md`.
