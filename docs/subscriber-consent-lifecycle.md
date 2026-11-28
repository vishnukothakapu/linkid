# Verified Subscriber Consent Lifecycle

## Overview
This implementation adds an explicit, verified consent lifecycle to LinkID's public newsletter subscription feature (addressing Issue #938).

## Key Components

### 1. Domain States (`SubscriberStatus`)
- `PENDING`: Initial submission state. No `subscriber.created` or confirmed events are emitted.
- `CONFIRMED`: Active, confirmed subscriber after clicking a valid one-use confirmation link.
- `UNSUBSCRIBED`: Privacy-preserving opt-out state.

### 2. Expiring Hashed One-Use Tokens (`SubscriberToken`)
- Confirmation tokens use cryptographically random 32-byte hex strings whose SHA-256 hash is stored in the database.
- Tokens expire in 48 hours.
- Once used, `usedAt` is stamped.
- Replayed tokens cannot reactivate consent: if an unsubscribed user's old confirmation link is clicked, it rejects with `TOKEN_ALREADY_USED`.

### 3. Bounded Resend Behavior
- If a pending subscriber submits their email again, a 60-second cooldown is enforced to prevent email flooding.
- Resends are capped at 5 per 1-hour window.
- Already confirmed subscribers receive an idempotent acknowledgment without sending redundant confirmation emails.

### 4. Privacy-Preserving Unsubscribe
- Every confirmation email includes an optional unsubscribe link tied to a distinct, long-lived token.
- Unsubscribing does not reveal email addresses or require account authentication.

### 5. Outbox & Bounded Retries
- Confirmation email jobs are queued into the `Job` outbox (`subscriber-confirmation`) and processed by `scripts/worker.ts`.
- Worker retries leverage exponential backoff with a maximum attempt limit (5 attempts).

### 6. Workspace Scoping & Owner Visibility
- Owner reads on `/dashboard` distinguish confirmed subscribers from pending subscribers.
- CSV exports via `/api/subscribers/export` are strictly limited to confirmed consent (`status: "CONFIRMED"`).
- Cascade deletion ensures deleting a workspace or subscriber removes all associated tokens.
