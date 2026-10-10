import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Inbox, 
  Layers, 
  BookOpen, 
  Settings as SettingsIcon, 
  ChevronDown, 
  LogOut,
  HelpCircle
} from 'lucide-react';

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
    <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-50 px-4 md:px-6 py-2.5 flex items-center justify-between">
      {/* Brand & System Mode */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-750 flex items-center justify-center text-zinc-100 font-bold text-xs">
            T
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xs tracking-wider text-zinc-100 uppercase">TOPBOX SUPPORT OS</span>
              <span className="text-[10px] text-zinc-400 font-mono px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800">
                40 000 USERS
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">Система контроля качества продукта по обратной связи</span>
          </div>
        </div>

        {/* Navigation Tabs - Strict Monochrome */}
        <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-zinc-800">
          <button
            onClick={() => setTab('dashboard')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
            title="Экран собственника: 40 000 база, метрики здоровья продукта, ТОП проблем"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>VPN Health (Директор)</span>
          </button>

          <button
            onClick={() => setTab('workspace')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              currentTab === 'workspace'
                ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
            title="Рабочее место оператора: тикеты TG/IG, паспорт 7 полей, ИИ-копилот, ключи"
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Обращения и Паспорт</span>
          </button>

          {(user?.role === 'director' || user?.role === 'support_lead' || user?.role === 'superroot') && (
            <button
              onClick={() => setTab('problems')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                currentTab === 'problems'
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title="ITIL L5: Реестр проблем и бэклог устранения первопричин"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Problem Register & Backlog</span>
            </button>
          )}

          <button
            onClick={() => setTab('knowledge')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              currentTab === 'knowledge'
                ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
            title="База знаний: эталонные инструкции для клиентов и автоответов"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>База знаний</span>
          </button>

          {user?.role === 'superroot' && (
            <button
              onClick={() => setTab('settings')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                currentTab === 'settings'
                  ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
              title="Управление токенами TG, IG, OpenRouter и симулятором"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Настройки</span>
            </button>
          )}
        </nav>
      </div>

      {/* Role Selection & Profile */}
      <div className="flex items-center space-x-2.5">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-zinc-300 transition-colors"
          >
            <span className="px-1.5 py-0.2 rounded text-[11px] font-mono bg-zinc-800 text-zinc-200 border border-zinc-700">
              {user?.role}
            </span>
            <span className="text-zinc-200 font-medium text-xs max-w-[120px] truncate">{user?.full_name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-72 bg-zinc-900 border border-zinc-800 rounded shadow-2xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                Переключение роли (Демо-режим)
              </div>

              <button
                onClick={() => { onQuickRoleSwitch('director'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-zinc-100">Директор (Director)</div>
                  <div className="text-[10px] text-zinc-400">Экран здоровья базы 40k, еженедельные отчеты</div>
                </div>
                {user?.role === 'director' && <span className="text-zinc-100 font-mono text-xs font-bold">✓</span>}
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('lead'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-zinc-100">Руководитель саппорта (Lead)</div>
                  <div className="text-[10px] text-zinc-400">Problem Register, бэклог, SLA, база знаний</div>
                </div>
                {user?.role === 'support_lead' && <span className="text-zinc-100 font-mono text-xs font-bold">✓</span>}
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('agent'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-zinc-100">Менеджер саппорта (Agent)</div>
                  <div className="text-[10px] text-zinc-400">Диалоги TG/IG, паспорт тикета, ИИ Copilot, ключи</div>
                </div>
                {user?.role === 'support_agent' && <span className="text-zinc-100 font-mono text-xs font-bold">✓</span>}
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('superroot'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-zinc-800 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-zinc-100">Суперрут (Superroot)</div>
                  <div className="text-[10px] text-zinc-400">Токены TG/IG, OpenRouter пул, симулятор</div>
                </div>
                {user?.role === 'superroot' && <span className="text-zinc-100 font-mono text-xs font-bold">✓</span>}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
          title="Выйти из системы"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
