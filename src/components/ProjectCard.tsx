'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Play, AlertCircle, ArrowRight, CheckCircle2, History, Trash2 } from 'lucide-react';
import { Project, TestRun, ChecklistItem, TestAnswer, ProjectStatus } from '@/types/database';
import { StatusBadge } from './StatusBadge';

interface ProjectCardProps {
  project: Project;
  latestRun?: TestRun;
  itemsCount: number;
  answers: Record<string, TestAnswer>;
  onDeleteProject?: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  latestRun,
  itemsCount = 0,
  answers = {},
  onDeleteProject,
}) => {
  // Compute progress and problem count
  let answeredCount = 0;
  let problemCount = 0;
  let caveatCount = 0;

  const runAnswers = latestRun ? Object.values(answers).filter((a) => a.test_run_id === latestRun.id) : [];

  runAnswers.forEach((ans) => {
    if (ans.result !== 'unanswered') {
      answeredCount++;
    }
    if (ans.result === 'no') {
      problemCount++;
    }
    if (ans.result === 'caveat') {
      caveatCount++;
    }
  });

  const percentage = itemsCount > 0 ? Math.round((answeredCount / itemsCount) * 100) : 0;

  // Calculate automatic status if not explicit
  let autoStatus: ProjectStatus = 'not_started';
  if (answeredCount === 0) {
    autoStatus = 'not_started';
  } else if (answeredCount < itemsCount) {
    autoStatus = 'in_progress';
  } else if (problemCount > 0 || caveatCount > 0) {
    autoStatus = 'needs_review';
  } else {
    autoStatus = 'completed';
  }

  const effectiveStatus = latestRun?.status && latestRun.status !== 'not_started' ? latestRun.status : autoStatus;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition-all hover:shadow-md flex flex-col justify-between group">
      <div>
        {/* Header: Title, URL, Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
              {project.name}
            </h3>
            {project.website_url ? (
              <a
                href={project.website_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 hover:underline mt-0.5"
              >
                <span>{project.website_url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-xs text-slate-400">Sem URL informada</span>
            )}
          </div>
          <StatusBadge status={effectiveStatus} />
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-slate-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Responsible & Date */}
        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 mb-4">
          <div>
            Responsável: <span className="font-semibold text-slate-700">{latestRun?.tester_name || project.created_by_name || 'Equipe'}</span>
          </div>
          <div>{new Date(project.created_at).toLocaleDateString('pt-BR')}</div>
        </div>

        {/* Progress Bar & Counter */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs text-slate-600 mb-1 font-medium">
            <span>{answeredCount} de {itemsCount} testes concluídos</span>
            <span className="font-bold text-slate-900">{percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
            <div
              className={`h-full transition-all duration-300 ${
                percentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Issues Warning Box */}
        {(problemCount > 0 || caveatCount > 0) && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-xs text-rose-700 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              <strong>{problemCount}</strong> problema{problemCount !== 1 ? 's' : ''} e <strong>{caveatCount}</strong> ressalva{caveatCount !== 1 ? 's' : ''} encontrada{problemCount + caveatCount !== 1 ? 's' : ''}.
            </span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {latestRun ? (
            <Link
              href={`/projects/${project.id}/runs/${latestRun.id}`}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {percentage === 100 ? 'Ver / Editar Teste' : 'Continuar Teste'}
            </Link>
          ) : (
            <Link
              href={`/projects/${project.id}`}
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Iniciar Teste
            </Link>
          )}

          {latestRun && (
            <Link
              href={`/projects/${project.id}/runs/${latestRun.id}/report`}
              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              Relatório
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={`/projects/${project.id}`}
            title="Ver histórico de testes"
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <History className="w-4 h-4" />
          </Link>

          {onDeleteProject && (
            <button
              onClick={() => onDeleteProject(project.id)}
              title="Excluir projeto"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
