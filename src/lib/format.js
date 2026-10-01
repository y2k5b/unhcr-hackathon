const TZ = "Africa/Nairobi"

export const OPERATOR_ID = "OP-207"

export function formatDateTime(iso, locale = "it-IT") {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso))
}

export function formatDate(iso, locale = "it-IT") {
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric", timeZone: TZ }).format(
    new Date(iso),
  )
}

export function usd(n) {
  return `$${(n ?? 0).toLocaleString("en-US")}`
}

export const TAG_LABELS = {
  single_parent: "Genitore single",
  chronic_illness: "Malattia cronica",
  unaccompanied_minors: "Minori non accompagnati",
  new_arrival: "Nuovo arrivo",
  informal_employment: "Lavoro informale",
  disability: "Disabilità",
  large_household: "Nucleo numeroso",
  pregnancy: "Gravidanza",
  female_headed: "Capofamiglia donna",
  elderly_dependent: "Anziano a carico",
}

export const ACTION_LABELS = {
  APPROVE: "Approvare",
  REJECT: "Respingere",
  REVIEW: "Revisione umana",
}

export const STATUS_LABELS = {
  PENDING: "Da decidere",
  APPROVED: "Autorizzata",
  REJECTED: "Respinta",
  ESCALATED: "Inoltrata",
}

export function priorityOf(c) {
  const appealBoost = c.human_oversight.appeal && c.human_oversight.status === "PENDING" ? 1000 : 0
  const reviewBoost = c.ai_assessment.recommended_action === "REVIEW" ? 200 : 0
  return appealBoost + reviewBoost + c.vulnerability_profile.overall_score
}

export function voucherCode(c) {
  const digits = c.case_id.slice(-3)
  const sum = [...c.case_id].reduce((a, ch) => a + ch.charCodeAt(0), 0)
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const check = alphabet[sum % alphabet.length] + alphabet[(sum * 7) % alphabet.length]
  return `${c.demographics.current_camp.slice(0, 3).toUpperCase()}-${digits}-${check}`
}

export const FILTERS = [
  { id: "open", label: "Aperte" },
  { id: "review", label: "Revisione IA" },
  { id: "appeals", label: "Ricorsi" },
  { id: "closed", label: "Concluse" },
  { id: "all", label: "Tutte" },
]

export function matchesFilter(c, f) {
  const open = c.human_oversight.status === "PENDING"
  switch (f) {
    case "open":
      return open
    case "review":
      return open && c.ai_assessment.recommended_action === "REVIEW"
    case "appeals":
      return open && !!c.human_oversight.appeal
    case "closed":
      return !open
    case "all":
      return true
    default:
      return true
  }
}
