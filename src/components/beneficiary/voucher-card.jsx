import { useState } from "react"
import { Calendar, Copy, MapPin } from "lucide-react"
import { t } from "@/lib/i18n"
import { voucherCode } from "@/lib/format"

export function VoucherCard({ c, lang }) {
  const [copied, setCopied] = useState(false)
  const code = voucherCode(c)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-ink bg-card shadow-sm">
      <div className="bg-highlight px-4 py-3">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-ink">{t("voucher_title", lang)}</h2>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="font-mono text-2xl font-bold tracking-widest text-ink" dir="ltr">
            {code}
          </span>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1 rounded-md bg-ink px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
          >
            <Copy className="size-3.5" aria-hidden="true" />
            <span aria-live="polite">{copied ? t("copied", lang) : t("copy", lang)}</span>
          </button>
        </div>
      </div>
      <dl className="space-y-3 p-4 text-sm">
        <div className="flex gap-3">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <dt className="text-xs font-bold uppercase text-muted-foreground">{t("voucher_where", lang)}</dt>
            <dd className="font-semibold text-foreground">{c.distribution.point}</dd>
          </div>
        </div>
        <div className="flex gap-3">
          <Calendar className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
          <div>
            <dt className="text-xs font-bold uppercase text-muted-foreground">{t("voucher_when", lang)}</dt>
            <dd className="font-semibold text-foreground">{c.distribution.window}</dd>
          </div>
        </div>
        <p className="border-t border-dashed border-border pt-3 text-muted-foreground">{t("voucher_bring", lang)}</p>
      </dl>
    </section>
  )
}
