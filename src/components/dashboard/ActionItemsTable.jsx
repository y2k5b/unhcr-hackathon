export function ActionItemsTable({ items, onCoordinateAction }) {
  return (
    <section aria-labelledby="field-actions-title" className="border border-border bg-white">
      {/* Table Header & Summary */}
      <div className="p-4 sm:px-6 border-b border-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="field-actions-title" className="text-sm font-bold uppercase tracking-wider text-brand-deep">
              Priority Field Actions (IASC Cluster Coordination)
            </h2>
            <span className="bg-brand text-white font-mono text-[10px] font-bold px-2 py-0.5">
              {items.length} Interventi Attivi
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Disposizioni operative urgenti per i capifila dei settori WASH, Sanità, Protezione, Alloggi e Logistica.
          </p>
        </div>
      </div>

      {/* Action Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <th className="py-3 px-4 w-28">Settore</th>
              <th className="py-3 px-4 w-36">Priorità</th>
              <th className="py-3 px-4">Esigenza Umanitaria &amp; Dettagli Operativi</th>
              <th className="py-3 px-4 w-44">Localizzazione</th>
              <th className="py-3 px-4 w-52">Team Assegnatario</th>
              <th className="py-3 px-4 w-36 text-right">Azione di Coordinamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-muted-foreground">
                  Nessuna azione prioritaria con i filtri selezionati.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isCritical = item.priority === "CRITICAL"
                const isHigh = item.priority === "HIGH"
                const isDeployed = item.status === "in_progress"

                return (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    {/* Sector */}
                    <td className="py-3.5 px-4 font-bold text-brand">
                      {item.sector}
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide border ${
                          isCritical
                            ? "bg-red-50 text-destructive border-red-200"
                            : isHigh
                              ? "bg-orange-50 text-amber-800 border-amber-200"
                              : "bg-blue-50 text-brand border-blue-200"
                        }`}
                      >
                        {isCritical ? "CRITICAL / URGENT" : isHigh ? "HIGH PRIORITY" : "COORDINATION"}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-foreground text-xs">{item.descriptionTitle}</div>
                      <div className="text-muted-foreground text-[11px] mt-0.5 leading-relaxed">
                        {item.descriptionDetail}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-foreground font-medium">
                      {item.location}
                    </td>

                    {/* Assignee Team */}
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {item.assignee}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right">
                      {isDeployed ? (
                        <span className="bg-brand-deep text-white px-2.5 py-1 text-xs font-mono font-bold inline-block">
                          Team Dispiegato ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onCoordinateAction(item.id)}
                          className={
                            item.actionLabel === "Deploy Team"
                              ? "bg-brand hover:bg-brand-deep text-white px-3 py-1.5 text-xs font-bold transition-colors"
                              : "bg-white border border-brand-deep text-brand-deep hover:bg-muted px-3 py-1.5 text-xs font-bold transition-colors"
                          }
                        >
                          {item.actionLabel}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Action Protocol Footer */}
      <div className="p-3 bg-muted/30 border-t border-border flex flex-wrap items-center justify-between text-[11px] text-muted-foreground">
        <span>Protocollo IASC: I casi di priorità CRITICAL richiedono dispiegamento documentato entro 120 minuti dalla notifica.</span>
        <span>Coordinamento intersettoriale: UNHCR, WFP, UNICEF, IRC, LWF, Medair</span>
      </div>
    </section>
  )
}
