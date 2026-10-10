import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus } from 'lucide-react';
import { api } from '../api';

export default function KnowledgeBaseView({ user }) {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Не умеет подключить',
    subcategory: 'инструкция',
    device: 'iPhone',
    app: 'Amnezia',
    content: '',
    short_answer: ''
  });

  const loadArticles = async () => {
    try {
      const data = await api.knowledge.list({ search });
      setArticles(data);
      if (data.length > 0 && !selectedArticle) {
        setSelectedArticle(data[0]);
      }
    } catch (err) {
      console.error('Failed to load articles:', err);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.knowledge.create(form);
      setShowCreateModal(false);
      setForm({ title: '', category: 'Не умеет подключить', subcategory: 'инструкция', device: 'iPhone', app: 'Amnezia', content: '', short_answer: '' });
      await loadArticles();
    } catch (err) {
      console.error('Failed to create article:', err);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase font-mono">
              БАЗА ЗНАНИЙ И ИНСТРУКЦИИ
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-750">
              Deflection Engine
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            <strong>Обоснование:</strong> Понятные инструкции снижают нагрузку на операторов на 35–45%. Бот и операторы отправляют их в 1 клик.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-xs font-semibold text-white dark:text-zinc-950 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Добавить статью</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column: List & Search */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Поиск по статьям и тегам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg pl-8 pr-2.5 py-2 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-500 shadow-xs"
            />
          </div>

          <div className="space-y-1.5">
            {articles.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelectedArticle(a)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-colors shadow-xs ${
                  selectedArticle?.id === a.id
                    ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-400 dark:border-zinc-650'
                    : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                }`}
              >
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{a.title}</div>
                <div className="flex items-center space-x-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                  <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">{a.category}</span>
                  {a.device && <span>• {a.device}</span>}
                  {a.app && <span>• {a.app}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Article Detail */}
        <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-xs">
          {selectedArticle ? (
            <>
              <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono mb-1">
                  <span>{selectedArticle.category}</span>
                  <span>/</span>
                  <span>{selectedArticle.subcategory || 'общие'}</span>
                </div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{selectedArticle.title}</h2>
                <div className="flex items-center space-x-3 text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-mono">
                  <span>Платформа: <strong className="text-zinc-800 dark:text-zinc-300">{selectedArticle.device || 'Все'}</strong></span>
                  <span>Приложение: <strong className="text-zinc-800 dark:text-zinc-300">{selectedArticle.app || 'Любое'}</strong></span>
                </div>
              </div>

              {selectedArticle.short_answer && (
                <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">Краткий автоответ бота: </span>
                  <span className="text-zinc-900 dark:text-zinc-100">{selectedArticle.short_answer}</span>
                </div>
              )}

              <div className="text-xs text-zinc-800 dark:text-zinc-200 font-mono whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {selectedArticle.content}
              </div>
            </>
          ) : (
            <div className="text-center text-zinc-400 text-xs py-12 font-mono">
              Выберите статью для просмотра
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Article */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-200 uppercase tracking-wide font-mono">
                Новая статья базы знаний
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800"
              >
                Отмена
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="text-zinc-600 dark:text-zinc-400 font-medium">Заголовок статьи</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Как настроить..."
                  className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2 text-zinc-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-600 dark:text-zinc-400 font-medium">Категория</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2 text-zinc-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-600 dark:text-zinc-400 font-medium">Устройство</label>
                  <input
                    type="text"
                    value={form.device}
                    onChange={(e) => setForm({ ...form, device: e.target.value })}
                    className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2 text-zinc-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-600 dark:text-zinc-400 font-medium">Краткий автоответ (для бота)</label>
                <input
                  type="text"
                  value={form.short_answer}
                  onChange={(e) => setForm({ ...form, short_answer: e.target.value })}
                  placeholder="1-2 предложения..."
                  className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2 text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-zinc-600 dark:text-zinc-400 font-medium">Полный текст инструкции</label>
                <textarea
                  rows="6"
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Шаги 1, 2, 3..."
                  className="w-full mt-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg p-2 text-zinc-900 dark:text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
