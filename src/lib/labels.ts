import type {
  ApplicationStatus,
  EventType,
  Lane,
  MatchOutcome,
  OrderStatus,
  OrgRole,
  PaymentMethod,
  ProductCategory,
  SquadRole,
  TournamentFormat,
  TournamentStatus,
} from "@server/db/schema";

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  admin: "Admin",
  seller: "Seller",
  user: "User",
};

// Temporary alias while call sites migrate to ORG_ROLE_LABELS
export const ROLE_LABELS = ORG_ROLE_LABELS;

// NOTE: Multi-select lanes + the "Flex" role were disabled per a product
// decision (GASAK: one lane per player, no Flex). The `flex` label is kept so
// any DB-backed `flex` values still render, but the UI no longer offers it.
// Re-enable by restoring the Flex option in LaneSelectGroup and the rules in
// canonicalizeLanes below.
export const LANE_LABELS: Record<Lane, string> = {
  exp: "EXP",
  jungle: "Jungle",
  mid: "Mid",
  gold: "Gold",
  roam: "Roam",
  flex: "Flex",
};

/** Canonical display order for lanes (specific roles first, Flex last). */
export const LANE_ORDER: Lane[] = [
  "exp",
  "jungle",
  "mid",
  "gold",
  "roam",
  "flex",
];

/** The five specific MLBB lanes (everything except the flexible "Flex" role). */
export const SPECIFIC_LANES: Lane[] = ["exp", "jungle", "mid", "gold", "roam"];

/** The flexible role: a player who can fill any/multiple lanes. */
export const FLEX_LANE = "flex" satisfies Lane;

export function isLane(value: string | null | undefined): value is Lane {
  return Boolean(value && value in LANE_LABELS);
}

/** Normalize an arbitrary lane list into ordered, de-duplicated valid lanes. */
export function normalizeLanes(
  lanes: readonly (string | null | undefined)[] | null | undefined,
): Lane[] {
  const valid = new Set((lanes ?? []).filter(isLane));
  return LANE_ORDER.filter((lane) => valid.has(lane));
}

/**
 * Apply the Flex selection rules so stored lane data is always canonical,
 * regardless of the input source (form, API, seed):
 * - de-duplicated and ordered (via {@link normalizeLanes});
 * - Flex is exclusive: if present, it collapses to just `["flex"]`;
 * - selecting all five specific lanes is equivalent to Flex.
 *
 * NOTE: Flex + multi-select are disabled per product decision (one lane per
 * player, no Flex). The rules below are kept commented for future reference.
 */
export function canonicalizeLanes(
  lanes: readonly (string | null | undefined)[] | null | undefined,
): Lane[] {
  // const normalized = normalizeLanes(lanes);
  // if (normalized.includes(FLEX_LANE)) return [FLEX_LANE];
  // if (SPECIFIC_LANES.every((lane) => normalized.includes(lane))) {
  //   return [FLEX_LANE];
  // }
  // return normalized;
  return normalizeLanes(lanes);
}

/** Format a player's preferred lanes as a readable label (e.g. "EXP, Mid"). */
export function formatLanes(
  lanes: readonly (string | null | undefined)[] | null | undefined,
  fallback = "—",
): string {
  const normalized = normalizeLanes(lanes);
  if (normalized.length === 0) return fallback;
  return normalized.map((lane) => LANE_LABELS[lane]).join(", ");
}

/** Format a player's MLBB ID with server, e.g. "(2151) 123456789". */
export function formatMlbbId(
  mlbbId: string | null | undefined,
  serverId: string | null | undefined,
  fallback = "-",
): string {
  if (!mlbbId) return fallback;
  return `${serverId ? `(${serverId}) ` : ""}${mlbbId}`;
}

export const SQUAD_ROLE_LABELS: Record<SquadRole, string> = {
  leader: "Leader",
  coach: "Coach",
  player: "Player",
  reserve: "Reserve",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  under_review: "Under Review",
  trial: "Trial",
  accepted: "Accepted",
  rejected: "Rejected",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  practice: "Practice",
  tournament: "Tournament",
  meeting: "Meeting",
  scrim: "Scrim",
};

export const TOURNAMENT_FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: "Single Elimination",
  double_elimination: "Double Elimination",
  round_robin: "Round Robin",
  swiss: "Swiss",
  other: "Other",
};

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const MATCH_OUTCOME_LABELS: Record<MatchOutcome, string> = {
  win: "Win",
  loss: "Loss",
  draw: "Draw",
  pending: "Pending",
};

/** Badge variant for a freeform scrim result string ("Won 3-2", "Lost 1-3"). */
export function resultBadgeVariant(result: string) {
  if (/^won?\b/i.test(result)) return "default" as const;
  if (/^lost?\b/i.test(result)) return "destructive" as const;
  return "secondary" as const;
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  diamonds: "Diamonds",
  weekly_pass: "Weekly Pass",
  joki: "Joki",
  coaching: "Coaching",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  waiting_payment: "Waiting Payment",
  paid: "Paid",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "waiting_payment",
  "paid",
  "processing",
  "completed",
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  duitnow_qr: "DuitNow QR",
  bank_transfer: "Bank Transfer",
  fpx: "FPX",
  billplz: "Billplz (online)",
};
