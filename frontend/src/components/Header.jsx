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
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../ThemeContext';

const ROLES_TITLE = {
  director: 'Директор',
  support_lead: 'Руководитель',
  support_agent: 'Оператор саппорта',
  superroot: 'Суперрут'
};

export default function Header({ user, currentTab, setTab, onQuickRoleSwitch, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  return (
    <>
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-50 px-3 md:px-6 flex items-center justify-between select-none shadow-xs transition-colors duration-150">
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center space-x-3 md:space-x-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md lg:hidden text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            title="Меню навигации"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold font-mono text-xs flex items-center justify-center shadow-sm shrink-0">
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

          {/* Desktop Navigation Tabs */}
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

            {(user?.role === 'director' || user?.role === 'support_lead' || user?.role === 'superroot') && (
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

            {user?.role === 'superroot' && (
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

        {/* Right Actions: Theme Toggle + Role Switcher + Logout */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs"
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-zinc-200" /> : <Moon className="w-4 h-4 text-zinc-800" />}
          </button>

          {/* Role Switcher Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-200 transition-colors shadow-xs"
            >
              <span className="font-semibold">{ROLES_TITLE[user?.role] || user?.role}</span>
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

      {/* Mobile Drawer Navigation Menu when Hamburger is tapped */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-1 z-40 transition-all shadow-md">
          <button
            onClick={() => { setTab('dashboard'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left ${
              currentTab === 'dashboard'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>VPN Health (Директор)</span>
          </button>

          <button
            onClick={() => { setTab('workspace'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left ${
              currentTab === 'workspace'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Диалоги и Паспорт</span>
          </button>

          {(user?.role === 'director' || user?.role === 'support_lead' || user?.role === 'superroot') && (
            <button
              onClick={() => { setTab('problems'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left ${
                currentTab === 'problems'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Реестр проблем & Бэклог</span>
            </button>
          )}

          <button
            onClick={() => { setTab('knowledge'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left ${
              currentTab === 'knowledge'
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>База знаний</span>
          </button>

          {user?.role === 'superroot' && (
            <button
              onClick={() => { setTab('settings'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left ${
                currentTab === 'settings'
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold'
                : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Настройки суперрут</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
