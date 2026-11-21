# APInex Free Models & Smart Routing Research

Investigation of APInex upstream behavior, public APIs, token/uptime telemetry, and smart routing designs for the `Sync APInex Free` feature in 9Router.

---

## 1. Primary Source Telemetry & Public APIs

### 1.1 Model Catalog (`https://apinex.bond/api/public/models`)
Public JSON endpoint listing all models provided by APInex.

```json
{
  "id": "free/qwen-3.8-max",
  "provider": "Free",
  "name": "Qwen 3.8 Max",
  "contextWindow": "1M",
  "weight": 3,
  "allowFree": true,
  "supportsVision": true,
  "supportsTools": true,
  "dollarsPer1M": 0,
  "outputDollarsPer1M": 0,
  "tags": [],
  "health": "live"
}
```

#### Key Findings:
- **`provider: "Free"` is NOT sufficient**: APInex returns 21 models with `provider: "Free"` and `dollarsPer1M: 0`. However, **7 of these models have `allowFree: false`** (e.g. `free/claude-sonnet-4.6`, `free/claude-opus-4.6`, `free/gemini-3.1-pro`, `free/kimi-k2.8`, `free/minimax-m3`, `free/glm-5.3-flashx`, `free/mimo-v2.6-flash`).
- Calling a model with `allowFree: false` with a free account triggers:
  `HTTP 402 Billing Error`: `"This model is currently available only with a subscription. Buy a subscription at https://apinex.bond/subscriptions to use it."`
- **`health`**: Models have values `"live"` or `"no_data"`.
- **`weight`**: Priority weighting (values 2, 3, 4) indicating upstream capacity.

---

### 1.2 Real-time & 7-Day Uptime Telemetry (`https://apinex.bond/api/public/status`)
Public telemetry reporting current state and 168-hour (7-day) historical health for every model.

```json
{
  "generatedAt": "2026-11-14T05:16:20.990Z",
  "windowHours": 168,
  "models": [
    {
      "id": "free/qwen-3.8-max",
      "name": "Qwen 3.8 Max",
      "provider": "Free",
      "state": "operational",
      "uptimePct": 99.8,
      "hours": [
        { "at": "2026-11-14T05:00:00.000Z", "state": "up" }
      ]
    }
  ]
}
```

#### Fields:
- `state`: `"operational"`, `"degraded"`, or `"down"`.
- `uptimePct`: Rolling 7-day uptime percentage (e.g. `99.8`).
- `hours[].state`: Hourly status (`"up"`, `"load"`, `"partial"`, `"down"`).

---

### 1.3 Rate Limits & Quotas (`https://apinex.bond/api/public/rate-limits`)
Public definition of tier throughput:

```json
{
  "rpmFree": 15,
  "rpmSubscription": 60,
  "subscriberPriority": true,
  "plans": {
    "free": { "rpm": 15, "priceUsd": 0 }
  }
}
```

- Free tier rate limit is **15 RPM**.
- Subscriptions jump to 60–200 RPM with subscriber priority.

---

### 1.4 Live Chat Completion Headers (`https://api.apinex.bond/v1/chat/completions`)
Verified via direct upstream request using an active free API key:

#### Rate Limit Response Headers:
```http
ratelimit-limit: 15
ratelimit-remaining: 14
ratelimit-reset: 1794633826
x-ratelimit-limit: 15
x-ratelimit-remaining: 14
x-ratelimit-reset: 1794633826
```

#### Daily Check-in Requirement (HTTP 402):
```json
{
  "error": {
    "message": "Daily check-in required to use free models. Please visit https://apinex.bond/overview to check in.",
    "type": "billing_error",
    "param": null,
    "code": null
  }
}
```
*Note: `/api/user/checkin` uses Cloudflare Turnstile captcha, requiring manual user completion in the browser.*

---

## 2. Root Cause Analysis of Current 9Router Issues

1. **Flawed Filter in `src/lib/apinex/sync.js`**:
   The current sync logic filters:
   `allModels.filter((m) => m.provider === "Free" && m.dollarsPer1M === 0)`
   This imports 7 paid-only models into `9r-apinex`.
2. **Cascading Model Locks**:
   When 9Router sends traffic to these models, APInex returns HTTP 402. Under `open-sse/config/errorConfig.js`, HTTP 402 triggers a 2-minute `modelLock_${model}`. Eventually all models get locked, setting `testStatus: unavailable` on the connection.
3. **Daily Check-in 402 Treated as Model Error**:
   When the user has not completed their daily check-in, APInex returns HTTP 402 for *all* free models. 9Router locks every model individually instead of informing the user to check in.

---

## 3. Proposed Smart Features for Continuous Free Model Availability

### Feature 1: Health & Uptime-Aware Model Sync & Ordering
- **Stricter Filtering**:
  ```js
  const freeModels = allModels.filter(
    (m) => m.provider === "Free" && m.dollarsPer1M === 0 && m.allowFree === true && m.health === "live"
  );
  ```
- **Uptime-Weighted Priority**: Join with `https://apinex.bond/api/public/status`. Sort the models in combo `9r-apinex` by:
  1. `state === "operational"` first.
  2. Higher `uptimePct` (e.g. 99.8% > 95.0%).
  3. Higher `weight` (capacity).
  This guarantees the combo hits the highest-uptime operational model first.

### Feature 2: In-Memory RPM Token Bucket & Cooldown Guard
- Read `ratelimit-remaining` and `ratelimit-reset` from APInex response headers.
- If `ratelimit-remaining === 0`, set a short lock matching `ratelimit-reset` (e.g. 10–20s) instead of failing requests or applying generic 2-minute error penalties.
- Let subsequent requests rotate immediately to the next model in the combo or wait for the exact reset timestamp.

### Feature 3: Smart 402 Differentiation & Daily Check-in Alert
- In APInex error handling, inspect `error.message`:
  - If `"Daily check-in required"`: Do NOT lock individual models. Set connection flag `checkinRequired: true` and surface a clear UI warning: *"APInex daily check-in required [Check in now](https://apinex.bond/overview)"*.
  - If `"available only with a subscription"`: Exclude the model immediately from the active combo.
- Once check-in is complete, clear the status on next request.

### Feature 4: Live Telemetry Widget on Combos / Providers Dashboard
- On the `9r-apinex` combo card:
  - Display available live models count (e.g. `14/14 Operational`).
  - Display average uptime (e.g. `99.4% uptime`).
  - Display rate limit token status (e.g. `14/15 RPM available`).
