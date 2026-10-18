export type PrimitiveType = 'noul' | 'choice' | 'score';

export interface NoulQuestion {
  type: 'noul';
  instructions: string;
  criteria?: {
    true?: string;
    false?: string;
  };
}

export interface ChoiceQuestion {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string>;
}

export interface ScoreQuestion {
  type: 'score';
  instructions: string;
  criteria: string[];
}

export type QuestionDefinition = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export interface NoulAnswer {
  type: 'noul';
  noul: number;
}

export interface ChoiceAnswer {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface ScoreAnswer {
  type: 'score';
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
}

export type AnswerDefinition = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export interface QuestionMetrics {
  entropy: number;
  normalized_entropy: number;
  certainty: number;
  top2_margin?: number | null;
  verdict?: string | null;
  deltas?: Record<string, number> | null;
}

export interface Stage1Telemetry {
  model: string;
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  bypassed: boolean;
}

export interface Stage2Telemetry {
  model_requested: string;
  model_served: string;
  gen_id: string;
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  cost_per_1k: number;
  cost_per_1m: number;
}

export interface SweepResult {
  iteration: number;
  answers: Record<string, AnswerDefinition>;
  latency_ms: number;
  tokens: number;
}

export interface ComparisonResult {
  model_requested: string;
  model_served: string;
  answers: Record<string, AnswerDefinition>;
  metrics: Record<string, QuestionMetrics>;
  telemetry: Stage2Telemetry;
}

export interface ExecuteResponse {
  run_id: string;
  mode: 'auto_compile' | 'direct' | 'sweep' | 'comparison';
  raw_prompt?: string | null;
  state: any;
  state_mode: 'text' | 'json';
  questions: Record<string, QuestionDefinition>;
  answers: Record<string, AnswerDefinition>;
  metrics: Record<string, QuestionMetrics>;
  stage1_telemetry: Stage1Telemetry;
  stage2_telemetry: Stage2Telemetry;
  comparison_result?: ComparisonResult | null;
  sweep_results?: SweepResult[] | null;
  created_at: string;
}

export interface ExecuteRequest {
  mode: 'auto_compile' | 'direct' | 'sweep' | 'comparison';
  raw_prompt?: string | null;
  parser_model?: string | null;
  decision_model: string;
  comparison_model?: string | null;
  state: any;
  state_mode: 'text' | 'json';
  questions: Record<string, QuestionDefinition>;
  thresholds?: { reject: number; commit: number } | null;
  parent_run_id?: string | null;
  scenario_id?: string | null;
}

export interface CompileResponse {
  compiled: {
    state: any;
    state_mode: 'text' | 'json';
    questions: Record<string, QuestionDefinition>;
  };
  telemetry: Stage1Telemetry;
}

export interface ModelItem {
  id: string;
  name: string;
  description?: string | null;
  stage: 'stage1' | 'stage2';
  provider: string;
  tags: string[];
  input_cost_per_m?: number | null;
  output_cost_per_m?: number | null;
  is_free: boolean;
  is_default: boolean;
}

export interface ModelsListResponse {
  stage1_models: ModelItem[];
  stage2_models: ModelItem[];
}

export interface ThresholdSettings {
  reject: number;
  commit: number;
}

export interface SettingsResponse {
  is_configured: boolean;
  masked_key: string;
  has_env_key: boolean;
  default_stage1_model: string;
  default_stage2_model: string;
  pinned_models: string[];
  thresholds: ThresholdSettings;
  updated_at?: string | null;
}

export interface SettingsUpdateRequest {
  openrouter_api_key?: string | null;
  default_stage1_model?: string | null;
  default_stage2_model?: string | null;
  pinned_models?: string[] | null;
  thresholds?: ThresholdSettings | null;
}

export interface ScenarioResponse {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  raw_prompt?: string | null;
  state_mode: 'text' | 'json';
  state_content: string;
  questions: Record<string, QuestionDefinition>;
  thresholds?: ThresholdSettings | null;
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScenarioCreate {
  name: string;
  description?: string | null;
  category?: string;
  raw_prompt?: string | null;
  state_mode: 'text' | 'json';
  state_content: string;
  questions: Record<string, QuestionDefinition>;
  thresholds?: ThresholdSettings | null;
}

export interface RunSummary {
  id: string;
  parent_run_id?: string | null;
  scenario_id?: string | null;
  mode: string;
  raw_user_prompt?: string | null;
  decision_model_requested: string;
  decision_model_served?: string | null;
  status: string;
  decision_latency_ms: number;
  decision_cost_usd: number;
  created_at: string;
}

export interface RunDetail extends RunSummary {
  parser_model?: string | null;
  parser_latency_ms: number;
  parser_tokens_in: number;
  parser_tokens_out: number;
  parser_cost_usd: number;
  openrouter_gen_id?: string | null;
  state_payload: any;
  questions_payload: Record<string, QuestionDefinition>;
  answers_payload: Record<string, AnswerDefinition>;
  metrics_payload?: Record<string, QuestionMetrics> | null;
  decision_input_tokens: number;
  decision_output_tokens: number;
  error_message?: string | null;
}
