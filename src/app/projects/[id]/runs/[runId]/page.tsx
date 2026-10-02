'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ChecklistHeader } from '@/components/ChecklistHeader';
import { TestItemCard } from '@/components/TestItemCard';
import { FinalizeModal } from '@/components/FinalizeModal';
import { getStorageData, saveStorageData } from '@/lib/storage';
import { AnswerResult, IssueSeverity, TestAnswer } from '@/types/database';

export default function ActiveTestRunPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const runId = params?.runId as string;

  const [data, setData] = useState(() => getStorageData());
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFinalizeModal, setShowFinalizeModal] = useState<boolean>(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  useEffect(() => {
    setData(getStorageData());
  }, [projectId, runId]);

  const project = data.projects.find((p) => p.id === projectId);
  const run = data.runs.find((r) => r.id === runId);
  const template = data.templates.find((t) => t.project_id === projectId);

  const items = template
    ? data.items.filter((i) => i.checklist_template_id === template.id)
    : [];

  const answers = data.answers;

  // Filter items by category/status/search
  const filteredItems = items.filter((item) => {
    const ans = answers[`${runId}_${item.id}`] || data.answers[item.id];
    const result = ans?.result || 'unanswered';

    if (activeFilter === 'pending' && result !== 'unanswered') return false;
    if (activeFilter === 'yes' && result !== 'yes') return false;
    if (activeFilter === 'no' && result !== 'no') return false;
    if (activeFilter === 'caveat' && result !== 'caveat') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchQuestion = item.question.toLowerCase().includes(q);
      const matchCat = item.category_name?.toLowerCase().includes(q);
      return matchQuestion || matchCat;
    }

    return true;
  });

  const handleAnswerChange = (
    itemId: string,
    result: AnswerResult,
    note?: string,
    severity?: IssueSeverity,
    attachmentUrl?: string
  ) => {
    const key = `${runId}_${itemId}`;
    const existing = answers[key] || answers[itemId];

    const updatedAnswer: TestAnswer = {
      id: existing?.id || `ans-${Date.now()}-${itemId}`,
      test_run_id: runId,
      checklist_item_id: itemId,
      result,
      note: note || undefined,
      severity: result === 'no' ? severity || 'medium' : undefined,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: attachmentUrl
        ? [
            {
              id: `att-${Date.now()}`,
              test_answer_id: existing?.id || `ans-${Date.now()}-${itemId}`,
              file_url: attachmentUrl,
              file_type: 'image',
              created_at: new Date().toISOString(),
            },
          ]
        : [],
    };

    const updatedData = { ...data };
    updatedData.answers[key] = updatedAnswer;
    updatedData.answers[itemId] = updatedAnswer; // fallback dual key

    // Auto-update run status
    const currentRun = updatedData.runs.find((r) => r.id === runId);
    if (currentRun) {
      currentRun.status = 'in_progress';
    }

    saveStorageData(updatedData);
    setData(updatedData);
  };

  // Keyboard Shortcuts (1 = SIM, 2 = NÃO, 3 = RESSALVA)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore shortcut if user is typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (filteredItems.length === 0) return;

      const currentItem = filteredItems[focusedIndex] || filteredItems[0];
      if (!currentItem) return;

      if (e.key === '1') {
        e.preventDefault();
        handleAnswerChange(currentItem.id, 'yes');
        // Smoothly move focus index to next
        if (focusedIndex < filteredItems.length - 1) {
          setFocusedIndex((prev) => prev + 1);
        }
      } else if (e.key === '2') {
        e.preventDefault();
        handleAnswerChange(currentItem.id, 'no');
      } else if (e.key === '3') {
        e.preventDefault();
        handleAnswerChange(currentItem.id, 'caveat');
      }
    },
    [filteredItems, focusedIndex]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!project || !run) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Execução de teste não encontrada</h2>
        <button onClick={() => router.push('/dashboard')} className="text-sm text-indigo-600 hover:underline">
          Voltar ao dashboard
        </button>
      </div>
    );
  }

  // Count unanswered items
  const unansweredCount = items.filter((item) => {
    const ans = answers[`${runId}_${item.id}`] || answers[item.id];
    return !ans || ans.result === 'unanswered';
  }).length;

  const handleFinalizeConfirm = () => {
    setShowFinalizeModal(false);

    // Calculate final status
    const runAnsList = items.map((i) => answers[`${runId}_${i.id}`] || answers[i.id]);
    const hasProblems = runAnsList.some((a) => a?.result === 'no' || a?.result === 'caveat');

    const updated = { ...data };
    const targetRun = updated.runs.find((r) => r.id === runId);
    if (targetRun) {
      targetRun.status = hasProblems ? 'needs_review' : 'completed';
      targetRun.completed_at = new Date().toISOString();
    }

    saveStorageData(updated);
    router.push(`/projects/${projectId}/runs/${runId}/report`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentRole={data.currentUser.role} userName={data.currentUser.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 sm:py-8">
        <ChecklistHeader
          project={project}
          run={run}
          items={items}
          answers={answers}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFinalize={() => setShowFinalizeModal(true)}
        />

        {/* Keyboard shortcut helper bar */}
        <div className="hidden sm:flex items-center justify-between bg-slate-100/80 px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 mb-6">
          <span className="font-semibold text-slate-700">Dica de Produtividade (Atalhos):</span>
          <div className="flex items-center gap-3 font-mono">
            <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs font-bold text-slate-900">1</kbd> = Sim</span>
            <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs font-bold text-slate-900">2</kbd> = Não</span>
            <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs font-bold text-slate-900">3</kbd> = Ressalva</span>
          </div>
        </div>

        {/* Interactive Items List */}
        {filteredItems.length > 0 ? (
          <div className="space-y-4 mb-10">
            {filteredItems.map((item, idx) => {
              const ans = answers[`${runId}_${item.id}`] || answers[item.id];
              return (
                <TestItemCard
                  key={item.id}
                  item={item}
                  answer={ans}
                  index={idx}
                  totalCount={filteredItems.length}
                  onAnswerChange={handleAnswerChange}
                  isFocused={idx === focusedIndex}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center my-6">
            <p className="text-sm font-semibold text-slate-600">
              Nenhum item encontrado com o filtro selecionado.
            </p>
            <button
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="mt-3 text-xs font-bold text-indigo-600 hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}

        {/* Bottom Sticky Action Bar */}
        <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-4 shadow-lg flex items-center justify-between">
          <div className="text-xs text-slate-600">
            {unansweredCount > 0 ? (
              <span className="font-medium text-amber-700">
                Faltam <strong>{unansweredCount}</strong> teste{unansweredCount !== 1 ? 's' : ''} para concluir
              </span>
            ) : (
              <span className="font-bold text-emerald-600">
                ✓ Todos os testes foram respondidos!
              </span>
            )}
          </div>

          <button
            onClick={() => setShowFinalizeModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-lg transition-colors shadow-xs"
          >
            Finalizar Checklist
          </button>
        </div>
      </main>

      <FinalizeModal
        isOpen={showFinalizeModal}
        unansweredCount={unansweredCount}
        totalCount={items.length}
        onConfirm={handleFinalizeConfirm}
        onCancel={() => setShowFinalizeModal(false)}
      />
    </div>
  );
}
