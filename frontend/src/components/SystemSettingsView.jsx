import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  Send, 
  Database, 
  Users, 
  Check, 
  ShieldAlert, 
  RefreshCw,
  Plus,
  Play
} from 'lucide-react';
import { InstagramIcon } from './Icons';
import { api } from '../api';

export default function SystemSettingsView({ user }) {
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  // Form states
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [modelPoolStr, setModelPoolStr] = useState('');
  const [tgToken, setTgToken] = useState('');
  const [tgGroupId, setTgGroupId] = useState('');
  const [igToken, setIgToken] = useState('');
  const [vpnDbUrl, setVpnDbUrl] = useState('');

  // Simulator state
  const [simChannel, setSimChannel] = useState('telegram');
  const [simUserId, setSimUserId] = useState('994821');
  const [simUserName, setSimUserName] = useState('Константин Тестов');
  const [simText, setSimText] = useState('Здравствуйте! Amnezia VPN не подключается на Android через оператор МТС');
  const [simStatus, setSimStatus] = useState('');

  // New User state
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'support_agent'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, uData] = await Promise.all([
        api.settings.get(),
        api.auth.listUsers()
      ]);
      setSettings(sData);
      setUsers(uData);
      setOpenrouterKey('');
      setModelPoolStr((sData.openrouter?.model_pool || []).join('\n'));
      setTgToken('');
      setTgGroupId(sData.telegram?.operator_group_id || '');
      setIgToken('');
      setVpnDbUrl('');
    } catch (err) {
      console.error('Error fetching settings/users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const payload = {};
      if (openrouterKey.trim()) payload.openrouter_api_key = openrouterKey.trim();
      if (modelPoolStr.trim()) {
        payload.free_model_pool = modelPoolStr.split('\n').map(s => s.trim()).filter(Boolean);
      }
      if (tgToken.trim()) payload.telegram_bot_token = tgToken.trim();
      if (tgGroupId) payload.telegram_operator_group_id = parseInt(tgGroupId) || 0;
      if (igToken.trim()) payload.instagram_access_token = igToken.trim();
      if (vpnDbUrl.trim()) payload.vpn_database_url = vpnDbUrl.trim();

      await api.settings.update(payload);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
      await loadData();
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    setSimStatus('Отправка события в очередь...');
    try {
      const res = await api.webhooks.simulate({
        channel: simChannel,
        user_id: simUserId,
        user_name: simUserName,
        message_text: simText
      });
      setSimStatus(`Успешно! Создан/обновлен тикет #${res.ticket_id || res.user_id}`);
      setTimeout(() => setSimStatus(''), 4000);
    } catch (err) {
      setSimStatus(`Ошибка: ${err.message}`);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.auth.createUser(newUser);
      setShowUserModal(false);
      setNewUser({ username: '', full_name: '', email: '', password: '', role: 'support_agent' });
      await loadData();
    } catch (err) {
      alert(`Ошибка создания пользователя: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-xs">Загрузка системных настроек...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">СУПЕРРУТ НАСТРОЙКИ</h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
              Superroot Access Only
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Управление интеграциями Telegram, Instagram, пулом бесплатных моделей OpenRouter, базой данных VPN и сотрудниками.
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-pulse">
            <Check className="w-4 h-4" />
            <span>Настройки успешно сохранены!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: OpenRouter Free Model Pool */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">OpenRouter AI & Бесплатный пул</h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Статус ключа: <strong className={settings?.openrouter?.has_api_key ? 'text-emerald-400' : 'text-amber-400'}>
                {settings?.openrouter?.has_api_key ? 'Активен' : 'Локальный режим (Heuristic)'}
              </strong>
            </span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-medium">OpenRouter API Key</label>
              <input
                type="password"
                placeholder={settings?.openrouter?.masked_key ? `Текущий: ${settings.openrouter.masked_key}` : 'sk-or-v1-...'}
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Ключ от openrouter.ai для доступа к пулу моделей.
              </span>
            </div>

            <div>
              <label className="text-slate-400 font-medium">Пул бесплатных моделей (последовательность failover)</label>
              <textarea
                rows="5"
                value={modelPoolStr}
                onChange={(e) => setModelPoolStr(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                При ошибке 429 или таймауте система автоматически переключается на следующую модель по списку.
              </span>
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-colors"
            >
              Сохранить параметры ИИ
            </button>
          </form>
        </div>

        {/* SECTION 2: Channels (Telegram & Instagram) & VPN DB */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Каналы связи и База VPN</h2>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 font-medium flex items-center justify-between">
                <span>Telegram Bot Token (@topvpnhelp_bot)</span>
                <span className={settings?.telegram?.is_configured ? 'text-emerald-400 text-[10px]' : 'text-slate-500 text-[10px]'}>
                  {settings?.telegram?.is_configured ? 'Подключен' : 'Не задан (симуляция)'}
                </span>
              </label>
              <input
                type="password"
                placeholder={settings?.telegram?.masked_token ? `Текущий: ${settings.telegram.masked_token}` : '123456789:ABCDefgh...'}
                value={tgToken}
                onChange={(e) => setTgToken(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium">Telegram ID супергруппы операторов</label>
              <input
                type="text"
                placeholder="-100123456789"
                value={tgGroupId}
                onChange={(e) => setTgGroupId(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium flex items-center justify-between">
                <span>Instagram Graph API Access Token</span>
                <span className={settings?.instagram?.is_configured ? 'text-emerald-400 text-[10px]' : 'text-slate-500 text-[10px]'}>
                  {settings?.instagram?.is_configured ? 'Подключен' : 'Симуляция / Mock'}
                </span>
              </label>
              <input
                type="password"
                placeholder="EAAG..."
                value={igToken}
                onChange={(e) => setIgToken(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium flex items-center justify-between">
                <span>Строка подключения к базе VPN (databasetop)</span>
                <span className="text-cyan-400 text-[10px]">{settings?.vpn_database?.status}</span>
              </label>
              <input
                type="text"
                placeholder="postgresql://user:pass@host:5432/databasetop"
                value={vpnDbUrl}
                onChange={(e) => setVpnDbUrl(e.target.value)}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {settings?.vpn_database?.message}
              </span>
            </div>

            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30 transition-colors"
            >
              Сохранить каналы
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 3: Live Incoming Message Simulator */}
      <div className="bg-slate-900/60 border border-indigo-900/40 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Play className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Симулятор входящих обращений (Telegram & Instagram)
            </h2>
          </div>
          <span className="text-xs text-slate-400">Тестирование AI триажа и автоответов в 1 клик</span>
        </div>

        <form onSubmit={handleSimulate} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs items-end">
          <div>
            <label className="text-slate-400 font-medium">Канал обращения</label>
            <select
              value={simChannel}
              onChange={(e) => setSimChannel(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-semibold"
            >
              <option value="telegram">Telegram (@bot)</option>
              <option value="instagram">Instagram Direct</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 font-medium">Имя клиента</label>
            <input
              type="text"
              value={simUserName}
              onChange={(e) => setSimUserName(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium">ID клиента</label>
            <input
              type="text"
              value={simUserId}
              onChange={(e) => setSimUserId(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Смоделировать запрос</span>
          </button>

          <div className="md:col-span-4">
            <label className="text-slate-400 font-medium">Текст сообщения от абонента</label>
            <input
              type="text"
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              placeholder="Например: Не работает VPN на iPhone через Wi-Fi Ростелеком..."
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
            />
          </div>
        </form>

        {simStatus && (
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
            {simStatus}
          </div>
        )}
      </div>

      {/* SECTION 4: Staff Users & Roles */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Сотрудники и роли (RBAC)
            </h2>
          </div>
          <button
            onClick={() => setShowUserModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить сотрудника</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                <th className="py-2.5 px-3">Логин</th>
                <th className="py-2.5 px-3">Имя сотрудника</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Роль доступа</th>
                <th className="py-2.5 px-3">Статус</th>
                <th className="py-2.5 px-3 text-right">Последний вход</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-white">{u.username}</td>
                  <td className="py-2.5 px-3 font-semibold">{u.full_name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{u.email || '—'}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      u.role === 'superroot' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      u.role === 'director' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                      u.role === 'support_lead' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-emerald-400 font-semibold">● Активен</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">
                    {u.last_login ? new Date(u.last_login).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Добавить сотрудника</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Отмена
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Логин</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Полное имя</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Роль</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="support_agent">support_agent (Менеджер саппорта)</option>
                  <option value="support_lead">support_lead (Руководитель саппорта)</option>
                  <option value="director">director (Директор)</option>
                  <option value="superroot">superroot (Суперрут)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Пароль</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
