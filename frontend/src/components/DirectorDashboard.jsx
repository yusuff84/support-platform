import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  Copy, 
  Check, 
  RefreshCw,
  ArrowUpRight,
  ShieldAlert
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
        <div className="flex flex-col items-center space-y-2">
          <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
          <span className="text-xs text-slate-500">Сбор метрик базы 40 000 абонентов...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-7">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-100">ЗДОРОВЬЕ VPN И КАЧЕСТВО ПРОДУКТА</h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              База: 40 000 абонентов
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Сквозная аналитика качества сервиса: распределение базы, рейтинг причин и ITIL-аномалии.
          </p>
        </div>

        {/* Executive Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openReport('daily')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-750 text-xs font-medium text-slate-200 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Ежедневный срез (5 мин)</span>
          </button>

          <button
            onClick={() => openReport('weekly')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-100 transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>VPN — Support Weekly</span>
          </button>

          <button
            onClick={fetchData}
            className="p-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
            title="Обновить"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Level 3: Proportions of 40,000 Base */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Working Normally */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Работают без проблем</span>
            <CheckCircle className="w-4 h-4 text-emerald-500/80" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {health?.working_normally_users.toLocaleString()}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500/80 h-full rounded-full transition-all" 
                style={{ width: `${health?.working_normally_pct}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-emerald-400 min-w-[40px] text-right font-mono">
              {health?.working_normally_pct}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Сервис функционирует стабильно</div>
        </div>

        {/* Users with Problems */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Столкнулись с проблемой</span>
            <AlertCircle className="w-4 h-4 text-rose-400/80" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-rose-300 font-mono">
            {health?.problem_users.toLocaleString()}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-rose-500/80 h-full rounded-full transition-all" 
                style={{ width: `${health?.problem_users_pct * 4}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-rose-400 min-w-[40px] text-right font-mono">
              {health?.problem_users_pct}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>User Problem Rate:</span>
            <span className="font-semibold text-rose-300 font-mono">{health?.user_problem_rate_pct}%</span>
          </div>
        </div>

        {/* Unknown Status */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Неизвестный статус</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-200 font-mono">
            {health?.unknown_status_users.toLocaleString()}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-slate-600 h-full rounded-full" 
                style={{ width: `${health?.unknown_status_pct * 8}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-slate-300 min-w-[40px] text-right font-mono">
              {health?.unknown_status_pct}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Без недавней телеметрии сессий</div>
        </div>

        {/* Inactive Users */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Неактивны</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-400 font-mono">
            {health?.inactive_users.toLocaleString()}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-slate-700 h-full rounded-full" 
                style={{ width: `${health?.inactive_users_pct * 10}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-slate-400 min-w-[40px] text-right font-mono">
              {health?.inactive_users_pct}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Без подключений свыше 30 дней</div>
        </div>
      </div>

      {/* Support Score Grid (KPIs) */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>SUPPORT SCORE (Ключевые показатели работы саппорта)</span>
          </span>
          <span className="text-xs text-slate-400">
            Всего обращений за неделю: <strong className="text-slate-200 font-mono">{health?.total_tickets_period}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Решено саппортом</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">{health?.resolved_pct}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">цель: &gt; 90%</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Время решения (MTTR)</div>
            <div className="text-lg font-bold text-slate-200 mt-0.5 font-mono">{health?.median_resolution_time_min} мин</div>
            <div className="text-[10px] text-slate-500 mt-0.5">медиана закрытия</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">С 1-го контакта (FCR)</div>
            <div className="text-lg font-bold text-slate-200 mt-0.5 font-mono">{health?.first_contact_resolution_pct}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">без повторных жалоб</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">CSAT Оценка</div>
            <div className="text-lg font-bold text-slate-200 mt-0.5 font-mono">{health?.csat_pct}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">удовлетворенность</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Автоматизация / AI</div>
            <div className="text-lg font-bold text-slate-200 mt-0.5 font-mono">{health?.automation_rate_pct}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">решено ботом / FAQ</div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] text-slate-400">Эскалации инженеру</div>
            <div className="text-lg font-bold text-rose-300 mt-0.5 font-mono">{health?.escalated_pct}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">сложные кейсы L2</div>
          </div>
        </div>
      </div>

      {/* Level 4 & Level 5: Top Problems + Root Cause Drill-down */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Level 4: TOP-10 Problems Ranking */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">ТОП Проблем (Рейтинг причин)</h2>
              </div>
              <span className="text-[11px] text-slate-400">Срез за 7 дней</span>
            </div>

            <div className="space-y-2.5">
              {topProblems.map((prob) => (
                <div key={prob.rank} className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 text-xs font-bold font-mono flex items-center justify-center">
                        {prob.rank}
                      </span>
                      <span className="text-xs font-medium text-slate-200">{prob.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className="text-xs font-bold text-white">{prob.count}</span>
                      <span className="text-[11px] text-slate-400">({prob.share_pct}%)</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded font-medium ${
                        prob.trend_pct > 0 ? 'bg-rose-950/40 text-rose-400 border border-rose-900/40' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {prob.trend_pct > 0 ? `+${prob.trend_pct}%` : `${prob.trend_pct}%`}
                      </span>
                    </div>
                  </div>

                  {/* Micro breakdown tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-900 text-[10px]">
                    {prob.top_devices?.slice(0, 2).map((d) => (
                      <span key={d.name} className="bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded border border-slate-800">
                        {d.name}: {d.count}
                      </span>
                    ))}
                    {prob.top_operators?.slice(0, 2).map((o) => (
                      <span key={o.name} className="bg-slate-900 text-slate-300 px-1.5 py-0.2 rounded border border-slate-800">
                        {o.name}: {o.count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Level 5: Drill-Down Root Cause Anomalies */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
                  Выявленные аномалии (Root Cause)
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">Кандидаты в Problem Register</span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Автоматическое пересечение Платформы, Оператора и Приложения, концентрирующее основной объем обращений:
            </p>

            <div className="space-y-2.5">
              {anomalies.map((a, idx) => (
                <div 
                  key={idx}
                  className={`bg-slate-950/70 rounded-lg p-3 border transition-colors ${
                    a.alert_level === 'CRITICAL'
                      ? 'border-rose-900/50 bg-rose-950/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      {a.combination}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                      a.alert_level === 'CRITICAL'
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {a.alert_level}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 mt-1">
                    Категория: <strong className="text-slate-300">{a.category}</strong> • {a.occurrences} случаев ({a.percentage_of_category}% от категории)
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900 text-[10px]">
                    <span className="text-slate-500">
                      Уникальных абонентов: <strong className="text-slate-300 font-mono">{a.unique_users}</strong>
                    </span>
                    {a.linked_problem_code ? (
                      <span className="text-slate-300 font-mono">
                        Привязано: {a.linked_problem_code}
                      </span>
                    ) : (
                      <span className="text-rose-400 font-medium">
                        Требует занесения в Problem Register
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Предотвращено обращений исправлениями:</span>
            <span className="text-slate-200 font-semibold font-mono">~1 420 тикетов / месяц</span>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-xs text-slate-200">{reportData?.title || 'Генерация отчета...'}</h3>
              </div>
              <button
                onClick={() => setReportModal(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
              >
                Закрыть
              </button>
            </div>

            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed bg-slate-950">
              {reportData?.text || 'Загрузка данных...'}
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Готовый текст для отправки собственнику / в чат лидеров</span>
              <button
                onClick={handleCopyReport}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Скопировано в буфер' : 'Скопировать текст'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
