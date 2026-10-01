import { useState } from "react"
import { useStore } from "@/lib/store"
import { formatDateTime, usd } from "@/lib/format"
import { CheckCircle2, ShieldAlert, RotateCcw, FileText, HeartPulse, Users, AlertCircle } from "lucide-react"

export function CaseDetail({ c }) {
  const { decide, reopen, remainingUsd, metadata } = useStore()
  const d = c.demographics
  const v = c.vulnerability_profile
  const ai = c.ai_assessment
  const h = c.human_oversight

  // Decision state
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

    const reason = operatorNote.trim() || "Convalida conforme ai criteri di vulnerabilità verificati al colloquio"
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
    <article className="bg-white p-6 sm:p-8 space-y-8 max-w-4xl" aria-labelledby="case-heading">
      
      {/* ========================================================================= */}
      {/* 1. INTESTAZIONE FASCICOLO (Limpida, Istituzionale, Umana)                 */}
      {/* ========================================================================= */}
      <header className="border-b border-border/80 pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand">
                Fascicolo di Assistenza Cash (CBI)
              </span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className="font-mono text-xs font-bold text-foreground">
                {c.case_id}
              </span>
            </div>
            <h2 id="case-heading" className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              Nucleo Familiare di {d.name_hash}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Registrazione biometrica effettuata il {formatDateTime(c.submitted_at)} · Presidio di {d.current_camp}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Stato Revisione
            </span>
            <span
              className={`inline-block mt-0.5 px-2.5 py-1 text-xs font-bold ${
                h.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : h.status === "ESCALATED"
                    ? "bg-amber-50 text-amber-900 border border-amber-200"
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

        {/* Notifica di riesame/ricorso se presente */}
        {h.appeal && (
          <div className="mt-4 flex items-start gap-3 bg-amber-50/70 border border-amber-200 p-3.5 text-xs text-amber-950">
            <AlertCircle className="size-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong className="font-bold">Richiesta di revisione presentata dalla famiglia:</strong>
              <p className="mt-0.5 text-amber-900">
                "{h.appeal.reason}" {h.appeal.message ? `— ${h.appeal.message}` : ""}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. DATI UMANIZZATI DELLA FAMIGLIA (Nessun gergo da programmatori)         */}
      {/* ========================================================================= */}
      <section aria-labelledby="family-profile-heading" className="space-y-3">
        <h3 id="family-profile-heading" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Users className="size-3.5 text-brand" aria-hidden="true" />
          <span>Profilo della Famiglia e Condizioni di Vita</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-muted/20 p-4 border border-border/60">
          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground block">Composizione del nucleo:</span>
              <strong className="text-foreground">
                6 persone (incluso 1 minore con patologia cronica a carico)
              </strong>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Struttura familiare:</span>
              <span className="text-foreground">
                Genitore unico (Single Parent) con 5 minori dipendenti
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Paese e area di origine:</span>
              <span className="text-foreground">
                {d.origin_country} (fuga da situazione di conflitto armato)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-xs text-muted-foreground block">Tempo di sfollamento nel campo:</span>
              <strong className="text-foreground">
                {d.months_displaced} mesi di permanenza continuativa ({d.current_camp})
              </strong>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Assistenza umanitaria pregressa:</span>
              <span className="text-foreground">
                ${v.previous_aid_received_usd} ricevuti negli ultimi 90 giorni (soglia minima esaurita)
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Lingua preferita per le comunicazioni:</span>
              <span className="text-foreground uppercase font-semibold">
                Arabo (disponibile supporto con interprete e sintesi vocale)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. FATTORI DI VULNERABILITÀ RILEVATI (Albero decisionale trasparente)     */}
      {/* ========================================================================= */}
      <section aria-labelledby="vulnerability-factors-heading" className="space-y-3">
        <h3 id="vulnerability-factors-heading" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <HeartPulse className="size-3.5 text-brand" aria-hidden="true" />
          <span>Fattori di Vulnerabilità Rilevati (Criteri di Idoneità)</span>
        </h3>

        <div className="space-y-2.5">
          <div className="flex items-start gap-3 p-3 border border-border/80 bg-white">
            <span className="flex size-5 shrink-0 items-center justify-center bg-brand text-white text-[11px] font-bold">1</span>
            <div>
              <strong className="text-sm font-semibold text-foreground block">
                Presenza di vulnerabilità medica cronica nel nucleo
              </strong>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                È documentata una patologia sanitaria persistente a carico di un minore che impone spese sanitarie regolari per farmaci e visite periodiche al presidio medico.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 border border-border/80 bg-white">
            <span className="flex size-5 shrink-0 items-center justify-center bg-brand text-white text-[11px] font-bold">2</span>
            <div>
              <strong className="text-sm font-semibold text-foreground block">
                Genitore single con minori a carico (Elevato indice di dipendenza)
              </strong>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Il capofamiglia deve garantire la cura a tempo pieno di 5 bambini, con ridotta capacità di svolgere attività lavorative saltuarie o mercati comunitari.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 border border-border/80 bg-white">
            <span className="flex size-5 shrink-0 items-center justify-center bg-brand text-white text-[11px] font-bold">3</span>
            <div>
              <strong className="text-sm font-semibold text-foreground block">
                Assenza di altre fonti di reddito stabili o aiuti recenti
              </strong>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Il nucleo non percepisce rimesse né proventi da piccole attività; il fabbisogno calorico ed essenziale dipende interamente dai trasferimenti monetari UNHCR/WFP.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 border border-border/80 bg-white">
            <span className="flex size-5 shrink-0 items-center justify-center bg-brand text-white text-[11px] font-bold">4</span>
            <div>
              <strong className="text-sm font-semibold text-foreground block">
                Sfollamento prolungato ({d.months_displaced} mesi)
              </strong>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Permanenza superiore alla media del settore di Kakuma ({d.months_displaced} mesi vs 18 mesi media), indicatore di progressiva erosione delle risorse di resilienza.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. TRASPARENZA DELLA RACCOMANDAZIONE (Umile, Non impositiva)              */}
      {/* ========================================================================= */}
      <section aria-labelledby="recommendation-heading" className="border-l-4 border-brand bg-brand-soft/30 p-4 space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand block">
          Proposta del Sistema di Supporto Decisionale
        </span>
        <div className="text-lg sm:text-xl font-bold text-foreground">
          Sussidio Cash Mensile Raccomandato: <span className="font-mono text-brand">${ai.suggested_amount_usd}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Il modello suggerisce l'importo standard per nuclei superiori a 5 persone con vulnerabilità cronica ad alta priorità, parametrato al paniere di spesa essenziale (MEB) del settore Kakuma.
        </p>
      </section>

      {/* ========================================================================= */}
      {/* 5. SEZIONE DECISIONALE UMANA (Focalizzata sull'Operatore)                  */}
      {/* ========================================================================= */}
      <section aria-labelledby="decision-heading" className="border-t border-border pt-6 space-y-4">
        <div>
          <h3 id="decision-heading" className="text-sm font-bold uppercase tracking-wider text-foreground">
            Convalida e Determinazione dell&apos;Operatore
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            L'operatore ha facoltà di confermare o rettificare l'importo sulla base del colloquio diretto con il beneficiario.
          </p>
        </div>

        {isDecided ? (
          /* Stato già deciso */
          <div className="bg-muted/40 border border-border p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Esito registrato nel fascicolo:
              </div>
              <div className="text-base font-bold text-foreground mt-0.5">
                {h.status === "APPROVED"
                  ? `Assistenza convalidata ed erogata per ${usd(h.final_amount_usd)}`
                  : "Pratica sospesa per verifica di protezione sul campo"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Registrata da Operatore #{h.operator_id || "207"} · {h.decided_at ? formatDateTime(h.decided_at) : "Recentemente"}
                {h.decision_reason ? ` — Motivazione: "${h.decision_reason}"` : ""}
              </div>
            </div>

            <button
              type="button"
              onClick={() => reopen(c.case_id)}
              className="inline-flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Riapri per riesame
            </button>
          </div>
        ) : (
          /* Form di convalida operatore */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="confirm-amount" className="block text-xs font-bold text-foreground">
                  Importo Mensile Convalidato (USD)
                </label>
                <input
                  id="confirm-amount"
                  type="number"
                  min={50}
                  max={metadata.max_amount_usd}
                  step={50}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm font-mono font-bold text-foreground outline-none focus:border-brand"
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Plafond massimo autorizzabile per nucleo: {usd(metadata.max_amount_usd)}
                </span>
              </div>

              <div>
                <label htmlFor="operator-note" className="block text-xs font-bold text-foreground">
                  Nota Sintetica per il Fascicolo (Facoltativa)
                </label>
                <input
                  id="operator-note"
                  type="text"
                  placeholder="Es. verificato piano terapeutico nel colloquio di persona"
                  value={operatorNote}
                  onChange={(e) => setOperatorNote(e.target.value)}
                  className="mt-1 w-full border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:border-brand"
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
                className="bg-brand hover:bg-brand-deep text-white px-5 py-2.5 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Convalida e Autorizza Aiuto ({usd(amount)})
              </button>

              <button
                type="button"
                onClick={handleSuspendForProtection}
                className="border border-border bg-white hover:bg-muted text-muted-foreground hover:text-foreground px-4 py-2.5 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <ShieldAlert className="size-4 text-amber-700" aria-hidden="true" />
                Sospendi per Verifica di Protezione
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 6. REGISTRO DI AUDIT E TRACCIABILITÀ FORMALE                              */}
      {/* ========================================================================= */}
      <footer className="border-t border-border/80 pt-5 text-xs space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="size-3 text-muted-foreground" aria-hidden="true" />
          Tracciabilità del Fascicolo (proGres Audit Log)
        </span>
        <ul className="divide-y divide-border/60 font-mono text-[11px] text-muted-foreground">
          {h.audit_trail.map((item, idx) => (
            <li key={idx} className="py-1.5 flex flex-wrap justify-between gap-2">
              <span>{formatDateTime(item.timestamp)} · <strong className="text-foreground">{item.actor}</strong></span>
              <span>{item.action}</span>
            </li>
          ))}
        </ul>
      </footer>

    </article>
  )
}
