-- One-off data migration for the role refactor (run BEFORE `pnpm db:push`).
--
-- Org roles: "leader" and "member" collapse into "user"; leader now only
-- exists as a squad role. Squad role "member" is renamed to "player".

-- 1. Organization roles (stored as plain text on the Better Auth user table)
UPDATE "user" SET "role" = 'user' WHERE "role" IN ('leader', 'member');

-- 2. Squad role enum: rename the value in place so existing rows keep working
ALTER TYPE "squad_role" RENAME VALUE 'member' TO 'player';
