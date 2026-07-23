# Security model (Kangur)

Short threat model and authZ checklist for the API + mobile client.

## AuthN

- Mobile and API use **Clerk Bearer tokens** (not cookie sessions). CSRF is N/A for the JSON API.
- `requireUser` resolves Clerk primary email; **platform ADMIN** bootstrap (`PLATFORM_ADMIN_EMAILS`) runs only when that email is **verified**.

## AuthZ

- Workspace-scoped mutations go through `authorize` / `authorizeList` (+ `requireRole` where owner/admin-only).
- Invitations: accept/preview require matching email; raw invite tokens are **not** returned from create API or stored in notification/push payloads (email deep-link only). Accept is **single-use** (`status: pending` → `accepted`).
- Push devices: Expo tokens are **not** reassigned across users.

### Consistency checklist

Before shipping a new `backend/app/api/v1/**/route.ts`:

1. Call `requireUser` (exceptions: public `app/version`, Stripe `billing/webhook`).
2. For workspace/list data: `authorize` / `authorizeList` (or equivalent membership check in the feature).
3. For admin/owner-only: `requireRole` / `requirePlatformAdmin`.
4. Spot-check with:

```bash
rg "requireUser|authorize\(|authorizeList|requirePlatformAdmin|requireRole" backend/app/api
```

## AI credits (business logic)

- Credits are **reserved at ingest** (OpenAI call), not at apply.
- OpenAI timeout / failure → **immediate refund**.
- Orphaned holds expire after **15 minutes** (TTL safety net).
- Abandon after a successful proposal = credits already spent (intended).

## AI integrity

- Apply rehydrates name/amount/note/category from the **stored** `AiProposalRun.proposal` (client sends decisions only).
- Prompts use **Prompt/Data Separation** (`<<<UNTRUSTED_DATA>>>` delimiters).

## Rate limits (tiered)

| Class | Examples | Default |
|-------|----------|---------|
| AI | ingest, meal, history | 10 / min |
| Invitations | create, preview, accept | 20 / h |
| Auth | push register | 60 / min |
| Notifications | list | 120 / min |

In-memory per instance — defense in depth, not a global distributed limiter.

## Data hygiene

- No raw SQL (`$queryRaw` / `$executeRaw`). Prisma only.
- Invite tokens: SHA-256 in DB; never log `acceptUrl` / raw token.
- Screenshot ingest: MIME + magic-byte sniff; Stripe webhook errors are generic.
