import { Icons } from "@components/icons";
import { PageSkeleton } from "@components/shared/page-skeleton";
import { db, jokiPackages, jokiTiers, products } from "@server/db";
import { requireOrgRole } from "@server/session";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { PageHeader } from "../_components/page-surface";

function CatalogSectionCard({
  href,
  title,
  description,
  icon: Icon,
  stats,
}: {
  href: string;
  title: string;
  description: string;
  icon: (typeof Icons.Domain)[keyof typeof Icons.Domain];
  stats: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 border bg-card p-5 shadow-xs transition-colors hover:border-primary/50 hover:bg-primary/5"
    >
      <span className="flex size-11 shrink-0 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
        <Icon size={22} />
      </span>
      <span className="grid min-w-0 gap-1">
        <span className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wide">
          {title}
          <Icons.Layout.Navigation.CaretRight
            size={13}
            className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </span>
        <span className="text-xs text-muted-foreground">{description}</span>
        <span className="mt-1 font-mono text-xs text-primary">{stats}</span>
      </span>
    </Link>
  );
}

// The catalog currently sells joki services and merchandise only — other
// categories were removed and will be rebuilt from scratch later.
export default async function ProductsPage() {
  await requireOrgRole("admin", "seller");

  const [merchRows, tiers, packages] = await Promise.all([
    db.select().from(products).where(eq(products.category, "merchandise")),
    db.select().from(jokiTiers),
    db.select().from(jokiPackages),
  ]);
  const activeMerch = merchRows.filter((product) => product.active);

  return (
    <PageSkeleton name="products" loading={false}>
      <main>
        <PageHeader
          title="Products"
          kicker="Commerce"
          icon={Icons.Domain.Products}
          description="The shop catalog — joki services and GASAK merchandise."
        />

        <div className="grid gap-4 desktop:grid-cols-2">
          <CatalogSectionCard
            href="/dashboard/products/joki"
            title="Joki Services"
            description="Rank boost tiers, per-star pricing, and flat-rate packages."
            icon={Icons.Domain.Joki}
            stats={`${tiers.length} tiers · ${packages.length} packages`}
          />
          <CatalogSectionCard
            href="/dashboard/products/merchandise"
            title="Merchandise"
            description="Physical items — jerseys, hoodies, and other GASAK gear."
            icon={Icons.Domain.Merchandise}
            stats={`${activeMerch.length} active · ${merchRows.length} items total`}
          />
        </div>
      </main>
    </PageSkeleton>
  );
}
