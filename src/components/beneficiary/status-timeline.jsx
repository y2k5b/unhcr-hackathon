import { Check, X } from "lucide-react"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function StatusTimeline({ status, lang }) {
  const reviewDone = status === "APPROVED" || status === "REJECTED"
  const steps = [
    { key: "step_registered", state: "done" },
    { key: "step_ai", state: "done" },
    { key: "step_human", state: reviewDone ? "done" : "active" },
    {
      key: status === "REJECTED" ? "step_not_paid" : "step_payout",
      state: status === "APPROVED" ? "active" : status === "REJECTED" ? "stopped" : "todo",
    },
  ]

  return (
    <section className="rounded-2xl bg-card p-4 shadow-sm border border-border/50">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-brand">{t("steps_title", lang)}</h2>
      <ol className="space-y-0">
        {steps.map((s, i) => (
          <li key={s.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                  s.state === "done" && "border-brand bg-brand text-white",
                  s.state === "active" && "border-brand bg-highlight text-ink",
                  s.state === "todo" && "border-border bg-card text-muted-foreground",
                  s.state === "stopped" && "border-ink bg-ink text-white",
                )}
              >
                {s.state === "done" ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : s.state === "stopped" ? (
                  <X className="size-4" aria-hidden="true" />
                ) : (
                  i + 1
                )}
              </span>
              {i < steps.length - 1 ? (
                <span className={cn("my-1 h-6 w-0.5", s.state === "done" ? "bg-brand" : "bg-border")} aria-hidden="true" />
              ) : null}
            </div>
            <p
              className={cn(
                "pt-1 text-sm",
                s.state === "active" ? "font-extrabold text-foreground" : "font-semibold",
                s.state === "todo" && "text-muted-foreground",
              )}
            >
              {t(s.key, lang)}
            </p>
          </li>
        ))}
      </ol>
    </section>
  )
}
