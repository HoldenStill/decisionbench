import {
  SettingsResponse,
  SettingsUpdateRequest,
  ModelsListResponse,
  ExecuteRequest,
  ExecuteResponse,
  CompileResponse,
  ScenarioResponse,
  ScenarioCreate,
  RunDetail,
  RunSummary
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorDetail = `Request failed: ${res.statusText}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Settings
  getSettings: () => request<SettingsResponse>('/settings'),
  updateSettings: (data: SettingsUpdateRequest) =>
    request<SettingsResponse>('/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testConnection: (apiKey?: string) =>
    request<{ success: boolean; message: string; models_available: number }>('/settings/test-connection', {
      method: 'POST',
      body: JSON.stringify({ openrouter_api_key: apiKey }),
    }),

  // Models
  getModels: () => request<ModelsListResponse>('/models'),

  // Decisions
  compile: (prompt: string, model?: string) =>
    request<CompileResponse>('/decisions/compile', {
      method: 'POST',
      body: JSON.stringify({ prompt, model }),
    }),
  execute: (data: ExecuteRequest) =>
    request<ExecuteResponse>('/decisions/execute', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Scenarios
  getScenarios: (category?: string) =>
    request<ScenarioResponse[]>(category ? `/scenarios?category=${encodeURIComponent(category)}` : '/scenarios'),
  getScenario: (id: string) => request<ScenarioResponse>(`/scenarios/${id}`),
  createScenario: (data: ScenarioCreate) =>
    request<ScenarioResponse>('/scenarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteScenario: (id: string) =>
    request<{ deleted: boolean; id: string }>(`/scenarios/${id}`, {
      method: 'DELETE',
    }),

  // Runs
  getRuns: (limit = 50, offset = 0) =>
    request<{ items: RunSummary[]; total: number; limit: number; offset: number }>(
      `/runs?limit=${limit}&offset=${offset}`
    ),
  getRun: (id: string) => request<RunDetail>(`/runs/${id}`),
  deleteRun: (id: string) =>
    request<{ deleted: boolean; id: string }>(`/runs/${id}`, {
      method: 'DELETE',
    }),
};
