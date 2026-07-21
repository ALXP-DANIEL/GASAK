import { MALAYSIA_STATES } from "@lib/labels";
import type { MlbbRank } from "@lib/ranks";
import { format } from "date-fns";
import { and, eq } from "drizzle-orm";
import { auth } from "../auth";
import {
  applications,
  authImages,
  db,
  events,
  galleries,
  jokiPackages,
  jokiTiers,
  news,
  type OrgRole,
  orders,
  organizationPositions,
  playerProfiles,
  productGallery,
  products,
  scrims,
  squadMembers,
  squads,
  tournamentRounds,
  tournaments,
  user,
} from "./index";

/** Helper to build a structured MLBB rank for seed data. */
const mkRank = (
  tier: MlbbRank["tier"],
  stars: number,
  division: number | null = null,
): MlbbRank => ({ tier, division, stars });

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
    where: eq(squads.name, "GASAK Academy"),
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

  await ensureAuthImages();
}

/**
 * Seeds the joki (rank boost) catalog: per-star tier rates + flat-rate
 * package promos, plus the hidden anchor product joki orders attach to
 * (stock 0 keeps it out of the shop listing). Legacy flat joki products are
 * deactivated — the /shop/joki calculator replaces them.
 */
async function ensureJokiCatalog(createdBy: string | null) {
  // Legacy rows used short aliases ("Honor"/"Glory") for the two Mythic
  // sub-tiers — rename in place so `name` matches the real RankTier value
  // everywhere (fromTierId/toTierId FK references are untouched by this).
  await db
    .update(jokiTiers)
    .set({ name: "Mythical Honor" })
    .where(eq(jokiTiers.name, "Honor"));
  await db
    .update(jokiTiers)
    .set({ name: "Mythical Glory" })
    .where(eq(jokiTiers.name, "Glory"));

  // Covers the full MLBB rank ladder, not just Epic..Glory.
  const defaultTierRates: [string, number][] = [
    ["Warrior", 50],
    ["Elite", 80],
    ["Master", 100],
    ["Grandmaster", 150],
    ["Epic", 200],
    ["Legend", 300],
    ["Mythic", 350],
    ["Mythical Honor", 400],
    ["Mythical Glory", 600],
    ["Mythical Immortal", 1000],
  ];
  const existingTierNames = new Set(
    (await db.select().from(jokiTiers)).map((t) => t.name),
  );
  const missingTiers = defaultTierRates.filter(
    ([name]) => !existingTierNames.has(name),
  );
  if (missingTiers.length > 0) {
    await db.insert(jokiTiers).values(
      missingTiers.map(([name, pricePerStarSen]) => ({
        name,
        pricePerStarSen,
      })),
    );
  }

  // Package segments are tier-linked so the checkout can price any from→to
  // range as the cheapest chain (see computeJokiPackagePath). Ensured
  // additively (never wiped) so admin-added packages survive reseeding.
  const tiersByName = new Map(
    (await db.select().from(jokiTiers)).map((t) => [t.name, t.id]),
  );
  async function ensureEdge(from: string, to: string, priceSen: number) {
    const fromTierId = tiersByName.get(from);
    const toTierId = tiersByName.get(to);
    if (!fromTierId || !toTierId) return;
    const exists = await db.query.jokiPackages.findFirst({
      where: and(
        eq(jokiPackages.fromTierId, fromTierId),
        eq(jokiPackages.toTierId, toTierId),
      ),
    });
    if (exists) return;
    await db.insert(jokiPackages).values({
      name: `${from} → ${to}`,
      fromTierId,
      toTierId,
      priceSen,
    });
  }
  await ensureEdge("Warrior", "Elite", 500);
  await ensureEdge("Elite", "Master", 800);
  await ensureEdge("Master", "Grandmaster", 1200);
  await ensureEdge("Grandmaster", "Epic", 1500);
  await ensureEdge("Epic", "Legend", 1500);
  await ensureEdge("Legend", "Mythic", 6000);
  await ensureEdge("Epic", "Mythic", 7000);
  await ensureEdge("Mythic", "Mythical Honor", 8000);
  await ensureEdge("Mythical Honor", "Mythical Glory", 9000);
  await ensureEdge("Mythical Glory", "Mythical Immortal", 15_000);

  const anchor = await db.query.products.findFirst({
    where: and(
      eq(products.name, "Joki Rank Boost"),
      eq(products.category, "joki"),
    ),
  });
  if (!anchor) {
    await db.insert(products).values({
      name: "Joki Rank Boost",
      category: "joki",
      description:
        "MLBB rank boost by GASAK players — priced per star or by package.",
      priceSen: 0,
      stock: 0,
      active: true,
      createdBy,
    });
  }

  // Retire legacy flat-price joki products (replaced by /shop/joki).
  const legacyJoki = await db.query.products.findMany({
    where: and(eq(products.category, "joki"), eq(products.active, true)),
  });
  for (const legacy of legacyJoki) {
    if (legacy.name === "Joki Rank Boost") continue;
    await db
      .update(products)
      .set({ active: false })
      .where(eq(products.id, legacy.id));
  }
}

