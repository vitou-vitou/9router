# 04: Quota Tracker & Session Conflict Recovery

**What to build:** Expose real-time daily session usage and Freebucks wallet balance in the dashboard, recover from transient session expirations automatically, and provide clear error messages with cooldown timers when hitting single-model locks or regional IP gates.

**Blocked by:** 03 (Freebuff Executor with Session Leasing & Wire Decoration).

**Status:** completed

- [x] Usage handler reads `GET /api/v1/freebuff/session` strictly without POSTing to prevent burning daily session quotas
- [x] Displays remaining sessions per model and Freebucks daily / wallet balances in Usage stats
- [x] Intercepts session stale error codes (428, 409, 410) and automatically performs a forced session re-claim and retry
- [x] Maps `model_locked` error to 409 status with 10-minute cooldown timestamp explaining single-model lock constraint
- [x] Flags regional limited-mode IP rejections with actionable proxy suggestions
- [x] Checks capacity-limited trial offers (Claude Fable 5) before claiming and rejects gracefully when closed
