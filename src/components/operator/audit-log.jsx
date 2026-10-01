import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

export function AuditLog({ entries }) {
  const ordered = [...entries].reverse()
  return (
    <ol className="relative space-y-4 border-l-2 border-border pl-5">
      {ordered.map((e, i) => {
        const isModel = e.actor.startsWith("Modello")
        const isBeneficiary = e.actor === "Beneficiario"
        return (
          <li key={`${e.timestamp}-${i}`} className="relative">
            <span
              aria-hidden="true"
              className={cn(
                "absolute -left-[27px] top-1 size-3 rounded-full border-2 border-card",
                isModel ? "bg-muted-foreground" : isBeneficiary ? "bg-highlight" : "bg-brand",
              )}
            />
            <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-bold">{e.action}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-mono">{e.actor}</span> · {formatDateTime(e.timestamp)}
            </div>
            {e.note ? <p className="mt-1 text-sm italic text-muted-foreground">{`"${e.note}"`}</p> : null}
          </li>
        )
      })}
    </ol>
  )
}
