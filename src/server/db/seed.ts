import { and, eq } from "drizzle-orm";
import { auth } from "../auth";
import {
  announcements,
  applications,
  authSlides,
  db,
  events,
  type OrgRole,
  orders,
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
    ...extraPlayers.map((player, index) => ({
      userId: player.id,
      fullName: player.name,
      nickname: player.name.split(" ")[0],
      ign: extraPlayerSeeds[index][2],
      mlbbId: String(567_000_000 + index),
      serverId: String(2003 + (index % 4)),
      phone: `+60123456${790 + index}`,
      preferredLane: extraPlayerSeeds[index][3],
      currentRank: index % 2 === 0 ? "Mythic" : "Mythical Honor",
      peakRank: index % 3 === 0 ? "Mythical Glory" : "Mythical Honor",
    })),
  ]);

  const [alpha, academy, bravo, charlie, delta, creators] = await db
    .insert(squads)
    .values([
      {
        name: "GASAK Alpha",
        description:
          "The main competitive roster of GASAK, grinding MPL qualifiers and major community tournaments.",
      },
      {
        name: "GASAK Academy",
        description:
          "Development squad for rising talent — the pipeline into GASAK Alpha.",
      },
      {
        name: "GASAK Bravo",
        description: "Second competitive roster focused on weekly cups.",
      },
      {
        name: "GASAK Charlie",
        description: "Community tournament lineup for rising players.",
      },
      {
        name: "GASAK Delta",
        description: "Scrim-heavy development roster for role specialists.",
      },
      {
        name: "GASAK Creators",
        description: "Content and coaching squad for public sessions.",
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
    ...extraPlayers.map((player, index) => ({
      squadId: [academy.id, bravo.id, charlie.id, delta.id, creators.id][
        index % 5
      ],
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
    ].map(([title, type, day, hour, squadId]) => ({
      title: title as string,
      description: `${title} scheduled for GASAK players.`,
      type: type as "practice" | "tournament" | "meeting" | "scrim",
      startsAt: inDays(day as number, hour as number),
      endsAt: inDays(day as number, (hour as number) + 2),
      location: type === "tournament" ? "Online lobby" : "Discord",
      squadId: squadId as string | null,
      createdBy: admin.id,
    })),
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
      prize: `RM ${(index + 1) * 750}`,
      opponent: ["Orion", "Ravage GG", "Titan Esports", "Fenix MY"][index % 4],
      result:
        index % 3 === 0 ? "Won 2-0" : index % 3 === 1 ? "Lost 1-2" : "Top 4",
      mvp: ["GSK·Aiman", "GSK·Danish", "GSK·Nabil"][index % 3],
      squadId: [alpha.id, academy.id, bravo.id, charlie.id][index % 4],
    })),
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
      content: `${title} — seeded announcement content for app testing.`,
      squadId: squadId as string | null,
      authorId: admin.id,
    })),
  ]);

  const productRows = await db
    .insert(products)
    .values([
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
        description:
          "MLBB Weekly Diamond Pass — best value for daily diamonds.",
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
      ...[
        ["257 Diamonds", "diamonds", 1650, 999],
        ["344 Diamonds", "diamonds", 2200, 999],
        ["429 Diamonds", "diamonds", 2750, 999],
        ["706 Diamonds", "diamonds", 4400, 800],
        ["Twilight Pass", "weekly_pass", 4200, 100],
        ["Rank Push Coaching", "coaching", 12_000, 12],
        ["Duo Queue Review", "coaching", 6000, 20],
        ["Joki Legend to Mythic", "joki", 3500, 15],
        ["Joki Honor to Glory", "joki", 9000, 8],
        ["Draft Review Session", "coaching", 4500, 25],
      ].map(([name, category, priceSen, stock]) => ({
        name: name as string,
        category: category as "diamonds" | "weekly_pass" | "joki" | "coaching",
        description: `${name} package from GASAK shop.`,
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
      ign: `Trial${index + 1}`,
      mlbbId: String(880_000_000 + index),
      serverId: String(3000 + (index % 5)),
      currentRank: index % 2 === 0 ? "Mythic" : "Legend",
      preferredLane: ["exp", "jungle", "mid", "gold", "roam"][index % 5] as
        | "exp"
        | "jungle"
        | "mid"
        | "gold"
        | "roam",
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
