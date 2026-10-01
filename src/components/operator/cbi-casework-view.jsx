import { useStore } from "@/lib/store"
import { FactsheetBanner } from "./factsheet-banner"
import { CaseworkQueue } from "./casework-queue"
import { CaseDossier } from "./case-dossier"

export function CbiCaseworkView() {
  const { cases, activeCaseId, setActiveCaseId } = useStore()

  const activeCase = cases.find((c) => c.case_id === activeCaseId) || cases[0]

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Factsheet Banner */}
      <FactsheetBanner />

      {/* Main Two-Pane Casework Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Triage Queue (4 cols on lg) */}
        <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20">
          <CaseworkQueue
            cases={cases}
            activeCaseId={activeCase?.case_id}
            onSelectCase={(id) => setActiveCaseId(id)}
          />
        </div>

        {/* Right Column: Case Dossier & XAI Decision Tree (8 cols on lg) */}
        <div className="lg:col-span-8 xl:col-span-9">
          {activeCase ? (
            <CaseDossier key={activeCase.case_id} c={activeCase} />
          ) : (
            <div className="bg-white border border-border p-12 text-center text-sm text-muted-foreground">
              Seleziona un nucleo familiare dalla lista per visualizzare il fascicolo e l&apos;albero decisionale.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
