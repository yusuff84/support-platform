import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Key, 
  FileText, 
  Sparkles, 
  Bot, 
  User, 
  Smartphone, 
  Radio, 
  Layers, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Search,
  MessageCircle,
  SendHorizontal,
  ChevronRight,
  Shield,
  HelpCircle,
  Check
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

  // Load taxonomy once
  useEffect(() => {
    api.tickets.getTaxonomy().then(setTaxonomy).catch(console.error);
  }, []);

  useEffect(() => {
    loadTickets();
  }, [channelFilter, statusFilter, searchQuery]);

  // Load selected ticket details
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

  // Send message
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

  // Save passport
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

  // AI Assistant triggers
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

  // Fast Actions
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
    <div className="h-[calc(100vh-61px)] flex flex-col md:flex-row overflow-hidden bg-slate-950">
      {/* COLUMN 1: Ticket Queue List */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-slate-950/90 shrink-0">
        {/* Filters Header */}
        <div className="p-3 border-b border-slate-800 space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск по номеру, имени, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between space-x-2 text-xs">
            {/* Channel filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 flex-1"
            >
              <option value="">Все каналы</option>
              <option value="telegram">Telegram (@bot)</option>
              <option value="instagram">Instagram Direct</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 flex-1"
            >
              <option value="">Все статусы</option>
              <option value="new">Новые</option>
              <option value="in_progress">В работе</option>
              <option value="escalated">Эскалированы</option>
              <option value="resolved">Решенные</option>
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
                  className={`p-3 cursor-pointer transition-all hover:bg-slate-900/60 ${
                    isSelected ? 'bg-indigo-950/30 border-l-2 border-indigo-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      {t.channel === 'telegram' ? (
                        <span className="p-1 rounded bg-cyan-500/10 text-cyan-400" title="Telegram">
                          <MessageCircle className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-pink-500/10 text-pink-400" title="Instagram">
                          <InstagramIcon className="w-3 h-3" />
                        </span>
                      )}
                      <span className="font-semibold text-xs text-white truncate max-w-[120px]">
                        {t.channel_user_name || t.channel_user_id}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        t.severity === 'P0' ? 'bg-red-500 text-white animate-pulse' :
                        t.severity === 'P1' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        t.severity === 'P2' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {t.severity}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                        t.status === 'new' ? 'bg-emerald-500/20 text-emerald-400' :
                        t.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        t.status === 'escalated' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-slate-300 line-clamp-1 mb-1">
                    {t.category ? (
                      <span className="text-indigo-400 font-semibold">{t.category}: </span>
                    ) : null}
                    {t.problem || t.last_message || 'Без описания'}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{t.ticket_number}</span>
                    <span>{t.device || 'Платформа не указана'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMN 2: Chat & Fast Actions */}
      <div className="flex-1 flex flex-col border-r border-slate-800 bg-slate-950 min-w-0">
        {selectedTicket ? (
          <>
            {/* Ticket Chat Header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                  {selectedTicket.channel_user_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-white">{selectedTicket.channel_user_name}</span>
                    <span className="text-[10px] text-slate-400">{selectedTicket.channel_user_handle}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      ID: {selectedTicket.channel_user_id}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                    <span>Канал: <strong className="text-slate-300 capitalize">{selectedTicket.channel}</strong></span>
                    <span>•</span>
                    <span>Номер тикета: <strong className="text-slate-300">{selectedTicket.ticket_number}</strong></span>
                  </div>
                </div>
              </div>

              {/* Fast Action Buttons in Chat Header */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleSendKey}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
                  title="Отправить действующий ключ клиенту в чат"
                >
                  <Key className="w-3 h-3" />
                  <span>Отправить ключ</span>
                </button>

                <div className="relative group">
                  <button
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Инструкция</span>
                  </button>
                  <div className="absolute right-0 mt-1 hidden group-hover:flex flex-col bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 z-30 min-w-[130px]">
                    <button
                      onClick={() => handleSendGuide('iPhone')}
                      className="px-3 py-1 text-left text-xs text-slate-300 hover:bg-slate-800"
                    >
                      📱 iOS (iPhone)
                    </button>
                    <button
                      onClick={() => handleSendGuide('Android')}
                      className="px-3 py-1 text-left text-xs text-slate-300 hover:bg-slate-800"
                    >
                      🤖 Android
                    </button>
                    <button
                      onClick={() => handleSendGuide('Windows')}
                      className="px-3 py-1 text-left text-xs text-slate-300 hover:bg-slate-800"
                    >
                      💻 Windows
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleRecreateKey}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
                  title="Сбросить и перевыпустить ключ на новом сервере"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Пересоздать ключ</span>
                </button>
              </div>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-950/60">
              {messages.map((m) => {
                const isClient = m.sender_type === 'client';
                const isAI = m.sender_type === 'ai';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mb-1 px-1">
                      {isAI && <Bot className="w-3 h-3 text-cyan-400" />}
                      <span className="font-semibold text-slate-400">{m.sender_name || m.sender_type}</span>
                      <span>•</span>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        isClient
                          ? 'bg-slate-900 border border-slate-800 text-slate-200'
                          : isAI
                          ? 'bg-cyan-950/50 border border-cyan-800/60 text-cyan-100 shadow-sm'
                          : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      }`}
                    >
                      {m.message_text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Suggested Response Banner if available */}
            {aiSuggestion && (
              <div className="mx-4 mb-2 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-cyan-900/40 mb-2">
                  <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Предложение от ИИ Copilot ({aiSuggestion.model_used})</span>
                  </div>
                  <button
                    onClick={() => setMessageText(aiSuggestion.suggested_reply)}
                    className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] transition-colors"
                  >
                    Вставить в чат
                  </button>
                </div>
                <div className="text-slate-300 font-mono text-[11px] leading-relaxed line-clamp-3">
                  {aiSuggestion.suggested_reply}
                </div>
              </div>
            )}

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/40 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Напишите ответ клиенту (отправится в TG или IG)..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={sendingMsg || !messageText.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-md shadow-indigo-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Отправить</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
            Выберите тикет для просмотра переписки
          </div>
        )}
      </div>

      {/* COLUMN 3: Ticket Passport & AI Copilot Panel */}
      <div className="w-full md:w-80 lg:w-96 border-l border-slate-800 overflow-y-auto bg-slate-950 p-4 space-y-4 shrink-0">
        {selectedTicket ? (
          <>
            {/* Header of Passport */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-1.5">
                <Shield className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">Паспорт обращения</h3>
              </div>
              <button
                onClick={handleSavePassport}
                disabled={savingPassport}
                className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1 transition-colors"
              >
                {passportSavedNotice ? <Check className="w-3 h-3 text-emerald-300" /> : null}
                <span>{passportSavedNotice ? 'Сохранено!' : 'Сохранить'}</span>
              </button>
            </div>

            {/* AI Copilot & Triage triggers */}
            <div className="bg-indigo-950/30 border border-indigo-900/40 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>OpenRouter AI Ассистент</span>
                </span>
                <span className="text-[10px] text-slate-400">Пул Free моделей</span>
              </div>

              {selectedTicket.ai_diagnostic_summary && (
                <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="font-semibold text-indigo-400">Диагноз ИИ: </span>
                  {selectedTicket.ai_diagnostic_summary}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleAiTriage}
                  disabled={aiLoading}
                  className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] font-medium text-slate-300 flex items-center justify-center space-x-1 transition-colors"
                >
                  <Bot className="w-3 h-3 text-indigo-400" />
                  <span>AI Триаж</span>
                </button>

                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  className="px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] font-semibold text-white flex items-center justify-center space-x-1 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Ответ от ИИ</span>
                </button>
              </div>
            </div>

            {/* Passport Form Fields */}
            <div className="space-y-3 text-xs">
              {/* Level 1: Category & Subcategory */}
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Категория (Level 1)</label>
                <select
                  value={passport.category || ''}
                  onChange={(e) => setPassport({ ...passport, category: e.target.value, subcategory: '' })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Подкатегория --</option>
                    {taxonomy.categories[passport.category].map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Level 2: 7 Passport Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Устройство (Платформа)</label>
                  <select
                    value={passport.device || ''}
                    onChange={(e) => setPassport({ ...passport, device: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
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
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="P0">P0 (Массовая авария)</option>
                    <option value="P1">P1 (Критичная индив.)</option>
                    <option value="P2">P2 (Стандартная тех.)</option>
                    <option value="P3">P3 (Вопрос / Onboarding)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Проблема (Симптом)</label>
                <input
                  type="text"
                  value={passport.problem || ''}
                  onChange={(e) => setPassport({ ...passport, problem: e.target.value })}
                  placeholder="Суть проблемы..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Причина (Root Cause)</label>
                <input
                  type="text"
                  value={passport.cause || ''}
                  onChange={(e) => setPassport({ ...passport, cause: e.target.value })}
                  placeholder="Блокировка оператора, сбой сервера..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Результат (Resolution)</label>
                <input
                  type="text"
                  value={passport.result || ''}
                  onChange={(e) => setPassport({ ...passport, result: e.target.value })}
                  placeholder="Решено сменой протокола, выдан ключ..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Статус тикета</label>
                  <select
                    value={passport.status || 'new'}
                    onChange={(e) => setPassport({ ...passport, status: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="new">Новый</option>
                    <option value="in_progress">В работе</option>
                    <option value="escalated">Эскалирован</option>
                    <option value="resolved">Решён</option>
                    <option value="closed">Закрыт</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Помогла инструкция</label>
                  <select
                    value={passport.instruction_helped === true ? '1' : passport.instruction_helped === false ? '0' : ''}
                    onChange={(e) => setPassport({ 
                      ...passport, 
                      instruction_helped: e.target.value === '1' ? true : e.target.value === '0' ? false : null 
                    })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Неизвестно</option>
                    <option value="1">Да (Помогла)</option>
                    <option value="0">Нет (Не помогла)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* VPN Client Keys Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center space-x-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Действующие ключи VPN</span>
                </span>
                <span className="text-[10px] text-slate-400">databasetop hook</span>
              </div>

              {vpnKeys.length > 0 ? (
                vpnKeys.map((k) => (
                  <div key={k.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{k.server} • {k.protocol}</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold text-[10px]">
                        {k.subscription_status}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-slate-400 truncate">
                      {k.key_string}
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
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
