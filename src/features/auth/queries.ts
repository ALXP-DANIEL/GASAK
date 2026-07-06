import { getSession } from "@lib/session";

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
