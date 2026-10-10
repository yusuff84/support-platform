import React, { useState } from 'react';
import { Lock, User, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded p-6 md:p-8 shadow-2xl relative">
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="w-9 h-9 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 font-bold font-mono text-sm mb-1">
            T
          </div>
          <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider font-mono">
            TOPBOX SUPPORT OS
          </h1>
          <p className="text-xs text-zinc-400">
            Система контроля качества и поддержки на 40 000 абонентов
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded bg-zinc-950 border border-zinc-750 text-zinc-200 text-xs text-center font-mono font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-zinc-400 font-medium font-mono">Логин</label>
            <div className="relative mt-1">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="director / agent / lead / superroot"
                className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-white focus:outline-none focus:border-zinc-650 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 font-medium font-mono">Пароль</label>
            <div className="relative mt-1">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-white focus:outline-none focus:border-zinc-650"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors"
          >
            <span>{loading ? 'Авторизация...' : 'Войти в систему'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-6 pt-5 border-t border-zinc-800">
          <div className="text-[11px] font-bold text-zinc-400 text-center mb-3 uppercase tracking-wider font-mono">
            Быстрый вход для тестирования (в 1 клик):
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickDemo('director', 'director123')}
              className="p-2.5 rounded bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-medium text-left transition-colors"
            >
              <div className="font-bold text-zinc-100">Директор</div>
              <div className="text-[10px] text-zinc-400">VPN Health, 40k метрики</div>
            </button>

            <button
              onClick={() => handleQuickDemo('lead', 'lead123')}
              className="p-2.5 rounded bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-medium text-left transition-colors"
            >
              <div className="font-bold text-zinc-100">Руководитель</div>
              <div className="text-[10px] text-zinc-400">Problem Register, SLA</div>
            </button>

            <button
              onClick={() => handleQuickDemo('agent', 'agent123')}
              className="p-2.5 rounded bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-medium text-left transition-colors"
            >
              <div className="font-bold text-zinc-100">Менеджер саппорта</div>
              <div className="text-[10px] text-zinc-400">Чат, паспорт, ИИ, ключи</div>
            </button>

            <button
              onClick={() => handleQuickDemo('superroot', 'admin123')}
              className="p-2.5 rounded bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-medium text-left transition-colors"
            >
              <div className="font-bold text-zinc-100">Суперрут</div>
              <div className="text-[10px] text-zinc-400">Интеграции, симулятор</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
