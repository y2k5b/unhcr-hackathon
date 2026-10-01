import { useStore } from "@/lib/store"
import { usd } from "@/lib/format"
import { Download } from "lucide-react"

export function FactsheetBanner() {
  const { cases, metadata, committedUsd, exportDecisions } = useStore()

  const pendingCount = cases.filter((c) => c.human_oversight.status === "PENDING").length
  const approvedCount = cases.filter((c) => c.human_oversight.status === "APPROVED").length
  const escalatedCount = cases.filter((c) => c.human_oversight.status === "ESCALATED").length

  const budgetTotal = metadata.budget_total_usd || 4200
  const committedPct = Math.min(100, Math.round((committedUsd / budgetTotal) * 100))

  return (
    <section
      aria-label="Quadro Operativo del Ciclo CBI"
      className="bg-white border border-border p-4 sm:p-5 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand block">
            UNHCR KENYA · COORDINAMENTO OPERATIVO CBI
          </span>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Valutazione e Determinazione Sussidi Cash (Ciclo Ottobre 2026)
          </h1>
        </div>

        <button
          type="button"
          onClick={exportDecisions}
          className="inline-flex items-center gap-1.5 border border-border bg-white hover:bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors cursor-pointer"
        >
          <Download className="size-3.5 text-brand" aria-hidden="true" />
          Esporta Verbale Decisioni (JSON/proGres)
        </button>
      </div>

      {/* Real Humanitarian Factsheet Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        
        {/* Metric 1: Active Cases */}
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">
            Fascicoli nel Ciclo
          </span>
          <div className="text-2xl sm:text-3xl font-black text-brand tracking-tight">
            {cases.length} <span className="text-xs font-semibold text-muted-foreground">nuclei</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            <strong className="text-foreground">{pendingCount}</strong> in attesa · <span className="text-emerald-700 font-semibold">{approvedCount}</span> autorizzati
          </div>
        </div>

        {/* Metric 2: Budget Allocated */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-muted-foreground uppercase tracking-wide">
              Fondo Stanziato
            </span>
            <span className="font-mono font-bold text-brand">
              {committedPct}%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {usd(committedUsd)} <span className="text-xs font-normal text-muted-foreground">/ {usd(budgetTotal)}</span>
          </div>
          {/* Linear Progress Bar */}
          <div className="w-full bg-muted h-1.5 overflow-hidden">
            <div
              className="bg-brand h-full transition-all duration-300"
              style={{ width: `${committedPct}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Protection Verification */}
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">
            Segnalazioni Protezione
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
            {escalatedCount} <span className="text-xs font-semibold text-muted-foreground">sospese</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Casi inviati all&apos;approfondimento del Child Protection Team
          </div>
        </div>

        {/* Metric 4: MEB Basket Standard */}
        <div className="space-y-0.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide block">
            Copertura Fabbisogno MEB
          </span>
          <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            84% <span className="text-xs font-semibold text-emerald-700">target raggiunto</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Parametrato sul paniere alimentare e igienico Turkana West
          </div>
        </div>

      </div>
    </section>
  )
}
