import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle2, AlertCircle, RefreshCw, Plus, Trash2, Cpu } from 'lucide-react';
import { SettingsResponse, SettingsUpdateRequest, ModelItem } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsResponse | null;
  stage1Models: ModelItem[];
  stage2Models: ModelItem[];
  onSaveSettings: (update: SettingsUpdateRequest) => Promise<void>;
  onTestConnection: (apiKey?: string) => Promise<{ success: boolean; message: string; models_available: number }>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  stage1Models,
  stage2Models,
  onSaveSettings,
  onTestConnection,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [defaultStage1, setDefaultStage1] = useState('openrouter/free');
  const [defaultStage2, setDefaultStage2] = useState('typesafe/jev-router');
  const [rejectThreshold, setRejectThreshold] = useState(0.35);
  const [commitThreshold, setCommitThreshold] = useState(0.75);
  const [customModelSlug, setCustomModelSlug] = useState('');
  const [pinnedModels, setPinnedModels] = useState<string[]>([]);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setDefaultStage1(settings.default_stage1_model);
      const stage2 = settings.default_stage2_model === 'typesafe/jev-latest'
        ? 'typesafe/jev-router'
        : settings.default_stage2_model;
      setDefaultStage2(stage2);
      setRejectThreshold(settings.thresholds.reject);
      setCommitThreshold(settings.thresholds.commit);
      setPinnedModels(settings.pinned_models || []);
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(apiKey || undefined);
      setTestResult({
        success: res.success,
        message: res.success ? `Connected! Found ${res.models_available} models.` : res.message,
      });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleAddCustomModel = () => {
    const slug = customModelSlug.trim();
    if (slug && !pinnedModels.includes(slug)) {
      setPinnedModels([...pinnedModels, slug]);
      setCustomModelSlug('');
    }
  };

  const handleRemovePinnedModel = (slug: string) => {
    setPinnedModels(pinnedModels.filter((s) => s !== slug));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatePayload: SettingsUpdateRequest = {
        default_stage1_model: defaultStage1,
        default_stage2_model: defaultStage2,
        pinned_models: pinnedModels,
        thresholds: { reject: rejectThreshold, commit: commitThreshold },
      };
      if (apiKey.trim()) {
        updatePayload.openrouter_api_key = apiKey.trim();
      }
      await onSaveSettings(updatePayload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#111114] border border-[#27272a] rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Settings & Credentials</h3>
              <p className="text-xs text-zinc-400">Encrypted at rest with Fernet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-zinc-300">
          {/* API Key Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-zinc-200">OpenRouter API Key</label>
              {settings?.is_configured && (
                <span className="text-[11px] font-mono text-emerald-400">
                  Active ({settings.masked_key})
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder={settings?.is_configured ? 'Enter new key to replace...' : 'sk-or-v1-...'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 bg-[#18181c] border border-[#27272a] rounded-md px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500/50"
              />
              <button
                onClick={handleTestKey}
                disabled={testing}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-md border border-zinc-700 flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Test</span>
              </button>
            </div>
            {testResult && (
              <div
                className={`flex items-center gap-2 p-2 rounded text-xs font-mono ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              API key is securely encrypted at rest into SQLite using Fernet encryption. The raw key is never logged or stored in browser storage.
            </p>
          </div>

          <hr className="border-[#27272a]" />

          {/* Default Models Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-200">Default Stage-1 Compiler</label>
              <select
                value={defaultStage1}
                onChange={(e) => setDefaultStage1(e.target.value)}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
              >
                {stage1Models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.is_free ? 'FREE' : m.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-200">Default Stage-2 Decision Model</label>
              <select
                value={defaultStage2}
                onChange={(e) => setDefaultStage2(e.target.value)}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-md px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
              >
                {stage2Models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-[#27272a]" />

          {/* Tri-State Threshold Gate Cutoffs */}
          <div className="space-y-2">
            <label className="font-semibold text-zinc-200">
              Default Tri-State Threshold Gate (Noul Decisions)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400">Reject Cutoff (&lt;= P)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.0"
                  max="0.5"
                  value={rejectThreshold}
                  onChange={(e) => setRejectThreshold(parseFloat(e.target.value))}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-md px-2.5 py-1.5 font-mono text-zinc-200 focus:outline-none focus:border-rose-500/50"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-400">Commit Cutoff (&gt;= P)</span>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="1.0"
                  value={commitThreshold}
                  onChange={(e) => setCommitThreshold(parseFloat(e.target.value))}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-md px-2.5 py-1.5 font-mono text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          </div>

          <hr className="border-[#27272a]" />

          {/* Custom Pinned Model Slugs */}
          <div className="space-y-2">
            <label className="font-semibold text-zinc-200">Custom Pinned OpenRouter Models</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. anthropic/claude-3.5-haiku"
                value={customModelSlug}
                onChange={(e) => setCustomModelSlug(e.target.value)}
                className="flex-1 bg-[#18181c] border border-[#27272a] rounded-md px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500/50"
              />
              <button
                onClick={handleAddCustomModel}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md border border-zinc-700 flex items-center gap-1 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            {pinnedModels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {pinnedModels.map((slug) => (
                  <span
                    key={slug}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px] border border-zinc-700"
                  >
                    <span>{slug}</span>
                    <button
                      onClick={() => handleRemovePinnedModel(slug)}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#27272a] bg-[#18181c] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-md shadow-sm transition-colors text-xs disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
