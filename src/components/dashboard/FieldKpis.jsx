export function FieldKpis({ kpiData }) {
  const {
    totalPop,
    weeklyArrivals,
    shelterRate,
    shelterStatus,
    occupiedShelter,
    totalShelter,
    urgentCases,
    medicalCases,
    legalCases,
    criDistributed,
    criCoverage,
  } = kpiData

  return (
    <section aria-label="Metriche chiave del coordinamento umanitario" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      
      {/* 1. Total Registered Individuals (Active Cases) */}
      <div className="border border-border bg-white p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Registered Individuals
            </span>
            <span className="text-[10px] font-mono font-semibold text-brand bg-brand-soft/60 px-1.5 py-0.5">
              proGres Active
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-foreground">
              {totalPop.toLocaleString("en-US")}
            </span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Nuovi arrivi 7 giorni:</span>
          <strong className="font-mono text-foreground font-bold">{weeklyArrivals}</strong>
        </div>
      </div>

      {/* 2. Shelter Allocation Rate */}
      <div className="border border-border bg-white p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Shelter Allocation Rate
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5">
              {shelterStatus}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-foreground">
              {shelterRate}%
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              Capacità settori
            </span>
          </div>
          {/* Capacity Progress Bar */}
          <div className="mt-2 w-full h-1.5 bg-muted overflow-hidden">
            <div className="h-full bg-brand" style={{ width: `${shelterRate}%` }}></div>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Occupati: <strong className="font-mono text-foreground">{occupiedShelter.toLocaleString("en-US")}</strong></span>
          <span>Max: <strong className="font-mono text-foreground">{totalShelter.toLocaleString("en-US")}</strong></span>
        </div>
      </div>

      {/* 3. Urgent Protection & Medical Cases */}
      <div className="border border-border bg-white p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Urgent Protection &amp; Medical
            </span>
            <span className="text-[10px] font-bold text-destructive bg-red-50 border border-red-200 px-1.5 py-0.5">
              Priority Triage
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-destructive">
              {urgentCases}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              segnalazioni attive
            </span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Evacuazioni / UASC:</span>
          <strong className="font-mono text-destructive font-bold">{medicalCases} Sanitarie · {legalCases} Minori</strong>
        </div>
      </div>

      {/* 4. Core Relief Items (CRI) Distributed */}
      <div className="border border-border bg-white p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Core Relief Items (CRI)
            </span>
            <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5">
              Ciclo Settembre
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-foreground">
              {criDistributed.toLocaleString("en-US")}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              kit NFI consegnati
            </span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Copertura target mensile:</span>
          <strong className="font-mono text-emerald-700 font-bold">{criCoverage}</strong>
        </div>
      </div>

    </section>
  )
}
