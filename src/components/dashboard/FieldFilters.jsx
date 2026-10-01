import { SITES, VULNERABILITY_LEVELS, SECTOR_CLUSTERS } from "@/data/field-operations-data"

export function FieldFilters({ filters, onFilterChange, onReset }) {
  const isFiltered = filters.siteId !== "all" || filters.vulnerabilityId !== "all" || filters.clusterId !== "all"

  return (
    <section className="bg-white border-b border-border px-4 sm:px-6 lg:px-8 py-3" aria-label="Filtri operativi di coordinamento">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-deep">
            <span>Filtri Operativi:</span>
          </div>

          {/* 1. Camp / Site */}
          <div className="flex items-center border border-border bg-background px-2.5 py-1 text-xs">
            <label htmlFor="filter-site" className="text-muted-foreground font-semibold mr-2 uppercase text-[10px]">
              Camp/Site:
            </label>
            <select
              id="filter-site"
              value={filters.siteId}
              onChange={(e) => onFilterChange("siteId", e.target.value)}
              className="bg-transparent font-semibold text-foreground outline-none cursor-pointer"
            >
              {SITES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Vulnerability Priority */}
          <div className="flex items-center border border-border bg-background px-2.5 py-1 text-xs">
            <label htmlFor="filter-vulnerability" className="text-muted-foreground font-semibold mr-2 uppercase text-[10px]">
              Vulnerability Priority:
            </label>
            <select
              id="filter-vulnerability"
              value={filters.vulnerabilityId}
              onChange={(e) => onFilterChange("vulnerabilityId", e.target.value)}
              className="bg-transparent font-semibold text-foreground outline-none cursor-pointer"
            >
              {VULNERABILITY_LEVELS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Sector Cluster */}
          <div className="flex items-center border border-border bg-background px-2.5 py-1 text-xs">
            <label htmlFor="filter-cluster" className="text-muted-foreground font-semibold mr-2 uppercase text-[10px]">
              Sector Cluster:
            </label>
            <select
              id="filter-cluster"
              value={filters.clusterId}
              onChange={(e) => onFilterChange("clusterId", e.target.value)}
              className="bg-transparent font-semibold text-foreground outline-none cursor-pointer"
            >
              {SECTOR_CLUSTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-brand hover:underline px-2 py-1"
            >
              Azzera filtri
            </button>
          )}
        </div>

        {/* Operational Status Live Sync Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-600" aria-hidden="true"></span>
          <span className="font-mono text-[11px]">Sincronizzazione Live: 29 Settembre 2026, 21:55 EAT (UTC+3)</span>
        </div>

      </div>
    </section>
  )
}
