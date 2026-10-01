import { useState } from "react"
import { useStore } from "@/lib/store"
import { formatDateTime, usd } from "@/lib/format"
import { getXaiExplanation } from "@/data/xai-decision-trees"
import { XaiDecisionTree } from "./xai-decision-tree"
import {
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
  FileText,
  Users,
  MapPin,
  Clock,
  Globe2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react"

export function CaseDossier({ c }) {
  const { decide, reopen, remainingUsd, metadata } = useStore()
  const d = c.demographics
  const ai = c.ai_assessment
  const h = c.human_oversight
  const xai = getXaiExplanation(c.case_id)

  const [amount, setAmount] = useState(ai.suggested_amount_usd || 800)
  const [operatorNote, setOperatorNote] = useState("")
  const [validationError, setValidationError] = useState(null)

  const isDecided = h.status !== "PENDING"

  const handleAuthorize = () => {
    setValidationError(null)
    if (!Number.isInteger(amount) || amount <= 0) {
      setValidationError("Inserire un importo valido intero maggiore di zero.")
      return
    }
    if (amount > metadata.max_amount_usd) {
      setValidationError(`L'importo massimo autorizzabile per nucleo è ${usd(metadata.max_amount_usd)}.`)
      return
    }
    if (amount > remainingUsd) {
      setValidationError(`Fondi insufficienti per questo ciclo: residuo disponibile ${usd(remainingUsd)}.`)
      return
    }

    const reason = operatorNote.trim() || "Convalida conforme all'albero decisionale e al colloquio con il beneficiario"
    decide({
      caseId: c.case_id,
      status: "APPROVED",
      amount,
      reason,
    })
  }

  const handleSuspendForProtection = () => {
    setValidationError(null)
    const reason = operatorNote.trim() || "Sospeso per verifica di protezione sul campo e approfondimento vulnerabilità"
    decide({
      caseId: c.case_id,
      status: "ESCALATED",
      amount: null,
      reason,
    })
  }

  return (
    <article className="bg-white p-6 sm:p-8 space-y-8 max-w-5xl" aria-labelledby="case-heading">
      
      {/* 1. Intestazione Istituzionale del Fascicolo */}
      <header className="border-b border-border/80 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand">
                Fascicolo Assistenza Monetaria (CBI)
              </span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="font-mono text-xs font-bold text-foreground">
                ID Pratica: {c.case_id}
              </span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="font-mono text-xs text-muted-foreground">
                proGres v4: {xai.proGresId}
              </span>
            </div>

            <h2 id="case-heading" className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {xai.familyTitle}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Globe2 className="size-3.5 text-brand" aria-hidden="true" />
                Origine: <strong className="text-foreground">{d.origin_country}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-brand" aria-hidden="true" />
                Insediamento: <strong className="text-foreground">{d.current_camp}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-brand" aria-hidden="true" />
                Permanenza nel campo: <strong className="text-foreground">{d.months_displaced} mesi</strong>
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Stato Pratica nel Ciclo
            </span>
            <span
              className={`inline-block mt-1 px-3 py-1 text-xs font-bold ${
                h.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                  : h.status === "ESCALATED"
                    ? "bg-amber-50 text-amber-900 border border-amber-300"
                    : "bg-blue-50 text-brand border border-blue-200"
              }`}
            >
              {h.status === "APPROVED"
                ? "Aiuto Convalidato & Autorizzato"
                : h.status === "ESCALATED"
                  ? "In Verifica di Protezione"
                  : "In Attesa di Convalida Operatore"}
            </span>
          </div>
        </div>

        {/* Notifica di Ricorso/Riesame se presente */}
        {h.appeal && (
          <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-950">
            <AlertCircle className="size-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="font-bold">Richiesta di riesame presentata dalla famiglia:</strong>
              <p className="mt-0.5 text-amber-900">
                &ldquo;{h.appeal.reason}&rdquo; {h.appeal.message ? `— ${h.appeal.message}` : ""}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* 2. Profilo del Nucleo e Bisogni Specifici (UNHCR PSN Standard) */}
      <section aria-labelledby="family-profile-title" className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border/60 pb-2">
          <Users className="size-4 text-brand" aria-hidden="true" />
          <h3 id="family-profile-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Composizione del Nucleo e Bisogni Specifici (PSN - Persons with Specific Needs)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-muted/20 p-4 border border-border/70">
          <div className="space-y-3">
            <div>
              <span className="text-[11px] text-muted-foreground block">Capofamiglia Registrato:</span>
              <strong className="text-sm font-semibold text-foreground">{xai.headOfHousehold}</strong>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Composizione Nucleo:</span>
              <span className="text-foreground font-medium leading-relaxed block">
                {xai.compositionDetail}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Localizzazione Rifugio nel Campo:</span>
              <span className="text-foreground font-medium">
                {xai.shelterLocation}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] text-muted-foreground block">Condizione Sanitaria & Bisogni Medici:</span>
              <span className="text-foreground font-medium leading-relaxed block">
                {xai.healthCondition}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Carico di Cura e Struttura Familiare:</span>
              <span className="text-foreground font-medium leading-relaxed block">
                {xai.caregiverBurden}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Situazione Economica e Aiuti Recenti:</span>
              <span className="text-foreground font-medium">
                {xai.economicStatus}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. L'Albero Decisionale XAI Trasparente */}
      <XaiDecisionTree explanation={xai} />

      {/* 4. Convalida e Determinazione dell'Operatore (Human in the loop) */}
      <section aria-labelledby="operator-action-title" className="border-t border-border pt-6 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
            <h3 id="operator-action-title" className="text-sm font-bold uppercase tracking-wider text-foreground">
              Determinazione dell&apos;Operatore Umanitario
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            La raccomandazione algoritmica ha solo valore istruttorio. L&apos;operatore ha la piena facoltà di confermare o rettificare l&apos;importo in base a quanto accertato nel colloquio con la famiglia.
          </p>
        </div>

        {isDecided ? (
          /* Stato Convalidato o Sospeso */
          <div className="bg-muted/40 border border-border p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Decisione Ufficiale Registrata a Sistema
              </div>
              <div className="text-base font-bold text-foreground mt-0.5">
                {h.status === "APPROVED"
                  ? `Assistenza convalidata ed erogata per ${usd(h.final_amount_usd)} / mese`
                  : "Pratica sospesa per verifica di protezione sul campo"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Operatore #{h.operator_id || "4829"} · {h.decided_at ? formatDateTime(h.decided_at) : "Recentemente"}
                {h.decision_reason ? ` — Motivazione: "${h.decision_reason}"` : ""}
              </div>
            </div>

            <button
              type="button"
              onClick={() => reopen(c.case_id)}
              className="inline-flex items-center gap-1.5 border border-border bg-white px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Riapri fascicolo per riesame
            </button>
          </div>
        ) : (
          /* Form di Convalida */
          <div className="space-y-4 bg-muted/10 border border-border/80 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="confirm-amount" className="block text-xs font-bold text-foreground">
                  Importo Mensile Convalidato (USD)
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-muted-foreground">
                    $
                  </span>
                  <input
                    id="confirm-amount"
                    type="number"
                    min={0}
                    max={metadata.max_amount_usd}
                    step={50}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full border border-border bg-white py-2 pl-7 pr-3 text-sm font-mono font-bold text-foreground outline-none focus:border-brand"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Proposta XAI: ${ai.suggested_amount_usd} · Plafond massimo per nucleo: {usd(metadata.max_amount_usd)}
                </span>
              </div>

              <div>
                <label htmlFor="operator-note" className="block text-xs font-bold text-foreground">
                  Verbale del Colloquio / Motivazione (Registrata in proGres)
                </label>
                <input
                  id="operator-note"
                  type="text"
                  placeholder="Es. verificato piano terapeutico e documentazione al colloquio"
                  value={operatorNote}
                  onChange={(e) => setOperatorNote(e.target.value)}
                  className="mt-1 w-full border border-border bg-white px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
                />
              </div>
            </div>

            {validationError && (
              <p className="text-xs text-destructive bg-red-50 p-2.5 border border-red-200 font-semibold" role="alert">
                {validationError}
              </p>
            )}

            {/* I Due Soli Pulsanti Istituzionali */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleAuthorize}
                className="bg-brand hover:bg-brand-deep text-white px-5 py-2.5 text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Convalida e Autorizza Aiuto ({usd(amount)})
              </button>

              <button
                type="button"
                onClick={handleSuspendForProtection}
                className="border border-border bg-white hover:bg-muted text-muted-foreground hover:text-foreground px-4 py-2.5 text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
                Sospendi per Verifica di Protezione
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 5. Tracciabilità e Audit Log (proGres v4 Compliance) */}
      <footer className="border-t border-border/80 pt-5 text-xs space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="size-3.5 text-muted-foreground" aria-hidden="true" />
          Registro Ufficiale di Tracciabilità (proGres v4 Audit Log)
        </span>
        <ul className="divide-y divide-border/60 font-mono text-[11px] text-muted-foreground bg-muted/20 p-3 border border-border/50">
          {h.audit_trail.map((item, idx) => (
            <li key={idx} className="py-2 flex flex-wrap justify-between gap-2">
              <span>
                {formatDateTime(item.timestamp)} · <strong className="text-foreground">{item.actor}</strong>
              </span>
              <span className="text-foreground/90">{item.action}</span>
            </li>
          ))}
        </ul>
      </footer>

    </article>
  )
}
