import { desc } from "drizzle-orm";
import Image from "next/image";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/shadcn/table";
import { formatRM } from "@/lib/format";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/labels";
import { requireRole } from "@/lib/session";
import { db, products } from "@/server/db";
import { EmptyState, PageHeader } from "../_components/page-surface";
import { ProductFormDialog } from "./_components/product-form";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requireRole("admin", "seller");

  const rows = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  return (
    <main>
      <PageHeader
        title="Products"
        description="Diamonds, weekly passes, joki, and coaching packages."
      >
        <ProductFormDialog />
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState message="No products yet. Add your first product." />
      ) : (
        <div className="overflow-hidden rounded-none border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="hidden desktop:table-cell">
                  Category
                </TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden desktop:table-cell">
                  Stock
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          width={36}
                          height={36}
                          className="border object-cover"
                          unoptimized
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{product.name}</p>
                        <p className="line-clamp-1 max-w-64 text-xs text-muted-foreground">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden desktop:table-cell">
                    {PRODUCT_CATEGORY_LABELS[product.category]}
                  </TableCell>
                  <TableCell>{formatRM(product.priceSen)}</TableCell>
                  <TableCell className="hidden desktop:table-cell">
                    {product.stock}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.active ? "default" : "outline"}>
                      {product.active ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ProductFormDialog product={product} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
