import type { AIProviderPreset } from './types';

/**
 * 内置 Provider 预设：全部使用 OpenAI 兼容协议
 * 用户可以在 AI 设置里切换，也可以选 custom 完全自定义
 */
export const AI_PROVIDER_PRESETS: AIProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    requiresKey: true,
    desc: '官方 OpenAI，稳定但需国际网络 + 付费',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    requiresKey: true,
    desc: '国内首选，价格极低、中文效果强',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: [
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o-mini',
      'google/gemini-2.0-flash-exp',
      'meta-llama/llama-3.3-70b-instruct',
    ],
    requiresKey: true,
    desc: '一个 key 调用全球所有主流模型',
  },
  {
    id: 'moonshot',
    name: '月之暗面 Kimi',
    baseURL: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    requiresKey: true,
    desc: '国内合规，长文本能力强',
  },
  {
    id: 'ollama',
    name: 'Ollama（本地）',
    baseURL: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5:7b',
    models: ['qwen2.5:7b', 'qwen2.5:14b', 'llama3.2', 'deepseek-r1:7b'],
    requiresKey: false,
    desc: '完全本地运行，隐私最好但需自行部署',
  },
  {
    id: 'custom',
    name: '自定义',
    baseURL: '',
    defaultModel: '',
    models: [],
    requiresKey: true,
    desc: '任何兼容 OpenAI /v1/chat/completions 协议的服务',
  },
];

export const DEFAULT_AI_CONFIG = {
  provider: 'deepseek' as const,
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.6,
  language: 'zh' as const,
};

export function getProviderPreset(id: string): AIProviderPreset | undefined {
  return AI_PROVIDER_PRESETS.find((p) => p.id === id);
}
