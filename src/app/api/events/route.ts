import { inArray, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSession, userRole } from "@/lib/session";
import { getManagedSquadIds, getMemberSquadIds } from "@/server/authz";
import { db, events } from "@/server/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = userRole(session.user);

  let rows: Awaited<ReturnType<typeof queryAll>>;
  if (role === "admin") {
    rows = await queryAll();
  } else {
    const squadIds = await getMemberSquadIds(session.user.id);
    rows = await db.query.events.findMany({
      where: squadIds.length
        ? or(isNull(events.squadId), inArray(events.squadId, squadIds))
        : isNull(events.squadId),
      with: { squad: true },
    });
  }

  const managedSquadIds = await getManagedSquadIds(session.user.id);

  return NextResponse.json(
    rows.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startsAt,
      end: event.endsAt ?? undefined,
      extendedProps: {
        type: event.type,
        description: event.description,
        location: event.location,
        squadName: event.squad?.name ?? null,
        canManage:
          role === "admin" ||
          (event.squadId !== null && managedSquadIds.includes(event.squadId)),
      },
    })),
  );
}

function queryAll() {
  return db.query.events.findMany({ with: { squad: true } });
}
