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
  ShieldAlert,
  Info
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
          <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
          <span className="text-xs text-zinc-400 font-mono">Расчет пропорций базы 40 000 абонентов...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-zinc-100 uppercase font-mono">
              VPN HEALTH & QUALITY
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-900 text-zinc-300 border border-zinc-750">
              База: 40 000
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Главный экран собственника: управление VPN как IT-продуктом через реальные срезы обращений абонентов.
          </p>
        </div>

        {/* Executive Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openReport('daily')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-medium text-zinc-200 transition-colors"
            title="Сформировать 5-минутный ежедневный срез для руководства"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Ежедневный срез (5 мин)</span>
          </button>

          <button
            onClick={() => openReport('weekly')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-100 transition-colors"
            title="Сформировать еженедельный аналитический отчет VPN — Support Weekly"
          >
            <TrendingUp className="w-3.5 h-3.5 text-zinc-300" />
            <span>VPN — Support Weekly</span>
          </button>

          <button
            onClick={fetchData}
            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
            title="Обновить метрики"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Level 3: Proportions of 40,000 Base */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Уровень 3. Срез качества по всей базе 40 000 пользователей
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            Обоснование: метрики считаются в % от всей базы, а не в абсолютных тикетах
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Working Normally */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-medium">1. Работают нормально</span>
              <CheckCircle className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-white font-mono">
              {health?.working_normally_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-800 h-1.5 rounded overflow-hidden">
                <div 
                  className="bg-zinc-200 h-full rounded" 
                  style={{ width: `${health?.working_normally_pct}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-zinc-200 min-w-[42px] text-right font-mono">
                {health?.working_normally_pct}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">
              Абоненты без технических инцидентов за отчетный период
            </div>
          </div>

          {/* Users with Problems */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-medium">2. Были проблемы</span>
              <AlertCircle className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
              {health?.problem_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-800 h-1.5 rounded overflow-hidden">
                <div 
                  className="bg-zinc-400 h-full rounded" 
                  style={{ width: `${health?.problem_users_pct * 4}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-zinc-300 min-w-[42px] text-right font-mono">
                {health?.problem_users_pct}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2 flex items-center justify-between font-mono">
              <span>User Problem Rate:</span>
              <span className="font-bold text-zinc-200">{health?.user_problem_rate_pct}%</span>
            </div>
          </div>

          {/* Unknown Status */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-medium">3. Неизвестный статус</span>
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-200 font-mono">
              {health?.unknown_status_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-800 h-1.5 rounded overflow-hidden">
                <div 
                  className="bg-zinc-600 h-full rounded" 
                  style={{ width: `${health?.unknown_status_pct * 8}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-zinc-400 min-w-[42px] text-right font-mono">
                {health?.unknown_status_pct}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">
              Абоненты без свежего handshake/сессии подключения
            </div>
          </div>

          {/* Inactive Users */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded p-4">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-medium">4. Неактивны</span>
              <Clock className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-300 font-mono">
              {health?.inactive_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-800 h-1.5 rounded overflow-hidden">
                <div 
                  className="bg-zinc-700 h-full rounded" 
                  style={{ width: `${health?.inactive_users_pct * 10}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-zinc-400 min-w-[42px] text-right font-mono">
                {health?.inactive_users_pct}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">
              Не открывали приложение более 30 календарных дней
            </div>
          </div>
        </div>
      </div>

      {/* Support Score Grid (KPIs) */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-zinc-300" />
            <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              SUPPORT SCORE (Операционные метрики зрелости поддержки)
            </span>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Всего обращений: <strong className="text-zinc-200">{health?.total_tickets_period}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
          <div className="bg-zinc-950 border border-zinc-800/80 rounded p-3">
            <div className="text-[11px] text-zinc-400">Решено саппортом</div>
            <div className="text-lg font-bold text-zinc-100 font-mono mt-0.5">{health?.resolved_pct}%</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Ориентир: &gt; 90%</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded p-3">
            <div className="text-[11px] text-zinc-400">Время решения (MTTR)</div>
            <div className="text-lg font-bold text-zinc-100 font-mono mt-0.5">{health?.median_resolution_time_min} мин</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Медиана до закрытия</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded p-3">
            <div className="text-[11px] text-zinc-400">С 1-го контакта (FCR)</div>
            <div className="text-lg font-bold text-zinc-100 font-mono mt-0.5">{health?.first_contact_resolution_pct}%</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Без повторных писем</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded p-3">
            <div className="text-[11px] text-zinc-400">CSAT Удовлетворенность</div>
            <div className="text-lg font-bold text-zinc-100 font-mono mt-0.5">{health?.csat_pct}%</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Оценка абонентов</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded p-3">
            <div className="text-[11px] text-zinc-400">Automation Rate (AI)</div>
            <div className="text-lg font-bold text-zinc-100 font-mono mt-0.5">{health?.automation_rate_pct}%</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Без участия оператора</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800/80 rounded p-3">
            <div className="text-[11px] text-zinc-400">Передано инженеру</div>
            <div className="text-lg font-bold text-zinc-300 font-mono mt-0.5">{health?.escalated_pct}%</div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Сложные баги L2</div>
          </div>
        </div>
      </div>

      {/* Level 4 & Level 5: Top Problems + Root Cause Drill-down */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Level 4: TOP-10 Problems Ranking */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 mb-3">
              <div>
                <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                  Уровень 4. Рейтинг причин (ТОП Проблем)
                </h2>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Обоснование: распределение бюджета доработок на самые массовые жалобы
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">7 дней</span>
            </div>

            <div className="space-y-2">
              {topProblems.map((prob) => (
                <div key={prob.rank} className="bg-zinc-950 border border-zinc-800 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded bg-zinc-800 text-zinc-200 text-xs font-mono font-bold flex items-center justify-center">
                        {prob.rank}
                      </span>
                      <span className="text-xs font-semibold text-zinc-100">{prob.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="font-bold text-white">{prob.count}</span>
                      <span className="text-zinc-400">({prob.share_pct}%)</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-zinc-900 border border-zinc-750 text-zinc-300">
                        {prob.trend_pct > 0 ? `+${prob.trend_pct}%` : `${prob.trend_pct}%`}
                      </span>
                    </div>
                  </div>

                  {/* Micro drill tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-zinc-900 text-[10px] text-zinc-400">
                    {prob.top_devices?.slice(0, 2).map((d) => (
                      <span key={d.name} className="bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded">
                        {d.name}: {d.count}
                      </span>
                    ))}
                    {prob.top_operators?.slice(0, 2).map((o) => (
                      <span key={o.name} className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded">
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
        <div className="bg-zinc-900/40 border border-zinc-800 rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 mb-3">
              <div>
                <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                  Уровень 5. Drill-Down Аномалии (Root Cause)
                </h2>
                <div className="text-[10px] text-zinc-400 mt-0.5">
                  Обоснование: поиск скрытых корреляций (Устройство + Оператор + Приложение)
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">ITIL Problem Candidates</span>
            </div>

            <div className="space-y-2">
              {anomalies.map((a, idx) => (
                <div 
                  key={idx}
                  className={`bg-zinc-950 rounded p-3 border ${
                    a.alert_level === 'CRITICAL' ? 'border-zinc-700 bg-zinc-900/30' : 'border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-100 font-mono">
                      {a.combination}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-750 text-zinc-300">
                      {a.alert_level}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-400 mt-1">
                    Категория: <strong className="text-zinc-200">{a.category}</strong> • {a.occurrences} обращений ({a.percentage_of_category}% от всей категории)
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900 text-[10px]">
                    <span className="text-zinc-400">
                      Уникальных абонентов: <strong className="text-zinc-200 font-mono">{a.unique_users}</strong>
                    </span>
                    {a.linked_problem_code ? (
                      <span className="text-zinc-300 font-mono">
                        Связано с: {a.linked_problem_code}
                      </span>
                    ) : (
                      <span className="text-zinc-400 underline font-medium">
                        Внести в Problem Register
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>Предотвращено обращений благодаря устранению проблем:</span>
            <span className="text-zinc-100 font-bold font-mono">~1 420 тикетов / месяц</span>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <h3 className="font-bold text-xs text-zinc-200 font-mono">{reportData?.title || 'Генерация отчета...'}</h3>
              </div>
              <button
                onClick={() => setReportModal(null)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded bg-zinc-800"
              >
                Закрыть
              </button>
            </div>

            <div className="p-5 overflow-y-auto font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950">
              {reportData?.text || 'Загрузка данных...'}
            </div>

            <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">Готовый текст для отправки руководству</span>
              <button
                onClick={handleCopyReport}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-100 border border-zinc-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-zinc-200" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Скопировано!' : 'Скопировать текст'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
