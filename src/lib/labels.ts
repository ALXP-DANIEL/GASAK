import type {
  ApplicationStatus,
  EventType,
  Lane,
  OrderStatus,
  OrgRole,
  PaymentMethod,
  ProductCategory,
  SquadRole,
} from "@server/db/schema";

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  admin: "Admin",
  seller: "Seller",
  user: "User",
};

// Temporary alias while call sites migrate to ORG_ROLE_LABELS
export const ROLE_LABELS = ORG_ROLE_LABELS;

export const LANE_LABELS: Record<Lane, string> = {
  exp: "EXP Lane",
  jungle: "Jungle",
  mid: "Mid Lane",
  gold: "Gold Lane",
  roam: "Roam",
};

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

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  practice: "var(--chart-1)",
  tournament: "var(--chart-2)",
  meeting: "var(--chart-3)",
  scrim: "var(--chart-4)",
};

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

export const MLBB_RANKS = [
  "Warrior",
  "Elite",
  "Master",
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal",
] as const;
