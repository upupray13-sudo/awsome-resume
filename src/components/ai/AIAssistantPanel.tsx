import React, { useMemo, useState } from 'react';
import { X, Target, Sparkles, Loader2, CheckCircle2, AlertCircle, Settings2, TrendingUp } from 'lucide-react';
import { useAIStore } from '../../store/aiStore';
import { useResumeStore } from '../../store/resumeStore';
import { analyzeJD } from '../../services/ai';
import type { ResumeData } from '../../types/resume';

/**
 * 把简历要点压缩成喂给 AI 的简要摘要，避免 token 爆炸
 */
function buildResumeSummary(data: ResumeData): string {
  const lines: string[] = [];
  if (data.personal.title) lines.push(`目标：${data.personal.title}`);
  if (data.personal.summary) lines.push(`简介：${data.personal.summary}`);

  if (data.workExperience.length) {
    lines.push('【工作经历】');
    data.workExperience.slice(0, 4).forEach((w) => {
      lines.push(`- ${w.company} / ${w.position}`);
      if (w.description) lines.push(`  ${w.description}`);
      w.achievements.slice(0, 5).forEach((a) => lines.push(`  · ${a}`));
    });
  }
  if (data.projects.length) {
    lines.push('【项目】');
    data.projects.slice(0, 4).forEach((p) => {
      lines.push(`- ${p.name}（${p.role}）：${p.description || ''}`);
      if (p.technologies?.length) lines.push(`  技术：${p.technologies.join('、')}`);
    });
  }
  if (data.skills.length) {
    lines.push('【技能】');
    data.skills.forEach((s) => lines.push(`- ${s.category}：${s.items.join('、')}`));
  }
  // 截断，避免 token 过长
  return lines.join('\n').slice(0, 4000);
}

export const AIAssistantPanel: React.FC = () => {
  const { assistantOpen, setAssistantOpen, config, isReady, setSettingsOpen, jd, setJD, lastAnalysis, setLastAnalysis, analyzing, setAnalyzing } = useAIStore();
  const { data } = useResumeStore();
  const [error, setError] = useState<string | null>(null);

  const resumeSummary = useMemo(() => buildResumeSummary(data), [data]);

  if (!assistantOpen) return null;

  const handleAnalyze = async () => {
    if (!isReady()) {
      setSettingsOpen(true);
      return;
    }
    if (!jd.trim()) {
      setError('请先粘贴岗位 JD');
      return;
    }
    setError(null);
    setAnalyzing(true);
    try {
      const result = await analyzeJD(config, jd, resumeSummary);
      if (!result) {
        setError('AI 返回内容解析失败，请重试或切换模型');
      } else {
        setLastAnalysis(result);
      }
    } catch (err: any) {
      setError(err?.message || '分析失败');
    } finally {
      setAnalyzing(false);
    }
  };

  const clearAnalysis = () => {
    setLastAnalysis(null);
    setError(null);
  };

  const score = lastAnalysis?.matchScore ?? 0;
  const scoreColor =
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-blue-600' : score >= 40 ? 'text-orange-500' : 'text-red-500';

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* 遮罩 */}
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={() => setAssistantOpen(false)} />

      {/* 右侧抽屉 */}
      <aside className="w-full max-w-[480px] bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">AI 助手</h3>
              <p className="text-[11px] text-gray-400">岗位定向 · 匹配度分析 · 改写建议</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
              title="AI 设置"
            >
              <Settings2 size={15} />
            </button>
            <button
              onClick={() => setAssistantOpen(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!isReady() && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 leading-relaxed">
                还没配置 AI 服务。
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="ml-1 font-medium text-amber-700 underline hover:no-underline"
                >
                  立即配置 →
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-2">
              <Target size={13} className="text-purple-500" />
              粘贴目标岗位 JD
            </label>
            <textarea
              value={jd}
              onChange={(e) => setJD(e.target.value)}
              placeholder={'把心仪公司的岗位描述完整粘贴过来\n\nAI 将：\n• 抽取关键技能词\n• 计算你的简历匹配度\n• 给出分版块的改写建议'}
              rows={8}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed font-mono resize-y"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-gray-400">{jd.length} 字符</span>
              {jd && (
                <button onClick={() => setJD('')} className="text-[10px] text-gray-400 hover:text-red-500">
                  清空
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={analyzing || !jd.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                AI 分析中…
              </>
            ) : (
              <>
                <Sparkles size={14} />
                开始匹配分析
              </>
            )}
          </button>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-600 leading-relaxed">{error}</p>
            </div>
          )}

          {/* 分析结果 */}
          {lastAnalysis && (
            <div className="space-y-4 pt-2">
              {/* 匹配度 */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-purple-600" />
                    <span className="text-xs font-semibold text-gray-700">匹配度</span>
                  </div>
                  <button
                    onClick={clearAnalysis}
                    className="text-[10px] text-gray-400 hover:text-gray-600"
                  >
                    清除结果
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
                <div className="mt-2 h-2 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-700"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              {/* 关键词 */}
              {(lastAnalysis.matchedKeywords?.length || lastAnalysis.missingKeywords?.length) ? (
                <div className="grid grid-cols-1 gap-3">
                  {lastAnalysis.matchedKeywords?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 size={12} className="text-green-600" />
                        <span className="text-xs font-medium text-gray-700">
                          已覆盖 <span className="text-green-600">({lastAnalysis.matchedKeywords.length})</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lastAnalysis.matchedKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[11px] bg-green-50 text-green-700 border border-green-200 rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {lastAnalysis.missingKeywords?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <AlertCircle size={12} className="text-orange-500" />
                        <span className="text-xs font-medium text-gray-700">
                          缺失关键词 <span className="text-orange-500">({lastAnalysis.missingKeywords.length})</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lastAnalysis.missingKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-[11px] bg-orange-50 text-orange-700 border border-orange-200 rounded-full"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* 整体建议 */}
              {lastAnalysis.overallAdvice && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-1.5">整体建议</h4>
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-100">
                    {lastAnalysis.overallAdvice}
                  </p>
                </div>
              )}

              {/* 分板块建议 */}
              {lastAnalysis.sectionAdvices?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-1.5">分板块改写建议</h4>
                  <div className="space-y-2">
                    {lastAnalysis.sectionAdvices.map((item, i) => (
                      <div key={i} className="p-2.5 bg-white border border-gray-200 rounded-lg">
                        <p className="text-[11px] font-semibold text-purple-600 mb-1">
                          {sectionLabel(item.section)}
                        </p>
                        <p className="text-xs text-gray-600 leading-relaxed">{item.advice}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-gray-400 text-center pt-1">
                💡 提示：在对应模块的字段旁点 ✨ 按钮，AI 会基于此 JD 定向改写
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

function sectionLabel(key: string): string {
  const map: Record<string, string> = {
    personal: '基本信息',
    summary: '个人简介',
    workExperience: '工作经历',
    education: '教育经历',
    skills: '专业技能',
    projects: '项目经历',
    certificates: '证书荣誉',
    languages: '语言能力',
  };
  return map[key] || key;
}
