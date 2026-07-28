import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { StatItem, StatStrip } from "@components/shared/stat-strip";
import { buttonVariants } from "@components/ui/shadcn/button";
import { accountEnquiries, db } from "@server/db";
import { requireOrgRole } from "@server/session";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { PageHeader } from "../../../_components/page-surface";
import { EnquiriesList } from "../_components/enquiries-list";

export default async function AccountEnquiriesPage() {
  await requireOrgRole("admin", "seller");

  const rows = await db.query.accountEnquiries.findMany({
    orderBy: desc(accountEnquiries.createdAt),
    with: { product: { columns: { id: true, name: true } } },
  });
  const fresh = rows.filter((row) => row.status === "new");
  const contacted = rows.filter((row) => row.status === "contacted");

  return (
    <PageSkeleton name="account-enquiries" loading={false}>
      <main>
        <PageHeader
          title="Account Enquiries"
          kicker="Commerce"
          icon={Icons.Domain.Products}
          description="Buyers who registered interest in an account listing. Contact them on WhatsApp to arrange manual QR payment."
        >
          <Link
            href="/dashboard/products/accounts"
            className={buttonVariants({ variant: "outline" })}
          >
            Back to listings
          </Link>
        </PageHeader>

        <div className="flex flex-col gap-6">
          <StatStrip>
            <StatItem
              label="New"
              value={fresh.length}
              hint="Awaiting first contact"
              icon={Icons.Status.Pending}
            />
            <StatItem
              label="In progress"
              value={contacted.length}
              hint="Contacted, not yet closed"
              icon={Icons.Domain.Orders}
            />
            <StatItem
              label="Total"
              value={rows.length}
              hint="All enquiries received"
              icon={Icons.Domain.Products}
            />
          </StatStrip>
          <EnquiriesList rows={rows} />
        </div>
      </main>
    </PageSkeleton>
  );
}
