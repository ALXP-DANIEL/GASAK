"use server";

import type { DashboardAccess } from "@config/dashboard";
import { getManagedSquadIds, getMemberSquadIds } from "@server/authz";
import {
  db,
  news,
  orders,
  playerProfiles,
  products,
  scrims,
  squads,
  tournaments,
  user,
} from "@server/db";
import { requireUser, userOrgRole } from "@server/session";
import { eq, ilike, or } from "drizzle-orm";

export type SearchResultType =
  | "player"
  | "squad"
  | "tournament"
  | "match"
  | "news"
  | "product"
  | "order"
  | "user";

export type SearchResult = {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

const LIMIT = 6;
const like = (value: string) => `%${value}%`;

/**
 * Derive the caller's access from the session server-side. We never trust an
 * access object sent from the client — a server action is directly callable,
 * so a caller could otherwise escalate permissions (e.g. claim admin) to read
 * data they shouldn't see.
 */
async function resolveAccess(): Promise<DashboardAccess> {
  const actor = await requireUser();
  const [memberSquadIds, managedSquadIds] = await Promise.all([
    getMemberSquadIds(actor.id),
    getManagedSquadIds(actor.id),
  ]);
  return {
    orgRole: userOrgRole(actor),
    hasSquad: memberSquadIds.length > 0,
    managesSquad: managedSquadIds.length > 0,
  };
}

/**
 * App-wide search for the command palette. Results are scoped to what the
 * caller is allowed to see via their dashboard access — admins get
 * players/squads/users, commerce roles get products/orders, and squad-area
 * roles get tournaments/matches/news. Respects the existing role permission
 * model rather than exposing everything.
 */
export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const access = await resolveAccess();
  const pattern = like(q);
  const isAdmin = access.orgRole === "admin";
  const canCommerce = isAdmin || access.orgRole === "seller";
  const canSquad = isAdmin || access.hasSquad;

  const tasks: Promise<SearchResult[]>[] = [];

  if (isAdmin) {
    tasks.push(
      db
        .select({
          id: playerProfiles.userId,
          name: user.name,
          ign: playerProfiles.ign,
          nickname: playerProfiles.nickname,
        })
        .from(playerProfiles)
        .innerJoin(user, eq(playerProfiles.userId, user.id))
        .where(
          or(
            ilike(user.name, pattern),
            ilike(playerProfiles.ign, pattern),
            ilike(playerProfiles.nickname, pattern),
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          rows.map((r) => ({
            type: "player" as const,
            id: r.id,
            title: r.name,
            subtitle: r.ign ?? r.nickname ?? undefined,
            href: `/dashboard/players/${r.id}`,
          })),
        ),
      db
        .select({
          id: squads.id,
          name: squads.name,
          description: squads.description,
        })
        .from(squads)
        .where(
          or(ilike(squads.name, pattern), ilike(squads.description, pattern)),
        )
        .limit(LIMIT)
        .then((rows) =>
          rows.map((r) => ({
            type: "squad" as const,
            id: r.id,
            title: r.name,
            subtitle: r.description ?? undefined,
            href: `/dashboard/squads/${r.id}`,
          })),
        ),
      db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(or(ilike(user.name, pattern), ilike(user.email, pattern)))
        .limit(LIMIT)
        .then((rows) =>
          rows.map((r) => ({
            type: "user" as const,
            id: r.id,
            title: r.name,
            subtitle: r.email,
            href: "/dashboard/users",
          })),
        ),
    );
  }

  if (canCommerce) {
    tasks.push(
      db
        .select({
          id: products.id,
          name: products.name,
          category: products.category,
        })
        .from(products)
        .where(
          or(
            ilike(products.name, pattern),
            ilike(products.description, pattern),
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          rows.map((r) => ({
            type: "product" as const,
            id: r.id,
            title: r.name,
            subtitle: r.category,
            href: `/dashboard/products/${r.id}`,
          })),
        ),
      db
        .select({
          id: orders.id,
          orderNo: orders.orderNo,
          customerName: orders.customerName,
        })
        .from(orders)
        .where(
          or(
            ilike(orders.orderNo, pattern),
            ilike(orders.customerName, pattern),
            ilike(orders.customerEmail, pattern),
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          rows.map((r) => ({
            type: "order" as const,
            id: r.id,
            title: r.orderNo,
            subtitle: r.customerName,
            href: "/dashboard/orders",
          })),
        ),
    );
  }

  if (canSquad) {
    tasks.push(
      db
        .select({
          id: tournaments.id,
          name: tournaments.name,
          organizer: tournaments.organizer,
        })
        .from(tournaments)
        .where(
          or(
            ilike(tournaments.name, pattern),
            ilike(tournaments.organizer, pattern),
          ),
        )
        .limit(LIMIT)
        .then((rows) =>
          rows.map((r) => ({
            type: "tournament" as const,
            id: r.id,
            title: r.name,
            subtitle: r.organizer ?? undefined,
            href: `/dashboard/tournaments/${r.id}`,
          })),
        ),
      db
        .select({ id: scrims.id, opponent: scrims.opponent })
        .from(scrims)
        .where(ilike(scrims.opponent, pattern))
        .limit(LIMIT)
        .then((rows) =>
          rows.map((r) => ({
            type: "match" as const,
            id: r.id,
            title: `vs ${r.opponent}`,
            subtitle: "Scrim",
            href: `/dashboard/matches/${r.id}`,
          })),
        ),
      db
        .select({ id: news.id, title: news.title, content: news.content })
        .from(news)
        .where(or(ilike(news.title, pattern), ilike(news.content, pattern)))
        .limit(LIMIT)
        .then((rows) =>
          rows.map((r) => ({
            type: "news" as const,
            id: r.id,
            title: r.title,
            subtitle: r.content ? `${r.content.slice(0, 60)}…` : undefined,
            href: `/dashboard/news/${r.id}`,
          })),
        ),
    );
  }

  try {
    const settled = await Promise.all(tasks);
    return settled.flat();
  } catch {
    // Search is best-effort; never surface a 500 to the palette.
    return [];
  }
}
