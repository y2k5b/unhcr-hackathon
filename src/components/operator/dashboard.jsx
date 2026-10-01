import { useEffect, useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { priorityOf, matchesFilter } from "@/lib/format"
import { OperationsBand } from "./operations-band"
import { CaseQueue } from "./case-queue"
import { CaseDetail } from "./case-detail"

export function Dashboard() {
  const { cases, activeCaseId, setActiveCaseId } = useStore()
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [camp, setCamp] = useState("all")

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return cases
      .filter((c) => matchesFilter(c, filter))
      .filter((c) => camp === "all" || c.demographics.current_camp === camp)
      .filter(
        (c) => !q || c.case_id.toLowerCase().includes(q) || c.demographics.name_hash.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const openA = a.human_oversight.status === "PENDING" ? 1 : 0
        const openB = b.human_oversight.status === "PENDING" ? 1 : 0
        return openB - openA || priorityOf(b) - priorityOf(a)
      })
  }, [cases, filter, search, camp])

  const selected = cases.find((c) => c.case_id === activeCaseId) ?? visible[0]

  useEffect(() => {
    const onKey = (e) => {
      const target = e.target
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return
      if (e.key !== "j" && e.key !== "k") return
      const idx = visible.findIndex((c) => c.case_id === selected?.case_id)
      const next = visible[Math.max(0, Math.min(visible.length - 1, idx + (e.key === "j" ? 1 : -1)))]
      if (next) setActiveCaseId(next.case_id)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [visible, selected, setActiveCaseId])

  return (
    <div className="min-h-full pb-12">
      <OperationsBand />
      <div className="mx-auto grid max-w-[1600px] items-start gap-6 px-4 py-6 md:px-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <CaseQueue
          allCases={cases}
          visibleCases={visible}
          selectedId={selected?.case_id ?? ""}
          onSelect={setActiveCaseId}
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
          camp={camp}
          onCampChange={setCamp}
        />
        {selected ? (
          <CaseDetail c={selected} />
        ) : (
          <p className="rounded-2xl bg-card p-10 text-center font-bold text-muted-foreground">Nessuna pratica selezionata</p>
        )}
      </div>
    </div>
  )
}
