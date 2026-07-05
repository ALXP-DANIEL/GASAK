import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { BrandBadge, BrandCard, LinkButton } from "@/components/ui/brand";
import { formatDate, formatRM } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Announcement, Product, Squad } from "@/server/db/schema";

export function isDevelopmentSquad(squad: Pick<Squad, "name" | "description">) {
  return /academy|development|junior/i.test(
    `${squad.name} ${squad.description ?? ""}`,
  );
}

export function NewsCard({
  item,
  mode = "compact",
}: {
  item: Announcement;
  mode?: "compact" | "full";
}) {
  const compact = mode === "compact";

  return (
    <BrandCard className="flex h-full flex-col overflow-hidden">
      <div
        className={cn(
          "relative flex items-center justify-center border-b border-primary/20 bg-linear-to-br from-primary/25 via-primary/5 to-transparent",
          compact ? "aspect-16/10" : "h-32",
        )}
      >
        <Icons.Domain.News
          size={compact ? 40 : 34}
          className="text-primary/60"
          weight={compact ? undefined : "fill"}
        />
        <BrandBadge
          className={cn(
            "absolute left-3 top-3",
            compact && "border-primary bg-primary text-primary-foreground",
          )}
        >
          Announcement
        </BrandBadge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p
          className={cn(
            "font-semibold uppercase tracking-wide text-primary",
            compact ? "text-[10px]" : "text-xs",
          )}
        >
          {formatDate(item.createdAt)}
        </p>
        <h2
          className={cn(
            "mt-1 font-heading font-bold tracking-wide",
            compact ? "line-clamp-2 text-lg" : "text-xl",
          )}
        >
          {item.title}
        </h2>
        <p
          className={cn(
            "mt-2 leading-relaxed text-muted-foreground",
            compact
              ? "min-h-8 line-clamp-2 text-xs"
              : "whitespace-pre-wrap text-sm",
          )}
        >
          {item.content}
        </p>
        {compact && (
          <Link
            href="/news"
            className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline"
          >
            Read more <Icons.Layout.Navigation.CaretRight size={12} />
          </Link>
        )}
      </div>
    </BrandCard>
  );
}

export function ProductCard({
  product,
  action,
  mode = "compact",
}: {
  product: Product;
  action?: React.ReactNode;
  mode?: "compact" | "full";
}) {
  const compact = mode === "compact";

  return (
    <BrandCard
      className={cn(
        "flex h-full flex-col overflow-hidden",
        compact && "min-h-60 items-center p-5 text-center",
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden",
          compact ? "size-24" : "h-36 w-full",
        )}
      >
        {product.imageUrl ? (
          compact ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={96}
              height={96}
              className="size-full object-contain"
              unoptimized
            />
          ) : (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          )
        ) : (
          <Icons.Domain.Shop size={40} className="text-primary/50" />
        )}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col",
          compact ? "w-full items-center" : "p-5",
        )}
      >
        <div
          className={cn(
            compact ? "contents" : "flex items-center justify-between gap-2",
          )}
        >
          <h3
            className={cn(
              "font-heading font-bold tracking-wide",
              compact
                ? "mt-4 min-h-10 line-clamp-2 text-sm uppercase"
                : "text-xl",
            )}
          >
            {product.name}
          </h3>
          {compact ? (
            <p className="mt-1 text-xs font-semibold text-primary">
              {formatRM(product.priceSen)}
            </p>
          ) : (
            <BrandBadge>{formatRM(product.priceSen)}</BrandBadge>
          )}
        </div>

        {!compact && (
          <>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {product.description}
            </p>
            <p className="mt-auto pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {product.stock} in stock
            </p>
          </>
        )}

        <div className={cn(compact ? "mt-auto w-full pt-4" : "mt-4")}>
          {action ?? (
            <LinkButton href="/shop" size="sm" className="w-full">
              Buy now
            </LinkButton>
          )}
        </div>
      </div>
    </BrandCard>
  );
}

export function SquadCard({
  squad,
  memberCount,
  mode = "compact",
}: {
  squad: Squad;
  memberCount?: number;
  mode?: "compact" | "full";
}) {
  const compact = mode === "compact";
  const development = isDevelopmentSquad(squad);

  if (compact) {
    return (
      <BrandCard className="flex h-full flex-col items-center overflow-hidden p-6 text-center">
        <div className="flex size-36 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-background">
          <Image
            src={squad.logoUrl ?? "/images/gasak-logo.png"}
            alt={`${squad.name} emblem`}
            width={144}
            height={144}
            className="size-full object-cover"
            unoptimized={Boolean(squad.logoUrl)}
          />
        </div>
        <h3 className="mt-5 font-heading text-lg font-bold uppercase tracking-wide">
          {squad.name}
        </h3>
        <p
          className={cn(
            "mt-1 text-xs",
            development ? "text-destructive" : "text-primary",
          )}
        >
          {development ? "Development Squad" : "Competitive Squad"}
        </p>
        <LinkButton
          href={`/squads/${squad.slug}`}
          size="sm"
          caret
          className="mt-4"
        >
          View squad
        </LinkButton>
      </BrandCard>
    );
  }

  return (
    <Link href={`/squads/${squad.slug}`} className="h-full">
      <BrandCard className="h-full overflow-hidden">
        {squad.bannerUrl && (
          <div className="relative h-32 w-full">
            <Image
              src={squad.bannerUrl}
              alt={`${squad.name} banner`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-3">
            <Image
              src={squad.logoUrl ?? "/images/gasak-logo.png"}
              alt={`${squad.name} logo`}
              width={40}
              height={40}
              className="size-10 rounded-full object-cover"
              unoptimized={Boolean(squad.logoUrl)}
            />
            <div>
              <h2 className="font-heading text-xl font-bold tracking-wide">
                {squad.name}
              </h2>
              {typeof memberCount === "number" && (
                <p className="text-sm text-muted-foreground">
                  {memberCount} player{memberCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
            {squad.description}
          </p>
        </div>
      </BrandCard>
    </Link>
  );
}
