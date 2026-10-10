import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  ShieldAlert, 
  Cpu, 
  ArrowUpRight 
} from 'lucide-react';
import { api } from '../api';

const STATUS_CONFIG = {
  unknown: { label: 'Неизвестна', badge: 'bg-slate-800 text-rose-300 border-slate-700' },
  investigating: { label: 'Расследование', badge: 'bg-slate-800 text-amber-300 border-slate-700' },
  app_bug: { label: 'Баг приложения', badge: 'bg-slate-800 text-slate-300 border-slate-700' },
  server_overload: { label: 'Перегрузка ноды', badge: 'bg-slate-800 text-slate-300 border-slate-700' },
  bad_guide: { label: 'Плохая инструкция', badge: 'bg-slate-800 text-slate-300 border-slate-700' },
  resolved: { label: 'Устранено', badge: 'bg-slate-800 text-emerald-300 border-slate-700' }
};

export default function ProblemRegisterView({ user }) {
  const [problems, setProblems] = useState([]);
  const [backlog, setBacklog] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal create problem
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [probForm, setProbForm] = useState({
    problem_code: '',
    title: '',
    category: 'Не подключается',
    device: 'Android',
    operator: 'МТС',
    app: 'Amnezia',
    server: 'NL-03',
    occurrences_count: 50,
    affected_users_count: 45,
    status: 'investigating',
    root_cause: '',
    workaround: '',
    permanent_fix: '',
    backlog_priority: 'P1',
    estimated_weekly_tickets: 50,
    estimated_hours_saved_monthly: 4.5
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pData, bData] = await Promise.all([
        api.problems.list(),
        api.problems.listBacklog()
      ]);
      setProblems(pData);
      setBacklog(bData);
    } catch (err) {
      console.error('Error fetching problems/backlog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    try {
      await api.problems.create(probForm);
      setShowProblemModal(false);
      await fetchData();
    } catch (err) {
      console.error('Failed to create problem:', err);
    }
  };

  const handleUpdateBacklogStatus = async (item, newStatus) => {
    try {
      await api.problems.updateBacklog(item.id, { ...item, status: newStatus });
      await fetchData();
    } catch (err) {
      console.error('Failed to update backlog item:', err);
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-7">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-100">
              РЕЕСТР СИСТЕМНЫХ ПРОБЛЕМ И БЭКЛОГ
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              ITIL Level 5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Управление первопричинами инцидентов: трансформация жалоб клиентов в задачи инженерного бэклога.
          </p>
        </div>

        <button
          onClick={() => setShowProblemModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Зарегистрировать проблему</span>
        </button>
      </div>

      {/* Problem Register Table */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
              Реестр проблем (Problem Register)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Записей: <strong className="text-slate-200 font-mono">{problems.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-medium bg-slate-950/60">
                <th className="py-2.5 px-3">Код</th>
                <th className="py-2.5 px-3">Связка и описание</th>
                <th className="py-2.5 px-3 font-mono">Случаев</th>
                <th className="py-2.5 px-3 font-mono">Абонентов</th>
                <th className="py-2.5 px-3">Статус причины</th>
                <th className="py-2.5 px-3">Первопричина (Root Cause)</th>
                <th className="py-2.5 px-3">Временный воркараунд</th>
                <th className="py-2.5 px-3 text-right">Экономия часов/мес</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {problems.map((p) => {
                const sConf = STATUS_CONFIG[p.status] || { label: p.status, badge: 'bg-slate-800 text-slate-400 border-slate-700' };
                return (
                  <tr key={p.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-200">{p.problem_code}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-100">{p.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.device} • {p.operator} • {p.app} {p.server ? `• ${p.server}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-200">{p.occurrences_count}</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{p.affected_users_count}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${sConf.badge}`}>
                        {sConf.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400 max-w-[200px] truncate" title={p.root_cause}>
                      {p.root_cause || '—'}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-400 max-w-[180px] truncate" title={p.workaround}>
                      {p.workaround || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">
                      +{p.estimated_hours_saved_monthly} ч
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Backlog Derived from Support */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
          <div className="flex items-center space-x-2">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
              Product Backlog из реальных обращений
            </h2>
          </div>
          <span className="text-xs text-slate-400">Управление приоритетами по данным саппорта</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 font-medium bg-slate-950/60">
                <th className="py-2.5 px-3">Приоритет</th>
                <th className="py-2.5 px-3">Задача продукта</th>
                <th className="py-2.5 px-3">Проблема</th>
                <th className="py-2.5 px-3 font-mono">Снижение тикетов</th>
                <th className="py-2.5 px-3 font-mono">Экономия времени</th>
                <th className="py-2.5 px-3">Команда</th>
                <th className="py-2.5 px-3 text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {backlog.map((b) => (
                <tr key={b.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      b.priority === 'P0' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      b.priority === 'P1' ? 'bg-slate-800 text-slate-200' :
                      'bg-slate-900 text-slate-400'
                    }`}>
                      {b.priority}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-slate-100">{b.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{b.description}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">{b.problem_code || 'PRB'}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-200">
                    -{b.impact_tickets_per_week} / нед
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">
                    +{b.impact_hours_per_month} ч / мес
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-750">
                      {b.responsible_team}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <select
                      value={b.status}
                      onChange={(e) => handleUpdateBacklogStatus(b, e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-slate-700"
                    >
                      <option value="backlog">В бэклоге</option>
                      <option value="in_dev">В разработке</option>
                      <option value="testing">Тестирование</option>
                      <option value="released">Релиз</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Register Problem */}
      {showProblemModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wide">
                Регистрация проблемы в Problem Register
              </h3>
              <button
                onClick={() => setShowProblemModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded bg-slate-800"
              >
                Отмена
              </button>
            </div>

            <form onSubmit={handleCreateProblem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-medium">Код проблемы</label>
                  <input
                    type="text"
                    required
                    value={probForm.problem_code}
                    onChange={(e) => setProbForm({ ...probForm, problem_code: e.target.value })}
                    placeholder="PRB-005"
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Приоритет Backlog</label>
                  <select
                    value={probForm.backlog_priority}
                    onChange={(e) => setProbForm({ ...probForm, backlog_priority: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md p-2 text-white font-mono"
                  >
                    <option value="P0">P0 (Авария)</option>
                    <option value="P1">P1 (Высокий)</option>
                    <option value="P2">P2 (Средний)</option>
                    <option value="P3">P3 (Низкий)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Название проблемы</label>
                <input
                  type="text"
                  required
                  value={probForm.title}
                  onChange={(e) => setProbForm({ ...probForm, title: e.target.value })}
                  placeholder="Блокировка протокола Android + МТС..."
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 font-medium">Устройство</label>
                  <input
                    type="text"
                    value={probForm.device}
                    onChange={(e) => setProbForm({ ...probForm, device: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Оператор</label>
                  <input
                    type="text"
                    value={probForm.operator}
                    onChange={(e) => setProbForm({ ...probForm, operator: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Приложение</label>
                  <input
                    type="text"
                    value={probForm.app}
                    onChange={(e) => setProbForm({ ...probForm, app: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Первопричина (Root Cause)</label>
                <textarea
                  rows="2"
                  value={probForm.root_cause}
                  onChange={(e) => setProbForm({ ...probForm, root_cause: e.target.value })}
                  placeholder="Техническая причина сбоя..."
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Временный воркараунд</label>
                <input
                  type="text"
                  value={probForm.workaround}
                  onChange={(e) => setProbForm({ ...probForm, workaround: e.target.value })}
                  placeholder="Что говорить абонентам до релиза исправления..."
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-md p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProblemModal(false)}
                  className="px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-medium"
                >
                  Зарегистрировать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
