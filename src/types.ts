export interface CitizenInput {
  input_id: number;
  original_text: string;
}

export interface NormalizedRecord {
  input_id: number;
  original_text: string;
  detected_languages: string[];
  normalized_english: string;
  category: string;
  sitio_mentioned: string | null;
  input_type: "issue" | "suggestion" | "noise";
  severity_language_score: number;
}

export interface ThemeDetail {
  theme_id: string;
  category: string;
  theme_label: string;
  mention_count: number;
  sitios_affected: string[];
  avg_severity_language_score: number;
  input_type_breakdown: {
    issue: number;
    suggestion: number;
    noise: number;
  };
  representative_quotes: string[];
}

export interface DiscardedNoise {
  input_id: number;
  reason: string;
}

export interface Phase3Output {
  themes: ThemeDetail[];
  discarded_noise: DiscardedNoise[];
}

export interface RankedPriority {
  theme_id: string;
  theme_label: string;
  scores: {
    coverage: number | null;
    geographic_concentration: number | null;
    time_consistency: number | null;
    population_impact: number | null;
  };
  composite_priority_score: number;
  criteria_scored_count: number;
  data_gaps: string[];
  budget_fit: "fits_within_fund" | "partial_fit" | "exceeds_fund_needs_city_support" | "conflicts_with_planned_project";
  budget_fit_explanation: string;
}

export interface Phase4Output {
  ranked_priorities: RankedPriority[];
}

export interface ProjectPitch {
  theme_id: string;
  pitch_title: string;
  description: string;
  estimated_cost_range_php: string;
  estimated_impact: string;
  citizen_rationale: string;
  feasibility_flag: "fits_budget" | "needs_phasing" | "recommend_escalation_to_city";
  conflict_warning: string | null;
}

export interface DashboardSummary {
  headline: string;
}

export interface Phase5Output {
  dashboard_summary: DashboardSummary[];
  project_pitches: ProjectPitch[];
}

export interface Phase6Output {
  resolutionText: string;
  ppmpText: string;
  budgetBreakdownText: string;
}

// Data input schemas for the pipeline parameters:
export interface BarangayCensus {
  sitio_populations: { [sitioName: string]: number };
  sitio_households: { [sitioName: string]: number };
}

export interface BarangayBudget {
  development_fund_php: number;
  planned_projects: string[];
}

export interface BarangayDataInput {
  census: BarangayCensus;
  budget: BarangayBudget;
  report_history: string;
}