async function ensureAuthImages() {
  const existing = await db.select().from(authImages).limit(1);
  if (existing.length > 0) return;

  await db.insert(authImages).values(
    Array.from({ length: 20 }, (_, i) => ({
      imageUrl: `https://picsum.photos/seed/gasak${i}/1080/1440`,
      active: true,
    })),
  );
}

const galleryCaptions = [
  "Scrim night at the GASAK house",
  "Champions of the regional qualifier",
  "Squad grind before worlds",
  "Drafting the perfect comp",
  "Post-match debrief",
  "Merch drop: jersey v2",
  "Fan meet & greet",
  "Bootcamp sunrise",
  "Trophy lift moment",
  "Mid-laner clutch",
  "Tactical whiteboard",
  "Community tournament",
  "New gaming lounge",
  "Victory pose",
  "Coach review session",
  "Ring light stream setup",
  "Hype mural wall",
  "Custom mousepads arrived",
  "Watch party finals",
  "Off-season team bonding",
];

async function ensureGalleries() {
  const existing = await db.select().from(galleries).limit(1);
  if (existing.length > 0) return;

  await db.insert(galleries).values(
    galleryCaptions.map((caption, i) => ({
      title: caption,
      description: `A moment from the GASAK family — ${caption}.`,
      imageUrl: `https://picsum.photos/seed/gallery${i}/1200/900`,
      sortOrder: i * 10,
      active: true,
    })),
  );
}

async function ensureProductGallery() {
  const products_ = await db.query.products.findMany({
    where: eq(products.category, "merchandise"),
  });
  if (products_.length === 0) return;

  for (const product of products_) {
    const existing = await db
      .select()
      .from(productGallery)
      .where(eq(productGallery.productId, product.id));
    if (existing.length > 0) continue;

    await db.insert(productGallery).values(
      [0, 1, 2].map((i) => ({
        productId: product.id,
        imageUrl: `https://picsum.photos/seed/merch-${product.id.slice(0, 8)}-${i}/1024/1024`,
        sortOrder: i,
      })),
    );
  }
}

async function ensureOrganizationPositions(admin: {
  id: string;
  name: string;
}) {
  const existing = await db.select().from(organizationPositions).limit(1);
  if (existing.length > 0) return;

  const leader = await db.query.user.findFirst({
    where: eq(user.email, "leader@gasak.gg"),
  });
  const seller = await db.query.user.findFirst({
    where: eq(user.email, "seller@gasak.gg"),
  });

  const [founder] = await db
    .insert(organizationPositions)
    .values({
      title: "Founder",
      icon: "👑",
      sortOrder: 0,
      userId: admin.id,
      parentId: null,
    })
    .returning();

  const [coFounder] = await db
    .insert(organizationPositions)
    .values({
      title: "Co-Founder",
      icon: "⚡",
      sortOrder: 10,
      userId: leader?.id ?? null,
      parentId: founder.id,
    })
    .returning();

  await db.insert(organizationPositions).values([
    {
      title: "Advisor",
      icon: "🧐",
      sortOrder: 20,
      userId: null,
      parentId: founder.id,
    },
    {
      title: "CEO",
      icon: "🔱",
      sortOrder: 30,
      userId: seller?.id ?? null,
      parentId: coFounder.id,
    },
  ]);
}

