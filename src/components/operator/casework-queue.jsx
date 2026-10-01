import { useState } from "react"
import { Search, Users, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react"
import { getXaiExplanation } from "@/data/xai-decision-trees"

export function CaseworkQueue({ cases, activeCaseId, onSelectCase }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCamp, setSelectedCamp] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const camps = ["Kakuma", "Dadaab", "Kalobeyei"]

  const filteredCases = cases.filter((c) => {
    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const matchId = c.case_id.toLowerCase().includes(q)
      const matchName = c.demographics.name_hash.toLowerCase().includes(q)
      const matchOrigin = c.demographics.origin_country.toLowerCase().includes(q)
      if (!matchId && !matchName && !matchOrigin) return false
    }

    // Camp filter
    if (selectedCamp !== "all" && c.demographics.current_camp !== selectedCamp) {
      return false
    }

    // Status filter
    const status = c.human_oversight.status
    if (statusFilter === "pending" && status !== "PENDING") return false
    if (statusFilter === "approved" && status !== "APPROVED") return false
    if (statusFilter === "escalated" && status !== "ESCALATED") return false

    return true
  })

  return (
    <aside
      aria-label="Coda Pratiche CBI"
      className="flex flex-col bg-white border border-border shadow-xs h-full"
    >
      {/* Header & Search */}
      <div className="p-4 border-b border-border space-y-3 bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand">
            Registro Nuclei Familiari (CBI)
          </span>
          <span className="font-mono text-xs text-muted-foreground font-bold">
            {filteredCases.length} di {cases.length}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            placeholder="Cerca per ID, nome, origine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-border py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand"
          />
        </div>

        {/* Camp Filter */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
          <button
            type="button"
            onClick={() => setSelectedCamp("all")}
            className={`px-2 py-1 font-semibold transition-colors shrink-0 ${
              selectedCamp === "all"
                ? "bg-brand text-white"
                : "bg-white border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            Tutti i campi
          </button>
          {camps.map((camp) => (
            <button
              key={camp}
              type="button"
              onClick={() => setSelectedCamp(camp)}
              className={`px-2 py-1 font-semibold transition-colors shrink-0 ${
                selectedCamp === camp
                  ? "bg-brand text-white"
                  : "bg-white border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {camp}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
              statusFilter === "all" ? "text-brand border-b-2 border-brand" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Tutti
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
              statusFilter === "pending" ? "text-brand border-b-2 border-brand" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Da Convalidare
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
              statusFilter === "approved" ? "text-brand border-b-2 border-brand" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Convalidati
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("escalated")}
            className={`px-2 py-0.5 text-[10px] uppercase font-bold ${
              statusFilter === "escalated" ? "text-brand border-b-2 border-brand" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sospesi
          </button>
        </div>
      </div>

      {/* Case List */}
      <ul className="divide-y divide-border/70 overflow-y-auto flex-1 max-h-[calc(100vh-280px)]">
        {filteredCases.length === 0 ? (
          <li className="p-6 text-center text-xs text-muted-foreground">
            Nessuna pratica corrispondente ai filtri.
          </li>
        ) : (
          filteredCases.map((c) => {
            const isSelected = c.case_id === activeCaseId
            const h = c.human_oversight
            const ai = c.ai_assessment
            const xai = getXaiExplanation(c.case_id)

            return (
              <li key={c.case_id}>
                <button
                  type="button"
                  onClick={() => onSelectCase(c.case_id)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`w-full text-left p-3.5 transition-colors block cursor-pointer border-l-3 ${
                    isSelected
                      ? "border-l-brand bg-brand-soft/30 shadow-xs"
                      : "border-l-transparent hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {c.case_id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 ${
                        h.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : h.status === "ESCALATED"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-blue-100 text-brand"
                      }`}
                    >
                      {h.status === "APPROVED"
                        ? `Autorizzato $${h.final_amount_usd}`
                        : h.status === "ESCALATED"
                          ? "Sospeso"
                          : "In attesa"}
                    </span>
                  </div>

                  <div className="mt-1 text-xs font-bold text-foreground truncate">
                    {xai.familyTitle}
                  </div>

                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {c.demographics.origin_country} · {c.demographics.current_camp}
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-border/40">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="size-3 text-muted-foreground" aria-hidden="true" />
                      {c.demographics.family_size} persone
                    </span>
                    <span className="font-mono font-bold text-brand">
                      Proposta: ${ai.suggested_amount_usd}
                    </span>
                  </div>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </aside>
  )
}
