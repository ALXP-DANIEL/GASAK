import { requireUser, userRole } from "@/lib/session";
import { AdminDashboard } from "./admin/admin-dashboard";
import { SellerDashboard } from "./seller/seller-dashboard";
import { SquadDashboard } from "./squad/squad-dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const role = userRole(user);

  if (role === "admin") return <AdminDashboard />;
  if (role === "seller") return <SellerDashboard />;
  return <SquadDashboard userId={user.id} isLeader={role === "leader"} />;
}
