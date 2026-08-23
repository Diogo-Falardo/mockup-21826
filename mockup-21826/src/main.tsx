import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { products } from "../data/products.db.table.ts"
import { Inventory } from "./components/inventory/inventory.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Inventory array={products} />
  </StrictMode>,
)
