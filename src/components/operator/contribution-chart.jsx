export function ContributionChart({ features }) {
  const sorted = [...features].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
  const max = Math.max(...sorted.map((f) => Math.abs(f.weight)), 0.01)

  return (
    <figure>
      <figcaption className="mb-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-destructive" aria-hidden="true" /> Riduce il punteggio
        </span>
        <span className="flex items-center gap-1.5">
          Aumenta il punteggio <span className="size-2.5 rounded-sm bg-brand" aria-hidden="true" />
        </span>
      </figcaption>
      <ul className="space-y-3">
        {sorted.map((f) => {
          const pct = (Math.abs(f.weight) / max) * 50
          const positive = f.weight >= 0
          return (
            <li key={f.feature}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-semibold">
                  {f.label} <span className="font-normal text-muted-foreground">· {f.value}</span>
                </span>
                <span className={positive ? "font-mono font-bold text-brand" : "font-mono font-bold text-destructive"}>
                  {positive ? "+" : ""}
                  {f.weight.toFixed(2)}
                </span>
              </div>
              <div className="relative h-3 rounded-sm bg-muted" aria-hidden="true">
                <div className="absolute inset-y-0 left-1/2 w-px bg-ink/40" />
                <div
                  className={positive ? "absolute inset-y-0 left-1/2 rounded-r-sm bg-brand" : "absolute inset-y-0 right-1/2 rounded-l-sm bg-destructive"}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <code className="mt-1 block font-mono text-[11px] text-muted-foreground">{f.feature}</code>
            </li>
          )
        })}
      </ul>
    </figure>
  )
}
