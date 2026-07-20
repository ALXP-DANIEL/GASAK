# Plan: Auth grid backdrop, public gallery, merch product gallery

Three related changes requested by the client. Scope below is implementation-ready.

## Context

- `authSlides` (schema `auth_slides`) currently drives a desktop-only carousel
  (`AuthSideCarousel`) on the auth layout (`src/app/(auth)/layout.tsx`) showing
  image + eyebrow/title/description, sorted by `sortOrder`.
- Client wants: (1) the auth side to become a **random image grid backdrop**,
  identical on desktop & mobile, with no title/description/sort; (2) a
  **public gallery** where GASAK uploads any number of images with
  title+description, shown on the public site; (3) a **merch product gallery**
  capped at 3 images per product on the product detail page.

## Decisions (confirmed with client)

1. **Auth slides → image-only.** Drop `eyebrow`, `title`, `description`,
   `sortOrder` columns from `auth_slides`. Keep `imageUrl`, `active`,
   `createdAt`, `updatedAt`, `id`. Auth layout shows a random grid of active
   images on both mobile and desktop (replaces the desktop-only carousel).
2. **Public gallery = new `galleries` table** (independent of `authSlides`),
   with `title` + `description` per image, unlimited uploads.
3. **Merch gallery = new `product_gallery` table**: `productId`,
   `imageUrl`, `sortOrder`, capped at 3 per product. `products.imageUrl`
   remains the cover/primary image.

---

## Task 1 — Auth image grid backdrop

### Schema (`src/server/db/schema.ts`)
- `authSlides` table: remove `eyebrow`, `title`, `description`, `sortOrder`.
  Keep `id`, `imageUrl`, `active`, `createdAt`, `updatedAt`.
- Update `authSlides` relations/types if any reference removed fields
  (grep `authSlides` for `.$inferSelect`/`$inferInsert` usages).

### Queries (`src/features/auth-slides/queries.ts`)
- `AuthCarouselSlide` type → `AuthSlideImage { id, imageUrl }`.
- `listActiveAuthSlides()` → return active rows mapped to `{ id, imageUrl }`.
  Order is irrelevant (randomized client-side); keep a stable `orderBy`
  (e.g. `createdAt`) for cache determinism. Keep `cacheTag("auth-slides")`.

### Auth layout (`src/app/(auth)/layout.tsx`)
- Replace `<AuthSideCarousel>` block with a new `<AuthSideGrid slides={slides} />`.
- Make the grid render on BOTH mobile and desktop (remove `hidden desktop:block`
  and the `desktop:grid-cols-2` conditional tied to carousel). Decide a
  consistent two-column-ish layout where the grid is the page background,
  with the auth card centered/overlaid. Keep `min-h-svh`.
- Pass all active slides (no length-gated single side).

### New component (`src/features/auth/components/auth-side-grid.tsx`)
- Client component (needs `Math.random()` shuffle per load).
- Renders a CSS grid (e.g. `grid-cols-2`/`3` responsive) of `Image`s
  (`object-cover`) filling the viewport as a backdrop, shuffled order each
  mount. If no slides, render a neutral branded fallback (no carousel).
- Keep accessibility: `alt=""` decorative, `aria-hidden` on grid.

### Dashboard admin (`src/app/(dashboard)/dashboard/auth-slides/...`)
- `_components/auth-slide-form.tsx`: drop eyebrow/title/description/sortOrder
  fields; keep image upload (label "Image") + active toggle. Update `schema`
  (drop `title`/`description`/`eyebrow`/`sortOrder`), `slideSchema` in
  `src/server/actions/auth-slides.ts`, and `defaultValues`.
- `_components/slides-grid.tsx`: drop `#sortOrder` badge and copy; show image
  tile + Active/Hidden badge + edit/delete.
- `page.tsx`: update empty-state copy ("Add your first image.").
- `src/server/actions/auth-slides.ts`: `parseSlideForm`/`slideSchema` no longer
  require title/description/eyebrow/sortOrder; `createAuthSlide`/`updateAuthSlide`
  insert only `imageUrl`, `active`, `updatedAt`. Keep activity-log + revalidate.
- `src/server/uploads.ts`: `"auth-slides"` folder already allowed; keep.

### Seed (`src/server/db/seed.ts`)
- `ensureAuthSlides()`: remove `eyebrow`/`title`/`description`/`sortOrder` from
  inserted values; insert only `imageUrl`, `active`.

---

