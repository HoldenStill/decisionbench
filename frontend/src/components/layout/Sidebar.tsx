import React, { useState } from 'react';
import {
  Bookmark,
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Trash2,
  ExternalLink,
  Clock,
  ArrowRight
} from 'lucide-react';
import { ScenarioResponse, RunSummary } from '../../types';
import { formatLatency, formatMicroCost } from '../../utils/formatters';

interface SidebarProps {
  scenarios: ScenarioResponse[];
  runs: RunSummary[];
  onSelectScenario: (scenario: ScenarioResponse) => void;
  onSelectRun: (runId: string) => void;
  onDeleteRun: (runId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  scenarios,
  runs,
  onSelectScenario,
  onSelectRun,
  onDeleteRun,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'history'>('presets');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScenarios = scenarios.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRuns = runs.filter(
    (r) =>
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.raw_user_prompt && r.raw_user_prompt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      r.decision_model_requested.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCollapsed) {
    return (
      <div className="w-12 border-r border-[#27272a] bg-[#111114] flex flex-col items-center py-3 gap-3 transition-all shrink-0">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md border border-transparent hover:border-[#27272a]"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setIsCollapsed(false);
            setActiveTab('presets');
          }}
          className={`p-2 rounded-md ${activeTab === 'presets' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'}`}
          title="Presets & Scenarios"
        >
          <Bookmark className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setIsCollapsed(false);
            setActiveTab('history');
          }}
          className={`p-2 rounded-md ${activeTab === 'history' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400'}`}
          title="Decision Runs Ledger"
        >
          <History className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-72 border-r border-[#27272a] bg-[#111114] flex flex-col h-[calc(100vh-3.5rem)] shrink-0 transition-all select-none">
      {/* Top Tabs & Collapse button */}
      <div className="p-3 border-b border-[#27272a] flex items-center justify-between gap-2">
        <div className="flex bg-[#18181c] p-0.5 rounded-md border border-[#27272a] flex-1">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1 text-[11px] font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'presets'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            <span>Presets</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1 text-[11px] font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'history'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3 h-3" />
            <span>Runs ({runs.length})</span>
          </button>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md border border-transparent hover:border-[#27272a]"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-2.5 border-b border-[#27272a]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'presets' ? 'Filter scenarios...' : 'Search runs ledger...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181c] text-xs text-zinc-200 pl-8 pr-2.5 py-1.5 rounded-md border border-[#27272a] focus:outline-none focus:border-amber-500/50 placeholder:text-zinc-600 font-sans"
          />
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activeTab === 'presets' ? (
          filteredScenarios.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">No scenarios found.</div>
          ) : (
            filteredScenarios.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => onSelectScenario(scenario)}
                className="group p-2.5 rounded-lg bg-[#18181c] border border-[#27272a] hover:border-amber-500/40 hover:bg-zinc-900 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-1">
                  <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-amber-400 leading-snug line-clamp-1">
                    {scenario.name}
                  </h4>
                  {scenario.is_builtin && (
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                      Preset
                    </span>
                  )}
                </div>
                {scenario.description && (
                  <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {scenario.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {scenario.category}
                  </span>
                  <span className="font-mono flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                    Load <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            ))
          )
        ) : (
          filteredRuns.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">No past runs recorded.</div>
          ) : (
            filteredRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => onSelectRun(run.id)}
                className="group p-2.5 rounded-lg bg-[#18181c] border border-[#27272a] hover:border-amber-500/40 hover:bg-zinc-900 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">
                    {run.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-zinc-400">
                      {formatLatency(run.decision_latency_ms)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRun(run.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-opacity"
                      title="Delete run"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2 leading-snug">
                  {run.raw_user_prompt || 'Direct schema execution'}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-0.5">
                  <span className="truncate max-w-[120px]">{run.decision_model_requested}</span>
                  <span className="text-emerald-400 font-mono">
                    {formatMicroCost(run.decision_cost_usd)}
                  </span>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </aside>
  );
};
