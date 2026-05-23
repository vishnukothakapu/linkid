-- Drop the stale PascalCase table created by migration 20260520091700_add_invalidated_session.
-- The correct lowercase "invalidatedSession" table (with @@map) was created in 20260521_add_invalidated_session.
DROP TABLE IF EXISTS "InvalidatedSession";
