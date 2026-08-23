import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { InventoryFilters } from "./inventory-filters.tsx"
import {
  selectVisible,
  useInventory,
  type product,
  type SortDir,
  type SortKey,
} from "./inventory.ts"

gsap.registerPlugin(ScrollTrigger)

const formatPrice = (value: number) => `$${value.toFixed(2)}`

const salePrice = (item: product) =>
  item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price

function sortLabel(key: SortKey, dir: SortDir) {
  if (key === "price") {
    return dir === "desc" ? "Sort by price high-low" : "Sort by price low-high"
  }
  return dir === "asc" ? "Sort by name a-z" : "Sort by name z-a"
}

function ProductTile({ item }: { item: product }) {
  const onSale = item.discount > 0

  return (
    <article
      data-slot="inventory-tile"
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground transition-colors duration-150 hover:border-foreground/20 hover:bg-muted/30"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {onSale ? (
          <span className="absolute top-2 right-2 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-medium text-primary-foreground">
            -{item.discount}%
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h2 className="line-clamp-2 text-sm font-medium leading-snug">{item.name}</h2>
        <p className="text-xs capitalize text-muted-foreground">{item.category}</p>
        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-2">
          {onSale ? (
            <>
              <span className="text-sm font-medium">{formatPrice(salePrice(item))}</span>
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(item.price)}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium">{formatPrice(item.price)}</span>
          )}
        </div>
      </div>
    </article>
  )
}

const MOBILE_QUERY = "(max-width: 767px)"
const FILTER_MIN = 88
const FILTER_PRODUCT_MIN = 140
const FILTER_DEFAULT_RATIO = 0.34

function clampFilterHeight(height: number, bodyHeight: number) {
  const max = Math.max(FILTER_MIN, bodyHeight - FILTER_PRODUCT_MIN)
  return Math.min(max, Math.max(FILTER_MIN, height))
}

function useMobileSplit() {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | null>(null)
  const drag = useRef<{ startY: number; startHeight: number } | null>(null)

  const measureBody = useCallback(() => bodyRef.current?.clientHeight ?? 0, [])

  const applyHeight = useCallback(
    (next: number) => {
      const bodyHeight = measureBody()
      if (bodyHeight <= 0) return
      setHeight(clampFilterHeight(next, bodyHeight))
    },
    [measureBody],
  )

  useLayoutEffect(() => {
    const bodyHeight = measureBody()
    if (bodyHeight <= 0) return
    setHeight((current) =>
      clampFilterHeight(current ?? Math.round(bodyHeight * FILTER_DEFAULT_RATIO), bodyHeight),
    )
  }, [measureBody])

  useEffect(() => {
    const sync = () => {
      const bodyHeight = measureBody()
      if (bodyHeight <= 0) return
      setHeight((current) =>
        clampFilterHeight(current ?? Math.round(bodyHeight * FILTER_DEFAULT_RATIO), bodyHeight),
      )
      ScrollTrigger.refresh()
    }

    const media = window.matchMedia(MOBILE_QUERY)
    window.addEventListener("resize", sync)
    window.visualViewport?.addEventListener("resize", sync)
    media.addEventListener("change", sync)
    return () => {
      window.removeEventListener("resize", sync)
      window.visualViewport?.removeEventListener("resize", sync)
      media.removeEventListener("change", sync)
    }
  }, [measureBody])

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!window.matchMedia(MOBILE_QUERY).matches) return
    event.preventDefault()
    drag.current = {
      startY: event.clientY,
      startHeight: height ?? measureBody() * FILTER_DEFAULT_RATIO,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return
    applyHeight(drag.current.startHeight + (event.clientY - drag.current.startY))
  }

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    ScrollTrigger.refresh()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault()
      applyHeight((height ?? 0) - 24)
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      applyHeight((height ?? 0) + 24)
    }
    if (event.key === "Home") {
      event.preventDefault()
      applyHeight(FILTER_MIN)
    }
    if (event.key === "End") {
      event.preventDefault()
      applyHeight(measureBody())
    }
  }

  const reset = () => {
    applyHeight(Math.round(measureBody() * FILTER_DEFAULT_RATIO))
    ScrollTrigger.refresh()
  }

  const bodyHeight = measureBody()
  const max = Math.max(FILTER_MIN, bodyHeight - FILTER_PRODUCT_MIN)

  return {
    bodyRef,
    height,
    max,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onKeyDown,
    reset,
  }
}

function useProductScroll(visibleCount: number, signature: string) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const scroller = scrollerRef.current
    const grid = gridRef.current
    if (!scroller || !grid || visibleCount === 0) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const tiles = grid.querySelectorAll<HTMLElement>("[data-slot=inventory-tile]")
    if (tiles.length === 0) return

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.fromTo(tiles, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, stagger: 0 })
        return
      }

      gsap.set(tiles, { autoAlpha: 0, y: 16 })

      ScrollTrigger.batch(tiles, {
        scroller,
        start: "top 94%",
        once: true,
        batchMax: 8,
        onEnter: (batch) => {
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.32,
            ease: "power2.out",
            stagger: 0.04,
            overwrite: true,
            clearProps: "transform",
          })
        },
      })
    }, grid)

    ScrollTrigger.refresh()

    return () => {
      ctx.revert()
    }
  }, [visibleCount, signature])

  return { scrollerRef, gridRef }
}

