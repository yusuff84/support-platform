import React, { useState, useEffect } from 'react';
import { 
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
    setSimStatus('Отправка запроса в конвейер...');
    try {
      const res = await api.webhooks.simulate({
        channel: simChannel,
        user_id: simUserId,
        user_name: simUserName,
        message_text: simText
      });
      setSimStatus(`Успешно! Тикет создан/обновлен в очереди: #${res.ticket_id || res.user_id}`);
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
    return <div className="p-12 text-center text-zinc-500 dark:text-zinc-400 text-xs font-mono">Загрузка параметров системы...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase font-mono">
              СИСТЕМНЫЕ НАСТРОЙКИ И ИНТЕГРАЦИИ
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-750">
              Superroot Level
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            <strong>Обоснование:</strong> Централизованное управление токенами, пулом ИИ-моделей и внешней базой VPN без перезапуска сервисов.
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-zinc-900 border border-emerald-300 dark:border-zinc-700 text-emerald-800 dark:text-zinc-200 text-xs font-mono font-medium shadow-xs">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-zinc-200" />
            <span>Параметры успешно сохранены</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SECTION 1: OpenRouter Free Model Pool */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wide font-mono">
                OpenRouter AI: Пул бесплатных моделей
              </h2>
            </div>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              Режим: <strong className="text-zinc-900 dark:text-zinc-200">{settings?.openrouter?.has_api_key ? 'Внешний API' : 'Локальный эвристический'}</strong>
            </span>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
            <div>
              <label className="text-zinc-700 dark:text-zinc-300 font-medium">OpenRouter API Key</label>
              <input
                type="password"
                placeholder={settings?.openrouter?.masked_key ? `Текущий: ${settings.openrouter.masked_key}` : 'sk-or-v1-...'}
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                Ключ от сервиса OpenRouter. Если ключ не задан, работает встроенный эвристический триаж.
              </span>
            </div>

            <div>
              <label className="text-zinc-700 dark:text-zinc-300 font-medium font-mono">Пул моделей (Очередь авто-failover при коде 429)</label>
              <textarea
                rows="5"
                value={modelPoolStr}
                onChange={(e) => setModelPoolStr(e.target.value)}
                className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white font-mono text-[11px]"
              />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                При Rate Limit или 503 запрос мгновенно передается следующей бесплатной модели в списке.
              </span>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-bold shadow-xs transition-colors"
            >
              Сохранить параметры ИИ
            </button>
          </form>
        </div>

        {/* SECTION 2: Channels (Telegram & Instagram) & VPN DB */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wide font-mono">
                Каналы обращений и База данных VPN
              </h2>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
            <div>
              <label className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center justify-between">
                <span>Telegram Bot Token (@topvpnhelp_bot)</span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-mono">
                  {settings?.telegram?.is_configured ? 'Подключен' : 'Локальный режим'}
                </span>
              </label>
              <input
                type="password"
                placeholder={settings?.telegram?.masked_token ? `Текущий: ${settings.telegram.masked_token}` : '123456789:ABCDefgh...'}
                value={tgToken}
                onChange={(e) => setTgToken(e.target.value)}
                className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="text-zinc-700 dark:text-zinc-300 font-medium font-mono">Telegram ID группы операторов (Форумные топики)</label>
              <input
                type="text"
                placeholder="-100123456789"
                value={tgGroupId}
                onChange={(e) => setTgGroupId(e.target.value)}
                className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center justify-between">
                <span>Instagram Graph API Access Token</span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-mono">
                  {settings?.instagram?.is_configured ? 'Подключен' : 'Локальный режим'}
                </span>
              </label>
              <input
                type="password"
                placeholder="EAAG..."
                value={igToken}
                onChange={(e) => setIgToken(e.target.value)}
                className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center justify-between">
                <span>Строка подключения к базе VPN (databasetop)</span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[10px] font-mono">{settings?.vpn_database?.status}</span>
              </label>
              <input
                type="text"
                placeholder="postgresql://user:pass@host:5432/databasetop"
                value={vpnDbUrl}
                onChange={(e) => setVpnDbUrl(e.target.value)}
                className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                {settings?.vpn_database?.message}
              </span>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-bold shadow-xs transition-colors"
            >
              Сохранить каналы
            </button>
          </form>
        </div>
      </div>

      {/* SECTION 3: Live Incoming Message Simulator */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <Play className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wide font-mono">
              Симулятор входящих обращений (Telegram & Instagram)
            </h2>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            Мгновенное тестирование пайплайна
          </span>
        </div>

        <form onSubmit={handleSimulate} className="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-xs items-end">
          <div>
            <label className="text-zinc-700 dark:text-zinc-300 font-medium">Канал</label>
            <select
              value={simChannel}
              onChange={(e) => setSimChannel(e.target.value)}
              className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white font-mono"
            >
              <option value="telegram">Telegram (@topvpnhelp_bot)</option>
              <option value="instagram">Instagram Direct</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-700 dark:text-zinc-300 font-medium">Имя абонента</label>
            <input
              type="text"
              value={simUserName}
              onChange={(e) => setSimUserName(e.target.value)}
              className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-zinc-700 dark:text-zinc-300 font-medium font-mono">ID абонента</label>
            <input
              type="text"
              value={simUserId}
              onChange={(e) => setSimUserId(e.target.value)}
              className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white font-mono"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-bold flex items-center justify-center space-x-2 transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Смоделировать обращение</span>
          </button>

          <div className="md:col-span-4">
            <label className="text-zinc-700 dark:text-zinc-300 font-medium">Текст сообщения от пользователя</label>
            <input
              type="text"
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              placeholder="Например: Не работает VPN на iPhone через Wi-Fi Ростелеком..."
              className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white"
            />
          </div>
        </form>

        {simStatus && (
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-300 font-mono">
            {simStatus}
          </div>
        )}
      </div>

      {/* SECTION 4: Staff Users & Roles */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-wide font-mono">
              Сотрудники и роли (RBAC)
            </h2>
          </div>
          <button
            onClick={() => setShowUserModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-xs font-bold text-white dark:text-zinc-950 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить сотрудника</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-50 dark:bg-zinc-950">
                <th className="py-2.5 px-3">Логин</th>
                <th className="py-2.5 px-3 font-sans">Имя сотрудника</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3 font-sans">Роль доступа</th>
                <th className="py-2.5 px-3 font-sans">Статус</th>
                <th className="py-2.5 px-3 text-right">Последний вход</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900 text-zinc-800 dark:text-zinc-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/60 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100">{u.username}</td>
                  <td className="py-2.5 px-3 font-sans text-zinc-800 dark:text-zinc-200">{u.full_name}</td>
                  <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400">{u.email || '—'}</td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 font-mono">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">Активен</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-500 dark:text-zinc-400 font-mono">
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
        <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-200 uppercase tracking-wide font-mono">Добавить сотрудника</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800"
              >
                Отмена
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-600 dark:text-zinc-400 font-medium font-mono">Логин</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-600 dark:text-zinc-400 font-medium">Полное имя</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-zinc-600 dark:text-zinc-400 font-medium font-mono">Роль</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white font-mono"
                >
                  <option value="support_agent">support_agent (Менеджер саппорта)</option>
                  <option value="support_lead">support_lead (Руководитель саппорта)</option>
                  <option value="director">director (Директор)</option>
                  <option value="superroot">superroot (Суперрут)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-600 dark:text-zinc-400 font-medium">Пароль</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2.5 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-zinc-150 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-bold shadow-xs"
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
