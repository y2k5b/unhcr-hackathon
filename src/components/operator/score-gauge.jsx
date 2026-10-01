export function ScoreGauge({ score, confidence }) {
  const radius = 52
  const circumference = Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const lowConfidence = confidence < 0.7

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[72px] w-[128px]">
        <svg viewBox="0 0 128 72" className="size-full" role="img" aria-label={`Punteggio di vulnerabilità ${score} su 100`}>
          <path d="M 12 64 A 52 52 0 0 1 116 64" fill="none" stroke="var(--muted)" strokeWidth="12" strokeLinecap="round" />
          <path
            d="M 12 64 A 52 52 0 0 1 116 64"
            fill="none"
            stroke="var(--brand)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center leading-none">
          <span className="text-3xl font-extrabold text-brand">{score}</span>
          <span className="text-xs font-bold text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="text-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Confidenza IA</div>
        <div className={lowConfidence ? "text-2xl font-extrabold text-orange-700" : "text-2xl font-extrabold"}>
          {Math.round(confidence * 100)}%
        </div>
        <div className="text-xs text-muted-foreground">{lowConfidence ? "Sotto soglia 70%" : "Sopra soglia 70%"}</div>
      </div>
    </div>
  )
}
