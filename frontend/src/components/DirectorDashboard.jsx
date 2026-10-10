import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Users, 
  FileText, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../api';

export default function DirectorDashboard() {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [topProblems, setTopProblems] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [reportModal, setReportModal] = useState(null);
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
          <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Сбор аналитических срезов базы 40 000 абонентов...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Toolbar Pattern */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-zinc-900 dark:text-white font-mono uppercase">
              VPN HEALTH & QUALITY
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300">
              База: 40 000 абонентов
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Экран собственника: контроль стабильности продукта через процентные доли всей базы абонентов.
          </p>
        </div>

        {/* Action Button Group */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openReport('daily')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Ежедневный срез (5 мин)</span>
          </button>

          <button
            onClick={() => openReport('weekly')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white border border-zinc-800 dark:border-zinc-200 text-xs font-semibold text-white dark:text-zinc-950 transition-colors shadow-xs"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>VPN — Support Weekly</span>
          </button>

          <button
            onClick={fetchData}
            className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-250 dark:border-zinc-800 transition-colors"
            title="Обновить метрики"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Metric Tile Cards Pattern (40,000 Base Breakdown with Informative Semantic Indicators) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold uppercase tracking-wider text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
            Срез качества по всей базе 40 000 пользователей
          </span>
          <span className="text-[11px] font-mono">
            Обоснование: проценты от всей базы исключают искажения от повторных сообщений
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {/* Card 1: Working Normally (GREEN Indicator) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <span className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>1. Работают нормально</span>
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">
              {health?.working_normally_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${health?.working_normally_pct}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 min-w-[42px] text-right font-mono">
                {health?.working_normally_pct}%
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
              Соединения активны, обращений нет
            </div>
          </div>

          {/* Card 2: Users with Problems (RED Indicator) */}
          <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-950/70 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <span className="font-medium text-rose-700 dark:text-rose-300 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>2. Были проблемы</span>
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
              {health?.problem_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${health?.problem_users_pct * 4}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 min-w-[42px] text-right font-mono">
                {health?.problem_users_pct}%
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 flex items-center justify-between font-mono">
              <span>User Problem Rate:</span>
              <span className="px-1.5 py-0.2 rounded font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900">
                {health?.user_problem_rate_pct}%
              </span>
            </div>
          </div>

          {/* Card 3: Unknown Status (AMBER/YELLOW Indicator) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <span className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>3. Неизвестный статус</span>
              </span>
              <Users className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200 font-mono">
              {health?.unknown_status_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${health?.unknown_status_pct * 8}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 min-w-[42px] text-right font-mono">
                {health?.unknown_status_pct}%
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
              Без недавних сессий и без обращений
            </div>
          </div>

          {/* Card 4: Inactive Users (Neutral Indicator) */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              <span className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                <span>4. Неактивны</span>
              </span>
              <Clock className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-300 font-mono">
              {health?.inactive_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-zinc-400 dark:bg-zinc-600 h-full rounded-full" 
                  style={{ width: `${health?.inactive_users_pct * 10}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 min-w-[42px] text-right font-mono">
                {health?.inactive_users_pct}%
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2">
              Не подключались более 30 дней
            </div>
          </div>
        </div>
      </div>

      {/* 3. Support Scoreboard Pattern with Informative Targets */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white font-mono">
              SUPPORT SCORE — Качество работы поддержки
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Метрики скорости решения, качества и предотвращения обращений
            </p>
          </div>
          <span className="text-xs text-zinc-600 dark:text-zinc-300 font-mono">
            Всего обращений за неделю: <strong className="text-zinc-900 dark:text-white">{health?.total_tickets_period}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 pt-1">
          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Решено саппортом</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{health?.resolved_pct}%</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5 font-mono">Ориентир &gt; 90%</div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Время решения (MTTR)</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono mt-0.5">{health?.median_resolution_time_min} мин</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">Медиана закрытия</div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">С 1-го контакта (FCR)</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono mt-0.5">{health?.first_contact_resolution_pct}%</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">Без повторных писем</div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">CSAT Оценка</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{health?.csat_pct}%</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">Удовлетворенность</div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Автоматизация / AI</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-white font-mono mt-0.5">{health?.automation_rate_pct}%</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">Закрыто ботом / FAQ</div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Эскалации инженеру</div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">{health?.escalated_pct}%</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-500 mt-0.5 font-mono">Требуют правок кода</div>
          </div>
        </div>
      </div>

      {/* 4. Two-Column Analytics Drill-down Pattern */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: TOP Problems Ranking */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white font-mono">
                  Рейтинг причин (ТОП-10 проблем)
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Куда уходит время операторов и где болит продукт
                </p>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">За 7 дней</span>
            </div>

            <div className="space-y-2.5">
              {topProblems.map((prob) => (
                <div key={prob.rank} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-850 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold flex items-center justify-center">
                        {prob.rank}
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">{prob.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="font-bold text-zinc-900 dark:text-white">{prob.count}</span>
                      <span className="text-zinc-500 dark:text-zinc-400">({prob.share_pct}%)</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        prob.trend_pct > 0 
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900' 
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}>
                        {prob.trend_pct > 0 ? `+${prob.trend_pct}%` : `${prob.trend_pct}%`}
                      </span>
                    </div>
                  </div>

                  {/* Proportional visual bar */}
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                    <div 
                      className={`h-full rounded-full ${
                        prob.rank === 1 ? 'bg-rose-500' : prob.rank === 2 ? 'bg-amber-500' : 'bg-zinc-500'
                      }`}
                      style={{ width: `${prob.share_pct * 2}%` }}
                    ></div>
                  </div>

                  {/* Drill tags */}
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-zinc-200 dark:border-zinc-900 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                    {prob.top_devices?.slice(0, 2).map((d) => (
                      <span key={d.name} className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 px-1.5 py-0.2 rounded">
                        {d.name}: {d.count}
                      </span>
                    ))}
                    {prob.top_operators?.slice(0, 2).map((o) => (
                      <span key={o.name} className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.2 rounded">
                        {o.name}: {o.count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Root Cause Anomaly Detector with RED/YELLOW badges */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white font-mono">
                  Детектор аномалий (Root Cause)
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Автоматический поиск связок (Устройство + Оператор + Приложение)
                </p>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">ITIL Problem</span>
            </div>

            <div className="space-y-2">
              {anomalies.map((a, idx) => (
                <div 
                  key={idx}
                  className={`rounded-lg p-3 border transition-colors ${
                    a.alert_level === 'CRITICAL'
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : a.alert_level === 'WARNING'
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono">
                      {a.combination}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      a.alert_level === 'CRITICAL' 
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' 
                        : a.alert_level === 'WARNING'
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        : 'bg-zinc-200 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                    }`}>
                      {a.alert_level}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                    Категория: <strong className="text-zinc-900 dark:text-white">{a.category}</strong> • {a.occurrences} случаев ({a.percentage_of_category}% от категории)
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-200 dark:border-zinc-850 text-[10px]">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Затронуто клиентов: <strong className="text-zinc-900 dark:text-zinc-200 font-mono">{a.unique_users}</strong>
                    </span>
                    {a.linked_problem_code ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                        Привязано: {a.linked_problem_code}
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold underline">
                        Требует занесения в Problem Register
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Предотвращено обращений благодаря устранению причин:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm">~1 420 тикетов / месяц</span>
          </div>
        </div>
      </div>

      {/* 5. Modal Dialog Pattern */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-zinc-500 dark:text-zinc-300" />
                <h3 className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider font-mono">{reportData?.title || 'Генерация отчета...'}</h3>
              </div>
              <button
                onClick={() => setReportModal(null)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs px-2.5 py-1 rounded bg-zinc-150 dark:bg-zinc-800 font-mono"
              >
                Закрыть
              </button>
            </div>

            <div className="p-5 overflow-y-auto font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-zinc-950">
              {reportData?.text || 'Загрузка данных...'}
            </div>

            <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Готовый текст для отправки руководству в рабочий чат</span>
              <button
                onClick={handleCopyReport}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-xs font-bold text-white dark:text-zinc-950 transition-colors shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Скопировано в буфер!' : 'Скопировать текст'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
