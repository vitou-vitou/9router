# 02: Fingerprint Device-Code Authentication & Connection Probe

**What to build:** Enable one-click account connection directly from the dashboard UI via Freebuff's browser fingerprint device-flow, store authorized tokens securely in the connection store, and support non-destructive health checks via the dashboard Connection Test button.

**Blocked by:** 01 (Freebuff Provider Registry & Model Catalog).

**Status:** completed

- [x] Fingerprint device-code handler generates client UUID and polls `https://freebuff.com/api/auth/cli/status`
- [x] Provider allowlisted in device-code and non-PKCE OAuth API routes
- [x] Connect button on Freebuff card opens OAuthModal and displays browser sign-in link
- [x] Successful authorization extracts `user.authToken` and registers active connection row in database
- [x] Connection Test probe verifies token validity against `https://www.codebuff.com/api/v1/freebuff/session` using non-destructive GET request
