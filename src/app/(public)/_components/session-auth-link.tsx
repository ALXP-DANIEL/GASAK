import { AuthLink } from "@components/layout/site-header";
import { getSession } from "@server/session";

/**
 * The only session-dependent piece of the public shell. Kept in its own
 * server component so the rest of the layout prerenders; this streams in
 * behind a Suspense boundary (fallback: the logged-out Login link).
 */
export async function SessionAuthLink() {
  const session = await getSession();
  return <AuthLink isLoggedIn={Boolean(session)} />;
}
