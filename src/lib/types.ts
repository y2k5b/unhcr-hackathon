// Data contract for the offline Python pipeline → data/mock-data.json.
// Every field below must be emitted by the script; UI-only state (decisions, appeals) lives in human_oversight.

export type Lang = "it" | "en" | "ar"
export type Localized = Record<Lang, string>

export type RecommendedAction = "APPROVE" | "REJECT" | "REVIEW"
export type OversightStatus = "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED"

export type ReasonIcon = "family" | "health" | "time" | "income" | "document" | "aid" | "child"

export interface FeatureImportance {
  feature: string
  label: string
  value: string
  weight: number
}

export interface DataQualityFlag {
  code: string
  severity: "info" | "warning" | "critical"
  message: string
}

export interface BeneficiaryReason {
  icon: ReasonIcon
  text: Localized
}

export interface AuditEntry {
  timestamp: string
  actor: string
  action: string
  note?: string
}

export interface Appeal {
  submitted_at: string
  reason: string
  message: string
}

export interface Case {
  case_id: string
  submitted_at: string
  demographics: {
    name_hash: string
    origin_country: string
    family_size: number
    unaccompanied_minors: number
    months_displaced: number
    current_camp: string
    preferred_language: Lang
  }
  vulnerability_profile: {
    overall_score: number
    tags: string[]
    previous_aid_received_usd: number
  }
  ai_assessment: {
    recommended_action: RecommendedAction
    suggested_amount_usd: number
    confidence: number
    model_version: string
  }
  xai_explanation: {
    operator_summary: string
    feature_importances: FeatureImportance[]
    counterfactual: string
    beneficiary_reasons: BeneficiaryReason[]
    data_quality_flags: DataQualityFlag[]
  }
  distribution: {
    point: string
    window: string
  }
  human_oversight: {
    status: OversightStatus
    final_amount_usd: number | null
    operator_id: string | null
    decision_reason: string | null
    decided_at: string | null
    audit_trail: AuditEntry[]
    appeal: Appeal | null
  }
}

export interface Dataset {
  metadata: {
    generated_at: string
    operation: string
    cycle: string
    currency: "USD"
    budget_total_usd: number
    max_amount_usd: number
    model_version: string
  }
  cases: Case[]
}
