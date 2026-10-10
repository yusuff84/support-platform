import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import { api, setToken } from '../api';
import { useTheme } from '../ThemeContext';

export default function LoginModal({ onLoginSuccess }) {
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 relative transition-colors duration-150">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-xs hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
          title="Сменить тему"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-zinc-200" /> : <Moon className="w-4 h-4 text-zinc-800" />}
        </button>
      </div>

      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-7 md:p-9 shadow-xl relative">
        <div className="flex flex-col items-center text-center space-y-2 mb-7">
          <div className="w-12 h-12 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center font-bold font-mono text-base mb-1 shadow-sm">
            TOP
          </div>
          <h1 className="text-base font-bold text-zinc-900 dark:text-white tracking-wider uppercase font-mono">
            TOPBOX SUPPORT OS
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Система контроля качества продукта и поддержки на 40 000 абонентов
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-zinc-700 dark:text-zinc-300 font-semibold block mb-1">Логин</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="director / agent / lead / superroot"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 font-mono shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-700 dark:text-zinc-300 font-semibold block mb-1">Пароль</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center space-x-2 transition-colors shadow-xs"
          >
            <span>{loading ? 'Авторизация...' : 'Войти в панель'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-7 pt-5 border-t border-zinc-150 dark:border-zinc-800">
          <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 text-center mb-3 uppercase tracking-wider font-mono">
            Вход в один клик для тестирования ролей:
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo('director', 'director123')}
              className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-left transition-colors shadow-xs"
            >
              <div className="font-bold text-zinc-900 dark:text-white">Директор</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Срез базы 40k, отчеты</div>
            </button>

            <button
              onClick={() => handleQuickDemo('lead', 'lead123')}
              className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-left transition-colors shadow-xs"
            >
              <div className="font-bold text-zinc-900 dark:text-white">Руководитель</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Problem Register, SLA</div>
            </button>

            <button
              onClick={() => handleQuickDemo('agent', 'agent123')}
              className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-left transition-colors shadow-xs"
            >
              <div className="font-bold text-zinc-900 dark:text-white">Оператор саппорта</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Чат, паспорт, ключи</div>
            </button>

            <button
              onClick={() => handleQuickDemo('superroot', 'admin123')}
              className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 text-left transition-colors shadow-xs"
            >
              <div className="font-bold text-zinc-900 dark:text-white">Суперрут</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Интеграции, симулятор</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
