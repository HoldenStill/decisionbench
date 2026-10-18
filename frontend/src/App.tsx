import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import {
  SettingsResponse,
  SettingsUpdateRequest,
  ModelItem,
  ExecuteResponse,
  ScenarioResponse,
  RunSummary,
  QuestionDefinition,
  ThresholdSettings
} from './types';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { SettingsModal } from './components/layout/SettingsModal';
import { OmniComposer } from './components/omni/OmniComposer';
import { DecisionCard } from './components/cards/DecisionCard';
import { DirectWorkbench } from './components/builder/DirectWorkbench';
import { CodeDrawer } from './components/inspector/CodeDrawer';
import { ComparisonCard } from './components/comparison/ComparisonCard';
import { AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  // App state
  const [activeMode, setActiveMode] = useState<'auto_compile' | 'direct'>('auto_compile');
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [stage1Models, setStage1Models] = useState<ModelItem[]>([]);
  const [stage2Models, setStage2Models] = useState<ModelItem[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);

  // Composer selections
  const [prompt, setPrompt] = useState('');
  const [selectedStage1Model, setSelectedStage1Model] = useState('openrouter/free');
  const [selectedStage2Model, setSelectedStage2Model] = useState('typesafe/jev-latest');
  const [comparisonModel, setComparisonModel] = useState<string | null>(null);
  const [isSweepEnabled, setIsSweepEnabled] = useState(false);

  // Execution status
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStep, setExecutionStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Results & Decisions History
  const [activeDecision, setActiveDecision] = useState<ExecuteResponse | null>(null);

  // Direct Workbench State
  const [workbenchState, setWorkbenchState] = useState<any>(
    'User is building a self-hosted single-user web app on a TrueNAS server.'
  );
  const [workbenchStateMode, setWorkbenchStateMode] = useState<'text' | 'json'>('text');
  const [workbenchQuestions, setWorkbenchQuestions] = useState<Record<string, QuestionDefinition>>({
    database_engine: {
      type: 'choice',
      instructions: 'Which database engine is best suited for this deployment?',
      criteria: {
        sqlite_wal: 'Embedded single-file relational database with Write-Ahead Logging; zero external container dependencies.',
        postgresql: 'Client-server relational database requiring a separate container process; advanced indexing.',
      },
    },
    single_container_safe: {
      type: 'noul',
      instructions: 'Is it safe and reliable to package this application inside a single Docker container?',
      criteria: {
        true: 'Single-container deployment is safe, reliable, and appropriate for the workload.',
        false: 'Single-container deployment risks data corruption or severe scaling bottlenecks.',
      },
    },
  });
  const [thresholds, setThresholds] = useState<ThresholdSettings>({ reject: 0.35, commit: 0.75 });

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [codeDrawerDecision, setCodeDrawerDecision] = useState<ExecuteResponse | null>(null);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [settingsRes, modelsRes, scenariosRes, runsRes] = await Promise.all([
        api.getSettings(),
        api.getModels(),
        api.getScenarios(),
        api.getRuns(50),
      ]);
      setSettings(settingsRes);
      setSelectedStage1Model(settingsRes.default_stage1_model);
      setSelectedStage2Model(settingsRes.default_stage2_model);
      setThresholds(settingsRes.thresholds);

      setStage1Models(modelsRes.stage1_models);
      setStage2Models(modelsRes.stage2_models);
      setScenarios(scenariosRes);
      setRuns(runsRes.items);
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
    }
  };

  // 1. Omni Auto-Compile + Run
  const handleExecuteFromOmni = async () => {
    if (!prompt.trim()) return;
    setIsExecuting(true);
    setErrorMessage(null);
    setExecutionStep('1. Compiling options & criteria (Stage 1)...');

    try {
      const mode = comparisonModel ? 'comparison' : isSweepEnabled ? 'sweep' : 'auto_compile';
      const res = await api.execute({
        mode,
        raw_prompt: prompt,
        parser_model: selectedStage1Model,
        decision_model: selectedStage2Model,
        comparison_model: comparisonModel,
        state: '',
        state_mode: 'text',
        questions: {},
        thresholds,
      });

      setActiveDecision(res);
      // Refresh runs ledger
      const updatedRuns = await api.getRuns(50);
      setRuns(updatedRuns.items);
    } catch (err: any) {
      setErrorMessage(err.message || 'Decision pipeline execution failed.');
    } finally {
      setIsExecuting(false);
      setExecutionStep('');
    }
  };

  // 2. Omni Compile to Editor Only
  const handleCompileOnly = async () => {
    if (!prompt.trim()) return;
    setIsExecuting(true);
    setErrorMessage(null);
    setExecutionStep('Compiling schema to Workbench...');

    try {
      const res = await api.compile(prompt, selectedStage1Model);
      setWorkbenchState(res.compiled.state);
      setWorkbenchStateMode(res.compiled.state_mode);
      setWorkbenchQuestions(res.compiled.questions);
      setActiveMode('direct');
    } catch (err: any) {
      setErrorMessage(err.message || 'Stage 1 schema compilation failed.');
    } finally {
      setIsExecuting(false);
      setExecutionStep('');
    }
  };

  // 3. Direct Workbench Run
  const handleExecuteFromWorkbench = async () => {
    setIsExecuting(true);
    setErrorMessage(null);
    setExecutionStep('Evaluating probabilities via Jev (Stage 2)...');

    try {
      const mode = comparisonModel ? 'comparison' : isSweepEnabled ? 'sweep' : 'direct';
      const res = await api.execute({
        mode,
        state: workbenchState,
        state_mode: workbenchStateMode,
        questions: workbenchQuestions,
        decision_model: selectedStage2Model,
        comparison_model: comparisonModel,
        thresholds,
      });

      setActiveDecision(res);
      // Refresh runs ledger
      const updatedRuns = await api.getRuns(50);
      setRuns(updatedRuns.items);
    } catch (err: any) {
      setErrorMessage(err.message || 'Direct decision execution failed.');
    } finally {
      setIsExecuting(false);
      setExecutionStep('');
    }
  };

  // 4. Live Tweak & Re-Run Loop (Bypass Stage 1, record delta)
  const handleReRunDecision = async (
    parentRunId: string,
    tweakedState: any,
    tweakedQuestions: Record<string, QuestionDefinition>
  ) => {
    setIsExecuting(true);
    setErrorMessage(null);

    try {
      const res = await api.execute({
        mode: 'direct',
        parent_run_id: parentRunId,
        state: tweakedState,
        state_mode: activeDecision?.state_mode || 'text',
        questions: tweakedQuestions,
        decision_model: activeDecision?.stage2_telemetry.model_requested || selectedStage2Model,
        thresholds,
      });

      setActiveDecision(res);
      const updatedRuns = await api.getRuns(50);
      setRuns(updatedRuns.items);
    } catch (err: any) {
      setErrorMessage(err.message || 'Re-run execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  // 5. Select Scenario Preset
  const handleSelectScenario = (scenario: ScenarioResponse) => {
    if (scenario.raw_prompt) {
      setPrompt(scenario.raw_prompt);
    }
    setWorkbenchState(scenario.state_content);
    setWorkbenchStateMode(scenario.state_mode);
    setWorkbenchQuestions(scenario.questions);
    if (scenario.thresholds) {
      setThresholds(scenario.thresholds);
    }
  };

  // 6. Select Historical Run
  const handleSelectRun = async (runId: string) => {
    try {
      const detail = await api.getRun(runId);
      // Convert RunDetail to ExecuteResponse shape
      const reconstructed: ExecuteResponse = {
        run_id: detail.id,
        mode: detail.mode as any,
        raw_prompt: detail.raw_user_prompt,
        state: detail.state_payload,
        state_mode: 'text',
        questions: detail.questions_payload,
        answers: detail.answers_payload,
        metrics: (detail.metrics_payload as any) || {},
        stage1_telemetry: {
          model: detail.parser_model || 'bypassed',
          latency_ms: detail.parser_latency_ms,
          tokens_in: detail.parser_tokens_in,
          tokens_out: detail.parser_tokens_out,
          cost_usd: detail.parser_cost_usd,
          bypassed: !detail.parser_model || detail.parser_model === 'bypassed',
        },
        stage2_telemetry: {
          model_requested: detail.decision_model_requested,
          model_served: detail.decision_model_served || detail.decision_model_requested,
          gen_id: detail.openrouter_gen_id || '',
          latency_ms: detail.decision_latency_ms,
          tokens_in: detail.decision_input_tokens,
          tokens_out: detail.decision_output_tokens,
          cost_usd: detail.decision_cost_usd,
          cost_per_1k: detail.decision_cost_usd * 1000,
          cost_per_1m: detail.decision_cost_usd * 1000000,
        },
        created_at: detail.created_at,
      };
      setActiveDecision(reconstructed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load run details.');
    }
  };

  // 7. Delete Run
  const handleDeleteRun = async (runId: string) => {
    try {
      await api.deleteRun(runId);
      setRuns(runs.filter((r) => r.id !== runId));
      if (activeDecision?.run_id === runId) {
        setActiveDecision(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete run.');
    }
  };

  // 8. Save Scenario
  const handleSaveScenario = async (
    name: string,
    state: any,
    questions: Record<string, QuestionDefinition>
  ) => {
    try {
      const created = await api.createScenario({
        name,
        category: 'Custom',
        raw_prompt: prompt || null,
        state_mode: workbenchStateMode,
        state_content: typeof state === 'string' ? state : JSON.stringify(state, null, 2),
        questions,
        thresholds,
      });
      setScenarios([created, ...scenarios]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save scenario preset.');
    }
  };

  const handleSaveWorkbenchAsScenario = async () => {
    const name = window.prompt('Enter a name for this Scenario preset:');
    if (name && name.trim()) {
      await handleSaveScenario(name.trim(), workbenchState, workbenchQuestions);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeMode={activeMode}
        onModeChange={setActiveMode}
        isConfigured={settings?.is_configured ?? false}
        maskedKey={settings?.masked_key ?? ''}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Rail (Sidebar) */}
        <Sidebar
          scenarios={scenarios}
          runs={runs}
          onSelectScenario={handleSelectScenario}
          onSelectRun={handleSelectRun}
          onDeleteRun={handleDeleteRun}
        />

        {/* Center Canvas */}
        <main className="flex-1 overflow-y-auto px-6 py-6 max-w-5xl mx-auto w-full space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-rose-400 font-mono">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-zinc-500 hover:text-zinc-300 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {activeMode === 'auto_compile' ? (
            /* Mode 1: Omni Dilemma Flow */
            <div className="space-y-6">
              <OmniComposer
                prompt={prompt}
                onPromptChange={setPrompt}
                stage1Models={stage1Models}
                stage2Models={stage2Models}
                selectedStage1Model={selectedStage1Model}
                onSelectStage1Model={setSelectedStage1Model}
                selectedStage2Model={selectedStage2Model}
                onSelectStage2Model={setSelectedStage2Model}
                comparisonModel={comparisonModel}
                onComparisonModelChange={setComparisonModel}
                isSweepEnabled={isSweepEnabled}
                onToggleSweep={() => setIsSweepEnabled(!isSweepEnabled)}
                isExecuting={isExecuting}
                executionStep={executionStep}
                onExecute={handleExecuteFromOmni}
                onCompileOnly={handleCompileOnly}
              />

              {/* Active Decision Result Card */}
              {activeDecision ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                      Active Decision Evaluation ({activeDecision.run_id})
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Evaluated at {activeDecision.created_at}
                    </span>
                  </div>

                  {/* Side-by-side comparison card if returned */}
                  {activeDecision.comparison_result && (
                    <ComparisonCard
                      decision={activeDecision}
                      comparison={activeDecision.comparison_result}
                    />
                  )}

                  <DecisionCard
                    decision={activeDecision}
                    thresholds={thresholds}
                    onReRunDecision={handleReRunDecision}
                    onOpenInWorkbench={(st, qs, p) => {
                      setWorkbenchState(st);
                      setWorkbenchQuestions(qs);
                      if (p) setPrompt(p);
                      setActiveMode('direct');
                    }}
                    onOpenCodeDrawer={(d) => {
                      setCodeDrawerDecision(d);
                      setIsCodeDrawerOpen(true);
                    }}
                    onSaveScenario={handleSaveScenario}
                    isReRunning={isExecuting}
                  />
                </div>
              ) : (
                <div className="text-center py-16 border border-dashed border-[#27272a] rounded-xl space-y-2 bg-[#111114]/40">
                  <Sparkles className="w-8 h-8 text-amber-500/40 mx-auto" />
                  <h4 className="text-xs font-semibold text-zinc-400 font-mono">
                    Awaiting Dilemma Submission
                  </h4>
                  <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                    Type a dilemma in the composer above or load a starter preset from the sidebar to evaluate probabilities via Jev.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Direct Schema Workbench */
            <div className="space-y-6">
              <DirectWorkbench
                stateContent={workbenchState}
                stateMode={workbenchStateMode}
                onStateContentChange={setWorkbenchState}
                onStateModeChange={setWorkbenchStateMode}
                questions={workbenchQuestions}
                onQuestionsChange={setWorkbenchQuestions}
                thresholds={thresholds}
                onThresholdsChange={setThresholds}
                stage2Models={stage2Models}
                selectedDecisionModel={selectedStage2Model}
                onSelectDecisionModel={setSelectedStage2Model}
                comparisonModel={comparisonModel}
                onComparisonModelChange={setComparisonModel}
                isSweepEnabled={isSweepEnabled}
                onToggleSweep={() => setIsSweepEnabled(!isSweepEnabled)}
                isExecuting={isExecuting}
                onExecute={handleExecuteFromWorkbench}
                onSaveScenario={handleSaveWorkbenchAsScenario}
              />

              {activeDecision && (
                <div className="space-y-3 pt-6 border-t border-[#27272a]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                    Workbench Decision Output ({activeDecision.run_id})
                  </span>
                  <DecisionCard
                    decision={activeDecision}
                    thresholds={thresholds}
                    onReRunDecision={handleReRunDecision}
                    onOpenInWorkbench={(st, qs) => {
                      setWorkbenchState(st);
                      setWorkbenchQuestions(qs);
                    }}
                    onOpenCodeDrawer={(d) => {
                      setCodeDrawerDecision(d);
                      setIsCodeDrawerOpen(true);
                    }}
                    onSaveScenario={handleSaveScenario}
                    isReRunning={isExecuting}
                  />
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        stage1Models={stage1Models}
        stage2Models={stage2Models}
        onSaveSettings={async (updated) => {
          const res = await api.updateSettings(updated);
          setSettings(res);
          setSelectedStage1Model(res.default_stage1_model);
          setSelectedStage2Model(res.default_stage2_model);
          setThresholds(res.thresholds);
        }}
        onTestConnection={(k) => api.testConnection(k)}
      />

      {/* Drop-in Code & JSON Drawer */}
      <CodeDrawer
        isOpen={isCodeDrawerOpen}
        onClose={() => setIsCodeDrawerOpen(false)}
        decision={codeDrawerDecision}
      />
    </div>
  );
};

export default App;
