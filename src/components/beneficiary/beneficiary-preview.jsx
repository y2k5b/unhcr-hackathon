import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { useStore } from "@/lib/store"
import { STATUS_LABELS } from "@/lib/format"
import { BeneficiaryApp } from "./beneficiary-app"

export function BeneficiaryPreview() {
  const { cases, activeCaseId, setActiveCaseId } = useStore()
  const c = cases.find((x) => x.case_id === activeCaseId) ?? cases[0]

  if (!c) {
    return <div className="p-10 text-center font-bold">Nessun dato disponibile</div>
  }

  return (
    <div className="bg-scene min-h-[calc(100vh-100px)] py-6 lg:py-12">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 lg:grid-cols-[1fr_auto] lg:px-6">
        <div className="hidden space-y-6 text-white lg:block">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-soft">Vista beneficiario · Mobile</p>
          <h1 className="text-balance text-4xl font-extrabold leading-tight text-white">
            Ogni decisione, spiegata nella lingua di chi la riceve.
          </h1>
          <p className="max-w-md text-pretty text-brand-soft">
            {
              "Motivazioni in linguaggio semplice, lettura ad alta voce, diritto di chiedere una revisione umana. Le decisioni prese nel Registro si riflettono qui in tempo reale, e i ricorsi arrivano in coda all'operatore."
            }
          </p>
          <label className="block max-w-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-soft">Simula il telefono di</span>
            <select
              value={c.case_id}
              onChange={(e) => setActiveCaseId(e.target.value)}
              className="mt-2 w-full rounded-md border-0 bg-white px-3 py-2.5 font-semibold text-ink shadow-sm outline-none"
            >
              {cases.map((x) => (
                <option key={x.case_id} value={x.case_id}>
                  {x.case_id} · {x.demographics.name_hash} · {STATUS_LABELS[x.human_oversight.status]}
                </option>
              ))}
            </select>
          </label>
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-white underline-offset-4 hover:underline">
              <ArrowLeft className="size-4" aria-hidden="true" /> Torna al Registro per decidere
            </Link>
          </div>
        </div>

        {/* Mobile simulator dropdown for small screens */}
        <div className="block lg:hidden text-white space-y-2">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-soft">Seleziona pratica:</span>
            <select
              value={c.case_id}
              onChange={(e) => setActiveCaseId(e.target.value)}
              className="mt-1 w-full rounded-md border-0 bg-white px-3 py-2 font-semibold text-ink shadow-sm"
            >
              {cases.map((x) => (
                <option key={x.case_id} value={x.case_id}>
                  {x.case_id} · {x.demographics.name_hash} · {STATUS_LABELS[x.human_oversight.status]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mx-auto w-full lg:w-[390px]">
          <div className="border-ink bg-background lg:h-[800px] lg:overflow-y-auto lg:rounded-[2.75rem] lg:border-[10px] lg:shadow-2xl overflow-hidden rounded-2xl border-2">
            <BeneficiaryApp key={c.case_id} c={c} />
          </div>
        </div>
      </div>
    </div>
  )
}
