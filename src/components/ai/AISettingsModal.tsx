import React, { useState } from 'react';
import { X, Eye, EyeOff, ExternalLink, Check, Loader2 } from 'lucide-react';
import { useAIStore } from '../../store/aiStore';
import { AI_PROVIDER_PRESETS, getProviderPreset } from '../../services/ai/providers';
import { chatOnce } from '../../services/ai';
import type { AIProviderId } from '../../services/ai/types';

export const AISettingsModal: React.FC = () => {
  const { settingsOpen, setSettingsOpen, config, setConfig, setProvider } = useAIStore();
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  if (!settingsOpen) return null;

  const preset = getProviderPreset(config.provider);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const reply = await chatOnce(
        config,
        [
          { role: 'system', content: 'You are a helpful assistant. Reply in 5 words or less.' },
          { role: 'user', content: 'say hi' },
        ],
        { temperature: 0.1 },
      );
      setTestResult({ ok: true, msg: `连接成功：${reply.slice(0, 40)}` });
    } catch (err: any) {
      setTestResult({ ok: false, msg: err?.message || '连接失败' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={() => setSettingsOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">AI 设置</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              密钥仅保存在你本地浏览器，不会上传任何服务器
            </p>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Provider */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">服务提供商</label>
            <div className="grid grid-cols-3 gap-2">
              {AI_PROVIDER_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id as AIProviderId)}
                  className={`p-2 rounded-lg border-2 text-left transition-all ${
                    config.provider === p.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p
                    className={`text-xs font-semibold ${
                      config.provider === p.id ? 'text-purple-700' : 'text-gray-700'
                    }`}
                  >
                    {p.name}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API 地址</label>
            <input
              type="text"
              value={config.baseURL}
              onChange={(e) => setConfig({ baseURL: e.target.value.trim() })}
              placeholder="https://api.example.com/v1"
              className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              API Key
              {preset && !preset.requiresKey && (
                <span className="ml-2 text-[10px] text-gray-400 font-normal">（本地模型可留空）</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => setConfig({ apiKey: e.target.value.trim() })}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-9 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">模型</label>
            <input
              type="text"
              list="ai-models"
              value={config.model}
              onChange={(e) => setConfig({ model: e.target.value.trim() })}
              placeholder="输入或选择模型"
              className="w-full px-3 py-2 text-sm font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <datalist id="ai-models">
              {(preset?.models || []).map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          {/* Advanced */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Temperature <span className="text-gray-400 font-mono">{config.temperature.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={1.5}
                step={0.1}
                value={config.temperature}
                onChange={(e) => setConfig({ temperature: parseFloat(e.target.value) })}
                className="w-full accent-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prompt 语言</label>
              <select
                value={config.language}
                onChange={(e) => setConfig({ language: e.target.value as 'zh' | 'en' })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Test */}
          <div className="pt-2 border-t border-gray-100">
            <button
              onClick={handleTest}
              disabled={testing || !config.baseURL || !config.model}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              测试连接
            </button>
            {testResult && (
              <p
                className={`mt-2 text-[11px] leading-relaxed ${
                  testResult.ok ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {testResult.msg}
              </p>
            )}
          </div>

          {/* Help */}
          <div className="text-[11px] text-gray-400 bg-gray-50 rounded-lg p-3 space-y-1">
            <p className="font-medium text-gray-500">如何获取 API Key：</p>
            <p>• DeepSeek：<a className="text-blue-500 hover:underline inline-flex items-center gap-0.5" href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer">platform.deepseek.com <ExternalLink size={9}/></a></p>
            <p>• OpenAI：<a className="text-blue-500 hover:underline inline-flex items-center gap-0.5" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">platform.openai.com <ExternalLink size={9}/></a></p>
            <p>• OpenRouter：<a className="text-blue-500 hover:underline inline-flex items-center gap-0.5" href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">openrouter.ai/keys <ExternalLink size={9}/></a></p>
            <p>• Ollama：<code className="bg-white px-1 rounded">ollama pull qwen2.5:7b</code> 后无需 Key</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
