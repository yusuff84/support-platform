import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  ShieldAlert, 
  Cpu, 
  Info 
} from 'lucide-react';
import { api } from '../api';

const STATUS_CONFIG = {
  unknown: { label: 'Неизвестна', badge: 'bg-zinc-900 text-zinc-300 border-zinc-750' },
  investigating: { label: 'В расследовании', badge: 'bg-zinc-800 text-zinc-100 border-zinc-700' },
  app_bug: { label: 'Баг клиента / приложения', badge: 'bg-zinc-900 text-zinc-300 border-zinc-800' },
  server_overload: { label: 'Перегрузка сервера', badge: 'bg-zinc-900 text-zinc-300 border-zinc-800' },
  bad_guide: { label: 'Дефект инструкции', badge: 'bg-zinc-900 text-zinc-300 border-zinc-800' },
  resolved: { label: 'Устранено разработкой', badge: 'bg-zinc-900 text-zinc-100 border-zinc-700 font-bold' }
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with ITIL Justification */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-zinc-100 uppercase font-mono">
              PROBLEM REGISTER & PRODUCT BACKLOG
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-900 text-zinc-300 border border-zinc-750">
              ITIL Level 5
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            <strong>Принцип ITSM:</strong> Инцидент — это «быстро восстановить связь клиенту прямо сейчас». 
            Проблема — это «почему это повторилось 380 раз и как устранить первопричину навсегда».
          </p>
        </div>

        <button
          onClick={() => setShowProblemModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-100 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Зарегистрировать проблему</span>
        </button>
      </div>

      {/* Problem Register Table */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-400" />
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Реестр проблем (Problem Register)
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Записей: <strong className="text-zinc-200">{problems.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-medium bg-zinc-950">
                <th className="py-2 px-3">Код</th>
                <th className="py-2 px-3 font-sans">Связка и описание</th>
                <th className="py-2 px-3">Случаев</th>
                <th className="py-2 px-3">Абонентов</th>
                <th className="py-2 px-3 font-sans">Статус причины</th>
                <th className="py-2 px-3 font-sans">Первопричина (Root Cause)</th>
                <th className="py-2 px-3 font-sans">Временный воркараунд</th>
                <th className="py-2 px-3 text-right">Экономия часов/мес</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300">
              {problems.map((p) => {
                const sConf = STATUS_CONFIG[p.status] || { label: p.status, badge: 'bg-zinc-900 text-zinc-400 border-zinc-800' };
                return (
                  <tr key={p.id} className="hover:bg-zinc-950/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-zinc-100">{p.problem_code}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-zinc-100">{p.title}</div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                        {p.device} • {p.operator} • {p.app} {p.server ? `• ${p.server}` : ''}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">{p.occurrences_count}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{p.affected_users_count}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${sConf.badge}`}>
                        {sConf.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[11px] text-zinc-400 max-w-[200px] truncate" title={p.root_cause}>
                      {p.root_cause || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[11px] text-zinc-400 max-w-[180px] truncate" title={p.workaround}>
                      {p.workaround || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-zinc-100">
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
      <div className="bg-zinc-900/40 border border-zinc-800 rounded p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wide">
              Product Backlog из реальных обращений
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            Обоснование: приоритизация задач разработки по реальной нагрузке на саппорт
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono font-medium bg-zinc-950">
                <th className="py-2 px-3">Приоритет</th>
                <th className="py-2 px-3 font-sans">Задача продукта</th>
                <th className="py-2 px-3">Проблема</th>
                <th className="py-2 px-3">Снижение тикетов</th>
                <th className="py-2 px-3">Экономия времени</th>
                <th className="py-2 px-3 font-sans">Команда</th>
                <th className="py-2 px-3 text-right font-sans">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300 font-mono">
              {backlog.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-950/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold">
                    <span className={`px-1.5 py-0.2 rounded border ${
                      b.priority === 'P0' ? 'bg-zinc-100 text-zinc-950 font-bold' :
                      b.priority === 'P1' ? 'bg-zinc-800 text-zinc-100 border-zinc-700' :
                      'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}>
                      {b.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-semibold text-zinc-100">{b.title}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{b.description}</div>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">{b.problem_code || 'PRB'}</td>
                  <td className="py-2.5 px-3 font-bold text-zinc-100">
                    -{b.impact_tickets_per_week} / нед
                  </td>
                  <td className="py-2.5 px-3 text-zinc-200">
                    +{b.impact_hours_per_month} ч / мес
                  </td>
                  <td className="py-2.5 px-3 font-sans text-[11px] text-zinc-400">
                    <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {b.responsible_team}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-sans">
                    <select
                      value={b.status}
                      onChange={(e) => handleUpdateBacklogStatus(b, e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-200 focus:outline-none focus:border-zinc-700"
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
              <h3 className="font-bold text-xs text-zinc-200 uppercase tracking-wide font-mono">
                Регистрация проблемы в Problem Register
              </h3>
              <button
                onClick={() => setShowProblemModal(false)}
                className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded bg-zinc-800"
              >
                Отмена
              </button>
            </div>

            <form onSubmit={handleCreateProblem} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-zinc-400 font-medium font-mono">Код проблемы</label>
                  <input
                    type="text"
                    required
                    value={probForm.problem_code}
                    onChange={(e) => setProbForm({ ...probForm, problem_code: e.target.value })}
                    placeholder="PRB-005"
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-medium font-mono">Приоритет Backlog</label>
                  <select
                    value={probForm.backlog_priority}
                    onChange={(e) => setProbForm({ ...probForm, backlog_priority: e.target.value })}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-white font-mono"
                  >
                    <option value="P0">P0 (Авария)</option>
                    <option value="P1">P1 (Высокий)</option>
                    <option value="P2">P2 (Средний)</option>
                    <option value="P3">P3 (Низкий)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-medium">Название проблемы</label>
                <input
                  type="text"
                  required
                  value={probForm.title}
                  onChange={(e) => setProbForm({ ...probForm, title: e.target.value })}
                  placeholder="Блокировка протокола Android + МТС..."
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-zinc-400 font-medium">Устройство</label>
                  <input
                    type="text"
                    value={probForm.device}
                    onChange={(e) => setProbForm({ ...probForm, device: e.target.value })}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-medium">Оператор</label>
                  <input
                    type="text"
                    value={probForm.operator}
                    onChange={(e) => setProbForm({ ...probForm, operator: e.target.value })}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-medium">Приложение</label>
                  <input
                    type="text"
                    value={probForm.app}
                    onChange={(e) => setProbForm({ ...probForm, app: e.target.value })}
                    className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-medium">Первопричина (Root Cause)</label>
                <textarea
                  rows="2"
                  value={probForm.root_cause}
                  onChange={(e) => setProbForm({ ...probForm, root_cause: e.target.value })}
                  placeholder="Техническая причина сбоя..."
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-medium">Временный воркараунд</label>
                <input
                  type="text"
                  value={probForm.workaround}
                  onChange={(e) => setProbForm({ ...probForm, workaround: e.target.value })}
                  placeholder="Что говорить абонентам до релиза..."
                  className="w-full mt-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowProblemModal(false)}
                  className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-bold"
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
