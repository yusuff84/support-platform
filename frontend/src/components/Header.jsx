import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  BarChart3, 
  MessageSquare, 
  Sliders, 
  BookOpen, 
  Settings, 
  ChevronDown, 
  LogOut,
  Users
} from 'lucide-react';

const ROLES_TITLE = {
  director: 'Директор',
  support_lead: 'Руководитель саппорта',
  support_agent: 'Оператор поддержки',
  superroot: 'Супер-администратор'
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
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-50 px-5 py-3 flex items-center justify-between">
      {/* Brand & Stats */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-100 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-slate-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-tight text-white">TOPBOX SUPPORT</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                40 000 абонентов
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Система контроля качества и омниканальной поддержки</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 pl-4 border-l border-slate-800">
          <button
            onClick={() => setTab('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'dashboard'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>VPN Health (Директор)</span>
          </button>

          <button
            onClick={() => setTab('workspace')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'workspace'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Диалоги и Паспорт</span>
          </button>

          {(user?.role === 'director' || user?.role === 'support_lead' || user?.role === 'superroot') && (
            <button
              onClick={() => setTab('problems')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'problems'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Реестр проблем & Бэклог</span>
            </button>
          )}

          <button
            onClick={() => setTab('knowledge')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'knowledge'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>База знаний</span>
          </button>

          {user?.role === 'superroot' && (
            <button
              onClick={() => setTab('settings')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentTab === 'settings'
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Настройки</span>
            </button>
          )}
        </nav>
      </div>

      {/* Role Switcher & User Profile */}
      <div className="flex items-center space-x-3">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs text-slate-200 transition-colors shadow-sm"
          >
            <span className="font-semibold">{ROLES_TITLE[user?.role] || user?.role}</span>
            <span className="text-slate-400 text-[11px]">({user?.full_name})</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-750 rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                Быстрое переключение роли (Демо)
              </div>

              <button
                onClick={() => { onQuickRoleSwitch('director'); setRoleMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="text-xs font-semibold text-white">Директор (Director)</div>
                <div className="text-[11px] text-slate-400">Экран здоровья базы 40k, ТОП проблем, отчеты</div>
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('lead'); setRoleMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="text-xs font-semibold text-white">Руководитель (Lead / Analyst)</div>
                <div className="text-[11px] text-slate-400">Реестр проблем (ITIL), продуктовый бэклог, SLA</div>
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('agent'); setRoleMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="text-xs font-semibold text-white">Оператор саппорта (Agent)</div>
                <div className="text-[11px] text-slate-400">Рабочий стол: чат TG/IG, паспорт 7 полей, ключи</div>
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('superroot'); setRoleMenuOpen(false); }}
                className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <div className="text-xs font-semibold text-white">Суперрут (Superroot)</div>
                <div className="text-[11px] text-slate-400">Токены Telegram/Instagram, OpenRouter, симулятор</div>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Выйти"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
