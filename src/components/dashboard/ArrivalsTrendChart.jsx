import { useEffect, useRef } from "react"
import { ARRIVALS_30_DAYS } from "@/data/field-operations-data"

export function ArrivalsTrendChart() {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return

    const labels = ARRIVALS_30_DAYS.map((d) => d.date)
    const arrivals = ARRIVALS_30_DAYS.map((d) => d.arrivals)

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    chartInstance.current = new window.Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Daily Arrivals (Registered)",
            data: arrivals,
            borderColor: "#0072bc",
            backgroundColor: "rgba(0, 114, 188, 0.08)",
            borderWidth: 2,
            fill: true,
            tension: 0.2,
            pointRadius: 2.5,
            pointBackgroundColor: "#0072bc",
            pointHoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#1c1c1b",
            titleFont: { family: "Montserrat", size: 12, weight: "bold" },
            bodyFont: { family: "JetBrains Mono", size: 12 },
            padding: 10,
            cornerRadius: 0,
            displayColors: false,
            callbacks: {
              label: (context) => `${context.parsed.y} individui registrati`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "JetBrains Mono", size: 10 },
              color: "#526071",
              maxTicksLimit: 8,
            },
          },
          y: {
            min: 50,
            max: 220,
            grid: {
              color: "#dbe3ec",
              borderDash: [2, 3],
            },
            ticks: {
              font: { family: "JetBrains Mono", size: 10 },
              color: "#526071",
              stepSize: 50,
            },
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [])

  return (
    <div className="border border-border bg-white p-5 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-brand">
              Trend of Daily Arrivals &amp; Registrations (Past 30 Days)
            </h2>
            <span className="text-[11px] text-muted-foreground">
              Flussi registrati ai reception desk di frontiera (Sudan, Somalia, RDC)
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-muted-foreground">
              Media mobile: <strong className="text-brand">138 arrivi/giorno</strong>
            </span>
          </div>
        </div>

        <div className="relative mt-4 h-64 w-full">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      <div className="border-t border-border pt-3 mt-2 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground">
        <span>Fonte dati: UNHCR proGres v4 · Frontiera di Lokichogio e corridoio Dadaab</span>
        <span className="font-semibold text-foreground">Picco rilevato: 16 Settembre (Corridoio Sudan: 195 arrivi)</span>
      </div>
    </div>
  )
}
