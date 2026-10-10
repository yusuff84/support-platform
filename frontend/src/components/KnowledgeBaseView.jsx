import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, ExternalLink, Smartphone, Check, Eye } from 'lucide-react';
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">БАЗА ЗНАНИЙ И ИНСТРУКЦИИ</h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Deflection Rate Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Эталонные гайды для клиентов, используемые ботом для самодиагностики и операторами для отправки в 1 клик.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Добавить статью</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: List & Search */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Поиск по статьям и тегам..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            {articles.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelectedArticle(a)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedArticle?.id === a.id
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-sm'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/80'
                }`}
              >
                <div className="text-xs font-bold text-white mb-1">{a.title}</div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 font-semibold">{a.category}</span>
                  {a.device && <span>• {a.device}</span>}
                  {a.app && <span>• {a.app}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Article Detail */}
        <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          {selectedArticle ? (
            <>
              <div className="pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-indigo-400 font-semibold mb-1">
                  <span>{selectedArticle.category}</span>
                  <span>/</span>
                  <span>{selectedArticle.subcategory || 'общие'}</span>
                </div>
                <h2 className="text-lg font-black text-white">{selectedArticle.title}</h2>
                <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-2">
                  <span>Платформа: <strong className="text-slate-200">{selectedArticle.device || 'Все'}</strong></span>
                  <span>Приложение: <strong className="text-slate-200">{selectedArticle.app || 'Любое'}</strong></span>
                </div>
              </div>

              {selectedArticle.short_answer && (
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs">
                  <span className="font-semibold text-indigo-300">Краткий автоответ бота: </span>
                  <span className="text-slate-200">{selectedArticle.short_answer}</span>
                </div>
              )}

              <div className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                {selectedArticle.content}
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 text-xs py-12">
              Выберите статью для просмотра
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create Article */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Новая статья базы знаний</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Отмена
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Заголовок статьи</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Как настроить..."
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-medium">Категория</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Устройство</label>
                  <input
                    type="text"
                    value={form.device}
                    onChange={(e) => setForm({ ...form, device: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-medium">Краткий ответ (для бота)</label>
                <input
                  type="text"
                  value={form.short_answer}
                  onChange={(e) => setForm({ ...form, short_answer: e.target.value })}
                  placeholder="1-2 предложения..."
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium">Полный текст инструкции</label>
                <textarea
                  rows="6"
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Шаги 1, 2, 3..."
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
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
