# Durable workspace webhooks

Apply `20261122010000_webhook_deliveries` and regenerate Prisma before deploying
the web process and worker together. The real analytics worker and subscriber
creation path now write an outbox record and job in the source transaction.
`/api/links/click` only enqueues analytics, so it cannot double-send webhooks.
Analytics jobs use their stable job ID to avoid counting retries twice.

Each event has one attempt-zero `QUEUED` outbox row. Real attempts have positive
attempt numbers, status, HTTP code, duration, error and a bounded response prefix.
The response reader consumes at most 1,024 bytes. The ten-second deadline covers
DNS validation, fetch and body reading; redirects are forbidden. Existing SSRF
validation runs before every attempt. Disabled/changed destination configurations
fail closed instead of sending an old event to a newly configured destination.
Signing uses the current secret, which is never stored in queue jobs or returned
by diagnostics endpoints.

The worker passes its retry attempt number to the dispatcher. HTTP/network
failures are logged before being thrown into the existing exponential-backoff
policy. Receivers must deduplicate `x-linkid-delivery-id`: delivery is at least
once, because a receiver may accept a request before the worker loses connection.
Every retry uses the original event envelope and stable ID. HMAC-SHA256 signs
the exact transmitted JSON bytes in `x-linkid-signature`; `x-linkid-event` names
the event. A successful already-recorded attempt is not transmitted again.

Only workspace owners can list the ten latest attempts or send a rate-limited
`test.ping` through `/api/settings/webhook/test`. Tests run synchronously for
immediate diagnostics, without adding a second queued delivery. The settings UI
uses CSRF tokens, shows the result, polls recent attempts and allows inspection
of the event payload and bounded response. These logs can contain subscriber
email addresses and must remain owner-only.

Older jobs containing raw URL/signature payloads are rejected by the upgraded
worker. Drain those jobs with the old worker before deployment, or mark them
failed and generate a fresh test event. Do not silently reinterpret old signed
payloads. Existing outbox/attempt logs follow workspace deletion cascades;
longer-term log retention is a separate policy.

## Verification

Unit tests cover exact signatures/headers, redirect policy, non-2xx retry errors,
bounded response capture, DNS/body timeouts, changed configuration and API role
boundaries. The opt-in PostgreSQL test (`WEBHOOK_TEST_URL`) checks source event
production, duplicate processing, delivery attempts and rollback on queue failure
using a new disposable database. It uses fake transport responses; no external
webhook receiver or production data is used. Never point the integration test
at a shared database, because it creates an intentional failure trigger.

The Node test launcher discovers actual `*.test.*` files, excluding the API's
directory named `test`, and preserves literal Next `[id]` paths on newer Node
versions. This retains all existing tests instead of importing the endpoint as
an accidental test or skipping dynamic-route tests.

Browser verification used a synthetic local owner and a deliberately blocked loopback HTTPS URL: the test returned a failure diagnostic and persisted the attempt, without sending a request to that endpoint.
