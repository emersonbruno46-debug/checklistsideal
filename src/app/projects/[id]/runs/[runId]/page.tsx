'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ChecklistHeader } from '@/components/ChecklistHeader';
import { TestItemCard } from '@/components/TestItemCard';
import { FinalizeModal } from '@/components/FinalizeModal';
import { getStorageData, saveStorageData } from '@/lib/storage';
import { AnswerResult, IssueSeverity, ScenarioResult, AssertionResultStatus } from '@/types/database';

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

  const scenarios = template
    ? data.scenarios.filter((s) => s.checklist_template_id === template.id)
    : [];

  const scenarioResults = data.scenarioResults;

  // Filter scenarios by status or search query
  const filteredScenarios = scenarios.filter((scen) => {
    const res = scenarioResults[`${runId}_${scen.id}`] || scenarioResults[scen.id];
    const resultType = res?.result || 'unanswered';

    if (activeFilter === 'pending' && resultType !== 'unanswered') return false;
    if (activeFilter === 'yes' && resultType !== 'yes') return false;
    if (activeFilter === 'no' && resultType !== 'no') return false;
    if (activeFilter === 'caveat' && resultType !== 'caveat') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = scen.title.toLowerCase().includes(q);
      const matchSec = scen.section_title?.toLowerCase().includes(q);
      const matchAssertion = scen.assertions.some((a) => a.text.toLowerCase().includes(q));
      return matchTitle || matchSec || matchAssertion;
    }

    return true;
  });

  const handleResultChange = (
    scenarioId: string,
    result: AnswerResult,
    note?: string,
    severity?: IssueSeverity,
    attachmentUrl?: string,
    assertionResults?: Record<string, AssertionResultStatus>
  ) => {
    const key = `${runId}_${scenarioId}`;
    const existing = scenarioResults[key] || scenarioResults[scenarioId];

    const updatedResult: ScenarioResult = {
      id: existing?.id || `res-${Date.now()}-${scenarioId}`,
      test_run_id: runId,
      scenario_id: scenarioId,
      result,
      note: note || undefined,
      severity: result === 'no' ? severity || 'medium' : undefined,
      assertion_results: assertionResults || existing?.assertion_results || {},
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: attachmentUrl
        ? [
            {
              id: `att-${Date.now()}`,
              scenario_result_id: existing?.id || `res-${Date.now()}-${scenarioId}`,
              file_url: attachmentUrl,
              file_type: 'image',
              created_at: new Date().toISOString(),
            },
          ]
        : [],
    };

    const updatedData = { ...data };
    updatedData.scenarioResults[key] = updatedResult;
    updatedData.scenarioResults[scenarioId] = updatedResult; // fallback

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
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (filteredScenarios.length === 0) return;

      const currentScenario = filteredScenarios[focusedIndex] || filteredScenarios[0];
      if (!currentScenario) return;

      if (e.key === '1') {
        e.preventDefault();
        handleResultChange(currentScenario.id, 'yes');
        if (focusedIndex < filteredScenarios.length - 1) {
          setFocusedIndex((prev) => prev + 1);
        }
      } else if (e.key === '2') {
        e.preventDefault();
        handleResultChange(currentScenario.id, 'no');
      } else if (e.key === '3') {
        e.preventDefault();
        handleResultChange(currentScenario.id, 'caveat');
      }
    },
    [filteredScenarios, focusedIndex]
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

  // Count unanswered scenarios
  const unansweredCount = scenarios.filter((scen) => {
    const res = scenarioResults[`${runId}_${scen.id}`] || scenarioResults[scen.id];
    return !res || res.result === 'unanswered';
  }).length;

  const handleFinalizeConfirm = () => {
    setShowFinalizeModal(false);

    const runResList = scenarios.map((s) => scenarioResults[`${runId}_${s.id}`] || scenarioResults[s.id]);
    const hasProblems = runResList.some((r) => r?.result === 'no' || r?.result === 'caveat');

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
          scenarios={scenarios}
          scenarioResults={scenarioResults}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onFinalize={() => setShowFinalizeModal(true)}
        />

        {/* Keyboard shortcut helper bar */}
        <div className="hidden sm:flex items-center justify-between bg-slate-100/80 px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 mb-6">
          <span className="font-semibold text-slate-700">Dica de Produtividade (Atalhos por Cenário):</span>
          <div className="flex items-center gap-3 font-mono">
            <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs font-bold text-slate-900">1</kbd> = Sim</span>
            <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs font-bold text-slate-900">2</kbd> = Não</span>
            <span><kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs font-bold text-slate-900">3</kbd> = Ressalva</span>
          </div>
        </div>

        {/* Scenario Cards List */}
        {filteredScenarios.length > 0 ? (
          <div className="space-y-6 mb-10">
            {filteredScenarios.map((scenario, idx) => {
              const res = scenarioResults[`${runId}_${scenario.id}`] || scenarioResults[scenario.id];
              return (
                <TestItemCard
                  key={scenario.id}
                  scenario={scenario}
                  result={res}
                  index={idx}
                  totalCount={filteredScenarios.length}
                  onResultChange={handleResultChange}
                  isFocused={idx === focusedIndex}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center my-6">
            <p className="text-sm font-semibold text-slate-600">
              Nenhum cenário encontrado com o filtro selecionado.
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

        {/* Sticky Action Footer */}
        <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-4 shadow-lg flex items-center justify-between">
          <div className="text-xs text-slate-600">
            {unansweredCount > 0 ? (
              <span className="font-medium text-amber-700">
                Faltam <strong>{unansweredCount}</strong> cenário{unansweredCount !== 1 ? 's' : ''} para concluir
              </span>
            ) : (
              <span className="font-bold text-emerald-600">
                ✓ Todos os cenários de teste foram avaliados!
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
        totalCount={scenarios.length}
        onConfirm={handleFinalizeConfirm}
        onCancel={() => setShowFinalizeModal(false)}
      />
    </div>
  );
}
