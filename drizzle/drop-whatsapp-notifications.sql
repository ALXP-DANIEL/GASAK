-- Remove the WhatsApp notification integration.
--
-- The Meta Cloud API path was never activated (no token, and freeform sends
-- would have needed approved templates anyway). Every notification it carried
-- — recruitment applications, the schedule digest, birthdays — already goes to
-- Discord, so nothing is lost by dropping it.
--
-- WhatsApp is still used in the app, but only as `wa.me` links opened by a
-- human from their own phone (seller → buyer on account enquiries). That needs
-- no server config and no stored numbers, hence no replacement table.
--
-- Preferred path is `npm run db:push`, which derives this from schema.ts.
-- This file is the manual equivalent for applying against a DB by hand.

DROP TABLE IF EXISTS "gasak_whatsapp_settings";
