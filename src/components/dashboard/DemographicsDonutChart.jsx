import { useEffect, useRef } from "react"

export function DemographicsDonutChart() {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (!chartRef.current || !window.Chart) return

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    chartInstance.current = new window.Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [
          "Women & Girls (18–59): 38%",
          "Children & UASC (0–17): 29%",
          "Men (18–59): 26%",
          "Elderly / Highly Vulnerable: 7%",
        ],
        datasets: [
          {
            data: [38, 29, 26, 7],
            backgroundColor: [
              "#0072bc", // Official UNHCR Blue (Women)
              "#ffd100", // Official UNHCR Accent (Children & UASC)
              "#0a3d6b", // Deep Navy (Men)
              "#526071", // Neutral Slate (Elderly)
            ],
            borderColor: "#ffffff",
            borderWidth: 2,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 12,
              padding: 12,
              font: { family: "Montserrat", size: 11, weight: "600" },
              color: "#1c1c1b",
            },
          },
          tooltip: {
            backgroundColor: "#1c1c1b",
            titleFont: { family: "Montserrat", size: 11, weight: "bold" },
            bodyFont: { family: "JetBrains Mono", size: 11 },
            padding: 8,
            cornerRadius: 0,
            callbacks: {
              label: (context) => ` ${context.label}`,
            },
          },
        },
        cutout: "66%",
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
              Demographic &amp; Vulnerability Profile
            </h2>
            <span className="text-[11px] text-muted-foreground">
              Ripartizione del Protection Cluster per priorità di assistenza
            </span>
          </div>
        </div>

        <div className="relative mt-4 h-64 w-full flex items-center justify-center">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      <div className="border-t border-border pt-3 mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>
          BAMBINI E MINORI (inclusi 3.840 UASC non accompagnati):{" "}
          <strong className="text-foreground">Priorità BIA/BID</strong>
        </span>
      </div>
    </div>
  )
}
