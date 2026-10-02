'use client';

import React from 'react';
import Link from 'next/link';
import { TestRun, TestAnswer } from '@/types/database';
import { Plus, History, Play, CheckCircle2, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface RunHistoryListProps {
  projectId: string;
  runs: TestRun[];
  answers: Record<string, TestAnswer>;
  onNewRun: () => void;
}

export const RunHistoryList: React.FC<RunHistoryListProps> = ({
  projectId,
  runs,
  answers,
  onNewRun,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Histórico de Execuções de Testes
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare o progresso das auditorias após as correções da equipe
          </p>
        </div>

        <button
          onClick={onNewRun}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Teste</span>
        </button>
      </div>

      {/* Comparison Timeline Badges */}
      {runs.length > 1 && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
            Evolução dos Testes
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {runs.map((r, idx) => {
              const runAnswers = Object.values(answers).filter((a) => a.test_run_id === r.id);
              const problems = runAnswers.filter((a) => a.result === 'no').length;
              const caveats = runAnswers.filter((a) => a.result === 'caveat').length;

              return (
                <React.Fragment key={r.id}>
                  <div className="bg-white px-3 py-2 rounded-md border border-slate-200 shrink-0 font-medium text-slate-700 shadow-2xs">
                    <span className="font-bold text-slate-900">Teste #{runs.length - idx}</span>: {' '}
                    {problems === 0 && caveats === 0 ? (
                      <span className="text-emerald-600 font-bold">0 problemas ✓</span>
                    ) : (
                      <span className="text-rose-600 font-bold">
                        {problems} problema{problems !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {idx < runs.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Runs List Table */}
      <div className="space-y-3">
        {runs.map((run, idx) => {
          const runNumber = runs.length - idx;
          const runAnswers = Object.values(answers).filter((a) => a.test_run_id === run.id);
          const totalAnswers = runAnswers.length;
          const problemsCount = runAnswers.filter((a) => a.result === 'no').length;

          return (
            <div
              key={run.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors bg-white"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">
                    Checklist #{runNumber}
                  </span>
                  <StatusBadge status={run.status} size="sm" />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(run.started_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span>•</span>
                  <span>Testador: <strong className="text-slate-700">{run.tester_name}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <div className="font-bold text-slate-800">
                    {problemsCount > 0 ? (
                      <span className="text-rose-600">{problemsCount} problema(s)</span>
                    ) : (
                      <span className="text-emerald-600">0 problemas</span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/projects/${projectId}/runs/${run.id}`}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Abrir</span>
                </Link>

                <Link
                  href={`/projects/${projectId}/runs/${run.id}/report`}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                >
                  Relatório
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
