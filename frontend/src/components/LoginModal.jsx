import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
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
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-7 md:p-9 shadow-2xl relative">
        <div className="flex flex-col items-center text-center space-y-2 mb-7">
          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-100 mb-1 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-slate-200" />
          </div>
          <h1 className="text-base font-bold text-white tracking-wider uppercase">
            TOPBOX SUPPORT OS
          </h1>
          <p className="text-xs text-slate-400">
            Система контроля качества продукта и поддержки на 40 000 абонентов
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-900 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Логин</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="director / agent / lead / superroot"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
          >
            <span>{loading ? 'Авторизация...' : 'Войти в панель'}</span>
            <ArrowRight className="w-4 h-4 text-slate-300" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-7 pt-5 border-t border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 text-center mb-3 uppercase tracking-wider">
            Вход в один клик для тестирования ролей:
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo('director', 'director123')}
              className="p-3 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-left transition-colors"
            >
              <div className="font-bold text-white">Директор</div>
              <div className="text-[11px] text-slate-400">Срез базы 40k, отчеты</div>
            </button>

            <button
              onClick={() => handleQuickDemo('lead', 'lead123')}
              className="p-3 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-left transition-colors"
            >
              <div className="font-bold text-white">Руководитель</div>
              <div className="text-[11px] text-slate-400">Problem Register, SLA</div>
            </button>

            <button
              onClick={() => handleQuickDemo('agent', 'agent123')}
              className="p-3 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-left transition-colors"
            >
              <div className="font-bold text-white">Оператор саппорта</div>
              <div className="text-[11px] text-slate-400">Чат, паспорт, ключи</div>
            </button>

            <button
              onClick={() => handleQuickDemo('superroot', 'admin123')}
              className="p-3 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 text-left transition-colors"
            >
              <div className="font-bold text-white">Суперрут</div>
              <div className="text-[11px] text-slate-400">Интеграции, симулятор</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
