import { and, eq } from "drizzle-orm";
import { auth } from "../../lib/auth";
import {
  announcements,
  authSlides,
  db,
  events,
  type OrgRole,
  playerProfiles,
  products,
  scrims,
  squadMembers,
  squads,
  tournaments,
  user,
} from "./index";

async function createUser(
  name: string,
  email: string,
  password: string,
  role: OrgRole,
) {
  const res = await auth.api.signUpEmail({
    body: { name, email, password },
  });
  await db.update(user).set({ role }).where(eq(user.id, res.user.id));
  return res.user;
}

async function syncDemoAccountRoles() {
  const rolesByEmail = [
    { email: "admin@gasak.gg", role: "admin" },
    { email: "leader@gasak.gg", role: "user" },
    { email: "member@gasak.gg", role: "user" },
    { email: "seller@gasak.gg", role: "seller" },
  ] satisfies { email: string; role: OrgRole }[];

  for (const account of rolesByEmail) {
    await db
      .update(user)
      .set({ role: account.role })
      .where(eq(user.email, account.email));
  }

  // Demonstrates the sidebar's Manage/Player focus toggle: give the seller a
  // squad membership if they don't already have one.
  const seller = await db.query.user.findFirst({
    where: eq(user.email, "seller@gasak.gg"),
  });
  const academy = await db.query.squads.findFirst({
    where: eq(squads.slug, "gasak-academy"),
  });
  if (seller && academy) {
    const existingMembership = await db.query.squadMembers.findFirst({
      where: and(
        eq(squadMembers.userId, seller.id),
        eq(squadMembers.squadId, academy.id),
      ),
    });
    if (!existingMembership) {
      await db.insert(squadMembers).values({
        squadId: academy.id,
        userId: seller.id,
        squadRole: "coach",
      });
    }
  }

  await ensureAuthSlides();
}

async function ensureAuthSlides() {
  const existing = await db.select().from(authSlides).limit(1);
  if (existing.length > 0) return;

  await db.insert(authSlides).values([
    {
      eyebrow: "GASAK Management",
      title: "Run the squad from one command center",
      description: "Track schedules, rosters, recruitment, and match activity.",
      imageUrl: "/images/hero.png",
      sortOrder: 0,
      active: true,
    },
    {
      eyebrow: "GASAK Management",
      title: "Keep competitive squads aligned",
      description:
        "Leaders manage their own squad flow without losing oversight.",
      imageUrl: "/images/squad-a.png",
      sortOrder: 10,
      active: true,
    },
    {
      eyebrow: "GASAK Management",
      title: "Built for the GASAK organization",
      description:
        "Admin, seller, leader, and player workflows stay separated.",
      imageUrl: "/images/about-family.png",
      sortOrder: 20,
      active: true,
    },
  ]);
}

