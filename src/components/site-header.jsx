import { Link, useLocation } from "react-router-dom"
import { useStore } from "@/lib/store"
import { OPERATOR_ID } from "@/lib/format"
import { Shield, Calendar } from "lucide-react"

export function SiteHeader() {
  const { metadata } = useStore()
  const location = useLocation()
  const path = location.pathname

  const navItems = [
    { to: "/", label: "Valutazione Pratiche (CBI & XAI)", exact: true },
    { to: "/quadro", label: "Quadro Operativo Hub (Factsheet)" },
    { to: "/beneficiario", label: "Vista Informativa per il Rifugiato" },
  ]

  return (
    <header className="bg-white border-b border-border sticky top-0 z-30 shadow-xs">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        
        {/* Brand Logo & UNHCR Institutional Title */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3">
            {/* Official UNHCR Emblem SVG */}
            <svg className="h-9 w-9 text-brand flex-shrink-0" viewBox="0 0 100 100" fill="currentColor" aria-label="UNHCR Official Emblem">
              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4"/>
              <path d="M50 20 C42 20 36 26 36 34 C36 42 42 48 50 48 C58 48 64 42 64 34 C64 26 58 20 50 20 Z" />
              <path d="M30 76 C30 62 40 54 50 54 C60 54 70 62 70 76 Z" />
              <path d="M22 48 C20 58 24 68 32 75 C30 68 31 58 36 50 C30 48 25 48 22 48 Z" />
              <path d="M78 48 C80 58 76 68 68 75 C70 68 69 58 64 50 C70 48 75 48 78 48 Z" />
            </svg>
            <span className="flex flex-col border-l-2 border-border pl-3 leading-tight">
              <span className="text-lg font-extrabold text-brand tracking-tight">UNHCR</span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                The UN Refugee Agency · {metadata.operation || "Operazione Kenya"}
              </span>
            </span>
          </Link>

          {/* Clean Navigation Tabs */}
          <nav aria-label="Moduli operativi" className="hidden md:flex items-center gap-1 border-l border-border pl-4">
            {navItems.map((item) => {
              const isActive = item.exact ? path === item.to : path.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    isActive
                      ? "text-brand bg-brand-soft/40 border-b-2 border-brand"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Info: Operation Hub, Date & Active Operator */}
        <div className="flex items-center gap-4 text-xs">
          <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="size-3.5 text-brand" aria-hidden="true" />
            <span>29 Settembre 2026 · Nairobi (EAT)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block font-semibold text-brand-deep">
              Hub Kakuma & Dadaab
            </span>
            <span className="inline-flex items-center gap-1.5 bg-muted px-2.5 py-1 text-xs font-semibold text-foreground border border-border/80">
              <Shield className="size-3 text-brand" aria-hidden="true" />
              <span>Operatore #{OPERATOR_ID}</span>
            </span>
          </div>
        </div>

      </div>
    </header>
  )
}
