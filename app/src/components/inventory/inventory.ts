import { create } from "zustand"
import { products as productTable, type product } from "../../../data/products.db.table.ts"

export type { product }

export type SortDir = "asc" | "desc"
export type SortKey = "name" | "price" | "discount"

type InventoryState = {
    products: product[]
    visible: product[]
    selectedCategorys: string[]
    sortKey: SortKey
    sortDir: SortDir
}

type InventoryActions = {
    load: (rows?: product[]) => void
    sortByName: (dir?: SortDir) => void
    sortByPrice: (dir?: SortDir) => void
    sortByDiscount: (dir?: SortDir) => void
    filterByCategory: (categorys: string | string[]) => void
    getCategorys: (dir?: SortDir) => string[]
}

export type InventoryStore = InventoryState & InventoryActions

const uniqueCategorys = (rows: product[], dir: SortDir = "asc"): string[] => {
    const categorys = [...new Set(rows.map((item) => item.category))]
    categorys.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    return dir === "desc" ? categorys.reverse() : categorys
}

const visibleProducts = (
    rows: product[],
    selectedCategorys: string[],
    sortKey: SortKey,
    sortDir: SortDir,
): product[] => {
    const selected = new Set(selectedCategorys)
    const filtered = selected.size === 0
        ? rows
        : rows.filter((item) => selected.has(item.category))

    const direction = sortDir === "asc" ? 1 : -1

    return [...filtered].sort((a, b) => {
        if (sortKey === "name") {
            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) * direction
        }

        return (a[sortKey] - b[sortKey]) * direction
    })
}

const view = (
    products: product[],
    selectedCategorys: string[],
    sortKey: SortKey,
    sortDir: SortDir,
): Pick<InventoryState, "products" | "visible" | "selectedCategorys" | "sortKey" | "sortDir"> => ({
    products,
    selectedCategorys,
    sortKey,
    sortDir,
    visible: visibleProducts(products, selectedCategorys, sortKey, sortDir),
})

export const useInventory = create<InventoryStore>()((set, get) => ({
    ...view(productTable, [], "name", "asc"),

    load: (rows = productTable) => {
        const { sortKey, sortDir } = get()
        set(view(rows, [], sortKey, sortDir))
    },

    sortByName: (dir = "asc") => {
        const { products, selectedCategorys } = get()
        set(view(products, selectedCategorys, "name", dir))
    },

    sortByPrice: (dir = "desc") => {
        const { products, selectedCategorys } = get()
        set(view(products, selectedCategorys, "price", dir))
    },

    sortByDiscount: (dir = "desc") => {
        const { products, selectedCategorys } = get()
        set(view(products, selectedCategorys, "discount", dir))
    },

    filterByCategory: (categorys) => {
        const { products, sortKey, sortDir } = get()
        const selectedCategorys = typeof categorys === "string" ? [categorys] : categorys
        set(view(products, selectedCategorys, sortKey, sortDir))
    },

    getCategorys: (dir = "asc") => uniqueCategorys(get().products, dir),
}))

export const selectVisible = (state: InventoryStore) => state.visible
export const selectCategorys = (dir: SortDir = "asc") => (state: InventoryStore) =>
    uniqueCategorys(state.products, dir)
