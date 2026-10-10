import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Cpu, 
  FileText, 
  Copy, 
  Check, 
  Flame, 
  ExternalLink,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { api } from '../api';

export default function DirectorDashboard() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [topProblems, setTopProblems] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [reportModal, setReportModal] = useState(null); // 'daily' or 'weekly'
  const [reportData, setReportData] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hData, tpData, aData] = await Promise.all([
        api.analytics.healthOverview(7),
        api.analytics.topProblems(7),
        api.analytics.drilldownAnomalies(14)
      ]);
      setHealth(hData);
      setTopProblems(tpData);
      setAnomalies(aData);
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openReport = async (type) => {
    setReportModal(type);
    setReportData(null);
    setCopied(false);
    try {
      const data = type === 'daily' ? await api.analytics.dailyReport() : await api.analytics.weeklyReport();
      setReportData(data);
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  const handleCopyReport = () => {
    if (reportData?.text) {
      navigator.clipboard.writeText(reportData.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-sm text-slate-400">Сбор метрик 40 000 абонентов и drill-down аналитики...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">VPN HEALTH & QUALITY</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              База: 40 000
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Главный экран собственника: сквозной контроль продукта через обращения абонентов, аномалии и ITSM-метрики.
          </p>
        </div>

        {/* Executive Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => openReport('daily')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 text-xs font-semibold text-slate-200 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ежедневный срез (5 мин)</span>
          </button>

          <button
            onClick={() => openReport('weekly')}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-md shadow-indigo-600/30"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>VPN — Support Weekly</span>
          </button>

          <button
            onClick={fetchData}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
            title="Обновить данные"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Level 3: Proportions of 40,000 Base */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Working Normally */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Работают без проблем</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{health?.working_normally_users.toLocaleString()}</div>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${health?.working_normally_pct}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-emerald-400 min-w-[42px] text-right">{health?.working_normally_pct}%</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Сервисы VPN функционируют в штатном режиме</div>
        </div>

        {/* Users with Problems */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Были проблемы</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400">{health?.problem_users.toLocaleString()}</div>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${health?.problem_users_pct * 4}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-rose-400 min-w-[42px] text-right">{health?.problem_users_pct}%</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>User Problem Rate:</span>
            <span className="font-bold text-rose-300">{health?.user_problem_rate_pct}%</span>
          </div>
        </div>

        {/* Unknown Status */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Неизвестный статус</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{health?.unknown_status_users.toLocaleString()}</div>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full" 
                style={{ width: `${health?.unknown_status_pct * 8}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-amber-400 min-w-[42px] text-right">{health?.unknown_status_pct}%</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Абоненты без свежей телеметрии</div>
        </div>

        {/* Inactive Users */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Неактивны</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-300">{health?.inactive_users.toLocaleString()}</div>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-slate-600 h-full rounded-full" 
                style={{ width: `${health?.inactive_users_pct * 10}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-slate-400 min-w-[42px] text-right">{health?.inactive_users_pct}%</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Не подключались более 30 дней</div>
        </div>
      </div>

      {/* Support Score Grid (KPIs) */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>SUPPORT SCORE (Качество и эффективность саппорта)</span>
          </span>
          <span className="text-xs text-slate-400">Всего тикетов за период: <strong className="text-white">{health?.total_tickets_period}</strong></span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Решено саппортом</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">{health?.resolved_pct}%</div>
            <div className="text-[10px] text-slate-500 mt-1">цель &gt; 90%</div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Среднее время (MTTR)</div>
            <div className="text-lg font-black text-white mt-0.5">{health?.median_resolution_time_min} мин</div>
            <div className="text-[10px] text-slate-500 mt-1">до закрытия вопроса</div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">С 1-го контакта (FCR)</div>
            <div className="text-lg font-black text-indigo-400 mt-0.5">{health?.first_contact_resolution_pct}%</div>
            <div className="text-[10px] text-slate-500 mt-1">без повторных писем</div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">CSAT Оценка</div>
            <div className="text-lg font-black text-amber-400 mt-0.5">{health?.csat_pct}%</div>
            <div className="text-[10px] text-slate-500 mt-1">удовлетворенность</div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Автоматизация / AI</div>
            <div className="text-lg font-black text-cyan-400 mt-0.5">{health?.automation_rate_pct}%</div>
            <div className="text-[10px] text-slate-500 mt-1">без ручного участия</div>
          </div>

          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400">Требует инженера</div>
            <div className="text-lg font-black text-rose-400 mt-0.5">{health?.escalated_pct}%</div>
            <div className="text-[10px] text-slate-500 mt-1">эскалации на 2-ю линию</div>
          </div>
        </div>
      </div>

      {/* Level 4 & Level 5: Top Problems + Root Cause Drill-down */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level 4: TOP-10 Problems Ranking */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">ТОП Проблем (Рейтинг причин)</h2>
              </div>
              <span className="text-xs text-slate-400">Недельный срез</span>
            </div>

            <div className="space-y-3">
              {topProblems.map((prob) => (
                <div key={prob.rank} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                        {prob.rank}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{prob.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{prob.count}</span>
                      <span className="text-[11px] text-slate-400">({prob.share_pct}%)</span>
                      <span className={`text-[10px] font-semibold px-1 py-0.2 rounded ${
                        prob.trend_pct > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {prob.trend_pct > 0 ? `+${prob.trend_pct}%` : `${prob.trend_pct}%`}
                      </span>
                    </div>
                  </div>

                  {/* Micro drill tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-900">
                    {prob.top_devices?.slice(0, 2).map((d) => (
                      <span key={d.name} className="text-[10px] bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded">
                        {d.name}: {d.count}
                      </span>
                    ))}
                    {prob.top_operators?.slice(0, 2).map((o) => (
                      <span key={o.name} className="text-[10px] bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-900/40">
                        {o.name}: {o.count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Level 5: Drill-Down Root Cause Anomalies (ITIL) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-white tracking-wide uppercase">🔥 Выявленные аномалии (Root Cause)</h2>
              </div>
              <span className="text-xs text-amber-400 font-semibold">ITIL Problem Candidates</span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Автоматический поиск узких мест: пересечение Устройства, Оператора и Приложения, дающее наибольший всплеск тикетов.
            </p>

            <div className="space-y-3">
              {anomalies.map((a, idx) => (
                <div 
                  key={idx}
                  className={`bg-slate-950/80 rounded-xl p-3 border transition-all ${
                    a.alert_level === 'CRITICAL'
                      ? 'border-rose-500/50 shadow-sm shadow-rose-500/10'
                      : a.alert_level === 'WARNING'
                      ? 'border-amber-500/40'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <span>{a.combination}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.alert_level === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : a.alert_level === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {a.alert_level}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1.5">
                    Категория: <strong className="text-slate-200">{a.category}</strong> • {a.occurrences} случаев ({a.percentage_of_category}% от категории)
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-[10px]">
                    <span className="text-slate-400">
                      Затронуто абонентов: <strong className="text-slate-200">{a.unique_users}</strong>
                    </span>
                    {a.linked_problem_code ? (
                      <span className="text-emerald-400 font-semibold">
                        Привязано: {a.linked_problem_code}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-semibold animate-pulse">
                        Не внесено в Problem Register
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Влияние на продукт:</span>
            <span className="text-emerald-400 font-bold">~1 420 обращений/мес предотвращено</span>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">{reportData?.title || 'Генерация отчета...'}</h3>
              </div>
              <button
                onClick={() => setReportModal(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Закрыть
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950">
              {reportData?.text || 'Загрузка данных и расчет процентов базы...'}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Готово для отправки в рабочий чат руководства</span>
              <button
                onClick={handleCopyReport}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Скопировано!' : 'Скопировать текст'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
