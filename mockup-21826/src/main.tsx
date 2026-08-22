import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { Inventory } from "./components/inventory/inventory.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Inventory />
  </StrictMode>,
)
