import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Key, 
  FileText, 
  Sparkles, 
  Bot, 
  Search,
  MessageCircle,
  RefreshCw,
  Check,
  Shield,
  Layers,
  HelpCircle
} from 'lucide-react';
import { InstagramIcon } from './Icons';
import { api } from '../api';

export default function OperatorWorkspace({ user }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [vpnKeys, setVpnKeys] = useState([]);
  const [taxonomy, setTaxonomy] = useState(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Chat input
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Passport Form State
  const [passport, setPassport] = useState({});
  const [savingPassport, setSavingPassport] = useState(false);
  const [passportSavedNotice, setPassportSavedNotice] = useState(false);

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // Load ticket list
  const loadTickets = async () => {
    try {
      const params = {};
      if (channelFilter) params.channel = channelFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const data = await api.tickets.list(params);
      setTickets(data);
      if (data.length > 0 && !selectedTicketId) {
        setSelectedTicketId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  useEffect(() => {
    api.tickets.getTaxonomy().then(setTaxonomy).catch(console.error);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [channelFilter, statusFilter, searchQuery]);

  const loadTicketDetails = async (id) => {
    if (!id) return;
    try {
      const [tData, mData, kData] = await Promise.all([
        api.tickets.get(id),
        api.tickets.getMessages(id),
        api.tickets.getVpnKeys(id)
      ]);
      setSelectedTicket(tData);
      setMessages(mData);
      setVpnKeys(kData.keys || []);
      setPassport({
        category: tData.category || '',
        subcategory: tData.subcategory || '',
        user_id: tData.user_id || '',
        device: tData.device || '',
        operator: tData.operator || '',
        app: tData.app || '',
        problem: tData.problem || '',
        cause: tData.cause || '',
        result: tData.result || '',
        protocol: tData.protocol || '',
        server: tData.server || '',
        severity: tData.severity || 'P2',
        status: tData.status || 'new',
        instruction_helped: tData.instruction_helped,
        escalated_to_engineer: tData.escalated_to_engineer
      });
      setAiSuggestion(null);
    } catch (err) {
      console.error('Error loading ticket details:', err);
    }
  };

  useEffect(() => {
    if (selectedTicketId) {
      loadTicketDetails(selectedTicketId);
    }
  }, [selectedTicketId]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!messageText.trim() || !selectedTicketId) return;

    setSendingMsg(true);
    try {
      await api.tickets.sendMessage(selectedTicketId, {
        ticket_id: selectedTicketId,
        message_text: messageText,
        sender_type: 'operator'
      });
      setMessageText('');
      await loadTicketDetails(selectedTicketId);
      await loadTickets();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSavePassport = async () => {
    if (!selectedTicketId) return;
    setSavingPassport(true);
    try {
      const updated = await api.tickets.updatePassport(selectedTicketId, passport);
      setSelectedTicket(updated);
      setPassportSavedNotice(true);
      setTimeout(() => setPassportSavedNotice(false), 2000);
      await loadTickets();
    } catch (err) {
      console.error('Failed to save passport:', err);
    } finally {
      setSavingPassport(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!selectedTicketId) return;
    setAiLoading(true);
    try {
      const res = await api.ai.suggest(selectedTicketId);
      setAiSuggestion(res);
    } catch (err) {
      console.error('AI suggestion failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiTriage = async () => {
    if (!selectedTicketId) return;
    setAiLoading(true);
    try {
      await api.ai.triage(selectedTicketId);
      await loadTicketDetails(selectedTicketId);
      await loadTickets();
    } catch (err) {
      console.error('AI triage failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendKey = async () => {
    if (!selectedTicketId) return;
    await api.tickets.sendKey(selectedTicketId);
    await loadTicketDetails(selectedTicketId);
  };

  const handleRecreateKey = async () => {
    if (!selectedTicketId) return;
    const proto = passport.protocol || 'Vless';
    const srv = passport.server || 'NL-03';
    await api.tickets.recreateKey(selectedTicketId, { protocol: proto, server: srv });
    await loadTicketDetails(selectedTicketId);
  };

  const handleSendGuide = async (platform) => {
    if (!selectedTicketId) return;
    await api.tickets.sendGuide(selectedTicketId, platform);
    await loadTicketDetails(selectedTicketId);
  };

  return (
    <div className="h-[calc(100vh-53px)] flex flex-col md:flex-row overflow-hidden bg-slate-950">
      {/* COLUMN 1: Ticket Queue List */}
      <div className="w-full md:w-80 lg:w-88 border-r border-slate-800/80 flex flex-col bg-slate-950 shrink-0">
        <div className="p-3 border-b border-slate-800/80 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск по номеру, имени, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-md pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
            />
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-slate-700 flex-1"
            >
              <option value="">Все каналы</option>
              <option value="telegram">Telegram</option>
              <option value="instagram">Instagram</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-slate-700 flex-1"
            >
              <option value="">Все статусы</option>
              <option value="new">Новые</option>
              <option value="in_progress">В работе</option>
              <option value="escalated">Эскалированы</option>
              <option value="resolved">Решённые</option>
            </select>

            <button
              onClick={loadTickets}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800"
              title="Обновить"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tickets Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
          {tickets.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Обращений не найдено
            </div>
          ) : (
            tickets.map((t) => {
              const isSelected = t.id === selectedTicketId;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-900 border-l-2 border-slate-400' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      {t.channel === 'telegram' ? (
                        <span className="p-0.5 rounded text-slate-400" title="Telegram">
                          <MessageCircle className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="p-0.5 rounded text-slate-400" title="Instagram">
                          <InstagramIcon className="w-3 h-3" />
                        </span>
                      )}
                      <span className="font-semibold text-xs text-slate-200 truncate max-w-[130px]">
                        {t.channel_user_name || t.channel_user_id}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        t.severity === 'P0' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        t.severity === 'P1' ? 'bg-slate-800 text-rose-300' :
                        t.severity === 'P2' ? 'bg-slate-800 text-slate-300' :
                        'bg-slate-900 text-slate-500'
                      }`}>
                        {t.severity}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                        t.status === 'new' ? 'text-emerald-400 font-medium' :
                        t.status === 'in_progress' ? 'text-slate-300' :
                        'text-slate-500'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 line-clamp-1 mb-1">
                    {t.category ? (
                      <span className="text-slate-400 font-medium">{t.category}: </span>
                    ) : null}
                    {t.problem || t.last_message || 'Без описания'}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{t.ticket_number}</span>
                    <span>{t.device || 'Платформа не указана'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMN 2: Chat & Actions */}
      <div className="flex-1 flex flex-col border-r border-slate-800/80 bg-slate-950 min-w-0">
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="p-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-300">
                  {selectedTicket.channel_user_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-slate-100">{selectedTicket.channel_user_name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{selectedTicket.channel_user_handle}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                      ID: {selectedTicket.channel_user_id}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center space-x-2 font-mono">
                    <span>Канал: <strong className="text-slate-400 capitalize">{selectedTicket.channel}</strong></span>
                    <span>•</span>
                    <span>Тикет: <strong className="text-slate-400">{selectedTicket.ticket_number}</strong></span>
                  </div>
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleSendKey}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition-colors"
                  title="Отправить действующий ключ абоненту"
                >
                  <Key className="w-3 h-3 text-slate-400" />
                  <span>Отправить ключ</span>
                </button>

                <div className="relative group">
                  <button
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors"
                  >
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Инструкция</span>
                  </button>
                  <div className="absolute right-0 mt-1 hidden group-hover:flex flex-col bg-slate-900 border border-slate-800 rounded-md shadow-xl py-1 z-30 min-w-[130px]">
                    <button
                      onClick={() => handleSendGuide('iPhone')}
                      className="px-3 py-1 text-left text-xs text-slate-300 hover:bg-slate-800"
                    >
                      iOS (iPhone)
                    </button>
                    <button
                      onClick={() => handleSendGuide('Android')}
                      className="px-3 py-1 text-left text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Android
                    </button>
                    <button
                      onClick={() => handleSendGuide('Windows')}
                      className="px-3 py-1 text-left text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Windows
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleRecreateKey}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition-colors"
                  title="Сбросить и перевыпустить ключ"
                >
                  <RefreshCw className="w-3 h-3 text-slate-400" />
                  <span>Пересоздать ключ</span>
                </button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
              {messages.map((m) => {
                const isClient = m.sender_type === 'client';
                const isAI = m.sender_type === 'ai';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mb-1 px-1 font-mono">
                      {isAI && <Bot className="w-3 h-3 text-slate-400" />}
                      <span>{m.sender_name || m.sender_type}</span>
                      <span>•</span>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                        isClient
                          ? 'bg-slate-900 border border-slate-800 text-slate-200'
                          : isAI
                          ? 'bg-slate-900/90 border border-slate-750 text-slate-200'
                          : 'bg-slate-800 border border-slate-700 text-slate-100'
                      }`}
                    >
                      {m.message_text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Suggestion Banner */}
            {aiSuggestion && (
              <div className="mx-4 mb-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    <span>Предложение ответа ИИ ({aiSuggestion.model_used})</span>
                  </div>
                  <button
                    onClick={() => setMessageText(aiSuggestion.suggested_reply)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors"
                  >
                    Вставить в поле ввода
                  </button>
                </div>
                <div className="text-slate-300 font-mono text-[11px] leading-relaxed line-clamp-3">
                  {aiSuggestion.suggested_reply}
                </div>
              </div>
            )}

            {/* Composer */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800/80 bg-slate-950 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Текст ответа клиенту (отправится в Telegram или Instagram)..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700"
              />
              <button
                type="submit"
                disabled={sendingMsg || !messageText.trim()}
                className="px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 font-medium text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-slate-400" />
                <span>Отправить</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Выберите обращение в левом списке
          </div>
        )}
      </div>

      {/* COLUMN 3: Ticket Passport & VPN Inspector */}
      <div className="w-full md:w-80 lg:w-88 border-l border-slate-800/80 overflow-y-auto bg-slate-950 p-4 space-y-4 shrink-0">
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-300">Паспорт обращения</h3>
              </div>
              <button
                onClick={handleSavePassport}
                disabled={savingPassport}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1 transition-colors"
              >
                {passportSavedNotice ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                <span>{passportSavedNotice ? 'Сохранено' : 'Сохранить'}</span>
              </button>
            </div>

            {/* AI Assist Module */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                  <span>ИИ Ассистент (OpenRouter Pool)</span>
                </span>
                <span className="text-[10px] text-slate-500">Авто-failover</span>
              </div>

              {selectedTicket.ai_diagnostic_summary && (
                <div className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800/80">
                  <span className="font-semibold text-slate-400">Диагноз ИИ: </span>
                  {selectedTicket.ai_diagnostic_summary}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleAiTriage}
                  disabled={aiLoading}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-medium text-slate-300 flex items-center justify-center space-x-1 transition-colors"
                >
                  <Bot className="w-3 h-3 text-slate-400" />
                  <span>AI Триаж</span>
                </button>

                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-slate-200 flex items-center justify-center space-x-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-slate-400" />
                  <span>Ответ от ИИ</span>
                </button>
              </div>
            </div>

            {/* Level 1 & Level 2 Passport Inputs */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Категория (Level 1)</label>
                <select
                  value={passport.category || ''}
                  onChange={(e) => setPassport({ ...passport, category: e.target.value, subcategory: '' })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-slate-700"
                >
                  <option value="">-- Выберите категорию --</option>
                  {taxonomy && Object.keys(taxonomy.categories).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {passport.category && taxonomy?.categories[passport.category] && (
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Подкатегория</label>
                  <select
                    value={passport.subcategory || ''}
                    onChange={(e) => setPassport({ ...passport, subcategory: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    <option value="">-- Подкатегория --</option>
                    {taxonomy.categories[passport.category].map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 7 Fields Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Устройство</label>
                  <select
                    value={passport.device || ''}
                    onChange={(e) => setPassport({ ...passport, device: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    <option value="">-- Платформа --</option>
                    {taxonomy?.devices.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Оператор связи</label>
                  <select
                    value={passport.operator || ''}
                    onChange={(e) => setPassport({ ...passport, operator: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    <option value="">-- Оператор --</option>
                    {taxonomy?.operators.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Приложение</label>
                  <select
                    value={passport.app || ''}
                    onChange={(e) => setPassport({ ...passport, app: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    <option value="">-- Приложение --</option>
                    {taxonomy?.apps.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Критичность</label>
                  <select
                    value={passport.severity || 'P2'}
                    onChange={(e) => setPassport({ ...passport, severity: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-slate-200 focus:outline-none focus:border-slate-700 font-mono"
                  >
                    <option value="P0">P0 (Авария)</option>
                    <option value="P1">P1 (Критичная)</option>
                    <option value="P2">P2 (Стандарт)</option>
                    <option value="P3">P3 (Инструкция / FAQ)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Проблема (Симптом)</label>
                <input
                  type="text"
                  value={passport.problem || ''}
                  onChange={(e) => setPassport({ ...passport, problem: e.target.value })}
                  placeholder="Суть неполадки..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Причина (Root Cause)</label>
                <input
                  type="text"
                  value={passport.cause || ''}
                  onChange={(e) => setPassport({ ...passport, cause: e.target.value })}
                  placeholder="Блокировка оператора, перегрузка сервера..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Результат (Resolution)</label>
                <input
                  type="text"
                  value={passport.result || ''}
                  onChange={(e) => setPassport({ ...passport, result: e.target.value })}
                  placeholder="Решено сменой протокола..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-md px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Статус тикета</label>
                  <select
                    value={passport.status || 'new'}
                    onChange={(e) => setPassport({ ...passport, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-slate-200 focus:outline-none focus:border-slate-700 font-medium"
                  >
                    <option value="new">Новый</option>
                    <option value="in_progress">В работе</option>
                    <option value="escalated">Эскалирован</option>
                    <option value="resolved">Решён</option>
                    <option value="closed">Закрыт</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Помог ли гайд</label>
                  <select
                    value={passport.instruction_helped === true ? '1' : passport.instruction_helped === false ? '0' : ''}
                    onChange={(e) => setPassport({ 
                      ...passport, 
                      instruction_helped: e.target.value === '1' ? true : e.target.value === '0' ? false : null 
                    })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-slate-200 focus:outline-none focus:border-slate-700"
                  >
                    <option value="">Неизвестно</option>
                    <option value="1">Да (Помог)</option>
                    <option value="0">Нет</option>
                  </select>
                </div>
              </div>
            </div>

            {/* VPN Client Keys Card */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center space-x-1">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>Действующие ключи VPN</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">databasetop</span>
              </div>

              {vpnKeys.length > 0 ? (
                vpnKeys.map((k) => (
                  <div key={k.id} className="bg-slate-950 p-2.5 rounded border border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{k.server} • {k.protocol}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {k.subscription_status}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 truncate">
                      {k.key_string}
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between font-mono">
                      <span>Трафик: {k.traffic_used_gb} / {k.traffic_limit_gb} GB</span>
                      <span>До: {k.expires_at || 'бессрочно'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[11px] text-slate-500 text-center py-2">
                  Активных ключей не найдено
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-slate-500 text-xs py-8">
            Выберите обращение
          </div>
        )}
      </div>
    </div>
  );
}
