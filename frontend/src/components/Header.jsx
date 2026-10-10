import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Sliders, 
  BookOpen, 
  Settings, 
  ChevronDown, 
  LogOut,
  UserCheck
} from 'lucide-react';

const ROLES_TITLE = {
  director: 'Директор',
  support_lead: 'Руководитель',
  support_agent: 'Оператор саппорта',
  superroot: 'Суперрут'
};

export default function Header({ user, currentTab, setTab, onQuickRoleSwitch, onLogout }) {
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

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between select-none">
      {/* 1. Identity Pattern: Logo & App Descriptor */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-750 flex items-center justify-center text-zinc-100 font-bold font-mono text-xs shadow-sm">
            TOP
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs tracking-wider text-zinc-100 uppercase font-mono">SUPPORT OS</span>
              <span className="text-[10px] text-zinc-400 font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                40k
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 leading-tight">Контроль качества VPN-продукта</span>
          </div>
        </div>

        {/* 2. Global Navigation Tabs Pattern */}
        <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-zinc-800">
          <button
            onClick={() => setTab('dashboard')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-zinc-850 text-white font-semibold border border-zinc-750 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
            <span>VPN Health (Директор)</span>
          </button>

          <button
            onClick={() => setTab('workspace')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentTab === 'workspace'
                ? 'bg-zinc-850 text-white font-semibold border border-zinc-750 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span>Обращения и Паспорт</span>
          </button>

          {(user?.role === 'director' || user?.role === 'support_lead' || user?.role === 'superroot') && (
            <button
              onClick={() => setTab('problems')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentTab === 'problems'
                  ? 'bg-zinc-850 text-white font-semibold border border-zinc-750 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              <span>Реестр проблем & Бэклог</span>
            </button>
          )}

          <button
            onClick={() => setTab('knowledge')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentTab === 'knowledge'
                ? 'bg-zinc-850 text-white font-semibold border border-zinc-750 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>База знаний</span>
          </button>

          {user?.role === 'superroot' && (
            <button
              onClick={() => setTab('settings')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentTab === 'settings'
                  ? 'bg-zinc-850 text-white font-semibold border border-zinc-750 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span>Настройки</span>
            </button>
          )}
        </nav>
      </div>

      {/* 3. Global Control & Role Switcher Pattern */}
      <div className="flex items-center space-x-2.5">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-200 transition-colors shadow-sm"
            title="Быстрое переключение роли пользователя"
          >
            <span className="font-semibold text-zinc-100">{ROLES_TITLE[user?.role] || user?.role}</span>
            <span className="text-zinc-400 text-[11px] font-mono">({user?.full_name})</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-zinc-900 border border-zinc-750 rounded-lg shadow-2xl p-1.5 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 mb-1">
                Переключение роли (Демо-режим)
              </div>

              <button
                onClick={() => { onQuickRoleSwitch('director'); setRoleMenuOpen(false); }}
                className="w-full text-left p-2 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <div className="text-xs font-semibold text-zinc-100">Директор (Director)</div>
                <div className="text-[11px] text-zinc-400">Срез базы 40k, ТОП проблем, отчеты</div>
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('lead'); setRoleMenuOpen(false); }}
                className="w-full text-left p-2 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <div className="text-xs font-semibold text-zinc-100">Руководитель (Lead)</div>
                <div className="text-[11px] text-zinc-400">Problem Register (ITIL), бэклог, SLA</div>
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('agent'); setRoleMenuOpen(false); }}
                className="w-full text-left p-2 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <div className="text-xs font-semibold text-zinc-100">Оператор саппорта (Agent)</div>
                <div className="text-[11px] text-zinc-400">Чат TG/IG, паспорт 7 полей, ключи</div>
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('superroot'); setRoleMenuOpen(false); }}
                className="w-full text-left p-2 rounded-md hover:bg-zinc-800 transition-colors"
              >
                <div className="text-xs font-semibold text-zinc-100">Суперрут (Superroot)</div>
                <div className="text-[11px] text-zinc-400">Токены Telegram/Instagram, OpenRouter</div>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
          title="Выйти из системы"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
