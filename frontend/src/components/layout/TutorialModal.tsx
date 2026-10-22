import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  Sparkles,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Cpu,
  Layers,
  Scale,
  Zap,
  ShieldCheck,
  Code
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'quickstart' | 'autocompile' | 'primitives' | 'workbench' | 'tuning';

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('quickstart');

  if (!isOpen) return null;

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'quickstart', label: '1. Quickstart', icon: <Zap className="w-3.5 h-3.5" /> },
    { key: 'autocompile', label: '2. Auto-Compile Mode', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'primitives', label: '3. Primitives (Noul/Choice/Score)', icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'workbench', label: '4. Direct Workbench', icon: <Sliders className="w-3.5 h-3.5" /> },
    { key: 'tuning', label: '5. Anti-Bias & Re-Runs', icon: <Scale className="w-3.5 h-3.5" /> },
  ];

  const handleNext = () => {
    const currentIndex = tabs.findIndex((t) => t.key === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].key);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    const currentIndex = tabs.findIndex((t) => t.key === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].key);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl bg-[#111114] border border-[#27272a] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#27272a] flex items-center justify-between bg-[#141418]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>Setting Up Decision Requests</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                  Guide
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                How System One models evaluate probabilities over structured criteria
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Close guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector Ribbon */}
        <div className="flex border-b border-[#27272a] bg-[#18181c]/60 px-3 py-1.5 overflow-x-auto gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-zinc-300 leading-relaxed">
          {/* Tab 1: Quickstart */}
          {activeTab === 'quickstart' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <Cpu className="w-4 h-4" />
                  <span>The System One Paradigm</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Unlike traditional generative LLMs that predict conversational text token-by-token,
                  <strong> System One models</strong> (like TypeSafe's <code>typesafe/jev-router</code> / <code>typesafe/jev-1.14</code>)
                  run on OpenRouter's Decisions API (<code>/api/alpha/decisions</code>) to compute
                  <strong> direct, calibrated probability distributions</strong> over defined choices.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-lg bg-[#18181c] border border-[#27272a] space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>Mode 1: Auto-Compile Dilemma</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Type a messy natural-language dilemma into the omni-composer. A fast Stage-1 compiler
                    extracts the background context into <code>state</code>, classifies questions, and writes
                    neutral criteria descriptions for Jev to evaluate in one click.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#18181c] border border-[#27272a] space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                    <Sliders className="w-4 h-4" />
                    <span>Mode 2: Direct Workbench</span>
                  </div>
                  <p className="text-zinc-400 text-[11px]">
                    Manually craft or customize <code>state</code> (Text or JSON) and define 1 to N parallel
                    typed questions (<code>noul</code>, <code>choice</code>, <code>score</code>) with custom
                    criteria and tri-state threshold gates.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-lg space-y-2">
                <div className="font-semibold text-zinc-200 text-xs">The 3-Step Setup Flow:</div>
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 text-[11px]">
                  <li>
                    <strong className="text-zinc-200">State / Context:</strong> Everything the decision model
                    needs to know (hardware limits, budget, constraints, priority goals).
                  </li>
                  <li>
                    <strong className="text-zinc-200">Question Instructions:</strong> The specific evaluation
                    you want performed (e.g. <em>"Which architecture is best suited?"</em>).
                  </li>
                  <li>
                    <strong className="text-zinc-200">Criteria Descriptions:</strong> Balanced descriptions
                    for each option. The model evaluates probabilities based on these descriptions.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Tab 2: Auto-Compile Mode */}
          {activeTab === 'autocompile' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-zinc-100 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>How to Formulate Natural-Language Dilemmas</span>
                </h4>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  The omni-composer uses a Stage-1 parser (e.g., <code>openrouter/free</code> or{' '}
                  <code>inclusionai/ling-3.0-flash</code>) with strict JSON Schema outputs to extract decision
                  structures. For best results, include both your <strong>options</strong> and your{' '}
                  <strong>constraints</strong>:
                </p>
              </div>

              <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-lg font-mono text-[11px] text-zinc-300 space-y-1">
                <div className="text-amber-400 font-semibold mb-1">// Example Dilemma Prompt:</div>
                <p className="text-zinc-200 italic">
                  "I'm building a single-user self-hosted app on TrueNAS SCALE. Concurrency is low (&lt;5
                  reqs), and zero-dependency volume backup is critical. Should I use SQLite WAL or PostgreSQL?
                  Also, is it safe to package inside a single container, and how complex is ongoing
                  maintenance?"
                </p>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-zinc-200 text-xs">What the Stage-1 Compiler Generates:</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 bg-[#18181c] border border-cyan-500/20 rounded">
                    <span className="text-cyan-400 font-mono font-bold block mb-1">1. database_engine</span>
                    <span className="text-zinc-400">Classified as <code>choice</code> (2 mutually exclusive options).</span>
                  </div>
                  <div className="p-2.5 bg-[#18181c] border border-amber-500/20 rounded">
                    <span className="text-amber-400 font-mono font-bold block mb-1">2. single_container_safe</span>
                    <span className="text-zinc-400">Classified as <code>noul</code> (binary yes/no with threshold gate).</span>
                  </div>
                  <div className="p-2.5 bg-[#18181c] border border-purple-500/20 rounded">
                    <span className="text-purple-400 font-mono font-bold block mb-1">3. ongoing_complexity</span>
                    <span className="text-zinc-400">Classified as <code>score</code> (ordinal rubric: Low, Med, High).</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-900 border border-zinc-700/60 rounded-lg text-[11px] text-zinc-400 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-200">Two Action Buttons:</strong> Click{' '}
                  <code className="text-amber-400">Ask Decision Model</code> to compile and execute via Jev in
                  one go, or click <code className="text-zinc-300">Compile to Editor Only</code> to inspect and
                  tweak the schema in the workbench before running.
                </span>
              </div>
            </div>
          )}

          {/* Tab 3: The 3 Primitives */}
          {activeTab === 'primitives' && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-[11px]">
                OpenRouter's Decisions API evaluates three core probabilistic primitives. You can mix and match
                any number of them within a single request:
              </p>

              {/* Noul */}
              <div className="p-3.5 bg-[#18181c] border border-amber-500/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      noul
                    </span>
                    <span className="font-semibold text-zinc-100 text-xs">Bernoulli / Binary Probability</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">P(yes) ∈ [0.0, 1.0]</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Outputs a single probability float for affirmative decisions. Certainty is encoded by
                  distance from the <code>0.50</code> toss-up midpoint ($2 \cdot |P - 0.50|$).
                </p>
                <div className="bg-[#111114] p-2 rounded font-mono text-[10px] text-zinc-300 overflow-x-auto">
                  {`"single_container_safe": {
  "type": "noul",
  "instructions": "Is it safe to package inside a single Docker container?",
  "criteria": {
    "true": "Single-container deployment is reliable under low concurrency.",
    "false": "Risks data corruption or process deadlocks under stated workload."
  }
}`}
                </div>
              </div>

              {/* Choice */}
              <div className="p-3.5 bg-[#18181c] border border-cyan-500/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      choice
                    </span>
                    <span className="font-semibold text-zinc-100 text-xs">Categorical Selection (2–255 Options)</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Σ P(i) = 1.0</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Evaluates mutually exclusive options. Returns winning choice key, complete probability
                  distribution, and Top-2 margin ($\Delta P = P_1 - P_2$).
                </p>
                <div className="bg-[#111114] p-2 rounded font-mono text-[10px] text-zinc-300 overflow-x-auto">
                  {`"database_engine": {
  "type": "choice",
  "instructions": "Which database engine is best suited?",
  "criteria": {
    "sqlite_wal": "Embedded single-file relational DB with Write-Ahead Logging; zero external dependencies.",
    "postgresql": "Client-server relational DB; advanced concurrency but requires separate container."
  }
}`}
                </div>
              </div>

              {/* Score */}
              <div className="p-3.5 bg-[#18181c] border border-purple-500/30 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      score
                    </span>
                    <span className="font-semibold text-zinc-100 text-xs">Ordinal Rubric Rating (2–10 Levels)</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">E[score] = Σ i · P(i)</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Evaluates an ordered array of criteria levels from index <code>0</code> (lowest) to{' '}
                  <code>N-1</code> (highest). Returns expected score needle and discrete probabilities.
                </p>
                <div className="bg-[#111114] p-2 rounded font-mono text-[10px] text-zinc-300 overflow-x-auto">
                  {`"maintenance_complexity": {
  "type": "score",
  "instructions": "Rate the ongoing maintenance complexity.",
  "criteria": [
    "Low: Single container with zero manual admin.",
    "Medium: Multi-process setup requiring periodic schema maintenance.",
    "High: Multi-container cluster requiring dump/restore pipelines."
  ]
}`}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Direct Workbench */}
          {activeTab === 'workbench' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h4 className="font-semibold text-zinc-100 text-xs flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Manual Schema Workbench Controls</span>
                </h4>
                <p className="text-zinc-400 text-[11px]">
                  In <strong>Direct Schema Workbench</strong> mode, you have complete surgical control over
                  every parameter sent to the decisions endpoint.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-lg space-y-1">
                  <span className="font-mono text-xs text-amber-400 font-bold block">1. State Composer</span>
                  <p className="text-zinc-400 text-[11px]">
                    Toggle between <strong>Raw Text / Markdown</strong> (for general dilemmas) and{' '}
                    <strong>Structured JSON</strong> (for telemetry, user session data, or bot detection signals).
                    JSON mode includes real-time syntax validation.
                  </p>
                </div>

                <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-lg space-y-1">
                  <span className="font-mono text-xs text-cyan-400 font-bold block">2. Question Stack</span>
                  <p className="text-zinc-400 text-[11px]">
                    Click <code className="text-zinc-200">+ Noul</code>, <code className="text-zinc-200">+ Choice</code>,
                    or <code className="text-zinc-200">+ Score</code> to stack questions. Reorder questions,
                    rename question identifier slugs, or click the duplicate button to clone a template.
                  </p>
                </div>

                <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-lg space-y-1">
                  <span className="font-mono text-xs text-emerald-400 font-bold block">3. Tri-State Threshold Slider</span>
                  <p className="text-zinc-400 text-[11px]">
                    For <code>noul</code> questions, drag the dual-cutoff sliders to customize automated
                    decision boundaries (e.g. <code>Reject &lt; 0.35</code>, <code>Review 0.35–0.75</code>,{' '}
                    <code>Commit &gt; 0.75</code>). The generated code drawer dynamically reflects these cutoffs.
                  </p>
                </div>

                <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-lg space-y-1">
                  <span className="font-mono text-xs text-purple-400 font-bold block">4. Bulk Paste Options</span>
                  <p className="text-zinc-400 text-[11px]">
                    Have a list of 10+ alternatives? Click <strong>Bulk Paste Lines</strong> inside any choice
                    question to paste one option per line (e.g. <code>slug: description</code>), generating
                    rows instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Anti-Bias & Re-Runs */}
          {activeTab === 'tuning' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <Scale className="w-4 h-4" />
                  <span>The Anti-Bias "Tweak & Re-Run" Feedback Loop</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  OpenRouter's System One models <strong>never see option keys</strong> like <code>"sqlite"</code>{' '}
                  or <code>"postgres"</code>. They compute probabilities based 100% on the descriptive text in{' '}
                  <code>criteria</code>. If option A has 3 sentences praising it and option B has 1 sentence
                  mentioning bugs, the model's output is compromised.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-lg space-y-1.5">
                  <span className="font-mono text-xs text-zinc-200 font-bold block">
                    Step 1: Expand the Extracted State & Options Inspector
                  </span>
                  <p className="text-zinc-400 text-[11px]">
                    On any Decision Result Card, click the inspector bar. You will see the exact <code>state</code>{' '}
                    and the exact synthesized <code>criteria</code> text the decision model evaluated.
                  </p>
                </div>

                <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-lg space-y-1.5">
                  <span className="font-mono text-xs text-cyan-400 font-bold block">
                    Step 2: Edit Criteria or Add Options
                  </span>
                  <p className="text-zinc-400 text-[11px]">
                    Balance out any perceived bias, tighten technical constraints, or click{' '}
                    <code className="text-cyan-400">+ Add Option on the Fly</code> to inject a new choice.
                  </p>
                </div>

                <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-lg space-y-1.5">
                  <span className="font-mono text-xs text-amber-400 font-bold block">
                    Step 3: Click "Re-Run Decision Model (Bypass Parser)"
                  </span>
                  <p className="text-zinc-400 text-[11px]">
                    This skips Stage 1 completely and hits OpenRouter's <code>/api/alpha/decisions</code>{' '}
                    in <strong>~200ms</strong>. The updated card displays green/red probability delta badges (e.g.{' '}
                    <code className="text-emerald-400">+14.2%</code> / <code className="text-rose-400">-8.5%</code>)
                    showing exactly how your adjustments shifted the decision distribution!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Navigation Controls */}
        <div className="px-5 py-3 border-t border-[#27272a] bg-[#141418] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {tabs.map((tab, idx) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-2 h-2 rounded-full transition-all ${
                  activeTab === tab.key ? 'bg-amber-400 w-5' : 'bg-zinc-700 hover:bg-zinc-500'
                }`}
                title={`Go to step ${idx + 1}: ${tab.label}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'quickstart' && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold rounded-md shadow-sm transition-colors flex items-center gap-1.5"
            >
              <span>{activeTab === 'tuning' ? 'Got It' : 'Next'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
