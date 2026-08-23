# Inventory component

Reusable React product grid: pass in an array of products, then search by name, sort, and filter by category and sale, with the toolbar pinned while the list scrolls.

The catalog lives in a Zustand store. Pass the rows as `array` — `products.db.table.ts` is the demo table. The UI is shadcn’s default theme — a right-side filter panel on desktop, a resizable filter split on mobile.

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
<Inventory array={products} />  →  inventory.ts (catalog + view)  →  tiles + InventoryFilters
```

1. **Catalog** — The parent passes `array`. Each row is `id`, `name`, `price`, `description`, `category`, `discount`. The demo uses `data/products.db.table.ts`.
2. **Store** — `src/components/inventory/inventory.ts` keeps that catalog and a derived `visible` list. Search, category, and in-sale filters compose, then the current sort is applied. The source array is not mutated.
3. **Grid** — `Inventory` calls `load(array)` when `array` changes, renders `visible` as tiles, and wires search / sort. GSAP `ScrollTrigger` fades tiles in as they enter the product scroller.
4. **Filters** — `InventoryFilters` toggles in-sale (`discount > 0`) and categories. No selected category means every category.

Search, sort, and filters stay on screen. Only the product scroller moves. On mobile, drag the bar between filters and products to resize the split.

## Usage

Pass the product rows in. The demo page does this with the mock table:

```tsx
import { Inventory } from "./components/inventory/inventory.tsx"
import { products } from "../data/products.db.table.ts"

<Inventory array={products} />
```

`Inventory` props:

| Prop        | Type         | Required | Role |
| ----------- | ------------ | -------- | ---- |
| `array`     | `product[]`  | yes      | Catalog to display. Reloading a new array clears search, in-sale, and categories, and keeps the current sort. |
| `className` | `string`     | no       | Extra classes on the section |

`InventoryFilters` is used inside `Inventory`. It can also be rendered on its own against the same store:

| Prop        | Type             | Required | Role                    |
| ----------- | ---------------- | -------- | ----------------------- |
| `className` | `string`         | no       | Extra classes on the aside |
| `style`     | `CSSProperties`  | no       | Inline styles (split height) |

The store is the public logic API:

| Export / action                         | Role |
| --------------------------------------- | ---- |
| `useInventory`                          | Zustand hook |
| `load(rows?)`                           | Replace the catalog (defaults to `data/products.db.table.ts`). Clears search, in-sale, and categories. Keeps sort. |
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

There is no backend and no `localStorage`. Pass any `product[]`. The demo rows are in `data/products.db.table.ts`:

| Field         | Type     | Notes |
| ------------- | -------- | ----- |
| `id`          | `number` | Unique |
| `name`        | `string` | Search target |
| `price`       | `number` | List price |
| `description` | `string` | Stored, not shown on the tile |
| `category`    | `string` | Filter target |
| `discount`    | `number` | Percent off. `0` is full price |

Tiles show the sale price when `discount > 0`: `price * (1 - discount / 100)`.

Swap the catalog by passing a different `array` (or calling `load(rows)`). Keep the `array` reference stable so filters are not cleared on every render.

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
