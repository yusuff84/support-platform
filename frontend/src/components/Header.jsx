import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Sliders, 
  BookOpen, 
  Settings, 
  ChevronDown, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../ThemeContext';

const ROLES_TITLE = {
  director: 'Директор',
  support_lead: 'Руководитель',
  support_agent: 'Оператор',
  superroot: 'Суперрут'
};

export default function Header({ user, currentTab, setTab, onQuickRoleSwitch, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showProblemsTab = user?.role === 'director' || user?.role === 'support_lead' || user?.role === 'superroot';
  const showSettingsTab = user?.role === 'superroot';

  return (
    <>
      {/* 1. Top Bar Header */}
      <header className="h-13 md:h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur sticky top-0 z-40 px-3 md:px-6 flex items-center justify-between select-none shadow-xs transition-colors duration-150">
        {/* Brand & Desktop Title */}
        <div className="flex items-center space-x-3 md:space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold font-mono text-xs flex items-center justify-center shadow-sm shrink-0">
              TOP
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-xs tracking-wider text-zinc-900 dark:text-zinc-100 uppercase font-mono">SUPPORT OS</span>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono px-1 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  40k
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight hidden sm:block">Контроль качества VPN-продукта</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Hidden on mobile, uses bottom nav on mobile) */}
          <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold border border-zinc-300 dark:border-zinc-700 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>VPN Health (Директор)</span>
            </button>

            <button
              onClick={() => setTab('workspace')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'workspace'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold border border-zinc-300 dark:border-zinc-700 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Диалоги и Паспорт</span>
            </button>

            {showProblemsTab && (
              <button
                onClick={() => setTab('problems')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentTab === 'problems'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold border border-zinc-300 dark:border-zinc-700 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Реестр проблем & Бэклог</span>
              </button>
            )}

            <button
              onClick={() => setTab('knowledge')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'knowledge'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold border border-zinc-300 dark:border-zinc-700 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>База знаний</span>
            </button>

            {showSettingsTab && (
              <button
                onClick={() => setTab('settings')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentTab === 'settings'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold border border-zinc-300 dark:border-zinc-700 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Настройки</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Actions: Theme Toggle + Role Menu + Logout */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs"
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-zinc-200" /> : <Moon className="w-4 h-4 text-zinc-800" />}
          </button>

          {/* Quick Role Switcher Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-200 transition-colors shadow-xs"
            >
              <span className="font-semibold text-[11px] sm:text-xs">{ROLES_TITLE[user?.role] || user?.role}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 rounded-xl shadow-xl p-1.5 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800 mb-1">
                  Переключение роли (Демо-режим)
                </div>

                <button
                  onClick={() => { onQuickRoleSwitch('director'); setRoleMenuOpen(false); }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Директор (Director)</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Срез базы 40k, ТОП проблем, отчеты</div>
                </button>

                <button
                  onClick={() => { onQuickRoleSwitch('lead'); setRoleMenuOpen(false); }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Руководитель (Lead)</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Problem Register (ITIL), бэклог, SLA</div>
                </button>

                <button
                  onClick={() => { onQuickRoleSwitch('agent'); setRoleMenuOpen(false); }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Оператор саппорта (Agent)</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Чат TG/IG, паспорт 7 полей, ключи</div>
                </button>

                <button
                  onClick={() => { onQuickRoleSwitch('superroot'); setRoleMenuOpen(false); }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Суперрут (Superroot)</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Токены Telegram/Instagram, OpenRouter</div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            className="p-1.5 sm:p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title="Выйти из системы"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Mobile Bottom Navigation Bar Pattern (Fixed at bottom for thumb-friendly navigation on phones) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-14 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur z-50 flex items-center justify-around px-2 shadow-lg pb-[env(safe-area-inset-bottom,0px)]">
        <button
          onClick={() => setTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'dashboard'
              ? 'text-zinc-950 dark:text-white font-bold'
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <BarChart3 className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Health</span>
        </button>

        <button
          onClick={() => setTab('workspace')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'workspace'
              ? 'text-zinc-950 dark:text-white font-bold'
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <MessageSquare className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Чаты</span>
        </button>

        {showProblemsTab && (
          <button
            onClick={() => setTab('problems')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentTab === 'problems'
                ? 'text-zinc-950 dark:text-white font-bold'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Sliders className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight">Реестр</span>
          </button>
        )}

        <button
          onClick={() => setTab('knowledge')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            currentTab === 'knowledge'
              ? 'text-zinc-950 dark:text-white font-bold'
              : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <BookOpen className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">База</span>
        </button>

        {showSettingsTab && (
          <button
            onClick={() => setTab('settings')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentTab === 'settings'
                ? 'text-zinc-950 dark:text-white font-bold'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <Settings className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight">Настройки</span>
          </button>
        )}
      </nav>
    </>
  );
}
