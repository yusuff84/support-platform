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
  ShieldCheck, 
  Copy,
  Clock,
  UserCheck
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
  const [copiedKey, setCopiedKey] = useState(false);

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

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
      setTimeout(() => setPassportSavedNotice(false), 2500);
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

  const handleCopyKeyString = (str) => {
    navigator.clipboard.writeText(str);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col md:flex-row overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* ======================================================== */}
      {/* PANE 1: MASTER LIST (QUEUE: Telegram + Instagram)       */}
      {/* ======================================================== */}
      <div className="w-full md:w-80 lg:w-88 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-950 shrink-0">
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 tracking-tight font-mono uppercase">
              Очередь тикетов
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              {tickets.length} диалогов
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Поиск по имени, номеру, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 shadow-xs"
            />
          </div>

          {/* Segmented Filter Controls */}
          <div className="flex items-center space-x-1.5 text-xs">
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded px-2 py-1 text-zinc-800 dark:text-zinc-300 text-xs focus:outline-none focus:border-zinc-500 flex-1 font-mono shadow-xs"
            >
              <option value="">Все каналы</option>
              <option value="telegram">Telegram</option>
              <option value="instagram">Instagram</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded px-2 py-1 text-zinc-800 dark:text-zinc-300 text-xs focus:outline-none focus:border-zinc-500 flex-1 font-mono shadow-xs"
            >
              <option value="">Все статусы</option>
              <option value="new">Новые</option>
              <option value="in_progress">В работе</option>
              <option value="escalated">Эскалированы</option>
              <option value="resolved">Решенные</option>
            </select>

            <button
              onClick={loadTickets}
              className="p-1.5 rounded bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-250 dark:border-zinc-800 shadow-xs"
              title="Обновить список"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Master List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-150 dark:divide-zinc-900">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 font-mono">
              Обращений не найдено
            </div>
          ) : (
            tickets.map((t) => {
              const isSelected = t.id === selectedTicketId;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-zinc-100 dark:bg-zinc-900 border-l-4 border-zinc-900 dark:border-zinc-200 shadow-xs' 
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-750 flex items-center justify-center shrink-0">
                        {t.channel === 'telegram' ? (
                          <MessageCircle className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
                        ) : (
                          <InstagramIcon className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
                        )}
                      </div>
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-[130px]">
                        {t.channel_user_name || t.channel_user_id}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                      {/* Informative Severity Pill (RED for P0/P1, YELLOW for P2) */}
                      <span className={`px-1.5 py-0.2 rounded font-bold border ${
                        t.severity === 'P0' ? 'bg-rose-600 text-white border-rose-700 font-bold' :
                        t.severity === 'P1' ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900' :
                        t.severity === 'P2' ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900' :
                        'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                      }`}>
                        {t.severity}
                      </span>

                      {/* Informative Status Pill (GREEN for new/resolved, YELLOW for in_progress, RED for escalated) */}
                      <span className={`px-1.5 py-0.2 rounded border font-semibold ${
                        t.status === 'new' ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' :
                        t.status === 'in_progress' ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900' :
                        t.status === 'escalated' ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900' :
                        'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                      }`}>
                        {t.status === 'new' ? 'Новый' : t.status === 'in_progress' ? 'В работе' : t.status === 'escalated' ? 'Эскалация' : 'Решен'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-1 mb-1 leading-snug">
                    {t.category && <strong className="text-zinc-900 dark:text-zinc-100">{t.category}: </strong>}
                    {t.problem || t.last_message || 'Без описания'}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                    <span>{t.ticket_number}</span>
                    <span>{t.device || 'Не указано'} • {t.operator || 'Сеть?'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* PANE 2: DETAIL CANVAS (CONVERSATION & ACTIONS)           */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 min-w-0">
        {selectedTicket ? (
          <>
            {/* Conversation Header */}
            <div className="h-14 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-950 shrink-0 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-850 border border-zinc-250 dark:border-zinc-750 flex items-center justify-center font-bold text-xs text-zinc-800 dark:text-zinc-200 font-mono">
                  {selectedTicket.channel_user_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{selectedTicket.channel_user_name}</span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">{selectedTicket.channel_user_handle}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 font-mono">
                      ID: {selectedTicket.channel_user_id}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center space-x-2 font-mono">
                    <span>Канал: <strong className="text-zinc-700 dark:text-zinc-300 capitalize">{selectedTicket.channel}</strong></span>
                    <span>•</span>
                    <span>Тикет: <strong className="text-zinc-700 dark:text-zinc-300">{selectedTicket.ticket_number}</strong></span>
                  </div>
                </div>
              </div>

              {/* Fast Action Buttons */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleSendKey}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-250 dark:border-zinc-800 text-xs font-semibold transition-colors shadow-xs"
                  title="Отправить действующий ключ абоненту в чат"
                >
                  <Key className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Отправить ключ</span>
                </button>

                <button
                  onClick={handleRecreateKey}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-250 dark:border-zinc-800 text-xs font-semibold transition-colors shadow-xs"
                  title="Сбросить и выпустить ключ на новом сервере"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Пересоздать ключ</span>
                </button>
              </div>
            </div>

            {/* Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3.5 bg-zinc-50/40 dark:bg-zinc-950">
              {messages.map((m) => {
                const isClient = m.sender_type === 'client';
                const isAI = m.sender_type === 'ai';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isClient ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 mb-1 px-1 font-mono">
                      {isAI && <Bot className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />}
                      <span>{m.sender_name || m.sender_type}</span>
                      <span>•</span>
                      <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                        isClient
                          ? 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                          : isAI
                          ? 'bg-amber-50/50 dark:bg-zinc-900 border border-amber-200/60 dark:border-zinc-750 text-zinc-900 dark:text-zinc-100'
                          : 'bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 text-white font-medium'
                      }`}
                    >
                      {m.message_text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Suggestion Banner Pattern */}
            {aiSuggestion && (
              <div className="mx-4 mb-2 p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-750 text-xs space-y-2 shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-800">
                  <div className="flex items-center space-x-1.5 text-zinc-900 dark:text-zinc-200 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Подсказка от ИИ ({aiSuggestion.model_used})</span>
                  </div>
                  <button
                    onClick={() => setMessageText(aiSuggestion.suggested_reply)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-semibold transition-colors shadow-xs"
                  >
                    Вставить в чат
                  </button>
                </div>
                <div className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px] leading-relaxed line-clamp-3">
                  {aiSuggestion.suggested_reply}
                </div>
              </div>
            )}

            {/* Action Chips Toolbar Pattern */}
            <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-850 bg-white/70 dark:bg-zinc-900/30 flex items-center space-x-1.5 overflow-x-auto text-xs">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 shrink-0 font-medium font-mono">Шаблоны:</span>
              <button
                type="button"
                onClick={() => handleSendGuide('iPhone')}
                className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-800 shrink-0 transition-colors font-mono shadow-xs"
              >
                iOS Гайд
              </button>
              <button
                type="button"
                onClick={() => handleSendGuide('Android')}
                className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-800 shrink-0 transition-colors font-mono shadow-xs"
              >
                Android Гайд
              </button>
              <button
                type="button"
                onClick={() => handleSendGuide('Windows')}
                className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-800 shrink-0 transition-colors font-mono shadow-xs"
              >
                Windows Гайд
              </button>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiLoading}
                className="px-2.5 py-1 rounded-md bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-750 text-white border border-zinc-800 dark:border-zinc-700 font-medium shrink-0 flex items-center space-x-1 transition-colors shadow-xs"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Сгенерировать ответ ИИ</span>
              </button>
            </div>

            {/* Bottom Composer Pattern */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Напишите ответ клиенту (отправится в Telegram или Instagram)..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 shadow-xs"
              />
              <button
                type="submit"
                disabled={sendingMsg || !messageText.trim()}
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 text-white dark:text-zinc-950 font-semibold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Отправить</span>
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs font-mono">
            Выберите диалог из очереди слева
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* PANE 3: INSPECTOR (PASSPORT 7 FIELDS & CRM DATA)         */}
      {/* ======================================================== */}
      <div className="w-full md:w-80 lg:w-88 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto bg-white dark:bg-zinc-950 p-4 space-y-4 shrink-0 shadow-xs">
        {selectedTicket ? (
          <>
            {/* Inspector Header with Save Button */}
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col">
                <span className="font-bold text-xs uppercase tracking-wide text-zinc-900 dark:text-zinc-100 font-mono">
                  Паспорт обращения
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">7 обязательных полей аналитики</span>
              </div>
              <button
                onClick={handleSavePassport}
                disabled={savingPassport}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                {passportSavedNotice ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : null}
                <span>{passportSavedNotice ? 'Сохранено' : 'Сохранить'}</span>
              </button>
            </div>

            {/* AI Triage Card */}
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                <span className="flex items-center space-x-1.5">
                  <Bot className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>AI Триаж тикета</span>
                </span>
                <button
                  type="button"
                  onClick={handleAiTriage}
                  disabled={aiLoading}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-250 dark:border-zinc-700 transition-colors shadow-xs"
                >
                  Заполнить по тексту
                </button>
              </div>

              {selectedTicket.ai_diagnostic_summary && (
                <div className="text-[11px] text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 leading-relaxed font-mono">
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">Диагноз ИИ: </span>
                  {selectedTicket.ai_diagnostic_summary}
                </div>
              )}
            </div>

            {/* Grouped Form Fields */}
            <div className="space-y-3.5 text-xs">
              {/* Classification */}
              <div className="space-y-1">
                <label className="text-zinc-700 dark:text-zinc-300 font-semibold">1. Категория проблемы</label>
                <select
                  value={passport.category || ''}
                  onChange={(e) => setPassport({ ...passport, category: e.target.value, subcategory: '' })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 shadow-xs"
                >
                  <option value="">-- Выберите категорию --</option>
                  {taxonomy && Object.keys(taxonomy.categories).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {passport.category && taxonomy?.categories[passport.category] && (
                <div className="space-y-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold">Подкатегория</label>
                  <select
                    value={passport.subcategory || ''}
                    onChange={(e) => setPassport({ ...passport, subcategory: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 shadow-xs"
                  >
                    <option value="">-- Подкатегория --</option>
                    {taxonomy.categories[passport.category].map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Environment */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold font-mono">2. Устройство</label>
                  <select
                    value={passport.device || ''}
                    onChange={(e) => setPassport({ ...passport, device: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono shadow-xs"
                  >
                    <option value="">-- Платформа --</option>
                    {taxonomy?.devices.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold font-mono">3. Оператор</label>
                  <select
                    value={passport.operator || ''}
                    onChange={(e) => setPassport({ ...passport, operator: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono shadow-xs"
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
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold font-mono">4. Приложение</label>
                  <select
                    value={passport.app || ''}
                    onChange={(e) => setPassport({ ...passport, app: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono shadow-xs"
                  >
                    <option value="">-- Приложение --</option>
                    {taxonomy?.apps.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold font-mono">Критичность</label>
                  <select
                    value={passport.severity || 'P2'}
                    onChange={(e) => setPassport({ ...passport, severity: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono shadow-xs"
                  >
                    <option value="P0">P0 (Авария)</option>
                    <option value="P1">P1 (Критичная)</option>
                    <option value="P2">P2 (Стандартная)</option>
                    <option value="P3">P3 (Инструкция / FAQ)</option>
                  </select>
                </div>
              </div>

              {/* Symptom & Cause */}
              <div className="space-y-1">
                <label className="text-zinc-700 dark:text-zinc-300 font-semibold">5. Проблема (Симптом)</label>
                <input
                  type="text"
                  value={passport.problem || ''}
                  onChange={(e) => setPassport({ ...passport, problem: e.target.value })}
                  placeholder="Суть жалобы абонента..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-700 dark:text-zinc-300 font-semibold">6. Причина (Root Cause)</label>
                <input
                  type="text"
                  value={passport.cause || ''}
                  onChange={(e) => setPassport({ ...passport, cause: e.target.value })}
                  placeholder="Блокировка оператора, сбой сервера..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 shadow-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-700 dark:text-zinc-300 font-semibold">7. Результат решения</label>
                <input
                  type="text"
                  value={passport.result || ''}
                  onChange={(e) => setPassport({ ...passport, result: e.target.value })}
                  placeholder="Решено сменой протокола / сервера..."
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 shadow-xs"
                />
              </div>

              {/* Status & Verification */}
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="space-y-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold">Статус тикета</label>
                  <select
                    value={passport.status || 'new'}
                    onChange={(e) => setPassport({ ...passport, status: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 font-semibold shadow-xs"
                  >
                    <option value="new">Новый</option>
                    <option value="in_progress">В работе</option>
                    <option value="escalated">Эскалирован L2</option>
                    <option value="resolved">Решен</option>
                    <option value="closed">Закрыт</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold">Инструкция помогла</label>
                  <select
                    value={passport.instruction_helped === true ? '1' : passport.instruction_helped === false ? '0' : ''}
                    onChange={(e) => setPassport({ 
                      ...passport, 
                      instruction_helped: e.target.value === '1' ? true : e.target.value === '0' ? false : null 
                    })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 shadow-xs"
                  >
                    <option value="">Неизвестно</option>
                    <option value="1">Да (Помогла)</option>
                    <option value="0">Нет</option>
                  </select>
                </div>
              </div>
            </div>

            {/* VPN Key Inspector Card with Status Pill */}
            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-zinc-200">
                <span className="flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Активные ключи VPN</span>
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">databasetop</span>
              </div>

              {vpnKeys.length > 0 ? (
                vpnKeys.map((k) => (
                  <div key={k.id} className="bg-white dark:bg-zinc-950 p-3 rounded-lg border border-zinc-200 dark:border-zinc-850 space-y-1.5 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-white font-mono">{k.server} • {k.protocol}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        k.subscription_status === 'active' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' 
                          : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                      }`}>
                        {k.subscription_status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                      <span className="truncate max-w-[190px]">{k.key_string}</span>
                      <button
                        onClick={() => handleCopyKeyString(k.key_string)}
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors ml-1"
                        title="Скопировать ключ"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex justify-between font-mono pt-0.5">
                      <span>Трафик: {k.traffic_used_gb} / {k.traffic_limit_gb} GB</span>
                      <span>До: {k.expires_at || 'бессрочно'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-400 text-center py-2 font-mono">
                  Для данного абонента нет ключей в базе
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center text-zinc-400 text-xs py-8 font-mono">
            Выберите тикет
          </div>
        )}
      </div>
    </div>
  );
}
