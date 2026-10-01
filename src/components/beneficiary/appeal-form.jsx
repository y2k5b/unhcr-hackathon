import { useState } from "react"
import { CheckCircle2, MessageSquareWarning } from "lucide-react"
import { useStore } from "@/lib/store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const REASON_KEYS = ["appeal_r_family", "appeal_r_health", "appeal_r_income", "appeal_r_other"]

export function AppealForm({ c, lang }) {
  const { appeal } = useStore()
  const [open, setOpen] = useState(false)
  const [reasonKey, setReasonKey] = useState(null)
  const [message, setMessage] = useState("")

  const h = c.human_oversight
  const hasOpenAppeal = !!h.appeal && h.status === "PENDING"

  if (hasOpenAppeal) {
    return (
      <div role="status" className="flex gap-3 rounded-2xl bg-highlight p-4 text-ink shadow-sm">
        <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-extrabold">{t("appeal_sent_title", lang)}</p>
          <p className="mt-0.5">{t("appeal_sent_body", lang)}</p>
        </div>
      </div>
    )
  }

  if (h.status === "PENDING") return null

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-card px-4 py-4 text-base font-extrabold text-ink hover:bg-muted transition-colors shadow-sm"
      >
        <MessageSquareWarning className="size-5" aria-hidden="true" />
        {t("appeal_cta", lang)}
      </button>
    )
  }

  const submit = (e) => {
    e.preventDefault()
    if (!reasonKey) return
    appeal(c.case_id, t(reasonKey, "it"), message.trim())
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border-2 border-ink bg-card p-4 shadow-sm">
      <div>
        <h2 className="text-lg font-extrabold text-foreground">{t("appeal_title", lang)}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("appeal_intro", lang)}</p>
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-bold text-foreground">{t("appeal_reason", lang)}</legend>
        {REASON_KEYS.map((k) => (
          <label
            key={k}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 text-sm font-semibold transition-colors",
              reasonKey === k ? "border-brand bg-brand-soft text-brand-deep" : "border-border text-foreground hover:bg-muted/50",
            )}
          >
            <input
              type="radio"
              name="appeal-reason"
              value={k}
              checked={reasonKey === k}
              onChange={() => setReasonKey(k)}
              className="size-4 accent-[#0072bc]"
            />
            {t(k, lang)}
          </label>
        ))}
      </fieldset>
      <label className="block">
        <span className="text-sm font-bold text-foreground">{t("appeal_message", lang)}</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={400}
          className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 rounded-xl px-4 py-3 text-sm font-bold text-muted-foreground hover:bg-muted transition-colors"
        >
          {t("appeal_cancel", lang)}
        </button>
        <button
          type="submit"
          disabled={!reasonKey}
          className="flex-[2] rounded-xl bg-brand px-4 py-3 text-sm font-extrabold text-white hover:bg-brand-deep transition-colors disabled:opacity-40"
        >
          {t("appeal_send", lang)}
        </button>
      </div>
    </form>
  )
}