## Task 2 — Public gallery (new `galleries` table)

### Schema (`src/server/db/schema.ts`)
```ts
export const galleries = createTable("galleries", {
  id: uuid("id").primaryKey().$defaultFn(() => generateId()),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```
- Add relations if `relations()` calls exist near other tables.

### Uploads (`src/server/uploads.ts`)
- Add `"galleries"` to the `saveUpload` folder union.

### Server actions (`src/server/actions/galleries.ts`)
- Mirror `auth-slides.ts` pattern: `createGalleryImage`, `updateGalleryImage`,
  `deleteGalleryImage`. `revalidatePath` for the dashboard + public gallery
  page, `updateTag("galleries")`.

### Queries (`src/features/galleries/queries.ts`)
- `listActiveGalleryImages()` (`"use cache"`, `cacheTag("galleries")`,
  `cacheLife("hours")`) ordered by `sortOrder`, `createdAt`. Returns
  `{ id, title, description, imageUrl }`.

### Dashboard admin
- New route `src/app/(dashboard)/dashboard/galleries/page.tsx` + components
  `gallery-form.tsx`, `gallery-grid.tsx`, `loading.tsx`, registered in
  `src/config/dashboard.ts` (mirror the `auth-slides` entry).
- Form: title, description (textarea), image upload (unlimited count — repeatable
  add or one-at-a-time create), active toggle. No per-image sort requirement from
  client, but keep `sortOrder` for stable ordering.

### Public page
- New public route, e.g. `src/app/(public)/gallery/page.tsx`, listing all
  active gallery images in a responsive grid (`Image` + title + description).
- Link it from the public nav/footer where appropriate (check
  `src/components/layout` nav config).

---

## Task 3 — Merch product gallery (max 3)

### Schema (`src/server/db/schema.ts`)
```ts
export const productGallery = createTable(
  "product_gallery",
  {
    id: uuid("id").primaryKey().$defaultFn(() => generateId()),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("gasak_product_gallery_product_idx").on(t.productId)],
);
```
- Add `productGallery` to `productRelations` as `many`.

### Server actions (`src/server/actions/shop.ts`)
- Add `setProductGallery(productId, images: { imageUrl, sortOrder }[])` that
  enforces a **max of 3** (slice/validate server-side) and replaces the set
  (delete existing + insert, or upsert). Reuse `saveUpload(..., "products")`.

### Queries
- In `getProduct` (`shop/[productId]/page.tsx`) add `with: { gallery: { orderBy: sortOrder } }`
  to include `productGallery` rows.

### Dashboard product form (`src/app/(dashboard)/dashboard/products/_components/product-form-page.tsx`)
- Add a "Gallery" `IndexedFormSection` with a repeatable image-upload field
  (max 3; disable add button at 3, show helper "Max 3 images"). On submit, call
  `setProductGallery(productId, ...)`.

### Public product page (`src/app/(public)/shop/[productId]/page.tsx`)
- Replace the single `BrandCard` image with a gallery: primary `products.imageUrl`
  + up to 3 `productGallery` images. Render as a thumbnail strip / clickable
  main+thumbs (or simple responsive grid). Keep `products.imageUrl` as the
  cover/fallback when gallery empty.

---

## Cross-cutting

- **Migrations:** no auto-migrate. Generate/author a manual SQL migration under
  `drizzle/` mirroring the schema diffs (drop columns on `auth_slides`; create
  `galleries`; create `product_gallery`). Apply via the project's migration flow.
- **Cache tags:** reuse existing `"auth-slides"` and add `"galleries"`; keep
  `"products"` for merch.
- **`generateId`/`uuid` helpers:** already imported in schema — reuse.

## Validation

- `npm run lint` and `npm run typecheck` pass after changes.
- Auth page (`/login`) on mobile + desktop widths shows a randomized image grid
  backdrop; no title/description; reload reshuffles.
- Dashboard auth-slides CRUD works without title/description/sort.
- `/dashboard/galleries` lets admin add unlimited images with title+description;
  public gallery page lists them.
- Merch product edit allows ≤3 gallery images; product detail page shows the
  gallery; attempting >3 is rejected server-side.

## Open questions / risks

- Exact public gallery route path & nav placement — confirm with client
  (default `/gallery`, linked from footer).
- Auth grid visual treatment: full-bleed backdrop behind the centered auth card
  vs. side panel on desktop. Plan assumes full-bleed backdrop on both, card
  overlaid. Adjust if client wants side-panel parity.
