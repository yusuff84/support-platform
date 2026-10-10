import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
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
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative blur */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-1">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">TOPBOX SUPPORT OS</h1>
          <p className="text-xs text-slate-400">
            Система контроля качества и омниканальной поддержки на 40 000 абонентов
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500"
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
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-indigo-600/30"
          >
            <span>{loading ? 'Авторизация...' : 'Войти в систему'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 text-center mb-3 uppercase tracking-wider flex items-center justify-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Быстрый вход для демонстрации (1 клик):</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickDemo('director', 'director123')}
              className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/40 text-purple-300 font-semibold text-left transition-colors"
            >
              📊 Директор
              <div className="text-[10px] text-slate-400 font-normal">VPN Health, 40k метрики</div>
            </button>

            <button
              onClick={() => handleQuickDemo('lead', 'lead123')}
              className="p-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/40 text-amber-300 font-semibold text-left transition-colors"
            >
              👑 Тимлид / Аналитик
              <div className="text-[10px] text-slate-400 font-normal">Problem Register, SLA</div>
            </button>

            <button
              onClick={() => handleQuickDemo('agent', 'agent123')}
              className="p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-emerald-300 font-semibold text-left transition-colors"
            >
              👤 Менеджер саппорта
              <div className="text-[10px] text-slate-400 font-normal">Чат, паспорт, ИИ, ключи</div>
            </button>

            <button
              onClick={() => handleQuickDemo('superroot', 'admin123')}
              className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 font-semibold text-left transition-colors"
            >
              ⚡ Суперрут (Root)
              <div className="text-[10px] text-slate-400 font-normal">Все настройки, симулятор</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
