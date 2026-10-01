import { GitBranch, Info, ChevronRight, HelpCircle } from "lucide-react"

export function XaiDecisionTree({ explanation }) {
  if (!explanation) return null

  const steps = explanation.decisionTreeSteps || []
  const counterfactuals = explanation.counterfactualAnalysis || []
  const focusPoints = explanation.interviewFocusPoints || []

  return (
    <section aria-labelledby="xai-tree-title" className="space-y-6">
      
      {/* Title & Institutional Context */}
      <div className="border-b border-border/80 pb-3">
        <div className="flex items-center gap-2 text-brand">
          <GitBranch className="size-4" aria-hidden="true" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Percorso Logico dell&apos;Albero Decisionale (XAI)
          </span>
        </div>
        <h3 id="xai-tree-title" className="mt-1 text-base font-bold text-foreground">
          Determinazione del Budget di Assistenza Cash (CBI)
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          Il modello non applica punteggi opachi o pesi probabilistici: segue le regole esplicite del cluster monetario inter-agenzia (CWG) basate sul paniere di spesa essenziale (MEB) e sulle vulnerabilità certificate.
        </p>
      </div>

      {/* Sequential Decision Tree Pathway */}
      <div className="space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Nodi e Regole Valutate in Sequenza:
        </div>

        <div className="space-y-2.5">
          {steps.map((step, idx) => {
            const isIncrement = step.impactType === "increment"
            const isDecrement = step.impactType === "decrement"
            const isWarning = step.impactType === "warning"

            return (
              <div
                key={idx}
                className={`p-3.5 border text-xs transition-colors ${
                  isWarning
                    ? "bg-amber-50/70 border-amber-300"
                    : "bg-white border-border/80 hover:border-brand/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Node index badge */}
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-none bg-brand text-white font-mono text-xs font-bold mt-0.5">
                      {step.stepNumber}
                    </span>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-xs font-bold text-foreground">
                          {step.criterion}
                        </strong>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          [{step.ruleRef}]
                        </span>
                      </div>

                      <div className="mt-1.5 flex items-center gap-2 text-foreground/90 font-medium">
                        <span className="text-muted-foreground text-[11px]">Condizione rilevata:</span>
                        <span className="bg-muted px-2 py-0.5 font-semibold text-[11px]">
                          {step.conditionEvaluated}
                        </span>
                      </div>

                      <p className="mt-1 text-muted-foreground leading-relaxed">
                        → {step.outcomeText}
                      </p>
                    </div>
                  </div>

                  {/* Financial Node Impact */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Quota Ramo
                    </span>
                    <span
                      className={`font-mono text-sm font-extrabold ${
                        isIncrement
                          ? "text-emerald-700"
                          : isDecrement
                            ? "text-destructive"
                            : isWarning
                              ? "text-amber-800"
                              : "text-brand"
                      }`}
                    >
                      {step.currencySymbol}
                      {step.financialImpact !== 0 ? step.financialImpact : "Verificato"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Synthesis Box: Recommended Assistance Amount */}
      <div className="border border-brand/40 bg-brand-soft/25 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand block">
              Sussidio Cash Mensile Raccomandato dall&apos;Albero
            </span>
            <div className="mt-1 text-2xl font-black text-brand tracking-tight">
              ${explanation.recommendedAmount} <span className="text-xs font-normal text-muted-foreground">/ mese</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground block">Fabbisogno MEB di riferimento:</span>
            <span className="font-mono font-bold text-xs text-foreground">{explanation.mebTarget}</span>
          </div>
        </div>

        <p className="mt-2.5 text-xs text-foreground/90 leading-relaxed border-t border-brand/20 pt-2.5">
          {explanation.rationaleSummary}
        </p>
      </div>

      {/* Counterfactual "What-If" Analysis (Explainability Boundary) */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <HelpCircle className="size-3.5 text-muted-foreground" aria-hidden="true" />
          <span>Analisi Controfattuale (&quot;Cosa accadrebbe se le condizioni variassero&quot;)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {counterfactuals.map((cf, idx) => (
            <div key={idx} className="bg-muted/30 border border-border/70 p-3 flex flex-col justify-between">
              <span className="text-muted-foreground leading-snug">
                {cf.condition}
              </span>
              <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Importo calcolato:</span>
                <span className="font-mono font-bold text-foreground">
                  ${cf.calculatedAmount} ({cf.delta})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Human Interview Guidance Points */}
      {focusPoints.length > 0 && (
        <div className="bg-white border border-border p-4 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-foreground">
            <Info className="size-3.5 text-brand" aria-hidden="true" />
            <span>Punti Chiave Suggeriti per il Colloquio dell&apos;Operatore</span>
          </div>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {focusPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ChevronRight className="size-3.5 text-brand shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-foreground/90">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </section>
  )
}
