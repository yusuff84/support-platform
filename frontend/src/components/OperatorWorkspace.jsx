import React, { useState, useEffect, useRef } from 'react';
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
  Copy, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Paperclip,
  Mic,
  Square,
  Image as ImageIcon,
  Zap,
  Play,
  Pause,
  Download,
  X,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { TelegramIcon, InstagramIcon, ChannelBadge } from './Icons';
import { api } from '../api';

// Predefined Canned Responses (Быстрые ответы с учетом канала)
const getQuickReplies = (channel) => {
  const isTG = channel === 'telegram';
  return [
    {
      category: isTG ? '🔑 Ключи и подписка (Telegram)' : '🔑 Получение ключа (Только через TG-бота)',
      items: isTG ? [
        {
          title: 'Выдать действующий ключ',
          text: 'Здравствуйте! Ваш действующий ключ доступа и инструкции отправлены выше. Пожалуйста, проверьте и подключитесь.'
        },
        {
          title: 'Перевыпуск ключа (Reality)',
          text: 'Мы перевыпустили ваш ключ на устойчивый протокол Vless-Reality для обхода блокировок оператора. Новый ключ отправлен, замените его в приложении.'
        },
        {
          title: 'Подтверждение продления',
          text: 'Оплата получена и подтверждена. Ваша подписка успешно продлена на 30 дней. Приятного пользования!'
        }
      ] : [
        {
          title: 'Ссылка на Telegram-бота для выдачи ключа',
          text: 'Здравствуйте! Для автоматической выдачи, привязки и замены вашего VPN-ключа перейдите в нашего официального Telegram-бота: https://t.me/topvpnhelp_bot (команда /start). Бот моментально выдаст действующий ключ!'
        },
        {
          title: 'Подтверждение продления подписки',
          text: 'Оплата получена и подтверждена. Ваша подписка успешно продлена на 30 дней. Для обновления и проверки ключа перейдите в Telegram-бота: https://t.me/topvpnhelp_bot.'
        }
      ]
    },
    {
      category: '📱 Инструкции по подключению',
      items: [
        {
          title: 'Инструкция для iPhone (iOS)',
          text: '📱 Инструкция для iPhone:\n1. Установите Amnezia VPN или Happ из App Store.\n2. Скопируйте ваш ключ.\n3. Нажмите «Добавить конфигурацию» ➔ «Из буфера».\n4. Нажмите большую кнопку «Подключить».'
        },
        {
          title: 'Инструкция для Android',
          text: '🤖 Инструкция для Android:\n1. Установите v2rayNG или Amnezia из Google Play.\n2. Скопируйте ключ.\n3. В приложении нажмите «+» ➔ «Импорт из буфера обмена».\n4. Нажмите круглую кнопку подключения внизу экрана.'
        },
        {
          title: 'Инструкция для Windows',
          text: '💻 Инструкция для Windows:\n1. Скачайте Amnezia VPN для Windows.\n2. Запустите от имени администратора.\n3. Вставьте ключ и нажмите «Подключиться».'
        }
      ]
    },
    {
      category: '🛠 Диагностика и устранение сбоев',
      items: [
        {
          title: 'Сброс радиоканала (Авиарежим)',
          text: 'Пожалуйста, включите «Авиарежим» на телефоне на 10 секунд и выключите его обратно. Это сбросит радиосессию вашего оператора связи.'
        },
        {
          title: 'Смена сервера на NL-02 / DE-01',
          text: 'Попробуйте в списке серверов приложения переключиться на сервер NL-02 или DE-01. На них сейчас минимальная нагрузка.'
        },
        {
          title: 'Проверка работы (Восстановилась ли связь?)',
          text: 'Мы применили исправления с нашей стороны. Подскажите, пожалуйста, восстановился ли сейчас доступ в интернет?'
        }
      ]
    },
    {
      category: '✅ Финал и закрытие',
      items: [
        {
          title: 'Проблема решена (Спасибо за обращение)',
          text: '✅ Рады, что всё заработало! Ваше обращение закрыто со статусом «Проблема решена». Если возникнут любые вопросы — мы всегда на связи!'
        },
        {
          title: 'Эскалация сетевому инженеру',
          text: '⚠️ Ваше обращение передано дежурному сетевому инженеру для детального анализа инфраструктуры. Специалист уже занимается решением вашего вопроса.'
        }
      ]
    }
  ];
};

