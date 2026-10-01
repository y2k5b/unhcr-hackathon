import { useState } from "react"
import { CheckCircle2, RotateCcw, ShieldAlert, XCircle } from "lucide-react"
import { useStore } from "@/lib/store"
import { ACTION_LABELS, formatDateTime, STATUS_LABELS, usd } from "@/lib/format"

const REASONS = [
  "Verifica documentale completata",
  "Informazioni aggiuntive dal colloquio",
  "Vulnerabilità non catturata dal modello",
  "Possibile errore o bias del modello",
  "Vincolo di budget del ciclo",
  "Rischio frode confermato",
  "Altro (specificare nella nota)",
]

export function DecisionPanel({ c }) {
  const { decide, reopen, remainingUsd, metadata } = useStore()
  const ai = c.ai_assessment
  const h = c.human_oversight

  const [amount, setAmount] = useState(ai.suggested_amount_usd || 0)
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")
  const [error, setError] = useState(null)

  if (h.status !== "PENDING") {
    return (
      <section
        aria-label="Esito della revisione umana"
        className="flex flex-col gap-4 border border-border bg-muted p-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Decisione umana registrata</div>
          <div className="mt-1 text-2xl font-extrabold">
            {STATUS_LABELS[h.status]}
            {h.status === "APPROVED" && h.final_amount_usd !== null ? ` · ${usd(h.final_amount_usd)}` : ""}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {h.operator_id} · {h.decided_at ? formatDateTime(h.decided_at) : ""}
            {h.decision_reason ? ` · ${h.decision_reason}` : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={() => reopen(c.case_id)}
          className="flex items-center justify-center gap-2 rounded-md border-2 border-ink px-4 py-2.5 text-sm font-bold hover:bg-white"
        >
          <RotateCcw className="size-4" aria-hidden="true" /> Riapri pratica
        </button>
      </section>
    )
  }

  const amountChanged = amount !== ai.suggested_amount_usd
  const needsJustification = (d) =>
    d === "ESCALATED" ||
    (d === "APPROVED" && (ai.recommended_action !== "APPROVE" || amountChanged)) ||
    (d === "REJECTED" && ai.recommended_action !== "REJECT") ||
    !!h.appeal

  const submit = (d) => {
    setError(null)
    if (d === "APPROVED") {
      if (!Number.isInteger(amount) || amount <= 0) return setError("Inserisci un importo intero maggiore di zero.")
      if (amount > metadata.max_amount_usd) return setError(`L'importo massimo per nucleo è ${usd(metadata.max_amount_usd)}.`)
      if (amount > remainingUsd) return setError(`Budget insufficiente: residuo ${usd(remainingUsd)}.`)
    }
    if (needsJustification(d) && !reason) {
      return setError("Questa decisione si discosta dall'IA o riguarda un ricorso: seleziona una motivazione.")
    }
    if ((reason.startsWith("Altro") || d === "ESCALATED") && note.trim().length < 5) {
      return setError("Aggiungi una nota esplicativa (almeno 5 caratteri).")
    }
    const fullReason = [reason, note.trim()].filter(Boolean).join(" — ") || "Conforme alla raccomandazione IA"
    decide({ caseId: c.case_id, status: d, amount: d === "APPROVED" ? amount : null, reason: fullReason })
  }

  return (
    <section aria-labelledby="decision-title" className="border border-border bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="decision-title" className="text-lg font-extrabold">
          Decisione dell&apos;operatore
        </h3>
        <p className="text-sm text-muted-foreground">
          IA suggerisce: <strong className="text-foreground">{ACTION_LABELS[ai.recommended_action]}</strong>
          {ai.suggested_amount_usd > 0 ? ` · ${usd(ai.suggested_amount_usd)}` : ""}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[200px_1fr]">
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Importo (USD)</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={metadata.max_amount_usd}
            step={50}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-lg font-bold outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            {amountChanged ? `Modificato rispetto all'IA (${usd(ai.suggested_amount_usd)})` : `Residuo budget ${usd(remainingUsd)}`}
          </span>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Motivazione</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm font-semibold"
            >
              <option value="">Nessuna (conforme all&apos;IA)</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nota per il fascicolo</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Es. colloquio del 28/09 conferma reddito"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => submit("ESCALATED")}
          className="flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold text-muted-foreground hover:bg-muted"
        >
          <ShieldAlert className="size-4" aria-hidden="true" /> Inoltra a Protection Officer
        </button>
        <button
          type="button"
          onClick={() => submit("REJECTED")}
          className="flex items-center justify-center gap-2 rounded-md border-2 border-ink px-5 py-3 text-sm font-extrabold hover:bg-muted"
        >
          <XCircle className="size-4" aria-hidden="true" /> Respingi
        </button>
        <button
          type="button"
          onClick={() => submit("APPROVED")}
          className="flex items-center justify-center gap-2 rounded-md bg-highlight px-6 py-3 text-base font-extrabold text-ink hover:bg-yellow-300 transition-colors"
        >
          <CheckCircle2 className="size-5" aria-hidden="true" /> Autorizza {usd(amount || 0)}
        </button>
      </div>
    </section>
  )
}
