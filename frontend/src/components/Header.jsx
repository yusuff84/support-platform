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
  Moon,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useTheme } from '../ThemeContext';

const ROLES_INFO = {
  director: { title: 'Директор', desc: 'Срез базы 40k, ТОП проблем, отчёты' },
  support_lead: { title: 'Руководитель', desc: 'Problem Register (ITIL), бэклог, SLA' },
  support_agent: { title: 'Оператор', desc: 'Чат TG/IG, паспорт 7 полей, ключи' },
  superroot: { title: 'Суперрут', desc: 'Токены каналов, OpenRouter AI, база' }
};

export default function Header({ user, currentTab, setTab, onQuickRoleSwitch, onLogout, hideMobileBottomBar = false }) {
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
      <header className="h-14 md:h-16 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 px-3 md:px-6 flex items-center justify-between select-none shadow-xs transition-all duration-200 shrink-0">
        {/* Brand & Desktop Title */}
        <div className="flex items-center space-x-3 md:space-x-5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-950 font-black font-mono text-xs flex items-center justify-center shadow-md shadow-zinc-900/10 dark:shadow-black/40 shrink-0">
              TOP
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xs tracking-wider text-zinc-900 dark:text-zinc-100 uppercase font-mono">SUPPORT OS</span>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-300 font-mono font-semibold px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-750">
                  40k абонентов
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight hidden sm:block font-medium">Контроль качества VPN-продукта</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1.5 pl-4 border-l border-zinc-200 dark:border-zinc-800/80">
            <button
              onClick={() => setTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                currentTab === 'dashboard'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>VPN Health</span>
            </button>

            <button
              onClick={() => setTab('workspace')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                currentTab === 'workspace'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Диалоги & Паспорт</span>
            </button>

            {showProblemsTab && (
              <button
                onClick={() => setTab('problems')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  currentTab === 'problems'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Реестр проблем</span>
              </button>
            )}

            <button
              onClick={() => setTab('knowledge')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                currentTab === 'knowledge'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>База знаний</span>
            </button>

            {showSettingsTab && (
              <button
                onClick={() => setTab('settings')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  currentTab === 'settings'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Настройки</span>
              </button>
            )}
          </nav>
        </div>

        {/* Right Actions: Theme Toggle + Role Menu + Logout */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-zinc-100/80 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all duration-150 shadow-xs"
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
          </button>

          {/* Quick Role Switcher Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-zinc-100/90 hover:bg-zinc-200/90 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 transition-all shadow-xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-bold text-xs">{ROLES_INFO[user?.role]?.title || user?.role}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-76 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800 mb-1.5">
                  Переключение роли (Демо-режим)
                </div>

                {Object.entries(ROLES_INFO).map(([key, info]) => {
                  const isActive = user?.role === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { onQuickRoleSwitch(key === 'support_lead' ? 'lead' : key === 'support_agent' ? 'agent' : key); setRoleMenuOpen(false); }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-250 dark:border-zinc-700' 
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{info.title}</span>
                        {isActive && <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Активно</span>}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{info.desc}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title="Выйти из системы"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Mobile Bottom Navigation Bar (Hidden when inside mobile chat to allow 100% space for composer) */}
      {!hideMobileBottomBar && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-15 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md z-40 flex items-center justify-around px-3 shadow-lg pb-[env(safe-area-inset-bottom,0px)]">
          <button
            onClick={() => setTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all ${
              currentTab === 'dashboard'
                ? 'text-zinc-950 dark:text-white font-bold scale-105'
                : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            <BarChart3 className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Health</span>
          </button>

          <button
            onClick={() => setTab('workspace')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all ${
              currentTab === 'workspace'
                ? 'text-zinc-950 dark:text-white font-bold scale-105'
                : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            <MessageSquare className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Чаты</span>
          </button>

          {showProblemsTab && (
            <button
              onClick={() => setTab('problems')}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all ${
                currentTab === 'problems'
                  ? 'text-zinc-950 dark:text-white font-bold scale-105'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              <Sliders className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Реестр</span>
            </button>
          )}

          <button
            onClick={() => setTab('knowledge')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all ${
              currentTab === 'knowledge'
                ? 'text-zinc-950 dark:text-white font-bold scale-105'
                : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            <BookOpen className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">База</span>
          </button>

          {showSettingsTab && (
            <button
              onClick={() => setTab('settings')}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all ${
                currentTab === 'settings'
                  ? 'text-zinc-950 dark:text-white font-bold scale-105'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              <Settings className="w-4 h-4 mb-0.5" />
              <span className="text-[10px]">Настройки</span>
            </button>
          )}
        </nav>
      )}
    </>
  );
}
