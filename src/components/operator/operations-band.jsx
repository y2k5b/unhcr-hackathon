import { Download } from "lucide-react"
import { useStore } from "@/lib/store"
import { usd } from "@/lib/format"

export function OperationsBand() {
  const { cases, metadata, committedUsd, remainingUsd, exportDecisions } = useStore()
  const pending = cases.filter((c) => c.human_oversight.status === "PENDING").length
  const appeals = cases.filter((c) => c.human_oversight.appeal && c.human_oversight.status === "PENDING").length
  const decided = cases.length - pending
  const overrides = cases.filter((c) => {
    const h = c.human_oversight
    if (h.status === "PENDING") return false
    const ai = c.ai_assessment
    if (h.status === "APPROVED") return ai.recommended_action !== "APPROVE" || h.final_amount_usd !== ai.suggested_amount_usd
    if (h.status === "REJECTED") return ai.recommended_action !== "REJECT"
    return false
  }).length
  const requestedUsd = cases
    .filter((c) => c.human_oversight.status === "PENDING" && c.ai_assessment.recommended_action !== "REJECT")
    .reduce((s, c) => s + c.ai_assessment.suggested_amount_usd, 0)
  const committedPct = Math.min(100, (committedUsd / metadata.budget_total_usd) * 100)
  const requestedPct = Math.min(100 - committedPct, (requestedUsd / metadata.budget_total_usd) * 100)
  const overBudget = requestedUsd > remainingUsd

  return (
    <div className="flex items-center justify-between gap-6 border-b border-border bg-brand-deep px-4 py-3 text-sm text-white">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="font-bold">{metadata.cycle_id}</span>
          <span className="text-white/70">·</span>
          <span className="font-semibold">{metadata.cycle_name}</span>
        </div>

        <div className="hidden items-center gap-4 text-white/80 md:flex">
          <span className="font-mono">{cases.length} <span className="font-sans text-xs uppercase tracking-wide opacity-70">Total</span></span>
          <span className="text-white/30">|</span>
          <span className="font-mono text-brand-light">{pending} <span className="font-sans text-xs uppercase tracking-wide opacity-70">Pending</span></span>
          <span className="text-white/30">|</span>
          <span className="font-mono text-emerald-400">{decided} <span className="font-sans text-xs uppercase tracking-wide opacity-70">Decided</span></span>
          <span className="text-white/30">|</span>
          <span className="font-mono text-amber-400">{appeals} <span className="font-sans text-xs uppercase tracking-wide opacity-70">Appeals</span></span>
          <span className="text-white/30">|</span>
          <span className="font-mono text-purple-400">{overrides} <span className="font-sans text-xs uppercase tracking-wide opacity-70">Overrides</span></span>
        </div>
      </div>

      <div className="flex max-w-md flex-1 items-center justify-end gap-6">
        <div className="flex-1 max-w-[200px]">
          <div className="mb-1 flex justify-between font-mono text-xs">
            <span>{usd(committedUsd)} spent</span>
            <span className="text-white/50">{usd(metadata.budget_total_usd)}</span>
          </div>
          <div className="flex h-1.5 w-full overflow-hidden bg-white/10">
            <div className="h-full bg-emerald-400" style={{ width: `${committedPct}%` }} />
            {requestedPct > 0 && (
              <div
                className={`h-full opacity-60 ${overBudget ? "bg-destructive" : "bg-brand-light"}`}
                style={{ width: `${requestedPct}%` }}
              />
            )}
          </div>
        </div>
        <button
          onClick={exportDecisions}
          className="flex items-center gap-2 border border-white/20 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/10"
        >
          <Download className="size-3" />
          Export
        </button>
      </div>
    </div>
  )
}
