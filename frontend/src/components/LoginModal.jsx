import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight } from 'lucide-react';
import { api, setToken } from '../api';

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e, customUser, customPass) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    const u = customUser || username;
    const p = customPass || password;

    try {
      const data = await api.auth.login(u, p);
      setToken(data.access_token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (roleUser, rolePass) => {
    setUsername(roleUser);
    setPassword(rolePass);
    handleSubmit(null, roleUser, rolePass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative">
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 mb-1">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-100 tracking-tight">TOPBOX SUPPORT OS</h1>
          <p className="text-xs text-slate-400">
            Система контроля качества и омниканальной поддержки на 40 000 абонентов
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-400 font-medium">Логин</label>
            <div className="relative mt-1">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="agent / director / superroot"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-slate-750 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-medium">Пароль</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-slate-750"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-100 font-semibold text-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            <span>{loading ? 'Авторизация...' : 'Войти в систему'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 text-center mb-3 uppercase tracking-wider">
            Быстрый вход для тестирования (в 1 клик):
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickDemo('director', 'director123')}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 font-medium text-left transition-colors"
            >
              Директор
              <div className="text-[10px] text-slate-500">VPN Health, метрики 40k</div>
            </button>

            <button
              onClick={() => handleQuickDemo('lead', 'lead123')}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 font-medium text-left transition-colors"
            >
              Руководитель
              <div className="text-[10px] text-slate-500">Problem Register, SLA</div>
            </button>

            <button
              onClick={() => handleQuickDemo('agent', 'agent123')}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 font-medium text-left transition-colors"
            >
              Менеджер саппорта
              <div className="text-[10px] text-slate-500">Чат, паспорт, ИИ, ключи</div>
            </button>

            <button
              onClick={() => handleQuickDemo('superroot', 'admin123')}
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 font-medium text-left transition-colors"
            >
              Суперрут
              <div className="text-[10px] text-slate-500">Интеграции, симулятор</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
