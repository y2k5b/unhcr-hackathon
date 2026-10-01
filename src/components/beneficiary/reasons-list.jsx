import { Baby, Clock, FileSearch, HandCoins, HeartPulse, Users, Wallet } from "lucide-react"
import { t } from "@/lib/i18n"

const ICONS = {
  family: Users,
  health: HeartPulse,
  time: Clock,
  income: Wallet,
  document: FileSearch,
  aid: HandCoins,
  child: Baby,
}

export function ReasonsList({ reasons, lang }) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{t("why_title", lang)}</h2>
      <ul className="mt-3 space-y-2">
        {reasons.map((r, i) => {
          const Icon = ICONS[r.icon] || Users
          return (
            <li key={i} className="flex items-start gap-2">
              <Icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
              <p className="text-[15px] font-medium leading-snug text-foreground">{r.text[lang] ?? r.text["it"]}</p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
