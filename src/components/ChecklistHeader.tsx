'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, CheckCircle2, AlertCircle, AlertTriangle, Clock, Search, CheckSquare, ArrowLeft } from 'lucide-react';
import { Project, TestRun, ChecklistItem, TestAnswer, AnswerResult } from '@/types/database';

interface ChecklistHeaderProps {
  project: Project;
  run: TestRun;
  items: ChecklistItem[];
  answers: Record<string, TestAnswer>;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFinalize: () => void;
}

export const ChecklistHeader: React.FC<ChecklistHeaderProps> = ({
  project,
  run,
  items,
  answers,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onFinalize,
}) => {
  const totalCount = items.length;
  let approvedCount = 0;
  let problemCount = 0;
  let caveatCount = 0;
  let pendingCount = 0;

  items.forEach((item) => {
    const ans = answers[item.id];
    if (!ans || ans.result === 'unanswered') {
      pendingCount++;
    } else if (ans.result === 'yes') {
      approvedCount++;
    } else if (ans.result === 'no') {
      problemCount++;
    } else if (ans.result === 'caveat') {
      caveatCount++;
    }
  });

  const answeredCount = totalCount - pendingCount;
  const percentage = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 mb-6 shadow-xs">
      {/* Top row: Back button, Title & URL, Finalize Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar aos projetos
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {project.name}
            </h1>
            {project.website_url && (
              <a
                href={project.website_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md hover:bg-indigo-100 transition-colors"
              >
                <span>{project.website_url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Testador: <strong className="text-slate-700">{run.tester_name}</strong> • Iniciado em: {new Date(run.started_at).toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Finalize Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onFinalize}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <CheckSquare className="w-4 h-4 stroke-[2.5]" />
            <span>Finalizar Checklist</span>
          </button>
        </div>
      </div>

      {/* Counter Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        <button
          onClick={() => onFilterChange('all')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Total</div>
          <div className="text-xl font-extrabold mt-0.5">{totalCount} testes</div>
        </button>

        <button
          onClick={() => onFilterChange('yes')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'yes'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-emerald-50/60 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Aprovados</div>
          <div className="text-xl font-extrabold mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {approvedCount}
          </div>
        </button>

        <button
          onClick={() => onFilterChange('no')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'no'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-rose-50/60 border-rose-200 text-rose-800 hover:bg-rose-100/70'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Problemas</div>
          <div className="text-xl font-extrabold mt-0.5 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            {problemCount}
          </div>
        </button>

        <button
          onClick={() => onFilterChange('caveat')}
          className={`p-3 rounded-lg border text-left transition-all ${
            activeFilter === 'caveat'
              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
              : 'bg-amber-50/60 border-amber-200 text-amber-800 hover:bg-amber-100/70'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Ressalvas</div>
          <div className="text-xl font-extrabold mt-0.5 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            {caveatCount}
          </div>
        </button>

        <button
          onClick={() => onFilterChange('pending')}
          className={`p-3 rounded-lg border text-left transition-all col-span-2 sm:col-span-1 ${
            activeFilter === 'pending'
              ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Pendentes</div>
          <div className="text-xl font-extrabold mt-0.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {pendingCount}
          </div>
        </button>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1.5">
          <span>Progresso geral do checklist ({answeredCount} de {totalCount})</span>
          <span className="text-indigo-600">{percentage}% concluído</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-300 ${
              percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'Pendentes' },
            { key: 'yes', label: 'Aprovados' },
            { key: 'no', label: 'Problemas' },
            { key: 'caveat', label: 'Com ressalva' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeFilter === tab.key
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar teste..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
