# Inventory component

Reusable React product grid: load a catalog, search by name, sort, filter by category and sale, and keep the toolbar pinned while the list scrolls.

The catalog lives in a Zustand store. `products.db.table.ts` stands in for a products table. The UI is shadcn’s default theme — a right-side filter panel on desktop, a resizable filter split on mobile.

## Stack

- React 19 + TypeScript + Vite
- [shadcn/ui](https://ui.shadcn.com/) (Radix, Tailwind 4)
- Zustand (catalog + current view)
- GSAP (tile enter on scroll)
- Vitest

> This mockup is a Vite SPA

## Quick start

```sh
cd mockup-21826
bun install
bun run dev
```

Open the URL Vite prints. `bun run test` runs the inventory store tests. `bun run test:watch` reruns on save.

## How it works

```
Inventory  →  inventory.ts (catalog + view)  →  tiles + InventoryFilters
                  ↑
     products.db.table.ts (load)
```

1. **Catalog** — `data/products.db.table.ts` is the mock table (`id`, `name`, `price`, `description`, `category`, `discount`).
2. **Store** — `src/components/inventory/inventory.ts` keeps the full catalog and a derived `visible` list. Search, category, and in-sale filters compose, then the current sort is applied. The source array is not mutated.
3. **Grid** — `Inventory` calls `load()` on mount, renders `visible` as tiles, and wires search / sort. GSAP `ScrollTrigger` fades tiles in as they enter the product scroller.
4. **Filters** — `InventoryFilters` toggles in-sale (`discount > 0`) and categories. No selected category means every category.

Search, sort, and filters stay on screen. Only the product scroller moves. On mobile, drag the bar between filters and products to resize the split.

## Usage

Drop the grid once. It already loads the table.

```tsx
import { Inventory } from "./components/inventory/inventory.tsx"

<Inventory />
```

`Inventory` props:

| Prop        | Type     | Required | Role                          |
| ----------- | -------- | -------- | ----------------------------- |
| `className` | `string` | no       | Extra classes on the section  |

`InventoryFilters` is used inside `Inventory`. It can also be rendered on its own against the same store:

| Prop        | Type             | Required | Role                    |
| ----------- | ---------------- | -------- | ----------------------- |
| `className` | `string`         | no       | Extra classes on the aside |
| `style`     | `CSSProperties`  | no       | Inline styles (split height) |

The store is the public logic API:

| Export / action                         | Role |
| --------------------------------------- | ---- |
| `useInventory`                          | Zustand hook |
| `load(rows?)`                           | Replace the catalog (defaults to the table). Clears search, in-sale, and categories. Keeps sort. |
| `searchByName(query)`                   | Case-insensitive name substring |
| `sortByName(dir?)`                      | Name sort. Default `"asc"` (A–Z) |
| `sortByPrice(dir?)`                     | Price sort. Default `"desc"` (high–low) |
| `sortByDiscount(dir?)`                  | Discount sort. Default `"desc"` |
| `filterByCategory(name \| names)`       | Keep those categories. `[]` shows all |
| `setInSale(on)`                         | When `true`, keep only `discount > 0` |
| `getCategorys(dir?)`                    | Unique catalog categories. Default A–Z |
| `selectVisible`                         | Selector for `visible` |
| `selectCategorys(dir?)`                 | Selector for unique categories |

Read the current view with selectors so a sort does not re-render unrelated UI:

```tsx
import { useInventory, selectVisible } from "./components/inventory/inventory.ts"

const visible = useInventory(selectVisible)
useInventory.getState().searchByName("watch")
useInventory.getState().filterByCategory(["tech", "outdoor"])
useInventory.getState().setInSale(true)
```

## Data

There is no backend and no `localStorage`. Rows come from `data/products.db.table.ts`:

| Field         | Type     | Notes |
| ------------- | -------- | ----- |
| `id`          | `number` | Unique |
| `name`        | `string` | Search target |
| `price`       | `number` | List price |
| `description` | `string` | Stored, not shown on the tile |
| `category`    | `string` | Filter target |
| `discount`    | `number` | Percent off. `0` is full price |

Tiles show the sale price when `discount > 0`: `price * (1 - discount / 100)`.

Pass another array to `load(rows)` to swap the catalog.

## Layout

```
mockup-21826/
  src/
    components/inventory/
      inventory.ts            Zustand store
      inventory.tsx           grid, search, sort, scroll
      inventory-filters.tsx   in-sale + categories
    main.tsx                  demo page
  data/products.db.table.ts
  tests/                      Vitest coverage for inventory.ts
```

## Scripts

| Command              | What it does                 |
| -------------------- | ---------------------------- |
| `bun run dev`        | Dev server                   |
| `bun run test`       | Vitest once                  |
| `bun run test:watch` | Vitest in watch mode         |
| `bun run build`      | Typecheck + production build |
| `bun run lint`       | ESLint                       |
