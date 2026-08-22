import { beforeEach, describe, expect, it } from "vitest"
import { products as productTable } from "../data/products.db.table.ts"
import {
    selectCategorys,
    selectVisible,
    useInventory,
    type product,
} from "../src/components/inventory/inventory.ts"

const makeCatalog = (): product[] => [
    { id: 1, name: "Beta Lamp", price: 40, description: "lamp", category: "home", discount: 10 },
    { id: 2, name: "alpha chair", price: 90, description: "chair", category: "home", discount: 0 },
    { id: 3, name: "Yoga Mat", price: 20, description: "mat", category: "sports", discount: 25 },
    { id: 4, name: "USB Hub", price: 20, description: "hub", category: "tech", discount: 25 },
    { id: 5, name: "Dark Chocolate", price: 16, description: "chocolate", category: "food", discount: 5 },
]

const names = (rows: product[]) => rows.map((item) => item.name)
const prices = (rows: product[]) => rows.map((item) => item.price)
const discounts = (rows: product[]) => rows.map((item) => item.discount)
const categorys = (rows: product[]) => rows.map((item) => item.category)

describe("useInventory", () => {
    beforeEach(() => {
        const { load, sortByName } = useInventory.getState()
        load(makeCatalog())
        sortByName("asc")
    })

    describe("load", () => {
        it("replaces the catalog with the given rows", () => {
            const rows = makeCatalog().slice(0, 2)

            useInventory.getState().load(rows)

            const state = useInventory.getState()
            expect(state.products).toEqual(rows)
            expect(state.visible).toHaveLength(2)
        })

        it("loads the product table when no rows are given", () => {
            useInventory.getState().load([])

            useInventory.getState().load()

            expect(useInventory.getState().products).toBe(productTable)
            expect(useInventory.getState().visible).toHaveLength(productTable.length)
        })

        it("loads an empty catalog", () => {
            useInventory.getState().load([])

            const state = useInventory.getState()
            expect(state.products).toEqual([])
            expect(state.visible).toEqual([])
        })

        it("clears the selected categories", () => {
            useInventory.getState().filterByCategory("tech")

            useInventory.getState().load(makeCatalog())

            expect(useInventory.getState().selectedCategorys).toEqual([])
            expect(useInventory.getState().visible).toHaveLength(5)
        })

        it("keeps the current sort", () => {
            useInventory.getState().sortByPrice()

            useInventory.getState().load(makeCatalog())

            expect(prices(useInventory.getState().visible)).toEqual([90, 40, 20, 20, 16])
        })

        it("clears search and the in-sale filter", () => {
            useInventory.getState().searchByName("lamp")
            useInventory.getState().setInSale(true)

            useInventory.getState().load(makeCatalog())

            const state = useInventory.getState()
            expect(state.search).toBe("")
            expect(state.inSale).toBe(false)
            expect(state.visible).toHaveLength(5)
        })
    })

    describe("sortByName", () => {
        it("sorts names A to Z by default", () => {
            useInventory.getState().sortByPrice()

            useInventory.getState().sortByName()

            expect(names(useInventory.getState().visible)).toEqual([
                "alpha chair",
                "Beta Lamp",
                "Dark Chocolate",
                "USB Hub",
                "Yoga Mat",
            ])
        })

        it("sorts names Z to A when dir is desc", () => {
            useInventory.getState().sortByName("desc")

            expect(names(useInventory.getState().visible)).toEqual([
                "Yoga Mat",
                "USB Hub",
                "Dark Chocolate",
                "Beta Lamp",
                "alpha chair",
            ])
        })

        it("does not change the catalog order", () => {
            const catalogIds = useInventory.getState().products.map((item) => item.id)

            useInventory.getState().sortByName("desc")

            expect(useInventory.getState().products.map((item) => item.id)).toEqual(catalogIds)
        })
    })

    describe("sortByPrice", () => {
        it("sorts price high to low by default", () => {
            useInventory.getState().sortByPrice()

            expect(prices(useInventory.getState().visible)).toEqual([90, 40, 20, 20, 16])
        })

        it("sorts price low to high when dir is asc", () => {
            useInventory.getState().sortByPrice("asc")

            expect(prices(useInventory.getState().visible)).toEqual([16, 20, 20, 40, 90])
        })
    })

    describe("sortByDiscount", () => {
        it("sorts discount high to low by default", () => {
            useInventory.getState().sortByDiscount()

            expect(discounts(useInventory.getState().visible)).toEqual([25, 25, 10, 5, 0])
        })

        it("sorts discount low to high when dir is asc", () => {
            useInventory.getState().sortByDiscount("asc")

            expect(discounts(useInventory.getState().visible)).toEqual([0, 5, 10, 25, 25])
        })
    })

    describe("filterByCategory", () => {
        it("keeps products in a single selected category", () => {
            useInventory.getState().filterByCategory("home")

            const visible = useInventory.getState().visible
            expect(categorys(visible)).toEqual(["home", "home"])
            expect(names(visible)).toEqual(["alpha chair", "Beta Lamp"])
        })

        it("keeps products in any of the selected categories", () => {
            useInventory.getState().filterByCategory(["sports", "tech"])

            expect(new Set(categorys(useInventory.getState().visible))).toEqual(new Set(["sports", "tech"]))
            expect(useInventory.getState().visible).toHaveLength(2)
        })

        it("shows the full catalog when the selection is empty", () => {
            useInventory.getState().filterByCategory("food")

            useInventory.getState().filterByCategory([])

            expect(useInventory.getState().visible).toHaveLength(5)
            expect(useInventory.getState().selectedCategorys).toEqual([])
        })

        it("shows no products when the category is missing", () => {
            useInventory.getState().filterByCategory("garden")

            expect(useInventory.getState().visible).toEqual([])
            expect(useInventory.getState().products).toHaveLength(5)
        })

        it("keeps the current sort on the filtered view", () => {
            useInventory.getState().sortByPrice()

            useInventory.getState().filterByCategory("home")

            expect(names(useInventory.getState().visible)).toEqual(["alpha chair", "Beta Lamp"])
            expect(prices(useInventory.getState().visible)).toEqual([90, 40])
        })
    })

    describe("searchByName", () => {
        it("keeps products whose name contains the query", () => {
            useInventory.getState().searchByName("lamp")

            expect(names(useInventory.getState().visible)).toEqual(["Beta Lamp"])
            expect(useInventory.getState().search).toBe("lamp")
        })

        it("matches names without regard to case", () => {
            useInventory.getState().searchByName("HUB")

            expect(names(useInventory.getState().visible)).toEqual(["USB Hub"])
        })

        it("shows the full catalog when the query is blank", () => {
            useInventory.getState().searchByName("lamp")

            useInventory.getState().searchByName("   ")

            expect(useInventory.getState().visible).toHaveLength(5)
        })

        it("shows no products when nothing matches", () => {
            useInventory.getState().searchByName("zzzz")

            expect(useInventory.getState().visible).toEqual([])
            expect(useInventory.getState().products).toHaveLength(5)
        })

        it("applies search on top of the selected categories", () => {
            useInventory.getState().filterByCategory("home")

            useInventory.getState().searchByName("chair")

            expect(names(useInventory.getState().visible)).toEqual(["alpha chair"])
        })
    })

    describe("setInSale", () => {
        it("keeps only products with a discount", () => {
            useInventory.getState().setInSale(true)

            expect(useInventory.getState().inSale).toBe(true)
            expect(names(useInventory.getState().visible)).toEqual([
                "Beta Lamp",
                "Dark Chocolate",
                "USB Hub",
                "Yoga Mat",
            ])
        })

        it("shows the full catalog when in-sale is turned off", () => {
            useInventory.getState().setInSale(true)

            useInventory.getState().setInSale(false)

            expect(useInventory.getState().inSale).toBe(false)
            expect(useInventory.getState().visible).toHaveLength(5)
        })

        it("applies in-sale on top of search", () => {
            useInventory.getState().searchByName("a")
            useInventory.getState().setInSale(true)

            expect(names(useInventory.getState().visible)).toEqual([
                "Beta Lamp",
                "Dark Chocolate",
                "Yoga Mat",
            ])
        })
    })

    describe("getCategorys", () => {
        it("returns unique catalog categories A to Z by default", () => {
            useInventory.getState().filterByCategory("tech")

            expect(useInventory.getState().getCategorys()).toEqual(["food", "home", "sports", "tech"])
        })

        it("returns unique catalog categories Z to A when dir is desc", () => {
            expect(useInventory.getState().getCategorys("desc")).toEqual(["tech", "sports", "home", "food"])
        })

        it("returns an empty list when the catalog is empty", () => {
            useInventory.getState().load([])

            expect(useInventory.getState().getCategorys()).toEqual([])
        })
    })

    describe("selectors", () => {
        it("selectVisible returns the current view", () => {
            useInventory.getState().sortByPrice()
            const state = useInventory.getState()

            expect(selectVisible(state)).toBe(state.visible)
            expect(prices(selectVisible(state))).toEqual([90, 40, 20, 20, 16])
        })

        it("selectCategorys returns unique catalog categories in the given direction", () => {
            useInventory.getState().filterByCategory("food")
            const state = useInventory.getState()

            expect(selectCategorys()(state)).toEqual(["food", "home", "sports", "tech"])
            expect(selectCategorys("desc")(state)).toEqual(["tech", "sports", "home", "food"])
        })
    })
})
