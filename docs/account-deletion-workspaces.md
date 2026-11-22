# Workspace cleanup on account deletion

After password and OTP verification, account deletion locks the user and their
workspace rows in a consistent order and runs at serializable isolation. A
workspace with no remaining members is deleted using existing database cascades.
If members remain without an owner, the earliest member by `(createdAt, id)` is
promoted. Existing owners are preserved. Memberships then cascade with user
deletion. Session invalidation and OTP cleanup participate in the same commit.
Serialization/deadlock conflicts retry at most three times.

Primary usernames and aliases are captured before deletion, then their Redis
entries and the Next `public-profile` tag are invalidated after commit. Existing
Redis helpers log cache outages and retain their bounded-TTL fallback; this does
not make Redis and PostgreSQL one distributed transaction.

Run focused tests with:

```
npx tsx --test --experimental-test-module-mocks lib/accountDeletion.test.ts app/api/user/delete/route.test.ts
```

`lib/accountDeletion.integration.test.ts` additionally checks real cascades,
released usernames, a deliberately failed delete rollback, and simultaneous
owner deletions. It is opt-in via `ACCOUNT_DELETION_TEST_URL` and must run against
a **new disposable database** initialized from this checkout's Prisma schema.
It creates an intentional failure trigger; never point it at a shared database.
