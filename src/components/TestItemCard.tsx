'use client';

import React, { useState, useEffect } from 'react';
import { ChecklistScenario, ScenarioResult, AnswerResult, IssueSeverity, AssertionResultStatus } from '@/types/database';
import { Check, X, AlertTriangle, Paperclip, MessageSquare, Image as ImageIcon, Trash2, ListChecks, ArrowRight } from 'lucide-react';

interface TestItemCardProps {
  scenario: ChecklistScenario;
  result?: ScenarioResult;
  index: number;
  totalCount: number;
  onResultChange: (
    scenarioId: string,
    result: AnswerResult,
    note?: string,
    severity?: IssueSeverity,
    attachmentUrl?: string,
    assertionResults?: Record<string, AssertionResultStatus>
  ) => void;
  isFocused?: boolean;
}

export const TestItemCard: React.FC<TestItemCardProps> = ({
  scenario,
  result,
  index,
  totalCount,
  onResultChange,
  isFocused = false,
}) => {
  const currentResult: AnswerResult = result?.result || 'unanswered';
  const [note, setNote] = useState<string>(result?.note || '');
  const [severity, setSeverity] = useState<IssueSeverity>(result?.severity || 'medium');
  const [showNoteField, setShowNoteField] = useState<boolean>(Boolean(result?.note));
  const [assertionState, setAssertionState] = useState<Record<string, AssertionResultStatus>>(
    result?.assertion_results || {}
  );
  const [evidenceUrl, setEvidenceUrl] = useState<string | undefined>(
    result?.attachments && result.attachments.length > 0 ? result.attachments[0].file_url : undefined
  );
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setNote(result?.note || '');
    setSeverity(result?.severity || 'medium');
    setAssertionState(result?.assertion_results || {});
    setEvidenceUrl(result?.attachments && result.attachments.length > 0 ? result.attachments[0].file_url : undefined);
  }, [result]);

  const handleToggleAssertion = (assertionId: string) => {
    const current = assertionState[assertionId] || 'pending';
    const next: AssertionResultStatus = current === 'passed' ? 'pending' : 'passed';
    const updatedState = { ...assertionState, [assertionId]: next };
    setAssertionState(updatedState);

    if (currentResult !== 'unanswered') {
      onResultChange(scenario.id, currentResult, note, severity, evidenceUrl, updatedState);
    }
  };

  const handleSelectResult = (newResult: AnswerResult) => {
    setSavingState('saving');
    // If selecting SIM, automatically mark all pending assertions as passed!
    let updatedAssertions = { ...assertionState };
    if (newResult === 'yes') {
      scenario.assertions.forEach((as) => {
        updatedAssertions[as.id] = 'passed';
      });
      setAssertionState(updatedAssertions);
    }

    onResultChange(
      scenario.id,
      newResult,
      note,
      newResult === 'no' ? severity : undefined,
      evidenceUrl,
      updatedAssertions
    );
    setTimeout(() => setSavingState('saved'), 300);
    setTimeout(() => setSavingState('idle'), 1500);
  };

  const handleNoteBlur = () => {
    if (currentResult !== 'unanswered') {
      setSavingState('saving');
      onResultChange(scenario.id, currentResult, note, severity, evidenceUrl, assertionState);
      setTimeout(() => setSavingState('saved'), 300);
      setTimeout(() => setSavingState('idle'), 1500);
    }
  };

  const handleSeverityChange = (newSev: IssueSeverity) => {
    setSeverity(newSev);
    if (currentResult === 'no') {
      setSavingState('saving');
      onResultChange(scenario.id, currentResult, note, newSev, evidenceUrl, assertionState);
      setTimeout(() => setSavingState('saved'), 300);
      setTimeout(() => setSavingState('idle'), 1500);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setEvidenceUrl(url);
      if (currentResult !== 'unanswered') {
        onResultChange(scenario.id, currentResult, note, severity, url, assertionState);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEvidence = () => {
    setEvidenceUrl(undefined);
    if (currentResult !== 'unanswered') {
      onResultChange(scenario.id, currentResult, note, severity, undefined, assertionState);
    }
  };

  // Card Background Depending on Result
  let borderBgClass = 'bg-white border-slate-200 hover:border-slate-300';
  if (currentResult === 'yes') {
    borderBgClass = 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300/50';
  } else if (currentResult === 'no') {
    borderBgClass = 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-300/50';
  } else if (currentResult === 'caveat') {
    borderBgClass = 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300/50';
  }

  return (
    <div
      id={`scenario-${scenario.id}`}
      className={`rounded-xl border p-5 sm:p-6 transition-all shadow-xs ${borderBgClass}`}
    >
      {/* Top Header: Scenario Title & Category */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
              Cenário #{index + 1} de {totalCount}
            </span>
            {scenario.section_title && (
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {scenario.section_title}
              </span>
            )}
            {savingState !== 'idle' && (
              <span className="text-[11px] text-slate-500 italic animate-pulse">
                {savingState === 'saving' ? 'Salvando...' : '✓ Salvo'}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 leading-snug">
            {scenario.title}
          </h3>
          {scenario.description && (
            <p className="text-xs text-slate-500 mt-1">{scenario.description}</p>
          )}
        </div>

        {/* Overall Result Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSelectResult('yes')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border shadow-2xs ${
              currentResult === 'yes'
                ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>✓ SIM</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectResult('no')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border shadow-2xs ${
              currentResult === 'no'
                ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
            }`}
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span>✕ NÃO</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectResult('caveat')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold transition-all border shadow-2xs ${
              currentResult === 'caveat'
                ? 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>⚠ RESSALVA</span>
          </button>
        </div>
      </div>

      {/* Scenario Steps Section (Etapa 7, 22) */}
      {scenario.steps && scenario.steps.length > 0 && (
        <div className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-200 mb-4">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
            Passos para execução:
          </span>
          <ol className="list-decimal list-inside space-y-1 text-xs font-medium text-slate-800 pl-1">
            {scenario.steps.map((st) => (
              <li key={st.id}>{st.text}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Scenario Assertions / Validations Checklist Section (Etapa 7) */}
      {scenario.assertions && scenario.assertions.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-emerald-600" />
            Validações do Cenário:
          </span>
          <div className="space-y-1.5">
            {scenario.assertions.map((as) => {
              const isChecked = assertionState[as.id] === 'passed';

              return (
                <button
                  key={as.id}
                  type="button"
                  onClick={() => handleToggleAssertion(as.id)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-2.5 ${
                    isChecked
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>{as.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded Details: For NÃO or COM RESSALVA or custom observation */}
      {(currentResult === 'no' || currentResult === 'caveat' || showNoteField) && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              {currentResult === 'no'
                ? 'Descreva o problema encontrado *'
                : currentResult === 'caveat'
                ? 'Qual a ressalva? *'
                : 'Observação do cenário'}
            </label>

            {currentResult === 'no' && (
              <div className="flex items-center gap-1 text-xs">
                <span className="font-semibold text-slate-600 mr-1">Gravidade:</span>
                {(['low', 'medium', 'high', 'critical'] as IssueSeverity[]).map((sev) => {
                  const labels: Record<IssueSeverity, string> = {
                    low: 'Baixa',
                    medium: 'Média',
                    high: 'Alta',
                    critical: 'Crítica',
                  };
                  const active = severity === sev;
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => handleSeverityChange(sev)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                        active
                          ? sev === 'critical'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : sev === 'high'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {labels[sev]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder={
              currentResult === 'no'
                ? 'Ex: O pedido é cancelado, porém o estoque permanece reservado...'
                : currentResult === 'caveat'
                ? 'Ex: Funciona, porém o cálculo do frete atrasou 3 segundos...'
                : 'Escreva qualquer observação sobre este cenário...'
            }
            className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs">
                <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                <span>{evidenceUrl ? 'Alterar evidência' : 'Anexar evidência (imagem/print)'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {evidenceUrl && (
                <button
                  type="button"
                  onClick={handleRemoveEvidence}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              )}
            </div>

            {evidenceUrl && (
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <img src={evidenceUrl} alt="Evidência" className="w-12 h-8 object-cover rounded border border-slate-300" />
                <span className="text-[11px] font-medium text-slate-600 pr-1">Evidência anexada</span>
              </div>
            )}
          </div>
        </div>
      )}

      {currentResult === 'yes' && !showNoteField && (
        <div className="mt-2 text-right">
          <button
            type="button"
            onClick={() => setShowNoteField(true)}
            className="text-xs text-slate-500 hover:text-indigo-600 hover:underline font-medium inline-flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3" />
            + Adicionar observação
          </button>
        </div>
      )}
    </div>
  );
};
