'use client';

import React, { useState } from 'react';
import { ParsedItem } from '@/types/database';
import { Plus, Trash2, Edit2, Check, X, MoveUp, MoveDown, FolderPlus, HelpCircle } from 'lucide-react';

interface ChecklistReviewScreenProps {
  initialItems: ParsedItem[];
  projectName: string;
  websiteUrl?: string;
  sourceFileName?: string;
  onConfirm: (categories: string[], items: ParsedItem[]) => void;
  onCancel: () => void;
}

export const ChecklistReviewScreen: React.FC<ChecklistReviewScreenProps> = ({
  initialItems,
  projectName,
  websiteUrl,
  sourceFileName,
  onConfirm,
  onCancel,
}) => {
  const [items, setItems] = useState<ParsedItem[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Geral');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [showAddCategory, setShowAddCategory] = useState<boolean>(false);

  // Derive unique categories
  const categories = Array.from(new Set(items.map((i) => i.category || 'Geral')));

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const cat = newCategoryName.trim();
    if (!categories.includes(cat)) {
      setSelectedCategory(cat);
    }
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  const handleAddItem = () => {
    if (!newQuestionText.trim()) return;
    let question = newQuestionText.trim();
    if (!question.endsWith('?')) {
      question += '?';
    }

    const newItem: ParsedItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      category: selectedCategory || 'Geral',
      question,
      order: items.length + 1,
    };

    setItems([...items, newItem]);
    setNewQuestionText('');
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleStartEdit = (item: ParsedItem) => {
    setEditingId(item.id);
    setEditingText(item.question);
  };

  const handleSaveEdit = (id: string) => {
    setItems(
      items.map((i) => (i.id === id ? { ...i, question: editingText.trim() || i.question } : i))
    );
    setEditingId(null);
    setEditingText('');
  };

  const handleChangeCategory = (id: string, newCat: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, category: newCat } : i)));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    // re-assign orders
    const reordered = newItems.map((it, idx) => ({ ...it, order: idx + 1 }));
    setItems(reordered);
  };

  const handleFinalConfirm = () => {
    if (items.length === 0) {
      alert('Adicione pelo menos um item ao checklist antes de continuar.');
      return;
    }
    const finalCategories = Array.from(new Set(items.map((i) => i.category || 'Geral')));
    onConfirm(finalCategories, items);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Step Banner */}
      <div className="border-b border-slate-100 pb-5 mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
          <span>Etapa de Revisão do Checklist</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Checklist Identificado ({items.length} itens)
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          O sistema analisou o arquivo <strong>{sourceFileName || 'anexado'}</strong> para o projeto <strong>{projectName}</strong>. Revise, edite ou adicione perguntas antes de gerar o checklist final.
        </p>
      </div>

      {/* Add Item Bar */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
          Adicionar novo teste manualmente
        </h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="Nova Categoria">+ Criar nova categoria...</option>
          </select>

          <input
            type="text"
            placeholder="Ex: O botão de login redireciona corretamente?"
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            className="flex-1 text-sm rounded-lg border border-slate-300 px-3.5 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={handleAddItem}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Categories & Items Accordion List */}
      <div className="space-y-6 mb-8">
        {categories.map((cat) => {
          const categoryItems = items.filter((i) => (i.category || 'Geral') === cat);

          return (
            <div key={cat} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                  {cat} ({categoryItems.length})
                </span>
                <span className="text-xs text-slate-500">
                  {categoryItems.length} teste{categoryItems.length !== 1 ? 's' : ''}
                </span>
              </div>

              <ul className="divide-y divide-slate-100">
                {categoryItems.map((item) => {
                  const globalIndex = items.findIndex((i) => i.id === item.id);
                  const isEditing = editingId === item.id;

                  return (
                    <li key={item.id} className="p-3 sm:p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-3">
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(item.id)}
                            className="flex-1 text-sm border border-indigo-300 rounded-md px-3 py-1.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                            title="Salvar alteração"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-start gap-3">
                          <span className="text-xs font-semibold text-slate-400 mt-0.5">
                            #{globalIndex + 1}
                          </span>
                          <p className="text-sm font-medium text-slate-800 leading-snug">
                            {item.question}
                          </p>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Change Category Selector */}
                          <select
                            value={item.category || 'Geral'}
                            onChange={(e) => handleChangeCategory(item.id, e.target.value)}
                            className="text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 text-slate-600 focus:outline-none"
                            title="Alterar categoria"
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>

                          {/* Reorder Buttons */}
                          <button
                            onClick={() => handleMove(globalIndex, 'up')}
                            disabled={globalIndex === 0}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                            title="Mover para cima"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMove(globalIndex, 'down')}
                            disabled={globalIndex === items.length - 1}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100"
                            title="Mover para baixo"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                            title="Editar pergunta"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Excluir item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors"
        >
          Voltar / Enviar outro arquivo
        </button>

        <button
          onClick={handleFinalConfirm}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Criar Checklist</span>
        </button>
      </div>
    </div>
  );
};