async function main() {
  const existing = await db.select().from(user).limit(1);
  if (existing.length > 0) {
    await syncDemoAccountRoles();
    console.log("Database already seeded, skipping.");
    return;
  }

  const admin = await createUser(
    "GASAK Admin",
    "admin@gasak.gg",
    "admin123",
    "admin",
  );
  const leader = await createUser(
    "Aiman Faris",
    "leader@gasak.gg",
    "leader123",
    "user",
  );
  const member1 = await createUser(
    "Danish Iman",
    "member@gasak.gg",
    "member123",
    "user",
  );
  const member2 = await createUser(
    "Hakim Zulkifli",
    "hakim@gasak.gg",
    "member123",
    "user",
  );
  const member3 = await createUser(
    "Irfan Syahmi",
    "irfan@gasak.gg",
    "member123",
    "user",
  );
  const seller = await createUser(
    "GASAK Store",
    "seller@gasak.gg",
    "seller123",
    "seller",
  );

  await db.insert(playerProfiles).values([
    {
      userId: leader.id,
      fullName: "Aiman Faris",
      nickname: "Aiman",
      ign: "GSK·Aiman",
      mlbbId: "123456789",
      serverId: "2001",
      phone: "+60123456789",
      preferredLane: "jungle",
      currentRank: "Mythical Glory",
      peakRank: "Mythical Immortal",
    },
    {
      userId: member1.id,
      fullName: "Danish Iman",
      nickname: "Danish",
      ign: "GSK·Danish",
      mlbbId: "234567890",
      serverId: "2001",
      phone: "+60123456780",
      preferredLane: "gold",
      currentRank: "Mythic",
      peakRank: "Mythical Glory",
    },
    {
      userId: member2.id,
      fullName: "Hakim Zulkifli",
      nickname: "Hakim",
      ign: "GSK·Hakim",
      mlbbId: "345678901",
      serverId: "2002",
      phone: "+60123456781",
      preferredLane: "mid",
      currentRank: "Mythical Honor",
      peakRank: "Mythical Glory",
    },
    {
      userId: member3.id,
      fullName: "Irfan Syahmi",
      nickname: "Irfan",
      ign: "GSK·Irfan",
      mlbbId: "456789012",
      serverId: "2001",
      phone: "+60123456782",
      preferredLane: "roam",
      currentRank: "Mythic",
      peakRank: "Mythical Honor",
    },
  ]);

  const [alpha, academy] = await db
    .insert(squads)
    .values([
      {
        name: "GASAK Alpha",
        slug: "gasak-alpha",
        description:
          "The main competitive roster of GASAK, grinding MPL qualifiers and major community tournaments.",
      },
      {
        name: "GASAK Academy",
        slug: "gasak-academy",
        description:
          "Development squad for rising talent — the pipeline into GASAK Alpha.",
      },
    ])
    .returning();

  await db.insert(squadMembers).values([
    { squadId: alpha.id, userId: leader.id, squadRole: "leader" },
    { squadId: alpha.id, userId: member1.id, squadRole: "player" },
    { squadId: alpha.id, userId: member2.id, squadRole: "player" },
    { squadId: alpha.id, userId: member3.id, squadRole: "reserve" },
    // Seller also plays for Academy — demonstrates the sidebar's
    // Manage/Player focus toggle for org roles that also have a squad.
    { squadId: academy.id, userId: seller.id, squadRole: "coach" },
  ]);

  const inDays = (d: number, h = 20) => {
    const date = new Date();
    date.setDate(date.getDate() + d);
    date.setHours(h, 0, 0, 0);
    return date;
  };

  await db.insert(events).values([
    {
      title: "Weekly Practice",
      description: "Draft practice and macro review.",
      type: "practice",
      startsAt: inDays(1),
      endsAt: inDays(1, 22),
      location: "Discord — Practice Room",
      squadId: alpha.id,
      createdBy: admin.id,
    },
    {
      title: "Scrim vs Titan Esports",
      description: "Best of 5, tournament draft rules.",
      type: "scrim",
      startsAt: inDays(3, 21),
      endsAt: inDays(3, 23),
      location: "In-game custom lobby",
      squadId: alpha.id,
      createdBy: leader.id,
    },
    {
      title: "All-hands Meeting",
      description: "Monthly org update for every squad.",
      type: "meeting",
      startsAt: inDays(5, 21),
      location: "Discord — Main Stage",
      createdBy: admin.id,
    },
    {
      title: "Kejohanan MLBB Selangor",
      description: "Community tournament, single elimination.",
      type: "tournament",
      startsAt: inDays(10, 10),
      endsAt: inDays(10, 18),
      location: "Cyber Arena, Shah Alam",
      squadId: alpha.id,
      createdBy: admin.id,
    },
  ]);

  await db.insert(tournaments).values([
    {
      name: "MLBB Community Cup 2026",
      organizer: "Moonton MY",
      date: inDays(-20, 12),
      prize: "RM 5,000",
      opponent: "Team Nova",
      result: "Won 3-1 (Champion)",
      mvp: "GSK·Aiman",
      squadId: alpha.id,
    },
    {
      name: "Piala Komuniti KL",
      organizer: "KL Esports Hub",
      date: inDays(-45, 14),
      prize: "RM 2,000",
      opponent: "Fenix MY",
      result: "Lost 1-2 (Semifinal)",
      mvp: "GSK·Danish",
      squadId: alpha.id,
    },
  ]);

  await db.insert(scrims).values([
    {
      squadId: alpha.id,
      opponent: "Titan Esports",
      date: inDays(-7, 21),
      result: "Won 3-2",
      notes: "Strong early rotations; late-game shot calling needs work.",
      replayLink: "https://youtu.be/example-replay",
    },
    {
      squadId: alpha.id,
      opponent: "Ravage GG",
      date: inDays(-3, 21),
      result: "Lost 1-3",
      notes: "Draft gap on tank meta — practice Grock/Khufra pool.",
    },
  ]);

  await db.insert(announcements).values([
    {
      title: "Welcome to the GASAK Management System",
      content:
        "All squads, players, events, and shop operations now run through this portal. Update your player profile and check the calendar weekly.",
      authorId: admin.id,
    },
    {
      title: "Alpha: scrim schedule updated",
      content:
        "Scrim vs Titan Esports moved to this week — check the calendar and confirm availability in Discord.",
      squadId: alpha.id,
      authorId: leader.id,
    },
  ]);

  await db.insert(products).values([
    {
      name: "86 Diamonds",
      category: "diamonds",
      description:
        "MLBB 86 diamonds top-up via player ID. Delivered within 15 minutes.",
      priceSen: 550,
      stock: 999,
      active: true,
      createdBy: seller.id,
    },
    {
      name: "172 Diamonds",
      category: "diamonds",
      description: "MLBB 172 diamonds top-up via player ID.",
      priceSen: 1100,
      stock: 999,
      active: true,
      createdBy: seller.id,
    },
    {
      name: "Weekly Diamond Pass",
      category: "weekly_pass",
      description: "MLBB Weekly Diamond Pass — best value for daily diamonds.",
      priceSen: 800,
      stock: 500,
      active: true,
      createdBy: seller.id,
    },
    {
      name: "Joki Mythic → Mythical Honor",
      category: "joki",
      description:
        "Rank boost by GASAK players. Safe, no cheats, VPN protected.",
      priceSen: 5000,
      stock: 10,
      active: true,
      createdBy: seller.id,
    },
    {
      name: "1-on-1 Coaching (2 hours)",
      category: "coaching",
      description:
        "Personal coaching session with a GASAK Alpha player — VOD review and live queue.",
      priceSen: 8000,
      stock: 20,
      active: true,
      createdBy: seller.id,
    },
  ]);

  await ensureAuthSlides();

  console.log("Seed complete.");
  console.log(
    "Logins: admin@gasak.gg/admin123, leader@gasak.gg/leader123, member@gasak.gg/member123, seller@gasak.gg/seller123",
  );
  console.log(`Squads: ${alpha.name}, ${academy.name}`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
