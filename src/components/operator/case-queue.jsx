import { AlertTriangle, MessageSquareWarning, Search } from "lucide-react"
import { ACTION_LABELS, STATUS_LABELS, FILTERS, matchesFilter } from "@/lib/format"
import { cn } from "@/lib/utils"

export function CaseQueue(props) {
  const camps = Array.from(new Set(props.allCases.map((c) => c.demographics.current_camp)))

  return (
    <aside
      aria-label="Coda di lavoro"
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] shadow-sm"
    >
      <div className="space-y-3 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Coda di lavoro</h2>
          <span className="text-xs text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1 font-mono">J</kbd>{" "}
            <kbd className="rounded border border-border bg-muted px-1 font-mono">K</kbd> per navigare
          </span>
        </div>
        <label className="relative block">
          <span className="sr-only">Cerca per ID o hash</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            placeholder="Cerca per ID o hash…"
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtra per stato">
          {FILTERS.map((f) => {
            const count = props.allCases.filter((c) => matchesFilter(c, f.id)).length
            const active = props.filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => props.onFilterChange(f.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                  active ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-brand-soft hover:text-brand-deep",
                )}
              >
                {f.label} <span className="font-mono opacity-80">{count}</span>
              </button>
            )
          })}
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          Campo
          <select
            value={props.camp}
            onChange={(e) => props.onCampChange(e.target.value)}
            className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm font-semibold text-foreground outline-none"
          >
            <option value="all">Tutti i campi</option>
            {camps.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="flex-1 divide-y divide-border overflow-y-auto max-h-[600px] lg:max-h-none">
        {props.visibleCases.length === 0 ? (
          <li className="p-6 text-center text-sm text-muted-foreground">Nessuna pratica con questi filtri.</li>
        ) : (
          props.visibleCases.map((c) => (
            <li key={c.case_id}>
              <QueueItem c={c} selected={c.case_id === props.selectedId} onSelect={props.onSelect} />
            </li>
          ))
        )}
      </ul>
    </aside>
  )
}

function QueueItem({ c, selected, onSelect }) {
  const h = c.human_oversight
  const ai = c.ai_assessment
  const open = h.status === "PENDING"
  const hasWarning = c.xai_explanation.data_quality_flags.some((f) => f.severity !== "info")

  return (
    <button
      type="button"
      onClick={() => onSelect(c.case_id)}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "w-full border-l-4 p-4 text-left transition-colors",
        selected ? "border-l-brand bg-brand-soft" : "border-l-transparent hover:bg-muted",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("font-extrabold", selected ? "text-brand" : "text-foreground")}>{c.case_id}</span>
        {open ? (
          <span
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              ai.recommended_action === "APPROVE" && "bg-brand text-white",
              ai.recommended_action === "REJECT" && "bg-ink text-white",
              ai.recommended_action === "REVIEW" && "bg-highlight text-ink",
            )}
          >
            IA: {ACTION_LABELS[ai.recommended_action]}
          </span>
        ) : (
          <span
            className={cn(
              "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              h.status === "APPROVED" && "bg-emerald-100 text-emerald-800",
              h.status === "REJECTED" && "bg-red-100 text-red-800",
              h.status === "ESCALATED" && "bg-muted text-muted-foreground",
            )}
          >
            {STATUS_LABELS[h.status]}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs font-semibold text-muted-foreground">
        {c.demographics.name_hash} · {c.demographics.current_camp} · {c.demographics.family_size} persone
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Priorità vulnerabilità:</span>
        <span className="font-semibold text-brand-deep">Alta (Livello 1)</span>
      </div>
      {(h.appeal && open) || hasWarning ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {h.appeal && open ? (
            <span className="flex items-center gap-1 rounded bg-highlight px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink">
              <MessageSquareWarning className="size-3" aria-hidden="true" /> Ricorso
            </span>
          ) : null}
          {hasWarning ? (
            <span className="flex items-center gap-1 rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-orange-800">
              <AlertTriangle className="size-3" aria-hidden="true" /> Anomalia dati
            </span>
          ) : null}
        </div>
      ) : null}
    </button>
  )
}
