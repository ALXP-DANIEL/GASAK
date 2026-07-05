import { requireUser, userRole } from "@/lib/session";
import { getLedSquadIds } from "@/server/authz";
import { AdminHome } from "./_components/home/admin-home";
import { SellerHome } from "./_components/home/seller-home";
import { SquadHome } from "./_components/home/squad-home";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const role = userRole(user);

  if (role === "admin") return <AdminHome />;
  if (role === "seller") return <SellerHome />;
  const ledSquadIds = await getLedSquadIds(user.id);
  return <SquadHome userId={user.id} isLeader={ledSquadIds.length > 0} />;
}
