import type { RewriteMode } from './types';

/**
 * 所有 Prompt 模板集中在这里，方便后续优化和多语言切换。
 * 设计原则：
 * 1. 尽量约束输出格式（纯文本或 JSON），避免前端解析失败。
 * 2. 少说废话，直接出结果（用户 UI 会说"正在生成"）。
 * 3. 默认中文，可通过 language 参数切换。
 */

const ZH_SYSTEM = `你是一位资深的技术招聘官和简历撰写专家，熟悉大厂的用人标准与 STAR 法则。
回答必须直接、克制、真实，不得虚构未提供的事实，不得使用"我认为"、"希望"等口水话。`;

const EN_SYSTEM = `You are a senior tech recruiter and resume writing expert, familiar with FAANG standards and the STAR framework.
Answers must be direct, concise, and factual. Do not fabricate anything not provided; avoid filler phrases.`;

export function getSystemPrompt(language: 'zh' | 'en'): string {
  return language === 'en' ? EN_SYSTEM : ZH_SYSTEM;
}

/** 改写单条句子 */
export function rewritePrompt(
  original: string,
  mode: RewriteMode,
  context?: { role?: string; jd?: string },
  language: 'zh' | 'en' = 'zh',
): string {
  const zh: Record<RewriteMode, string> = {
    polish: '请润色下列简历描述，使表达更专业、简洁、有力，但严格保持原意，不要虚构数据：',
    quantify:
      '请将下列简历描述改写为量化成就：补充合理的规模、比例、效果类数据（如有不合理之处请用方括号[待确认]标记），让 HR 一眼看到价值：',
    star:
      '请将下列简历描述改写为 STAR 结构：清晰体现情境（S）、任务（T）、行动（A）、结果（R），合并为一段简洁有力的成就句（单句即可）：',
    shorten: '请将下列简历描述压缩为不超过一行的精炼版本，保留最关键的成就：',
    expand: '请将下列简历描述扩写为更丰满的版本，补充具体动作和结果，但不得虚构事实：',
    translate_en: '请将下列中文简历内容翻译成地道的英文简历表达，使用动词开头的 bullet 风格：',
    translate_zh: '请将下列英文简历内容翻译成地道的中文简历表达，符合国内简历习惯：',
  };
  const en: Record<RewriteMode, string> = {
    polish: 'Polish the following resume line to be more professional, concise, and impactful while preserving the original meaning. Do not fabricate:',
    quantify:
      'Rewrite the following resume line into a quantified achievement: add reasonable metrics (scale/ratio/impact). Mark uncertain data with [TBD]:',
    star: 'Rewrite the following resume line using the STAR framework (Situation/Task/Action/Result), merged into a single crisp bullet:',
    shorten: 'Compress the following resume line into a single-line version, keeping only the most impactful point:',
    expand: 'Expand the following resume line with more concrete actions and results, without fabricating facts:',
    translate_en: 'Translate the following Chinese resume content into idiomatic English using verb-led bullet style:',
    translate_zh: 'Translate the following English resume content into idiomatic Chinese suitable for Chinese resumes:',
  };

  const prompts = language === 'en' ? en : zh;
  const ctx: string[] = [];
  if (context?.role) ctx.push(language === 'en' ? `Target role: ${context.role}` : `目标岗位：${context.role}`);
  if (context?.jd) ctx.push(language === 'en' ? `Target JD: ${context.jd.slice(0, 800)}` : `岗位 JD 摘要：${context.jd.slice(0, 800)}`);

  const intro = prompts[mode];
  const contextBlock = ctx.length ? `\n\n${ctx.join('\n')}` : '';
  const tail = language === 'en'
    ? '\n\nReturn ONLY the rewritten content. No explanations, no markdown, no quotes.'
    : '\n\n只返回改写后的内容本身，不要任何解释、不要 Markdown、不要引号。';

  return `${intro}${contextBlock}\n\n原文：${original}${tail}`;
}

/** STAR 打分 */
export function starScorePrompt(achievement: string, language: 'zh' | 'en' = 'zh'): string {
  if (language === 'en') {
    return `Analyze the following resume bullet using STAR (Situation/Task/Action/Result). Score each dimension 0-25 and give suggestions.

Bullet: ${achievement}

Return ONLY valid JSON (no markdown code fence) like:
{"total":80,"situation":20,"task":18,"action":22,"result":20,"suggestions":["..."]}`;
  }
  return `请基于 STAR 法则分析下面这条简历成就：给情境(S)/任务(T)/行动(A)/结果(R) 各打 0-25 分，汇总 total 为 0-100，并给出 1-3 条具体改进建议。

内容：${achievement}

只返回 JSON（不要 markdown 代码块），格式如：
{"total":80,"situation":20,"task":18,"action":22,"result":20,"suggestions":["建议1","建议2"]}`;
}

/** JD 分析 */
export function jdAnalysisPrompt(
  jd: string,
  resumeSummary: string,
  language: 'zh' | 'en' = 'zh',
): string {
  if (language === 'en') {
    return `Compare the candidate's resume highlights with the job description. Extract key skill/tech keywords from JD, mark which ones are covered by the resume.

JD:
${jd}

Resume highlights:
${resumeSummary}

Return ONLY valid JSON (no markdown):
{"matchScore":75,"matchedKeywords":["..."],"missingKeywords":["..."],"overallAdvice":"...","sectionAdvices":[{"section":"workExperience","advice":"..."}]}`;
  }
  return `请对比下面候选人的简历要点与岗位 JD：从 JD 抽取关键技能/技术词，标出简历中已覆盖与缺失的关键词，并给出整体建议和分版块的改写建议。

【JD】
${jd}

【简历要点】
${resumeSummary}

只返回 JSON（不要 markdown 代码块），格式：
{"matchScore":0-100,"matchedKeywords":["词1"],"missingKeywords":["词2"],"overallAdvice":"一段话整体建议","sectionAdvices":[{"section":"workExperience/projects/skills/summary","advice":"具体改法"}]}`;
}
