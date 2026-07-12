import { getDashboardContext } from "./_components/dashboard-context";
import { AdminHome } from "./_components/home/admin-home";
import { SellerHome } from "./_components/home/seller-home";
import { SquadHome } from "./_components/home/squad-home";

export default async function DashboardPage() {
  const { user, access, effectiveAccess } = await getDashboardContext();

  if (effectiveAccess.orgRole === "admin") return <AdminHome />;
  if (effectiveAccess.orgRole === "seller") return <SellerHome />;
  return <SquadHome userId={user.id} isLeader={access.managesSquad} />;
}
