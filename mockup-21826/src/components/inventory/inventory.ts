import { create } from "zustand"
import { products as productTable, type product } from "../../../data/products.db.table.ts"

export type { product }

export type SortDir = "asc" | "desc"
export type SortKey = "name" | "price" | "discount"

type ViewFields = {
    products: product[]
    selectedCategorys: string[]
    sortKey: SortKey
    sortDir: SortDir
    search: string
    inSale: boolean
}

type InventoryState = ViewFields & {
    categorys: string[]
    visible: product[]
}

type InventoryActions = {
    load: (rows?: product[]) => void
    sortByName: (dir?: SortDir) => void
    sortByPrice: (dir?: SortDir) => void
    sortByDiscount: (dir?: SortDir) => void
    filterByCategory: (categorys: string | string[]) => void
    searchByName: (query: string) => void
    setInSale: (inSale: boolean) => void
    getCategorys: (dir?: SortDir) => string[]
}

export type InventoryStore = InventoryState & InventoryActions

const uniqueCategorys = (rows: product[], dir: SortDir = "asc"): string[] => {
    const categorys = [...new Set(rows.map((item) => item.category))]
    categorys.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    return dir === "desc" ? categorys.reverse() : categorys
}

const visibleProducts = ({
    products,
    selectedCategorys,
    sortKey,
    sortDir,
    search,
    inSale,
}: ViewFields): product[] => {
    const selected = new Set(selectedCategorys)
    const query = search.trim().toLowerCase()

    const filtered = products.filter((item) => {
        if (selected.size > 0 && !selected.has(item.category)) return false
        if (query && !item.name.toLowerCase().includes(query)) return false
        if (inSale && item.discount <= 0) return false
        return true
    })

    const direction = sortDir === "asc" ? 1 : -1

    return [...filtered].sort((a, b) => {
        if (sortKey === "name") {
            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) * direction
        }

        return (a[sortKey] - b[sortKey]) * direction
    })
}

const project = (fields: ViewFields): InventoryState => ({
    ...fields,
    categorys: uniqueCategorys(fields.products, "asc"),
    visible: visibleProducts(fields),
})

const snapshot = (state: InventoryStore): ViewFields => ({
    products: state.products,
    selectedCategorys: state.selectedCategorys,
    sortKey: state.sortKey,
    sortDir: state.sortDir,
    search: state.search,
    inSale: state.inSale,
})

export const useInventory = create<InventoryStore>()((set, get) => {
    const commit = (patch: Partial<ViewFields>) => {
        set(project({ ...snapshot(get()), ...patch }))
    }

    return {
        ...project({
            products: [],
            selectedCategorys: [],
            sortKey: "name",
            sortDir: "asc",
            search: "",
            inSale: false,
        }),

        load: (rows = productTable) => {
            commit({
                products: rows,
                selectedCategorys: [],
                search: "",
                inSale: false,
            })
        },

        sortByName: (dir = "asc") => {
            commit({ sortKey: "name", sortDir: dir })
        },

        sortByPrice: (dir = "desc") => {
            commit({ sortKey: "price", sortDir: dir })
        },

        sortByDiscount: (dir = "desc") => {
            commit({ sortKey: "discount", sortDir: dir })
        },

        filterByCategory: (categorys) => {
            commit({
                selectedCategorys: typeof categorys === "string" ? [categorys] : categorys,
            })
        },

        searchByName: (query) => {
            commit({ search: query })
        },

        setInSale: (inSale) => {
            commit({ inSale })
        },

        getCategorys: (dir = "asc") => {
            if (dir === "asc") return get().categorys
            return uniqueCategorys(get().products, dir)
        },
    }
})

export const selectVisible = (state: InventoryStore) => state.visible
export const selectCategorys = (dir: SortDir = "asc") => (state: InventoryStore) =>
    dir === "asc" ? state.categorys : uniqueCategorys(state.products, dir)
