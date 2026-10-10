import React from 'react';
import { 
  ShieldCheck, 
  Activity, 
  MessageSquare, 
  Layers, 
  BookOpen, 
  Settings as SettingsIcon, 
  UserCheck, 
  LogOut,
  ChevronDown
} from 'lucide-react';

const ROLES_INFO = {
  superroot: { label: 'Суперрут', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  director: { label: 'Директор', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  support_lead: { label: 'Руководитель саппорта', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  support_agent: { label: 'Менеджер саппорта', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
};

export default function Header({ user, currentTab, setTab, onQuickRoleSwitch, onLogout }) {
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);

  const roleInfo = ROLES_INFO[user?.role] || { label: user?.role, color: 'bg-slate-800 text-slate-300' };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-2.5 flex items-center justify-between">
      {/* Brand & Status */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tight text-white text-base">TOPBOX</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/30">SUPPORT OS</span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>40 000 абонентов • Live Monitoring</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => setTab('dashboard')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>VPN Health (Директор)</span>
          </button>

          <button
            onClick={() => setTab('workspace')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'workspace'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Problem Register & Backlog</span>
            </button>
          )}

          <button
            onClick={() => setTab('knowledge')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentTab === 'knowledge'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Суперрут настройки</span>
            </button>
          )}
        </nav>
      </div>

      {/* User info & Fast Role Switcher */}
      <div className="flex items-center space-x-3">
        {/* Quick Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs transition-colors"
            title="Быстро переключить роль для тестирования функционала"
          >
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
            <span className="text-slate-300 font-medium text-xs max-w-[120px] truncate">{user?.full_name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-xl">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 mb-1">
                Быстрое переключение роли (Demo)
              </div>
              <button
                onClick={() => { onQuickRoleSwitch('director'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-purple-300">Директор (Director)</div>
                  <div className="text-[10px] text-slate-400">1-экранный VPN Health, метрики 40k, отчеты</div>
                </div>
                {user?.role === 'director' && <span className="text-purple-400 font-bold">✓</span>}
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('lead'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-amber-300">Руководитель саппорта (Lead)</div>
                  <div className="text-[10px] text-slate-400">Problem Register, SLA, бэклог, база знаний</div>
                </div>
                {user?.role === 'support_lead' && <span className="text-amber-400 font-bold">✓</span>}
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('agent'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-emerald-300">Менеджер саппорта (Agent)</div>
                  <div className="text-[10px] text-slate-400">Чат TG/IG, паспорт тикета, ИИ копилот, ключи</div>
                </div>
                {user?.role === 'support_agent' && <span className="text-emerald-400 font-bold">✓</span>}
              </button>

              <button
                onClick={() => { onQuickRoleSwitch('superroot'); setRoleMenuOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-red-300">Суперрут (Superroot)</div>
                  <div className="text-[10px] text-slate-400">Все права, токены, OpenRouter пул, симулятор</div>
                </div>
                {user?.role === 'superroot' && <span className="text-red-400 font-bold">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
          title="Выход"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
