import { Dashboard as OperatorDashboard } from "@/components/operator/dashboard"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

export default function CashRegistry() {
  return (
    <div>
      <div className="border-b border-border bg-white px-4 py-2 text-xs">
        <Link to="/" className="inline-flex items-center gap-1.5 font-bold text-brand hover:underline">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Torna al Quadro Operativo Generale
        </Link>
      </div>
      <OperatorDashboard />
    </div>
  )
}
