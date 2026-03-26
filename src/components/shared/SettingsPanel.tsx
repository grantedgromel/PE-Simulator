import { useState } from 'react'
import { isLLMEnabled, setLLMEnabled, setAPIKey, getAPICallCount } from '../../engine/llmDialogue'

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [llmOn, setLlmOn] = useState(isLLMEnabled())
  const [apiKey, setApiKeyInput] = useState('')
  const [showApiKey] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-terminal-surface border border-terminal-border rounded-lg p-6 w-96 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-mono text-terminal-amber uppercase tracking-widest">Settings</h2>
          <button onClick={onClose} className="text-terminal-muted hover:text-terminal-white text-sm">×</button>
        </div>

        {/* LLM Toggle */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs text-terminal-white">Dynamic Characters (LLM)</label>
            <button
              onClick={() => { const next = !llmOn; setLlmOn(next); setLLMEnabled(next) }}
              className={`px-3 py-1 text-xs font-mono rounded border ${
                llmOn
                  ? 'bg-terminal-green/20 border-terminal-green text-terminal-green'
                  : 'bg-terminal-bg border-terminal-border text-terminal-muted'
              }`}
            >
              {llmOn ? 'ON' : 'OFF'}
            </button>
          </div>
          <p className="text-[10px] text-terminal-muted">
            When enabled, characters generate contextual dialogue via Anthropic API. Requires internet and API key.
          </p>
        </div>

        {/* API Key */}
        {llmOn && (
          <div className="space-y-1">
            <label className="text-xs text-terminal-muted">Anthropic API Key</label>
            <div className="flex gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 bg-terminal-bg border border-terminal-border rounded px-2 py-1 text-xs text-terminal-white font-mono focus:outline-none focus:border-terminal-green"
              />
              <button
                onClick={() => { setAPIKey(apiKey); }}
                className="px-2 py-1 text-xs font-mono bg-terminal-green/15 border border-terminal-green text-terminal-green rounded"
              >
                SET
              </button>
            </div>
            <p className="text-[10px] text-terminal-muted">
              API calls this session: {getAPICallCount()}. Key stored in memory only — never saved.
            </p>
          </div>
        )}

        <div className="border-t border-terminal-border pt-3">
          <p className="text-[10px] text-terminal-muted text-center">
            v0.7.0 — Phase 7: LLM Integration
          </p>
        </div>
      </div>
    </div>
  )
}
