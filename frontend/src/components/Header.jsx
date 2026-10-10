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
  UserCheck
} from 'lucide-react';

const ROLES_INFO = {
  superroot: { label: 'Суперрут', badge: 'bg-slate-800 text-slate-200 border-slate-700' },
  director: { label: 'Директор', badge: 'bg-slate-800 text-slate-200 border-slate-700' },
  support_lead: { label: 'Руководитель', badge: 'bg-slate-800 text-slate-200 border-slate-700' },
  support_agent: { label: 'Специалист саппорта', badge: 'bg-slate-800 text-slate-200 border-slate-700' }
};

export default function Header({ user, currentTab, setTab, onQuickRoleSwitch, onLogout }) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const roleMeta = ROLES_INFO[user?.role] || { label: user?.role, badge: 'bg-slate-800 text-slate-300' };

  // Click outside listener
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
    <header className="border-b border-slate-800/80 bg-slate-950 sticky top-0 z-50 px-5 py-2.5 flex items-center justify-between">
      {/* Brand & Live status */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-200">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-tight text-slate-100">TOPBOX</span>
              <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                SUPPORT OS
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
              <span>40 000 абонентов • Мониторинг качества</span>
            </div>
          </div>
        </div>

        {/* Sober Tab Navigation */}
        <nav className="hidden md:flex items-center space-x-1 pl-2 border-l border-slate-800/80">
          <button
            onClick={() => setTab('dashboard')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentTab === 'dashboard'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>VPN Health (Директор)</span>
          </button>

          <button
            onClick={() => setTab('workspace')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentTab === 'workspace'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 text-slate-400" />
            <span>Обращения и Паспорт</span>
          </button>

          {(user?.role === 'director' || user?.role === 'support_lead' || user?.role === 'superroot') && (
            <button
              onClick={() => setTab('problems')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentTab === 'problems'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Реестр проблем & Бэклог</span>
            </button>
          )}

          <button
            onClick={() => setTab('knowledge')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              currentTab === 'knowledge'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <span>База знаний</span>
          </button>

          {user?.role === 'superroot' && (
            <button
              onClick={() => setTab('settings')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                currentTab === 'settings'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Настройки</span>
            </button>
          )}
        </nav>
      </div>

      {/* Role Switcher & User Control */}
      <div className="flex items-center space-x-3">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 transition-colors"
            title="Переключить роль"
          >
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${roleMeta.badge}`}>
              {roleMeta.label}
            </span>
            <span className="text-slate-200 font-medium text-xs max-w-[120px] truncate">{user?.full_name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                Переключение роли (Демо)
              </div>

              <button
                onClick={() => { onQuickRoleSwitch('director'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/70 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-200">Директор</div>
                  <div className="text-[10px] text-slate-400">Экран здоровья базы 40k, отчеты</div>
                </div>
                {user?.role === 'director' && <span className="text-indigo-400 text-xs font-bold">✓</span>}
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('lead'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/70 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-200">Руководитель саппорта</div>
                  <div className="text-[10px] text-slate-400">Реестр проблем, SLA, бэклог</div>
                </div>
                {user?.role === 'support_lead' && <span className="text-indigo-400 text-xs font-bold">✓</span>}
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('agent'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/70 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-200">Менеджер саппорта</div>
                  <div className="text-[10px] text-slate-400">Диалоги TG/IG, паспорт тикета, ключи</div>
                </div>
                {user?.role === 'support_agent' && <span className="text-indigo-400 text-xs font-bold">✓</span>}
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('superroot'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800/70 flex items-center justify-between transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-200">Суперрут</div>
                  <div className="text-[10px] text-slate-400">Интеграции, токены, симулятор</div>
                </div>
                {user?.role === 'superroot' && <span className="text-indigo-400 text-xs font-bold">✓</span>}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onLogout}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          title="Выйти"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