export default function OperatorWorkspace({ user, onMobileChatChange }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [vpnKeys, setVpnKeys] = useState([]);
  const [taxonomy, setTaxonomy] = useState(null);

  // Mobile View Switcher: 'queue' | 'chat' | 'passport'
  const [mobileView, setMobileView] = useState('queue');

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

  // Quick Replies drawer / modal
  const [quickRepliesOpen, setQuickRepliesOpen] = useState(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // File upload input ref
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Message scroll anchor ref
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedTicketId]);

  // Zoom Image modal state
  const [zoomedImage, setZoomedImage] = useState(null);

  // Playing audio state
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const audioPlayerRef = useRef(new Audio());

  // AI & Action State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [actionNotice, setActionNotice] = useState('');

  // Notify parent App when mobile view is in chat/passport
  useEffect(() => {
    if (onMobileChatChange) {
      onMobileChatChange(mobileView === 'chat' || mobileView === 'passport');
    }
  }, [mobileView, onMobileChatChange]);

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

  const handleSelectTicket = (tId) => {
    setSelectedTicketId(tId);
    setMobileView('chat');
  };

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

  // Resolution Action: Решено
  const handleResolveTicket = async () => {
    if (!selectedTicketId) return;
    try {
      setActionNotice('Проблема отмечена решённой!');
      await api.tickets.resolve(selectedTicketId);
      await loadTicketDetails(selectedTicketId);
      await loadTickets();
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  // Resolution Action: Не решено
  const handleEscalateTicket = async () => {
    if (!selectedTicketId) return;
    try {
      setActionNotice('Передано инженеру L2!');
      await api.tickets.escalate(selectedTicketId);
      await loadTicketDetails(selectedTicketId);
      await loadTickets();
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err) {
      alert(`Ошибка: ${err.message}`);
    }
  };

  // AI Setup Assistant
  const handleSendAiSetup = async () => {
    if (!selectedTicketId) return;
    setAiLoading(true);
    try {
      await api.tickets.sendAiSetup(selectedTicketId);
      await loadTicketDetails(selectedTicketId);
      await loadTickets();
      setActionNotice('Пошаговая инструкция ИИ отправлена клиенту!');
      setTimeout(() => setActionNotice(''), 3500);
    } catch (err) {
      console.error('AI setup assistant failed:', err);
    } finally {
      setAiLoading(false);
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
      setActionNotice('AI триаж выполнен: параметры заполнены');
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err) {
      console.error('AI triage failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // File & Photo Upload Handler
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicketId) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      let mediaType = 'document';
      if (file.type.startsWith('image/')) mediaType = 'photo';
      else if (file.type.startsWith('video/')) mediaType = 'video';
      else if (file.type.startsWith('audio/')) mediaType = 'audio';
      formData.append('media_type', mediaType);

      await api.tickets.uploadAttachment(selectedTicketId, formData);
      await loadTicketDetails(selectedTicketId);
      await loadTickets();
    } catch (err) {
      alert(`Ошибка отправки файла: ${err.message}`);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Voice Message Recording with MediaRecorder API
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        // Upload recorded voice
        if (audioBlob.size > 0 && selectedTicketId) {
          setSendingMsg(true);
          try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'voice_message.webm');
            formData.append('media_type', 'voice');
            await api.tickets.uploadAttachment(selectedTicketId, formData);
            await loadTicketDetails(selectedTicketId);
            await loadTickets();
          } catch (err) {
            console.error('Voice upload failed:', err);
          } finally {
            setSendingMsg(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Для записи голосового сообщения требуется доступ к микрофону в браузере.');
    }
  };

  const stopVoiceRecording = (cancel = false) => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (cancel) {
        audioChunksRef.current = [];
      }
      mediaRecorderRef.current.stop();
    }
  };

  // Play audio helper
  const handleTogglePlayAudio = (url) => {
    if (playingAudioUrl === url) {
      audioPlayerRef.current.pause();
      setPlayingAudioUrl(null);
    } else {
      audioPlayerRef.current.src = url;
      audioPlayerRef.current.play();
      setPlayingAudioUrl(url);
      audioPlayerRef.current.onended = () => setPlayingAudioUrl(null);
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

  const handleSendTgBotLink = async () => {
    if (!selectedTicketId) return;
    const text = "🔑 Для автоматического получения, проверки подписки и управления вашим VPN-ключом перейдите в нашего официального Telegram-бота: https://t.me/topvpnhelp_bot (команда /start).";
    await api.tickets.sendMessage(selectedTicketId, {
      ticket_id: selectedTicketId,
      message_text: text,
      sender_type: 'operator'
    });
    await loadTicketDetails(selectedTicketId);
    await loadTickets();
    setActionNotice('Ссылка на Telegram-бота отправлена клиенту!');
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleCopyKeyString = (str) => {
    navigator.clipboard.writeText(str);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleApplyQuickReply = (text, sendImmediately = false) => {
    setQuickRepliesOpen(false);
    if (sendImmediately && selectedTicketId) {
      api.tickets.sendMessage(selectedTicketId, {
        ticket_id: selectedTicketId,
        message_text: text,
        sender_type: 'operator'
      }).then(() => {
        loadTicketDetails(selectedTicketId);
        loadTickets();
      });
    } else {
      setMessageText(text);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 relative">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" 
        className="hidden" 
      />

      {/* Main 3-Pane Body with Mobile Switching */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* ======================================================== */}
        {/* PANE 1: MASTER LIST (QUEUE: Telegram + Instagram)       */}
        {/* ======================================================== */}
        <div className={`w-full md:w-80 lg:w-88 border-r border-zinc-200 dark:border-zinc-800 flex-col bg-white dark:bg-zinc-950 shrink-0 ${
          mobileView === 'queue' ? 'flex flex-1' : 'hidden md:flex'
        }`}>
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 tracking-tight font-mono uppercase">
                Очередь обращений
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

            {/* Filters */}
            <div className="flex items-center space-x-1.5 text-xs">
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded px-2 py-1.5 text-zinc-800 dark:text-zinc-300 text-xs focus:outline-none focus:border-zinc-500 flex-1 font-mono shadow-xs"
              >
                <option value="">Все каналы</option>
                <option value="telegram">Telegram</option>
                <option value="instagram">Instagram</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded px-2 py-1.5 text-zinc-800 dark:text-zinc-300 text-xs focus:outline-none focus:border-zinc-500 flex-1 font-mono shadow-xs"
              >
                <option value="">Все статусы</option>
                <option value="new">Новые</option>
                <option value="in_progress">В работе</option>
                <option value="escalated">Эскалированы</option>
                <option value="resolved">Решенные</option>
              </select>

              <button
                onClick={loadTickets}
                className="p-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-250 dark:border-zinc-800 shadow-xs"
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
                    onClick={() => handleSelectTicket(t.id)}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-zinc-100 dark:bg-zinc-900 border-l-4 border-zinc-900 dark:border-zinc-200 shadow-xs' 
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border shadow-xs ${
                          t.channel === 'telegram' 
                            ? 'bg-sky-500/15 border-sky-500/30 text-sky-500' 
                            : 'bg-pink-500/15 border-pink-500/30 text-pink-500'
                        }`}>
                          {t.channel === 'telegram' ? (
                            <TelegramIcon className="w-3.5 h-3.5 text-sky-500" />
                          ) : (
                            <InstagramIcon className="w-3.5 h-3.5 text-pink-500" />
                          )}
                        </div>
                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-[130px]">
                          {t.channel_user_name || t.channel_user_id}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 font-mono text-[10px]">
                        <span className={`px-1.5 py-0.2 rounded font-bold border ${
                          t.severity === 'P0' ? 'bg-rose-600 text-white border-rose-700 font-bold' :
                          t.severity === 'P1' ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900' :
                          t.severity === 'P2' ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900' :
                          'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                        }`}>
                          {t.severity}
                        </span>

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
                      <div className="flex items-center space-x-1.5">
                        <ChannelBadge channel={t.channel} showLabel={true} />
                        <span>{t.ticket_number}</span>
                      </div>
                      <span>{t.device || 'Не указано'} • {t.operator || 'Сеть?'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* PANE 2: DETAIL CANVAS (CONVERSATION & DOCKED COMPOSER)   */}
        {/* ======================================================== */}
        <div className={`flex-1 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 min-w-0 h-full relative ${
          mobileView === 'chat' ? 'flex' : 'hidden md:flex'
        }`}>
          {selectedTicket ? (
            <>
              {/* Responsive Header: Customer Info + Action Row */}
              <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 sm:p-3 shrink-0 shadow-xs space-y-2">
                {/* Top Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setMobileView('queue')}
                      className="md:hidden p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200"
                      title="К очереди обращений"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 border shadow-xs ${
                      selectedTicket.channel === 'telegram'
                        ? 'bg-sky-500/15 border-sky-500/30 text-sky-500'
                        : 'bg-pink-500/15 border-pink-500/30 text-pink-500'
                    }`}>
                      {selectedTicket.channel === 'telegram' ? (
                        <TelegramIcon className="w-4 h-4 text-sky-500" />
                      ) : (
                        <InstagramIcon className="w-4 h-4 text-pink-500" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-[120px] sm:max-w-none">
                          {selectedTicket.channel_user_name}
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[80px] sm:max-w-none">
                          {selectedTicket.channel_user_handle}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center space-x-1.5 font-mono">
                        <ChannelBadge channel={selectedTicket.channel} showLabel={true} />
                        <span>•</span>
                        <span>{selectedTicket.ticket_number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Passport button */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setMobileView('passport')}
                      className="md:hidden px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1"
                    >
                      <span>Паспорт</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Quick Resolution Buttons (РЕШИЛ / НЕ РЕШИЛ / ОТВЕТЫ) */}
                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-850/80">
                  <div className="flex items-center space-x-1.5 flex-1">
                    {/* Решено */}
                    <button
                      onClick={handleResolveTicket}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
                      title="Отметить тикет как решенный"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Решено</span>
                    </button>

                    {/* Не решено */}
                    <button
                      onClick={handleEscalateTicket}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-xs"
                      title="Эскалировать тикет инженеру L2"
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Не решено</span>
                    </button>

                    {/* Быстрые ответы drawer trigger */}
                    <button
                      onClick={() => setQuickRepliesOpen(true)}
                      className="flex items-center justify-center space-x-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-250 dark:border-zinc-800 text-xs font-semibold transition-colors shadow-xs shrink-0"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="hidden sm:inline">Быстрые ответы</span>
                    </button>
                  </div>

                  <div className="hidden sm:flex items-center space-x-1.5">
                    {selectedTicket.channel === 'telegram' ? (
                      <>
                        <button
                          onClick={handleSendKey}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-250 dark:border-zinc-800 text-xs font-semibold transition-colors shadow-xs flex items-center space-x-1"
                          title="Отправить действующий ключ абоненту в Telegram"
                        >
                          <Key className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          <span>Ключ</span>
                        </button>
                        <button
                          onClick={handleRecreateKey}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-250 dark:border-zinc-800 text-xs font-semibold transition-colors shadow-xs flex items-center space-x-1"
                          title="Сбросить и выпустить ключ в Telegram"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          <span>Сброс</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleSendTgBotLink}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-250 dark:border-zinc-800 text-xs font-semibold transition-colors shadow-xs flex items-center space-x-1"
                        title="Отправить клиенту в Direct ссылку на Telegram-бота для выдачи ключа"
                      >
                        <TelegramIcon className="w-3.5 h-3.5 text-sky-500" />
                        <span>Ссылка на TG-бота</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Banner Feedback if any */}
              {actionNotice && (
                <div className="bg-emerald-50 dark:bg-emerald-950/70 border-b border-emerald-200 dark:border-emerald-900 px-3 py-1.5 text-xs text-emerald-800 dark:text-emerald-200 font-medium flex items-center space-x-2 shrink-0">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{actionNotice}</span>
                </div>
              )}

              {/* Conversation Messages Stream (flex-1 min-h-0 guarantees scroll without pushing composer off-screen!) */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-zinc-50/40 dark:bg-zinc-950">
                {messages.map((m) => {
                  const isClient = m.sender_type === 'client';
                  const isAI = m.sender_type === 'ai';
                  const hasPhoto = m.media_type === 'photo' || (m.media_url && m.media_url.match(/\.(jpg|jpeg|png|webp|gif)$/i));
                  const hasVideo = m.media_type === 'video' || (m.media_url && m.media_url.match(/\.(mp4|webm|mov)$/i));
                  const hasVoice = m.media_type === 'voice' || m.media_type === 'audio' || (m.media_url && m.media_url.match(/\.(webm|mp3|ogg|wav)$/i));
                  const hasDoc = m.media_type === 'document';

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
                        className={`max-w-[88%] sm:max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap shadow-xs space-y-2 ${
                          isClient
                            ? 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
                            : isAI
                            ? 'bg-amber-50/60 dark:bg-zinc-900 border border-amber-200/80 dark:border-zinc-750 text-zinc-900 dark:text-zinc-100'
                            : 'bg-zinc-900 dark:bg-zinc-800 border border-zinc-800 dark:border-zinc-700 text-white font-medium'
                        }`}
                      >
                        {/* 1. Photo render */}
                        {hasPhoto && m.media_url && (
                          <div className="rounded-lg overflow-hidden border border-zinc-250 dark:border-zinc-750 cursor-pointer" onClick={() => setZoomedImage(m.media_url)}>
                            <img src={m.media_url} alt="Photo" className="max-h-56 w-auto object-cover rounded-lg hover:opacity-95 transition-opacity" />
                          </div>
                        )}

                        {/* 2. Video render */}
                        {hasVideo && m.media_url && (
                          <div className="rounded-lg overflow-hidden border border-zinc-250 dark:border-zinc-750">
                            <video src={m.media_url} controls className="max-h-56 w-full rounded-lg" />
                          </div>
                        )}

                        {/* 3. Voice audio player render */}
                        {hasVoice && m.media_url && (
                          <div className="flex items-center space-x-2.5 bg-zinc-100 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-250 dark:border-zinc-800">
                            <button
                              type="button"
                              onClick={() => handleTogglePlayAudio(m.media_url)}
                              className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center shrink-0"
                            >
                              {playingAudioUrl === m.media_url ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                            </button>
                            <div className="flex flex-col flex-1 min-w-[120px]">
                              <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">Голосовое сообщение</span>
                              <div className="w-full bg-zinc-300 dark:bg-zinc-700 h-1 rounded-full mt-1">
                                <div className={`h-full rounded-full ${playingAudioUrl === m.media_url ? 'bg-amber-500 animate-pulse w-2/3' : 'bg-zinc-500 w-1/4'}`}></div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4. Document attachment render */}
                        {hasDoc && m.media_url && (
                          <a 
                            href={m.media_url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-250 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:underline"
                          >
                            <Download className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span className="truncate max-w-[200px] font-mono text-[11px]">{m.message_text || 'Скачать файл'}</span>
                          </a>
                        )}

                        {/* Message text */}
                        <div>{m.message_text}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* AI Suggestion Box */}
              {aiSuggestion && (
                <div className="mx-2 sm:mx-4 mb-2 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-750 text-xs space-y-1.5 shadow-lg shrink-0">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-150 dark:border-zinc-800">
                    <div className="flex items-center space-x-1.5 text-zinc-900 dark:text-zinc-200 font-semibold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Подсказка от ИИ</span>
                    </div>
                    <button
                      onClick={() => setMessageText(aiSuggestion.suggested_reply)}
                      className="px-2 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-[11px] font-semibold"
                    >
                      Вставить
                    </button>
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px] leading-relaxed line-clamp-3">
                    {aiSuggestion.suggested_reply}
                  </div>
                </div>
              )}

              {/* PERMANENTLY FIXED BOTTOM ACTION DOCK (CHIPS + COMPOSER NEVER SCROLL!) */}
              <div className="shrink-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 z-30 shadow-lg">
                {/* 1. Quick Action Chips Toolbar */}
                <div className="px-2.5 sm:px-4 py-1.5 bg-zinc-50/70 dark:bg-zinc-900/40 flex items-center space-x-1.5 overflow-x-auto touch-scroll border-b border-zinc-150 dark:border-zinc-850">
                <button
                  type="button"
                  onClick={handleSendAiSetup}
                  disabled={aiLoading}
                  className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shrink-0 flex items-center space-x-1 shadow-xs text-xs"
                >
                  <Wrench className="w-3.5 h-3.5 text-zinc-950" />
                  <span>Настройка ИИ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickRepliesOpen(true)}
                  className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-750 shrink-0 text-xs font-semibold flex items-center space-x-1"
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>Ответы</span>
                  </button>

                  {selectedTicket.channel === 'telegram' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSendKey}
                        className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-800 shrink-0 text-xs font-medium flex items-center space-x-1"
                      >
                        <Key className="w-3 h-3 text-zinc-500" />
                        <span>Ключ</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRecreateKey}
                        className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-800 shrink-0 text-xs font-medium flex items-center space-x-1"
                      >
                        <RefreshCw className="w-3 h-3 text-zinc-500" />
                        <span>Сброс</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendTgBotLink}
                      className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-800 shrink-0 text-xs font-medium flex items-center space-x-1 font-mono"
                    >
                      <TelegramIcon className="w-3 h-3 text-sky-500" />
                      <span>Ссылка на TG-бота</span>
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() => handleSendGuide('iPhone')}
                  className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-800 shrink-0 font-mono text-xs"
                >
                  iOS
                </button>
                <button
                  type="button"
                  onClick={() => handleSendGuide('Android')}
                  className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-800 shrink-0 font-mono text-xs"
                >
                  Android
                </button>

                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  className="px-2 py-1 rounded-md bg-zinc-900 dark:bg-zinc-800 text-white border border-zinc-800 shrink-0 flex items-center space-x-1 text-xs font-medium"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Ответ ИИ</span>
                </button>
                </div>

                {/* 2. Pinned Bottom Input Row */}
                <div className="p-2 sm:p-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
                {/* Voice recording live indicator row */}
                {isRecording ? (
                  <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 rounded-xl px-4 py-2 text-xs">
                    <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-300 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                      <span>Запись аудиосообщения: {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => stopVoiceRecording(true)}
                        className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={() => stopVoiceRecording(false)}
                        className="px-3 py-1 rounded bg-rose-600 text-white font-bold shadow-xs flex items-center space-x-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Отправить</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center space-x-1.5 sm:space-x-2">
                    {/* Attachment file button (📎) */}
                    <button
                      type="button"
                      disabled={uploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 sm:p-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors shrink-0 shadow-xs"
                      title="Прикрепить файл, фото или видео"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Quick Replies trigger button (⚡) */}
                    <button
                      type="button"
                      onClick={() => setQuickRepliesOpen(true)}
                      className="p-2 sm:p-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors shrink-0 shadow-xs"
                      title="Быстрые готовые ответы"
                    >
                      <Zap className="w-4 h-4 text-amber-500" />
                    </button>

                    {/* Text input */}
                    <input
                      type="text"
                      placeholder="Сообщение абоненту..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-3 sm:px-3.5 py-2 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 shadow-xs min-w-0"
                    />

                    {/* Voice record button (🎙️) */}
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="p-2 sm:p-2.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shrink-0 shadow-xs"
                      title="Записать голосовое сообщение"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={sendingMsg || !messageText.trim()}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white disabled:opacity-50 text-white dark:text-zinc-950 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Отправить</span>
                    </button>
                  </form>
                )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs font-mono p-4">
              Выберите диалог из очереди слева
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* PANE 3: INSPECTOR (PASSPORT 7 FIELDS & CRM DATA)         */}
        {/* ======================================================== */}
        <div className={`w-full md:w-80 lg:w-88 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto bg-white dark:bg-zinc-950 p-4 space-y-4 shrink-0 shadow-xs ${
          mobileView === 'passport' ? 'flex flex-col flex-1' : 'hidden md:flex flex-col'
        }`}>
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setMobileView('chat')}
                    className="md:hidden p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-200"
                    title="Назад в чат"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs uppercase tracking-wide text-zinc-900 dark:text-zinc-100 font-mono">
                      Паспорт обращения
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">7 обязательных полей аналитики</span>
                  </div>
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

              {/* Status & Resolution Block (РЕШЕНО / НЕ РЕШЕНО) */}
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2 shadow-xs">
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
                  <span>Результат обработки:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    passport.status === 'resolved' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' :
                    passport.status === 'escalated' ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800' :
                    'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  }`}>
                    {passport.status === 'resolved' ? 'РЕШЕНО' : passport.status === 'escalated' ? 'ЭСКАЛИРОВАНО L2' : 'В РАБОТЕ'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResolveTicket}
                    className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Решено</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleEscalateTicket}
                    className="py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Не решено</span>
                  </button>
                </div>
              </div>

              {/* AI Triage & Personalized Setup Card */}
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2 shadow-xs">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-zinc-200">
                  <span className="flex items-center space-x-1.5">
                    <Bot className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <span>AI Триаж и Настройка</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAiTriage}
                    disabled={aiLoading}
                    className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-100 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-250 dark:border-zinc-700 transition-colors shadow-xs"
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

                <button
                  type="button"
                  onClick={handleSendAiSetup}
                  disabled={aiLoading}
                  className="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Отправить настройку клиенту</span>
                </button>
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
                      <option value="P3">P3 (Инструкция)</option>
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
                    placeholder="Решено сменой протокола..."
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

              {/* VPN Key Inspector Card */}
              {selectedTicket.channel === 'telegram' ? (
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
                      <div key={k.id} className="bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-850 space-y-1.5 text-xs shadow-xs">
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
                          <span className="truncate max-w-[170px] sm:max-w-[190px]">{k.key_string}</span>
                          <button
                            onClick={() => handleCopyKeyString(k.key_string)}
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors ml-1"
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
              ) : (
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-200">
                    <Key className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span>Управление ключами (Telegram Only)</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Выдача, замена и сброс ключей производятся через бота в Telegram (@topvpnhelp_bot). Для клиента из Instagram доступна быстрая отправка ссылки на бота.
                  </p>
                  <button
                    type="button"
                    onClick={handleSendTgBotLink}
                    className="w-full py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                  >
                    <TelegramIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>Отправить ссылку на бота клиенту в Direct</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-zinc-400 text-xs py-8 font-mono">
              Выберите тикет
            </div>
          )}
        </div>
      </div>

      {/* QUICK REPLIES MODAL / DRAWER (БЫСТРЫЕ ОТВЕТЫ) */}
      {quickRepliesOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white dark:bg-zinc-900 border-t sm:border border-zinc-200 dark:border-zinc-800 rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 shrink-0">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-white">
                  Быстрые готовые ответы
                </h3>
              </div>
              <button
                onClick={() => setQuickRepliesOpen(false)}
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-3 overflow-y-auto space-y-3.5 text-xs">
              {getQuickReplies(selectedTicket?.channel).map((group, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-mono">
                    {group.category}
                  </div>
                  <div className="space-y-1.5">
                    {group.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-650 transition-colors space-y-1.5"
                      >
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                          <span>{item.title}</span>
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleApplyQuickReply(item.text, false)}
                              className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 font-medium"
                            >
                              Вставить
                            </button>
                            <button
                              onClick={() => handleApplyQuickReply(item.text, true)}
                              className="px-2 py-0.5 rounded bg-zinc-900 dark:bg-zinc-100 text-[10px] text-white dark:text-zinc-950 hover:bg-zinc-800 font-bold"
                            >
                              Отправить
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono leading-relaxed line-clamp-2">
                          {item.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ZOOMED IMAGE MODAL */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-4 right-4 text-white p-2" onClick={() => setZoomedImage(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={zoomedImage} alt="Zoom" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
