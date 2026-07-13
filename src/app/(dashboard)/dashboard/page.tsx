import { DashboardHomeSkeleton } from "./_components/dashboard-bones";
import { getDashboardContext } from "./_components/dashboard-context";
import { AdminHome } from "./_components/home/admin-home";
import { SellerHome } from "./_components/home/seller-home";
import { SquadHome } from "./_components/home/squad-home";

export default async function DashboardPage() {
  const { user, access, effectiveAccess } = await getDashboardContext();

  let variant: "admin" | "seller" | "squad";
  let content: React.ReactNode;
  if (effectiveAccess.orgRole === "admin") {
    variant = "admin";
    content = <AdminHome />;
  } else if (effectiveAccess.orgRole === "seller") {
    variant = "seller";
    content = <SellerHome />;
  } else {
    variant = "squad";
    content = <SquadHome userId={user.id} isLeader={access.managesSquad} />;
  }

  return (
    <DashboardHomeSkeleton variant={variant}>{content}</DashboardHomeSkeleton>
  );
}