export function Inventory({
  array,
  className,
}: {
  array: product[]
  className?: string
}) {
  const visible = useInventory(selectVisible)
  const search = useInventory((state) => state.search)
  const sortKey = useInventory((state) => state.sortKey)
  const sortDir = useInventory((state) => state.sortDir)
  const searchByName = useInventory((state) => state.searchByName)
  const sortByName = useInventory((state) => state.sortByName)
  const sortByPrice = useInventory((state) => state.sortByPrice)
  const load = useInventory((state) => state.load)
  const signature = visible.map((item) => item.id).join(",")
  const { scrollerRef, gridRef } = useProductScroll(visible.length, signature)
  const split = useMobileSplit()

  useLayoutEffect(() => {
    load(array)
  }, [array, load])

  useLayoutEffect(() => {
    ScrollTrigger.refresh()
  }, [split.height])

  const onSortPrice = () => {
    if (sortKey === "price") {
      sortByPrice(sortDir === "desc" ? "asc" : "desc")
      return
    }
    sortByPrice()
  }

  const onSortName = () => {
    if (sortKey === "name") {
      sortByName(sortDir === "asc" ? "desc" : "asc")
      return
    }
    sortByName()
  }

  return (
    <section
      data-slot="inventory"
      className={cn(
        "mx-auto flex h-dvh w-full max-w-6xl flex-col overflow-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6",
        className,
      )}
    >
      <header
        data-slot="inventory-toolbar"
        className="z-10 flex shrink-0 flex-col gap-2 bg-background pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
      >
        <form
          className="relative w-full max-w-md"
          onSubmit={(event) => event.preventDefault()}
          role="search"
        >
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            data-slot="inventory-search"
            name="search"
            type="search"
            value={search}
            aria-label="Search products by name"
            placeholder="Search by name"
            className="h-10 rounded-xl pl-8"
            onChange={(event) => searchByName(event.target.value)}
          />
        </form>

        <div data-slot="inventory-sort" className="flex flex-row flex-wrap items-center justify-end gap-2 sm:flex-col sm:items-end sm:gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={sortKey === "price"}
            className={cn(
              "h-auto px-2 py-0.5 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground",
              sortKey === "price" && "font-medium text-foreground",
            )}
            onClick={onSortPrice}
          >
            {sortKey === "price" ? sortLabel("price", sortDir) : "Sort by price high-low"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-pressed={sortKey === "name"}
            className={cn(
              "h-auto px-2 py-0.5 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground",
              sortKey === "name" && "font-medium text-foreground",
            )}
            onClick={onSortName}
          >
            {sortKey === "name" ? sortLabel("name", sortDir) : "Sort by name a-z"}
          </Button>
        </div>
      </header>

      <div
        ref={split.bodyRef}
        className="flex min-h-0 flex-1 flex-col md:flex-row-reverse md:items-start md:gap-4"
      >
        <InventoryFilters
          className="h-[var(--inventory-filter-h,34%)] md:!h-auto"
          style={
            split.height
              ? ({ "--inventory-filter-h": `${split.height}px` } as CSSProperties)
              : undefined
          }
        />

        <button
          type="button"
          data-slot="inventory-resize"
          aria-label="Resize filters"
          aria-orientation="horizontal"
          aria-valuemin={FILTER_MIN}
          aria-valuemax={split.max}
          aria-valuenow={Math.round(split.height ?? FILTER_MIN)}
          className="flex h-5 w-full shrink-0 cursor-row-resize touch-none items-center justify-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
          onPointerDown={split.onPointerDown}
          onPointerMove={split.onPointerMove}
          onPointerUp={split.onPointerUp}
          onPointerCancel={split.onPointerUp}
          onKeyDown={split.onKeyDown}
          onDoubleClick={split.reset}
        >
          <span className="h-1 w-12 rounded-full bg-border transition-colors" />
        </button>

        <div
          ref={scrollerRef}
          data-slot="inventory-scroller"
          className="min-h-0 flex-1 self-stretch overflow-y-auto overscroll-contain"
        >
          <p className="mb-3 text-xs text-muted-foreground">
            {visible.length} {visible.length === 1 ? "product" : "products"}
          </p>
          {visible.length === 0 ? (
            <p
              data-slot="inventory-empty"
              className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-sm text-muted-foreground"
            >
              No products match these filters.
            </p>
          ) : (
            <div
              ref={gridRef}
              data-slot="inventory-grid"
              className="grid grid-cols-1 gap-4 pb-2 sm:grid-cols-2"
            >
              {visible.map((item) => (
                <ProductTile key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
