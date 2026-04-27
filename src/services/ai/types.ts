/**
 * AI 服务相关的类型定义
 */

/** 支持的 AI Provider */
export type AIProviderId = 'openai' | 'deepseek' | 'openrouter' | 'moonshot' | 'ollama' | 'custom';

export interface AIProviderPreset {
  id: AIProviderId;
  name: string;
  /** 默认 baseURL（OpenAI 兼容协议的 /v1 根路径） */
  baseURL: string;
  /** 默认推荐模型（用户可改） */
  defaultModel: string;
  /** 常用模型列表，用于下拉提示 */
  models: string[];
  /** 是否需要 apiKey（Ollama 本地通常不需要） */
  requiresKey: boolean;
  /** 简介文案 */
  desc: string;
}

/** 用户的 AI 配置 */
export interface AIConfig {
  provider: AIProviderId;
  baseURL: string;
  apiKey: string;
  model: string;
  /** 温度，默认 0.6 */
  temperature: number;
  /** Prompt 语言，默认 zh */
  language: 'zh' | 'en';
}

/** 一次对话消息 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** 改写模式 */
export type RewriteMode =
  | 'polish' // 润色（保持原意，提升表达）
  | 'quantify' // 量化（补充数据与规模）
  | 'star' // STAR 化（强化情境/任务/行动/结果）
  | 'shorten' // 压缩
  | 'expand' // 扩写
  | 'translate_en' // 翻译为英文
  | 'translate_zh'; // 翻译为中文

/** STAR 打分结果 */
export interface StarScore {
  total: number; // 0-100
  situation: number;
  task: number;
  action: number;
  result: number;
  /** 逐条建议 */
  suggestions: string[];
}

/** JD 分析结果 */
export interface JDAnalysis {
  /** 匹配度 0-100 */
  matchScore: number;
  /** 命中的关键词 */
  matchedKeywords: string[];
  /** 缺失的关键词 */
  missingKeywords: string[];
  /** 整体建议 */
  overallAdvice: string;
  /** 针对各板块的改写建议 */
  sectionAdvices: Array<{
    section: string;
    advice: string;
  }>;
}

/** 流式回调 */
export interface StreamHandlers {
  onDelta?: (chunk: string) => void;
  onDone?: (full: string) => void;
  onError?: (err: Error) => void;
  signal?: AbortSignal;
}
