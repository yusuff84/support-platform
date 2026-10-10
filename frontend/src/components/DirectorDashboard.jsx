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
  AlertTriangle, 
  ShieldCheck 
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
          <RefreshCw className="w-5 h-5 text-zinc-400 animate-spin" />
          <span className="text-xs text-zinc-400 font-mono">Сбор аналитических срезов базы 40 000 абонентов...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Toolbar Pattern */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white font-mono uppercase">
              VPN HEALTH & QUALITY
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-900 border border-zinc-750 text-zinc-300">
              База: 40 000 пользователей
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Экран собственника: контроль стабильности продукта через процентные доли всей базы абонентов.
          </p>
        </div>

        {/* Action Button Group Pattern */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => openReport('daily')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-medium text-zinc-200 transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Ежедневный срез (5 мин)</span>
          </button>

          <button
            onClick={() => openReport('weekly')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5 text-zinc-300" />
            <span>VPN — Support Weekly</span>
          </button>

          <button
            onClick={fetchData}
            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
            title="Обновить метрики"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Metric Tile Cards Pattern (40,000 Base Breakdown) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold uppercase tracking-wider text-[11px] font-mono text-zinc-300">
            Срез качества по всей базе 40 000 пользователей
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            Обоснование: проценты от всей базы исключают искажения от повторных сообщений
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Card 1: Working Normally */}
          <div className="bg-zinc-900 border border-zinc-800 rounded p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-medium text-zinc-300">1. Работают нормально</span>
              <CheckCircle2 className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {health?.working_normally_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-zinc-300 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${health?.working_normally_pct}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-zinc-200 min-w-[42px] text-right font-mono">
                {health?.working_normally_pct}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">
              Соединения активны, обращений в саппорт нет
            </div>
          </div>

          {/* Card 2: Users with Problems */}
          <div className="bg-zinc-900 border border-zinc-800 rounded p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-medium text-zinc-300">2. Были проблемы</span>
              <AlertTriangle className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              {health?.problem_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-zinc-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${health?.problem_users_pct * 4}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-zinc-300 min-w-[42px] text-right font-mono">
                {health?.problem_users_pct}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2 flex items-center justify-between font-mono">
              <span>User Problem Rate:</span>
              <strong className="text-zinc-100">{health?.user_problem_rate_pct}%</strong>
            </div>
          </div>

          {/* Card 3: Unknown Status */}
          <div className="bg-zinc-900 border border-zinc-800 rounded p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-medium text-zinc-300">3. Неизвестный статус</span>
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-200 font-mono">
              {health?.unknown_status_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-zinc-600 h-full rounded-full" 
                  style={{ width: `${health?.unknown_status_pct * 8}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-zinc-300 min-w-[42px] text-right font-mono">
                {health?.unknown_status_pct}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">
              Без недавних сессий и без обращений
            </div>
          </div>

          {/* Card 4: Inactive Users */}
          <div className="bg-zinc-900 border border-zinc-800 rounded p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-medium text-zinc-300">4. Неактивны</span>
              <Clock className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold text-zinc-400 font-mono">
              {health?.inactive_users.toLocaleString()}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-zinc-700 h-full rounded-full" 
                  style={{ width: `${health?.inactive_users_pct * 10}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-zinc-400 min-w-[42px] text-right font-mono">
                {health?.inactive_users_pct}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">
              Не подключались более 30 дней
            </div>
          </div>
        </div>
      </div>

      {/* 3. Support Scoreboard Pattern (Benchmark Comparison Grid) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              SUPPORT SCORE — Качество работы поддержки
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Метрики скорости решения, качества и предотвращения обращений
            </p>
          </div>
          <span className="text-xs text-zinc-300 font-mono">
            Всего обращений за неделю: <strong className="text-white">{health?.total_tickets_period}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5 pt-1">
          <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5">
            <div className="text-[11px] text-zinc-400">Решено саппортом</div>
            <div className="text-lg font-bold text-zinc-100 font-mono mt-0.5">{health?.resolved_pct}%</div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">Ориентир &gt; 90%</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5">
            <div className="text-[11px] text-zinc-400">Время решения (MTTR)</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{health?.median_resolution_time_min} мин</div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">Медиана закрытия</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5">
            <div className="text-[11px] text-zinc-400">С 1-го контакта (FCR)</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{health?.first_contact_resolution_pct}%</div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">Без повторных писем</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5">
            <div className="text-[11px] text-zinc-400">CSAT Оценка</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{health?.csat_pct}%</div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">Удовлетворенность</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5">
            <div className="text-[11px] text-zinc-400">Автоматизация / AI</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{health?.automation_rate_pct}%</div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">Закрыто ботом / FAQ</div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded p-2.5">
            <div className="text-[11px] text-zinc-400">Эскалации инженеру</div>
            <div className="text-lg font-bold text-zinc-200 font-mono mt-0.5">{health?.escalated_pct}%</div>
            <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">Требуют правок кода</div>
          </div>
        </div>
      </div>

      {/* 4. Two-Column Analytics Drill-down Pattern */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: TOP Problems Ranking */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Рейтинг причин (ТОП-10 проблем)
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Куда уходит время операторов и где болит продукт
                </p>
              </div>
              <span className="text-xs text-zinc-400 font-mono">За 7 дней</span>
            </div>

            <div className="space-y-2.5">
              {topProblems.map((prob) => (
                <div key={prob.rank} className="bg-zinc-950 border border-zinc-800 rounded p-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded bg-zinc-850 text-zinc-200 text-xs font-mono font-bold flex items-center justify-center">
                        {prob.rank}
                      </span>
                      <span className="text-xs font-bold text-white">{prob.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="font-bold text-white">{prob.count}</span>
                      <span className="text-zinc-400">({prob.share_pct}%)</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-850 border border-zinc-750 text-zinc-300 font-mono">
                        {prob.trend_pct > 0 ? `+${prob.trend_pct}%` : `${prob.trend_pct}%`}
                      </span>
                    </div>
                  </div>

                  {/* Proportional visual bar */}
                  <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mb-1.5">
                    <div 
                      className="bg-zinc-400 h-full rounded-full" 
                      style={{ width: `${prob.share_pct * 2}%` }}
                    ></div>
                  </div>

                  {/* Drill tags */}
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-zinc-900 text-[10px] text-zinc-400 font-mono">
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

        {/* Right: Root Cause Anomaly Detector */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Детектор аномалий (Root Cause)
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Автоматический поиск связок (Устройство + Оператор + Приложение)
                </p>
              </div>
              <span className="text-xs text-zinc-400 font-mono">ITIL Problem</span>
            </div>

            <div className="space-y-2">
              {anomalies.map((a, idx) => (
                <div 
                  key={idx}
                  className="bg-zinc-950 rounded p-3 border border-zinc-800"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white font-mono">
                      {a.combination}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-700 text-zinc-200">
                      {a.alert_level}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300 mt-1">
                    Категория: <strong className="text-white">{a.category}</strong> • {a.occurrences} случаев ({a.percentage_of_category}% от всей категории)
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-900 text-[10px]">
                    <span className="text-zinc-400">
                      Затронуто клиентов: <strong className="text-zinc-200 font-mono">{a.unique_users}</strong>
                    </span>
                    {a.linked_problem_code ? (
                      <span className="text-zinc-300 font-mono font-semibold">
                        Привязано: {a.linked_problem_code}
                      </span>
                    ) : (
                      <span className="text-zinc-300 font-semibold underline">
                        Требует занесения в Problem Register
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>Предотвращено обращений благодаря устранению причин:</span>
            <span className="text-white font-bold font-mono text-sm">~1 420 тикетов / месяц</span>
          </div>
        </div>
      </div>

      {/* 5. Modal Dialog Pattern: Executive Report Export */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-750 rounded max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-zinc-300" />
                <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">{reportData?.title || 'Генерация отчета...'}</h3>
              </div>
              <button
                onClick={() => setReportModal(null)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded bg-zinc-800 font-mono"
              >
                Закрыть
              </button>
            </div>

            <div className="p-5 overflow-y-auto font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed bg-zinc-950">
              {reportData?.text || 'Загрузка данных...'}
            </div>

            <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">Готовый текст для отправки руководству в рабочий чат</span>
              <button
                onClick={handleCopyReport}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white border border-zinc-700 transition-colors shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-zinc-200" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Скопировано в буфер!' : 'Скопировать текст'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
