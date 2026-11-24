# Workspace invitations and collaboration

Apply the `20261122000000_workspace_invitations` migration and regenerate the Prisma client before deployment. Configure `NEXTAUTH_URL` to the canonical application origin and the existing SMTP environment variables. Invitations are editor-only; existing owners can promote a member after acceptance. Role decisions are made by the server, not by UI state.

Open **Manage workspace team** on the dashboard, or `/dashboard/team`. Members can select a delegated workspace and open its dashboard. An explicit workspace ID without membership returns no workspace; it never falls back to another profile. Editors may curate links and profile content, while username changes, webhook secrets and team administration require ownership. Sensitive updates recheck ownership under the workspace lock.

Invitations last seven days and contain a random 32-byte bearer secret. Only its SHA-256 hash is stored. Resend rotates the token; expired, revoked and consumed tokens return 410. Acceptance requires a signed-in account whose verified email matches the invitation. An inviter who lost ownership cannot authorize an old invitation. The acceptance URL puts the token in a fragment, which is not sent in HTTP access logs; acceptance is an explicit authenticated, CSRF-protected POST. No raw invitation token is returned by list APIs or printed by the mail helper.

SMTP failures return a retryable delivery error while leaving an invitation visible to its owner; resending rotates the link. There is no claim that email was delivered if SMTP is absent. The UI supports listing members, promotions/demotions, revoking invites, resending and leaving as an editor. Removing or demoting the last owner is rejected. All team mutations are rate limited. Concurrent last-owner changes serialize on the workspace row and retain at least one owner.

## Tests

`npm test` covers email/token primitives and explicit workspace scope. `lib/workspaceTeam.integration.test.ts` is opt-in via `TEAM_TEST_URL` and must target a fresh disposable PostgreSQL database initialized from this schema. It tests actual hashed storage, resend invalidation, wrong/unverified email rejection, duplicate acceptance, expiry/revocation, editor/foreign permissions and simultaneous owner demotions. Do not use production data.

Browser verification used synthetic local accounts: last-owner demotion was blocked, promotion succeeded, missing SMTP produced a visible retry state, and revoke removed the pending invitation. No email was sent to a real person and no hosted account/database was used.
