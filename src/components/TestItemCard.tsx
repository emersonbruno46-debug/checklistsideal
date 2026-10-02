'use client';

import React, { useState, useEffect } from 'react';
import { ChecklistItem, TestAnswer, AnswerResult, IssueSeverity } from '@/types/database';
import { Check, X, AlertTriangle, Paperclip, MessageSquare, Image as ImageIcon, Trash2 } from 'lucide-react';

interface TestItemCardProps {
  item: ChecklistItem;
  answer?: TestAnswer;
  index: number;
  totalCount: number;
  onAnswerChange: (
    itemId: string,
    result: AnswerResult,
    note?: string,
    severity?: IssueSeverity,
    attachmentUrl?: string
  ) => void;
  isFocused?: boolean;
}

export const TestItemCard: React.FC<TestItemCardProps> = ({
  item,
  answer,
  index,
  totalCount,
  onAnswerChange,
  isFocused = false,
}) => {
  const currentResult: AnswerResult = answer?.result || 'unanswered';
  const [note, setNote] = useState<string>(answer?.note || '');
  const [severity, setSeverity] = useState<IssueSeverity>(answer?.severity || 'medium');
  const [showNoteField, setShowNoteField] = useState<boolean>(Boolean(answer?.note));
  const [evidenceUrl, setEvidenceUrl] = useState<string | undefined>(
    answer?.attachments && answer.attachments.length > 0 ? answer.attachments[0].file_url : undefined
  );
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Update local state if props change
  useEffect(() => {
    setNote(answer?.note || '');
    setSeverity(answer?.severity || 'medium');
    setEvidenceUrl(answer?.attachments && answer.attachments.length > 0 ? answer.attachments[0].file_url : undefined);
  }, [answer]);

  const handleSelectResult = (newResult: AnswerResult) => {
    setSavingState('saving');
    onAnswerChange(item.id, newResult, note, newResult === 'no' ? severity : undefined, evidenceUrl);
    setTimeout(() => setSavingState('saved'), 300);
    setTimeout(() => setSavingState('idle'), 1500);
  };

  const handleNoteBlur = () => {
    if (currentResult !== 'unanswered') {
      setSavingState('saving');
      onAnswerChange(item.id, currentResult, note, severity, evidenceUrl);
      setTimeout(() => setSavingState('saved'), 300);
      setTimeout(() => setSavingState('idle'), 1500);
    }
  };

  const handleSeverityChange = (newSev: IssueSeverity) => {
    setSeverity(newSev);
    if (currentResult === 'no') {
      setSavingState('saving');
      onAnswerChange(item.id, currentResult, note, newSev, evidenceUrl);
      setTimeout(() => setSavingState('saved'), 300);
      setTimeout(() => setSavingState('idle'), 1500);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert image/file to base64 preview for persistence
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setEvidenceUrl(url);
      if (currentResult !== 'unanswered') {
        onAnswerChange(item.id, currentResult, note, severity, url);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveEvidence = () => {
    setEvidenceUrl(undefined);
    if (currentResult !== 'unanswered') {
      onAnswerChange(item.id, currentResult, note, severity, undefined);
    }
  };

  // Border & background classes depending on result
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
      id={`item-${item.id}`}
      className={`rounded-xl border p-4 sm:p-5 transition-all shadow-xs ${borderBgClass}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Left: Question info & category */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Item #{index + 1} de {totalCount}
            </span>
            {item.category_name && (
              <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                {item.category_name}
              </span>
            )}
            {savingState !== 'idle' && (
              <span className="text-[11px] text-slate-500 italic animate-pulse">
                {savingState === 'saving' ? 'Salvando...' : '✓ Salvo'}
              </span>
            )}
          </div>
          <h4 className="text-base font-semibold text-slate-900 leading-snug">
            {item.question}
          </h4>
        </div>

        {/* Right: Fast 3-Button selection */}
        <div className="flex items-center gap-2 shrink-0">
          {/* SIM Button */}
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

          {/* NÃO Button */}
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

          {/* RESSALVA Button */}
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

      {/* Expanded Details: For NÃO or COM RESSALVA or custom observation */}
      {(currentResult === 'no' || currentResult === 'caveat' || showNoteField) && (
        <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-3 animate-fadeIn">
          {/* Label Header */}
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              {currentResult === 'no'
                ? 'Descreva o problema encontrado *'
                : currentResult === 'caveat'
                ? 'Qual a ressalva? *'
                : 'Observações do teste'}
            </label>

            {/* Severity selection if NÃO */}
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

          {/* Textarea */}
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteBlur}
            placeholder={
              currentResult === 'no'
                ? 'Ex: Ao clicar no botão, a tela fica carregando indefinidamente e não confirma...'
                : currentResult === 'caveat'
                ? 'Ex: Funciona, porém o alinhamento fica um pouco distorcido abaixo de 360px...'
                : 'Escreva qualquer observação sobre este item...'
            }
            className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />

          {/* Evidence Attachment Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs">
                <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                <span>{evidenceUrl ? 'Alterar evidência' : 'Anexar evidência (imagem/print)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
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

            {/* Evidence Image Preview Thumbnail */}
            {evidenceUrl && (
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <img
                  src={evidenceUrl}
                  alt="Evidência do teste"
                  className="w-12 h-8 object-cover rounded border border-slate-300"
                />
                <span className="text-[11px] font-medium text-slate-600 pr-1">
                  Evidência anexada
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Observation Button for SIM when note field is hidden */}
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
