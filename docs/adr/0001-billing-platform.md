# ADR-0001: Billing Platform

## Status

Accepted (Android / Google Play first; Apple stub; Stripe Web)

## Context

Kangur sells workspace Premium. Store policies require Google Play Billing on Android and App Store on iOS; Web uses Stripe. We need one domain model so providers are adapters, not special-cases in UI.

## Decision

### Domain shape

```text
BillingRegistry → BackendBillingProvider | MobileBillingProvider
ProductRepository → ProductCache (SWR) → MobileProvider.fetchProducts()
verifyPurchase → PurchaseSnapshot
getSubscription → SubscriptionSnapshot
ApplyPurchase(ApplyInput) → UpdateEntitlement  (transactional, single write)
```

### Snapshots

- **PurchaseSnapshot** — result of verifying a client proof (purchase / restore).
- **SubscriptionSnapshot** — current store subscription state (RTDN / sync).
- Shared base fields; `providerMetadata` = **raw provider response only** (never app/business flags).

### ApplyPurchase

- **Single write entrypoint** for `BillingPurchase`.
- **Transactional** with entitlement update (never purchase OK / subscription FAIL).
- **Deterministic** — same snapshot → same DB state; no emails, analytics, or push inside Apply.
- Callers emit `billing_apply_completed` after successful commit.

### UpdateEntitlement

Separate policy from purchase persistence. Future: family, credits, gifts, seats without bloating ApplyPurchase.

### ProductCatalog

SSOT for products: display keys, description keys, `featureSetId`, `billingInterval`, `sortOrder`, **`providerConfig`** (google: `externalProductId` + `basePlanId`; apple: `productId`; stripe: `priceId`).

### ProductRepository (mobile)

`list()` / `get(productId)` — sorts by catalog `sortOrder`. Cache (TTL, disk→memory→async refresh, `lastSuccessfulRefreshAt` / `lastAttemptAt`) lives here, not in the store adapter.

### Capabilities (lean)

`supportsPurchase`, trial/restore/manage/manageExternally, upgrade/downgrade, `priceSource`, `purchaseMode`. No Capability v2 flags yet. Unavailable reasons MVP: `COMING_SOON` | `STORE_NOT_SUPPORTED`.

### RTDN

Webhook is a **signal** only → `getSubscription` → Apply. Newest state wins. Unknown token → warning + metric. Provider mismatch (e.g. Google event vs active Stripe purchase) → warning + metric, no silent overwrite crash.

### Registry

Only `BillingRegistry.resolve(providerId)` and `resolveCurrent(channel)`. Platform channel: Android→google, iOS→apple, Web→stripe.

## Consequences

- Premium UI never branches on `Platform.OS`; it uses capabilities + `BillingProduct[]`.
- Adding Apple is a new adapter + ProductRepository wiring, not a new paywall.
- Play Console must create products/base plans matching `providerConfig.google`.
- Stripe remains Web-only rail; checkout/portal unchanged for web channel.
