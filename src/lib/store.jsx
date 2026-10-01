import { createContext, useCallback, useContext, useMemo, useReducer, useState } from "react"
import rawData from "@/data/mock-data.json"
import { OPERATOR_ID } from "@/lib/format"

const dataset = rawData

function updateCase(cases, caseId, fn) {
  return cases.map((c) => (c.case_id === caseId ? fn(c) : c))
}

const STATUS_VERB = {
  APPROVED: "Erogazione autorizzata",
  REJECTED: "Pratica respinta",
  ESCALATED: "Inoltrata a Protection Officer",
}

function reducer(cases, action) {
  const now = new Date().toISOString()
  switch (action.type) {
    case "decide":
      return updateCase(cases, action.caseId, (c) => ({
        ...c,
        human_oversight: {
          ...c.human_oversight,
          status: action.status,
          final_amount_usd: action.status === "APPROVED" ? action.amount : null,
          operator_id: OPERATOR_ID,
          decision_reason: action.reason,
          decided_at: now,
          audit_trail: [
            ...c.human_oversight.audit_trail,
            {
              timestamp: now,
              actor: OPERATOR_ID,
              action:
                action.status === "APPROVED"
                  ? `${STATUS_VERB.APPROVED}: $${action.amount}`
                  : STATUS_VERB[action.status],
              note: action.reason ?? undefined,
            },
          ],
        },
      }))
    case "reopen":
      return updateCase(cases, action.caseId, (c) => ({
        ...c,
        human_oversight: {
          ...c.human_oversight,
          status: "PENDING",
          final_amount_usd: null,
          decision_reason: null,
          decided_at: null,
          audit_trail: [
            ...c.human_oversight.audit_trail,
            { timestamp: now, actor: OPERATOR_ID, action: "Pratica riaperta per nuova revisione" },
          ],
        },
      }))
    case "appeal":
      return updateCase(cases, action.caseId, (c) => ({
        ...c,
        human_oversight: {
          ...c.human_oversight,
          status: "PENDING",
          appeal: { submitted_at: now, reason: action.reason, message: action.message },
          audit_trail: [
            ...c.human_oversight.audit_trail,
            {
              timestamp: now,
              actor: "Beneficiario",
              action: `Richiesta di revisione: ${action.reason}`,
              note: action.message || undefined,
            },
          ],
        },
      }))
    default:
      return cases
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [cases, dispatch] = useReducer(reducer, dataset.cases)
  const [activeCaseId, setActiveCaseId] = useState(dataset.cases[0]?.case_id ?? "")

  const committedUsd = useMemo(
    () =>
      cases.reduce(
        (sum, c) => sum + (c.human_oversight.status === "APPROVED" ? (c.human_oversight.final_amount_usd ?? 0) : 0),
        0,
      ),
    [cases],
  )

  const exportDecisions = useCallback(() => {
    const payload = { metadata: { ...dataset.metadata, generated_at: new Date().toISOString() }, cases }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `decisioni-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [cases])

  const value = useMemo(
    () => ({
      metadata: dataset.metadata,
      cases,
      committedUsd,
      remainingUsd: dataset.metadata.budget_total_usd - committedUsd,
      decide: (a) => dispatch({ type: "decide", ...a }),
      reopen: (caseId) => dispatch({ type: "reopen", caseId }),
      appeal: (caseId, reason, message) => dispatch({ type: "appeal", caseId, reason, message }),
      activeCaseId,
      setActiveCaseId,
      exportDecisions,
    }),
    [cases, committedUsd, activeCaseId, exportDecisions],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