async function main() {
  const existing = await db.select().from(user).limit(1);
  if (existing.length > 0) {
    await syncDemoAccountRoles();
    const admin = await db.query.user.findFirst({
      where: eq(user.email, "admin@gasak.gg"),
    });
    if (admin) await ensureOrganizationPositions(admin);
    const existingSeller = await db.query.user.findFirst({
      where: eq(user.email, "seller@gasak.gg"),
    });
    await ensureJokiCatalog(existingSeller?.id ?? null);
    await ensureGalleries();
    await ensureProductGallery();
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
  const extraPlayerSeeds = [
    ["Nabil Rahman", "nabil@gasak.gg", "GSK·Nabil", "exp"],
    ["Zafran Amir", "zafran@gasak.gg", "GSK·Zafran", "jungle"],
    ["Syafiq Danish", "syafiq@gasak.gg", "GSK·Syafiq", "mid"],
    ["Rizqin Hakim", "rizqin@gasak.gg", "GSK·Rizqin", "gold"],
    ["Aqil Muaz", "aqil@gasak.gg", "GSK·Aqil", "roam"],
    ["Faris Luqman", "faris@gasak.gg", "GSK·Faris", "exp"],
    ["Mikael Irfan", "mikael@gasak.gg", "GSK·Mikael", "jungle"],
    ["Harith Adam", "harith@gasak.gg", "GSK·Harith", "mid"],
    ["Rayyan Zikri", "rayyan@gasak.gg", "GSK·Rayyan", "gold"],
    ["Iman Hafiz", "iman@gasak.gg", "GSK·Iman", "roam"],
  ] as const;
  const extraPlayers = await Promise.all(
    extraPlayerSeeds.map(([name, email]) =>
      createUser(name, email, "member123", "user"),
    ),
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
      preferredLanes: ["jungle"],
      currentRank: mkRank("Mythical Glory", 30),
      peakRank: mkRank("Mythical Immortal", 120),
    },
    {
      userId: member1.id,
      fullName: "Danish Iman",
      nickname: "Danish",
      ign: "GSK·Danish",
      mlbbId: "234567890",
      serverId: "2001",
      phone: "+60123456780",
      preferredLanes: ["gold"],
      currentRank: mkRank("Mythic", 12),
      peakRank: mkRank("Mythical Glory", 45),
    },
    {
      userId: member2.id,
      fullName: "Hakim Zulkifli",
      nickname: "Hakim",
      ign: "GSK·Hakim",
      mlbbId: "345678901",
      serverId: "2002",
      phone: "+60123456781",
      preferredLanes: ["mid", "exp"],
      currentRank: mkRank("Mythical Honor", 30),
      peakRank: mkRank("Mythical Glory", 60),
    },
    {
      userId: member3.id,
      fullName: "Irfan Syahmi",
      nickname: "Irfan",
      ign: "GSK·Irfan",
      mlbbId: "456789012",
      serverId: "2001",
      phone: "+60123456782",
      preferredLanes: ["roam"],
      currentRank: mkRank("Mythic", 8),
      peakRank: mkRank("Mythical Honor", 28),
    },
    ...extraPlayers.map((player, index) => ({
      userId: player.id,
      fullName: player.name,
      nickname: player.name.split(" ")[0],
      ign: extraPlayerSeeds[index][2],
      mlbbId: String(567_000_000 + index),
      serverId: String(2003 + (index % 4)),
      phone: `+60123456${790 + index}`,
      preferredLanes: [extraPlayerSeeds[index][3]],
      currentRank:
        index % 2 === 0 ? mkRank("Mythic", 5) : mkRank("Mythical Honor", 30),
      peakRank:
        index % 3 === 0
          ? mkRank("Mythical Glory", 55)
          : mkRank("Mythical Honor", 40),
    })),
  ]);

  const allSquads = await db
    .insert(squads)
    .values([
      {
        name: "GASAK Alpha",
        description:
          "The main competitive roster of GASAK, grinding MPL qualifiers and major community tournaments.",
        logoUrl: "/images/squad-a.png",
        accentColor: "#e0af3b",
        division: "gasak",
      },
      {
        name: "GASAK Academy",
        description:
          "Development squad for rising talent — the pipeline into GASAK Alpha.",
        logoUrl: "/images/squad-b.png",
        accentColor: "#5fb0ff",
        division: "gasak",
      },
      {
        name: "GASAK Bravo",
        description: "Second competitive roster focused on weekly cups.",
        logoUrl: "/images/squad-retak.png",
        accentColor: "#3ddc84",
        division: "gasak",
      },
      {
        name: "GASAK Charlie",
        description: "Community tournament lineup for rising players.",
        logoUrl: "/images/squad-vultra.png",
        accentColor: "#ff6f5e",
        division: "gasak",
      },
      {
        name: "GASAK Delta",
        description: "Scrim-heavy development roster for role specialists.",
        accentColor: "#c792ff",
        division: "gasak",
      },
      {
        name: "GASAK Creators",
        description: "Content and coaching squad for public sessions.",
        accentColor: "#ffd35f",
        division: "gasak",
      },
      {
        name: "Nexus Prime",
        description:
          "Nexus flagship roster — aggressive early-game shotcallers.",
        logoUrl: "/images/squad-retak.png",
        accentColor: "#ff6f5e",
        division: "nexus",
      },
      {
        name: "Nexus Surge",
        description: "Nexus development roster for rising duelists.",
        accentColor: "#c792ff",
        division: "nexus",
      },
      {
        name: "Velrix Phantom",
        description: "Velrix main lineup — control and macro specialists.",
        accentColor: "#ffd35f",
        division: "velrix",
      },
      {
        name: "Velrix Tempest",
        description: "Velrix scrim-heavy roster built around flexible lanes.",
        accentColor: "#5fb0ff",
        division: "velrix",
      },
    ])
    .returning();

  const squadByName = Object.fromEntries(allSquads.map((s) => [s.name, s]));
  const alpha = squadByName["GASAK Alpha"];
  const academy = squadByName["GASAK Academy"];
  const bravo = squadByName["GASAK Bravo"];
  const charlie = squadByName["GASAK Charlie"];
  const delta = squadByName["GASAK Delta"];
  const creators = squadByName["GASAK Creators"];
  const nexusPrime = squadByName["Nexus Prime"];
  const nexusSurge = squadByName["Nexus Surge"];
  const velrixPhantom = squadByName["Velrix Phantom"];
  const velrixTempest = squadByName["Velrix Tempest"];

  await db.insert(squadMembers).values([
    { squadId: alpha.id, userId: leader.id, squadRole: "leader" },
    { squadId: alpha.id, userId: member1.id, squadRole: "player" },
    { squadId: alpha.id, userId: member2.id, squadRole: "player" },
    { squadId: alpha.id, userId: member3.id, squadRole: "reserve" },
    // Seller also plays for Academy — demonstrates the sidebar's
    // Manage/Player focus toggle for org roles that also have a squad.
    { squadId: academy.id, userId: seller.id, squadRole: "coach" },
    ...extraPlayers.map((player, index) => ({
      squadId: [
        academy.id,
        bravo.id,
        charlie.id,
        delta.id,
        creators.id,
        nexusPrime.id,
        nexusSurge.id,
        velrixPhantom.id,
        velrixTempest.id,
      ][index % 9],
      userId: player.id,
      squadRole: (index % 5 === 0
        ? "leader"
        : index % 5 === 1
          ? "coach"
          : index % 5 === 2
            ? "reserve"
            : "player") as "leader" | "coach" | "player" | "reserve",
    })),
  ]);

  const inDays = (d: number, h = 20) => {
    const date = new Date();
    date.setDate(date.getDate() + d);
    date.setHours(h, 0, 0, 0);
    return date;
  };
  const inDaysDate = (d: number) => format(inDays(d), "yyyy-MM-dd");

  // pastUnloggedScrimEvent is intentionally left unlinked to any scrim/round
  // — it demonstrates the "Log result" flow and the dashboard's
  // "Needs a Result" panel for a past match with nothing recorded yet.
  const [pastFinalEvent, pastScrimEvent] = await db
    .insert(events)
    .values([
      {
        title: "Grand Final vs Team Nova",
        description: "Community Cup grand final — best of 5.",
        type: "tournament",
        date: inDaysDate(-20),
        location: "Online lobby",
        squadId: alpha.id,
        createdBy: admin.id,
      },
      {
        title: "Scrim vs Ravage GG",
        description: "Scheduled scrim block.",
        type: "scrim",
        date: inDaysDate(-3),
        location: "In-game custom lobby",
        squadId: alpha.id,
        createdBy: admin.id,
      },
      {
        title: "Scrim vs Nova Axis",
        description: "Scheduled scrim block — result not logged yet.",
        type: "scrim",
        date: inDaysDate(-1),
        location: "In-game custom lobby",
        squadId: alpha.id,
        createdBy: admin.id,
      },
    ])
    .returning();

  await db.insert(events).values([
    {
      title: "Weekly Practice",
      description: "Draft practice and macro review.",
      type: "practice",
      date: inDaysDate(1),
      location: "Discord — Practice Room",
      squadId: alpha.id,
      createdBy: admin.id,
    },
    {
      title: "Scrim vs Titan Esports",
      description: "Best of 5, tournament draft rules.",
      type: "scrim",
      date: inDaysDate(3),
      location: "In-game custom lobby",
      squadId: alpha.id,
      createdBy: leader.id,
    },
    {
      title: "All-hands Meeting",
      description: "Monthly org update for every squad.",
      type: "meeting",
      date: inDaysDate(5),
      location: "Discord — Main Stage",
      createdBy: admin.id,
    },
    {
      title: "Kejohanan MLBB Selangor",
      description: "Community tournament, single elimination.",
      type: "tournament",
      date: inDaysDate(10),
      location: "Cyber Arena, Shah Alam",
      squadId: alpha.id,
      createdBy: admin.id,
    },
    ...[
      ["Alpha Draft Lab", "practice", 2, 20, alpha.id],
      ["Academy VOD Review", "meeting", 4, 21, academy.id],
      ["Bravo Scrim Block", "scrim", 6, 20, bravo.id],
      ["Charlie Lane Clinic", "practice", 7, 22, charlie.id],
      ["Delta Macro Night", "practice", 8, 21, delta.id],
      ["Creator Coaching Live", "meeting", 9, 20, creators.id],
      ["GASAK Internal Cup", "tournament", 12, 14, null],
      ["Academy Trial Session", "practice", 13, 21, academy.id],
      ["Bravo Review Room", "meeting", 14, 20, bravo.id],
      ["Delta Scrim vs Orion", "scrim", 16, 21, delta.id],
    ].map(([title, type, day, , squadId]) => ({
      title: title as string,
      description: `${title} scheduled for GASAK players.`,
      type: type as "practice" | "tournament" | "meeting" | "scrim",
      date: inDaysDate(day as number),
      location: type === "tournament" ? "Online lobby" : "Discord",
      squadId: squadId as string | null,
      createdBy: admin.id,
    })),
  ]);

  const [communityCup, pialaKL, roundRobinLeague] = await db
    .insert(tournaments)
    .values([
      {
        name: "MLBB Community Cup 2026",
        organizer: "Moonton MY",
        date: inDays(-20, 12),
        prizePool: "RM 5,000",
        prize: "RM 5,000",
        placement: "Champion",
        mvp: "GSK·Aiman",
        format: "single_elimination" as const,
        status: "completed" as const,
        squadId: alpha.id,
      },
      {
        name: "Piala Komuniti KL",
        organizer: "KL Esports Hub",
        date: inDays(-45, 14),
        prizePool: "RM 2,000",
        prize: "RM 2,000",
        placement: "Semifinal",
        mvp: "GSK·Danish",
        format: "double_elimination" as const,
        status: "completed" as const,
        squadId: alpha.id,
      },
      {
        name: "Klang Valley Round Robin",
        organizer: "Community Hub",
        date: inDays(-6, 18),
        prizePool: "RM 1,500",
        prize: "RM 1,500",
        placement: null,
        mvp: null,
        format: "round_robin" as const,
        status: "ongoing" as const,
        squadId: academy.id,
      },
      {
        name: "Challonge Demo Bracket",
        organizer: "GASAK Internal",
        date: inDays(-2, 20),
        prizePool: "TBD",
        prize: null,
        placement: null,
        mvp: null,
        format: "swiss" as const,
        status: "ongoing" as const,
        tracking: "challonge" as const,
        // Demo values — Challonge sync will error without a real
        // CHALLONGE_API_KEY/tournament, which is expected here.
        challongeTournamentId: "demo-tournament",
        challongeParticipantId: "demo-participant",
        challongeUrl: "https://challonge.com/demo-tournament",
        squadId: bravo.id,
      },
      {
        name: "Merdeka Cup Qualifiers",
        organizer: "Moonton MY",
        date: inDays(15, 14),
        prizePool: "RM 3,000",
        prize: "RM 3,000",
        placement: null,
        mvp: null,
        format: "single_elimination" as const,
        status: "upcoming" as const,
        squadId: charlie.id,
      },
      {
        name: "Weekend Warriors Cup",
        organizer: "Community Hub",
        date: inDays(-30, 14),
        prizePool: "RM 800",
        prize: "RM 800",
        placement: "Cancelled — organizer withdrew",
        mvp: null,
        format: "other" as const,
        status: "cancelled" as const,
        squadId: delta.id,
      },
      ...[
        "Selangor Open Qualifier",
        "Cyber Arena Invitational",
        "Merdeka Mobile Cup",
        "Weekend Warriors League",
        "MY Esports Clash",
        "Klang Valley Showdown",
        "GASAK Internal Masters",
        "Academy Rising Cup",
        "Northern Circuit",
        "Community Proving Grounds",
      ].map((name, index) => ({
        name,
        organizer: index % 2 === 0 ? "Community Hub" : "Moonton MY",
        date: inDays(-10 - index * 8, 14),
        prizePool: `RM ${(index + 1) * 750}`,
        prize: `RM ${(index + 1) * 750}`,
        placement:
          index % 3 === 0 ? "Champion" : index % 3 === 1 ? "Top 8" : "Top 4",
        mvp: ["GSK·Aiman", "GSK·Danish", "GSK·Nabil"][index % 3],
        format: (
          [
            "single_elimination",
            "double_elimination",
            "round_robin",
            "swiss",
            "other",
          ] as const
        )[index % 5],
        status: "completed" as const,
        squadId: [alpha.id, academy.id, bravo.id, charlie.id][index % 4],
      })),
    ])
    .returning();

  await db.insert(tournamentRounds).values([
    {
      tournamentId: communityCup.id,
      roundLabel: "Round 1",
      sortOrder: 0,
      opponent: "Ravage GG",
      scheduledAt: inDays(-20, 12),
      outcome: "win" as const,
      score: "2-0",
    },
    {
      tournamentId: communityCup.id,
      roundLabel: "Semifinal",
      sortOrder: 1,
      opponent: "Fenix MY",
      scheduledAt: inDays(-20, 15),
      outcome: "win" as const,
      score: "2-1",
    },
    {
      tournamentId: communityCup.id,
      roundLabel: "Grand Final",
      sortOrder: 2,
      opponent: "Team Nova",
      scheduledAt: inDays(-20, 19),
      outcome: "win" as const,
      score: "3-1",
      notes: "Reverse sweep threat in game 3; clutch Lord call sealed it.",
      eventId: pastFinalEvent.id,
    },
    {
      tournamentId: pialaKL.id,
      roundLabel: "Round 1",
      sortOrder: 0,
      opponent: "Orion",
      scheduledAt: inDays(-45, 14),
      outcome: "win" as const,
      score: "2-0",
    },
    {
      tournamentId: pialaKL.id,
      roundLabel: "Semifinal",
      sortOrder: 1,
      opponent: "Fenix MY",
      scheduledAt: inDays(-45, 18),
      outcome: "loss" as const,
      score: "1-2",
    },
    {
      tournamentId: roundRobinLeague.id,
      roundLabel: "Matchday 1",
      sortOrder: 0,
      opponent: "Cyber Arena Academy",
      scheduledAt: inDays(-6, 18),
      outcome: "draw" as const,
      score: "1-1",
      notes: "Even series — rematch scheduled next cycle.",
    },
    {
      tournamentId: roundRobinLeague.id,
      roundLabel: "Matchday 2",
      sortOrder: 1,
      opponent: "Northern Circuit",
      scheduledAt: inDays(2, 18),
      outcome: "pending" as const,
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
      eventId: pastScrimEvent.id,
    },
    ...Array.from({ length: 10 }, (_, index) => ({
      squadId: [alpha.id, academy.id, bravo.id, charlie.id, delta.id][
        index % 5
      ],
      opponent: [
        "Orion Esports",
        "Fenix MY",
        "Nova Axis",
        "Ravage GG",
        "Titan Academy",
      ][index % 5],
      date: inDays(-2 - index, 21),
      result: index % 2 === 0 ? "Won 3-1" : "Lost 2-3",
      notes: "Seeded scrim notes for dashboard testing.",
      replayLink: index % 3 === 0 ? "https://youtu.be/example-replay" : null,
    })),
  ]);

  await db.insert(news).values([
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
    ...[
      ["Roster check this Friday", null],
      ["Shop restock completed", null],
      ["Academy trials open", academy.id],
      ["Bravo weekly target", bravo.id],
      ["Charlie roster review", charlie.id],
      ["Delta training block", delta.id],
      ["Creator coaching queue", creators.id],
      ["Tournament screenshots due", null],
      ["Discord cleanup notice", null],
      ["Monthly townhall reminder", null],
    ].map(([title, squadId]) => ({
      title: title as string,
      content: `${title} — seeded news content for app testing.`,
      squadId: squadId as string | null,
      authorId: admin.id,
    })),
  ]);

  const productRows = await db
    .insert(products)
    .values([
      // Only joki and merchandise are live shop categories for now — other
      // categories will be rebuilt from scratch later.
      ...[
        ["GASAK Team Jersey", 8900, 40],
        ["GASAK Hoodie", 12_900, 25],
        ["GASAK Sticker Pack", 1500, 100],
      ].map(([name, priceSen, stock]) => ({
        name: name as string,
        category: "merchandise" as const,
        description: `${name} from the GASAK merch store.`,
        priceSen: priceSen as number,
        stock: stock as number,
        active: true,
        createdBy: seller.id,
      })),
    ])
    .returning();

  await db.insert(applications).values(
    Array.from({ length: 12 }, (_, index) => ({
      fullName: `Applicant ${index + 1}`,
      email: `applicant${index + 1}@gasak.gg`,
      phone: `+60129876${500 + index}`,
      age: 18 + (index % 10),
      daerah: MALAYSIA_STATES[index % MALAYSIA_STATES.length],
      ign: `Trial${index + 1}`,
      mlbbId: String(880_000_000 + index),
      serverId: String(3000 + (index % 5)),
      peakRank: mkRank(index % 2 === 0 ? "Mythic" : "Legend", 10),
      preferredLanes: [
        (["exp", "jungle", "mid", "gold", "roam"] as const)[index % 5],
      ],
      heroPool: "Chou, Valentina, Claude, Fredrinn",
      previousTeam: index % 3 === 0 ? "Local Stack" : null,
      introduction: "Seeded recruitment application for dashboard testing.",
      status: ["applied", "under_review", "trial", "accepted", "rejected"][
        index % 5
      ] as "applied" | "under_review" | "trial" | "accepted" | "rejected",
      assignedLeaderId: index % 2 === 0 ? leader.id : null,
      reviewNotes: index % 2 === 0 ? "Promising trial candidate." : null,
    })),
  );

  await db.insert(orders).values(
    Array.from({ length: 12 }, (_, index) => {
      const product = productRows[index % productRows.length];
      const quantity = (index % 3) + 1;
      return {
        orderNo: `GSK-SEED-${String(index + 1).padStart(3, "0")}`,
        customerName: `Customer ${index + 1}`,
        customerPhone: `+60127770${100 + index}`,
        customerEmail: `customer${index + 1}@example.com`,
        productId: product.id,
        quantity,
        unitPriceSen: product.priceSen,
        totalSen: product.priceSen * quantity,
        status: [
          "pending",
          "waiting_payment",
          "paid",
          "processing",
          "completed",
          "cancelled",
        ][index % 6] as
          | "pending"
          | "waiting_payment"
          | "paid"
          | "processing"
          | "completed"
          | "cancelled",
        paymentMethod: (index % 2 === 0 ? "billplz" : "duitnow_qr") as
          | "billplz"
          | "duitnow_qr",
        paymentVerifiedBy: index % 3 === 0 ? seller.id : null,
        paymentVerifiedAt: index % 3 === 0 ? inDays(-index) : null,
      };
    }),
  );

  await ensureAuthImages();
  await ensureGalleries();
  await ensureProductGallery();
  await ensureOrganizationPositions(admin);
  await ensureJokiCatalog(seller.id);

  console.log("Seed complete.");
  console.log(
    "Logins: admin@gasak.gg/admin123, leader@gasak.gg/leader123, member@gasak.gg/member123, seller@gasak.gg/seller123",
  );
  console.log(
    `Squads: ${alpha.name} (gasak), ${nexusPrime.name} (nexus), ${velrixPhantom.name} (velrix)`,
  );
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
