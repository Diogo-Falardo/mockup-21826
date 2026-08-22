import type { CSSProperties } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { selectCategorys, useInventory } from "./inventory.ts"

const selectCategorysAsc = selectCategorys("asc")

export function InventoryFilters({
  className,
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  const categorys = useInventory(selectCategorysAsc)
  const selectedCategorys = useInventory((state) => state.selectedCategorys)
  const inSale = useInventory((state) => state.inSale)
  const setInSale = useInventory((state) => state.setInSale)
  const filterByCategory = useInventory((state) => state.filterByCategory)

  const toggleCategory = (category: string) => {
    const next = selectedCategorys.includes(category)
      ? selectedCategorys.filter((item) => item !== category)
      : [...selectedCategorys, category]
    filterByCategory(next)
  }

  return (
    <aside
      data-slot="inventory-filters"
      aria-label="Product filters"
      style={style}
      className={cn(
        "flex w-full shrink-0 flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 text-card-foreground md:w-64 md:gap-4 md:p-4",
        className,
      )}
    >
      <div
        data-slot="inventory-filters-sale"
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/60"
      >
        <Checkbox
          id="inventory-in-sale"
          checked={inSale}
          onCheckedChange={(checked) => setInSale(checked === true)}
        />
        <Label htmlFor="inventory-in-sale" className="cursor-pointer text-base font-medium">
          In Sale
        </Label>
      </div>

      <div
        data-slot="inventory-filters-categorys"
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border md:flex-none"
      >
        <p className="border-b border-border px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Categorys
        </p>
        {categorys.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">No categorys to be displayed</p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain md:flex-none md:max-h-[min(24rem,calc(100dvh-14rem))]">
            <ul className="flex flex-col gap-1 p-2">
              {categorys.map((category) => {
                const checked = selectedCategorys.includes(category)
                const id = `inventory-category-${category}`
                return (
                  <li key={category}>
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60",
                        checked && "bg-muted",
                      )}
                    >
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <Label htmlFor={id} className="cursor-pointer text-sm font-normal capitalize">
                        {category}
                      </Label>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </aside>
  )
}
