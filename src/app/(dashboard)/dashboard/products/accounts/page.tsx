import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { buttonVariants } from "@components/ui/shadcn/button";
import { db, products } from "@server/db";
import { requireOrgRole } from "@server/session";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHeader } from "../../_components/page-surface";
import { AccountTable } from "./_components/account-table";

export default async function AccountsPage() {
  await requireOrgRole("admin", "seller");

  const rows = await db.query.products.findMany({
    where: eq(products.category, "account"),
    orderBy: desc(products.createdAt),
    with: { accountDetails: true },
  });
  const active = rows.filter((product) => product.active);
  const sold = rows.filter((product) => product.accountDetails?.sold);

  return (
    <PageSkeleton name="accounts" loading={false}>
      <main>
        <PageHeader
          title="Game Accounts"
          kicker="Commerce"
          icon={Icons.Domain.Products}
          description="MLBB accounts listed for direct buyer enquiries on WhatsApp."
        >
          <Link
            href="/dashboard/products/accounts/enquiries"
            className={buttonVariants({ variant: "outline" })}
          >
            Buyer enquiries
          </Link>
          <Link
            href="/dashboard/products/new?category=account"
            className={buttonVariants({ variant: "default" })}
          >
            New account listing
          </Link>
        </PageHeader>

        <div className="flex flex-col gap-6">
          <StatStrip>
            <StatItem
              label="Available"
              value={
                active.filter((product) => !product.accountDetails?.sold).length
              }
              hint={`${rows.length} listings total`}
              icon={Icons.Domain.Products}
            />
            <StatItem
              label="Sold"
              value={sold.length}
              hint="Marked sold by a seller"
              icon={Icons.Status.Success}
            />
          </StatStrip>
          <AccountTable rows={rows} />
        </div>
      </main>
    </PageSkeleton>
  );
}
