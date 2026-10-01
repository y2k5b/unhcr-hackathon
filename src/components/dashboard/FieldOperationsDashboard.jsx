import { useState, useMemo } from "react"
import { SITES, INITIAL_ACTION_ITEMS } from "@/data/field-operations-data"
import { FieldFilters } from "./FieldFilters"
import { FieldKpis } from "./FieldKpis"
import { ArrivalsTrendChart } from "./ArrivalsTrendChart"
import { DemographicsDonutChart } from "./DemographicsDonutChart"
import { ActionItemsTable } from "./ActionItemsTable"

export function FieldOperationsDashboard() {
  const [filters, setFilters] = useState({
    siteId: "all",
    vulnerabilityId: "all",
    clusterId: "all",
  })

  const [actionItems, setActionItems] = useState(INITIAL_ACTION_ITEMS)

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }))
  }

  const handleResetFilters = () => {
    setFilters({ siteId: "all", vulnerabilityId: "all", clusterId: "all" })
  }

  const handleCoordinateAction = (taskId) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === taskId ? { ...item, status: "in_progress" } : item))
    )
  }

  // Realistic KPI metrics by selected site/camp
  const kpiData = useMemo(() => {
    const siteMetrics = {
      all: {
        totalPop: 248310,
        weeklyArrivals: "+1,085 registrati",
        shelterRate: 84.2,
        shelterStatus: "High Capacity",
        occupiedShelter: 219500,
        totalShelter: 260000,
        urgentCases: 38,
        medicalCases: 22,
        legalCases: 16,
        criDistributed: 8650,
        criCoverage: "94.2% soddisfatto",
      },
      kakuma_1: {
        totalPop: 78420,
        weeklyArrivals: "+340 registrati",
        shelterRate: 89.1,
        shelterStatus: "Near Full",
        occupiedShelter: 73060,
        totalShelter: 82000,
        urgentCases: 14,
        medicalCases: 9,
        legalCases: 5,
        criDistributed: 3120,
        criCoverage: "96.0% soddisfatto",
      },
      kakuma_2: {
        totalPop: 62190,
        weeklyArrivals: "+280 registrati",
        shelterRate: 81.4,
        shelterStatus: "Moderate Capacity",
        occupiedShelter: 55350,
        totalShelter: 68000,
        urgentCases: 9,
        medicalCases: 5,
        legalCases: 4,
        criDistributed: 2400,
        criCoverage: "92.5% soddisfatto",
      },
      kalobeyei: {
        totalPop: 46200,
        weeklyArrivals: "+195 registrati",
        shelterRate: 79.0,
        shelterStatus: "Stable Capacity",
        occupiedShelter: 39500,
        totalShelter: 50000,
        urgentCases: 6,
        medicalCases: 3,
        legalCases: 3,
        criDistributed: 1550,
        criCoverage: "95.0% soddisfatto",
      },
      dadaab_hagadera: {
        totalPop: 34500,
        weeklyArrivals: "+150 registrati",
        shelterRate: 92.3,
        shelterStatus: "Critical Overcrowding",
        occupiedShelter: 35070,
        totalShelter: 38000,
        urgentCases: 5,
        medicalCases: 3,
        legalCases: 2,
        criDistributed: 980,
        criCoverage: "91.0% soddisfatto",
      },
      dadaab_ifo: {
        totalPop: 27000,
        weeklyArrivals: "+120 registrati",
        shelterRate: 86.0,
        shelterStatus: "High Capacity",
        occupiedShelter: 25800,
        totalShelter: 30000,
        urgentCases: 4,
        medicalCases: 2,
        legalCases: 2,
        criDistributed: 600,
        criCoverage: "93.0% soddisfatto",
      },
    }

    return siteMetrics[filters.siteId] || siteMetrics.all
  }, [filters.siteId])

  // Filter Action Items by Site and Cluster
  const visibleActionItems = useMemo(() => {
    return actionItems.filter((item) => {
      if (filters.siteId !== "all" && item.siteId !== filters.siteId) return false
      if (filters.clusterId !== "all" && item.sector !== filters.clusterId) return false
      return true
    })
  }, [actionItems, filters.siteId, filters.clusterId])

  return (
    <div className="min-h-full bg-background pb-12">
      {/* 1. Realistic Operational Filter Bar */}
      <FieldFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 md:px-6">
        
        {/* Context bar with Print action */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Panoramica Generale di Coordinamento Cluster
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quadro di comando per responsabili di settore, logistica umanitaria e protezione internazionale (Kenya Hub).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="border border-border bg-white hover:bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition-colors"
            >
              Stampa Rapporto di Situazione (SitRep)
            </button>
          </div>
        </div>

        {/* 2. Top Impact Humanitarian KPI Cards */}
        <FieldKpis kpiData={kpiData} />

        {/* 3. Center Data Visualizations (Trend of Arrivals + Demographics Donut) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* 30-Day Arrivals Chart (7 cols) */}
          <div className="lg:col-span-7">
            <ArrivalsTrendChart />
          </div>

          {/* Demographic Donut Chart (5 cols) */}
          <div className="lg:col-span-5">
            <DemographicsDonutChart />
          </div>
        </div>

        {/* 4. Priority Field Actions (IASC Cluster Coordination) */}
        <ActionItemsTable
          items={visibleActionItems}
          onCoordinateAction={handleCoordinateAction}
        />

        {/* 5. Footer Compliance & Accessibility */}
        <footer className="border-t border-border pt-4 mt-8 text-foreground" aria-label="Informazioni istituzionali e data protection">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-0.5 text-center md:text-left">
              <p className="font-bold text-brand-deep">
                UNHCR Data Protection Policy &amp; Humanitarian Confidentiality Standards (2026 Revision)
              </p>
              <p className="text-muted-foreground">
                Tutti i dati biometrici, demografici e di triage sono protetti in conformità all&apos;Articolo 35 della Convenzione di Ginevra del 1951 e alle linee guida IASC. L&apos;accesso ai registri nominativi è limitato al personale accreditato.
              </p>
            </div>
            <div className="font-mono text-muted-foreground text-center md:text-right flex-shrink-0">
              <div>SYSTEM: proGres v4 · Core Coordination Engine</div>
              <div>ACCESSIBILITY: WCAG 2.1 AA / AAA Standard Compliant</div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
