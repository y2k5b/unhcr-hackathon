import { useEffect, useState } from "react"
import { LifeBuoy, ShieldCheck, Volume2, VolumeX } from "lucide-react"
import { LANG_META, t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { StatusTimeline } from "./status-timeline"
import { ReasonsList } from "./reasons-list"
import { VoucherCard } from "./voucher-card"
import { AppealForm } from "./appeal-form"

const STATUS_COPY = {
  PENDING: { title: "status_pending_title", body: "status_pending_body" },
  ESCALATED: { title: "status_escalated_title", body: "status_escalated_body" },
  APPROVED: { title: "status_approved_title", body: "status_approved_body" },
  REJECTED: { title: "status_rejected_title", body: "status_rejected_body" },
}

export function BeneficiaryApp({ c }) {
  const [lang, setLang] = useState(c.demographics.preferred_language || "it")
  const [speaking, setSpeaking] = useState(false)
  const meta = LANG_META[lang] || LANG_META["it"]
  const h = c.human_oversight
  const copy = STATUS_COPY[h.status] || STATUS_COPY.PENDING

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const toggleSpeech = () => {
    const synth = window.speechSynthesis
    if (!synth) return
    if (speaking) {
      synth.cancel()
      setSpeaking(false)
      return
    }
    const parts = [
      t(copy.title, lang),
      t(copy.body, lang),
      h.status === "APPROVED" && h.final_amount_usd ? `${t("amount", lang)}: ${h.final_amount_usd} USD` : "",
      t("why_title", lang),
      ...(c.xai_explanation?.beneficiary_reasons?.map((r) => r.text[lang] ?? r.text["it"]) ?? []),
    ].filter(Boolean)
    const utterance = new SpeechSynthesisUtterance(parts.join(". "))
    utterance.lang = meta.speech
    utterance.rate = 0.9
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    synth.cancel()
    synth.speak(utterance)
    setSpeaking(true)
  }

  const changeLang = (l) => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    setLang(l)
  }

  return (
    <div dir={meta.dir} lang={lang} className="flex min-h-full flex-col bg-background text-foreground">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-brand px-4 py-3 text-white shadow-sm">
        <div className="leading-tight">
          <div className="text-sm font-extrabold">{t("app_name", lang)}</div>
          <div className="font-mono text-[11px] opacity-80" dir="ltr">
            {c.case_id}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-full bg-brand-deep/50 p-0.5" role="group" aria-label="Lingua / Language / اللغة">
            {Object.keys(LANG_META).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => changeLang(l)}
                aria-pressed={lang === l}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-bold transition-colors",
                  lang === l ? "bg-white text-brand" : "text-white hover:bg-white/10",
                )}
              >
                {LANG_META[l].label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggleSpeech}
            aria-pressed={speaking}
            className="flex items-center gap-1 rounded-full bg-highlight px-2.5 py-1 text-xs font-extrabold text-ink transition-colors hover:bg-yellow-300"
          >
            {speaking ? <VolumeX className="size-3.5" aria-hidden="true" /> : <Volume2 className="size-3.5" aria-hidden="true" />}
            {speaking ? t("stop", lang) : t("listen", lang)}
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 px-4 py-3">
        <section className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{t("your_request", lang)}</p>
          <h1 className="text-balance text-2xl font-extrabold leading-tight text-foreground">{t(copy.title, lang)}</h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{t(copy.body, lang)}</p>
          {h.status === "APPROVED" && h.final_amount_usd ? (
            <p className="pt-2">
              <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("amount", lang)}</span>
              <span className="text-4xl font-extrabold text-brand" dir="ltr">
                ${h.final_amount_usd.toLocaleString("en-US")}
              </span>
            </p>
          ) : null}
        </section>

        {h.status === "APPROVED" ? <VoucherCard c={c} lang={lang} /> : null}

        <StatusTimeline status={h.status} lang={lang} />

        {c.xai_explanation?.beneficiary_reasons ? (
          <ReasonsList reasons={c.xai_explanation.beneficiary_reasons} lang={lang} />
        ) : null}

        <p className="flex gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden="true" />
          {t("human_note", lang)}
        </p>

        {h.status !== "ESCALATED" ? <AppealForm key={c.case_id} c={c} lang={lang} /> : null}

        <section className="mt-6 flex flex-col gap-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground">
            <LifeBuoy className="size-4 shrink-0 text-brand" aria-hidden="true" />
            <h2 className="font-bold">{t("help_title", lang)}</h2>
          </div>
          <p>{t("help_body", lang)}</p>
        </section>
      </div>
    </div>
  )
}
