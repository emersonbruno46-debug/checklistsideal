'use client';

import React from 'react';
import { ProjectStatus, AnswerResult, IssueSeverity } from '@/types/database';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Check, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status?: ProjectStatus;
  result?: AnswerResult;
  severity?: IssueSeverity;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  result,
  severity,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  if (status) {
    switch (status) {
      case 'not_started':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Não iniciado
          </span>
        );
      case 'in_progress':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            Em teste
          </span>
        );
      case 'needs_review':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Revisão necessária
          </span>
        );
      case 'completed':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Concluído
          </span>
        );
    }
  }

  if (result) {
    switch (result) {
      case 'yes':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <Check className="w-3.5 h-3.5" />
            Aprovado (Sim)
          </span>
        );
      case 'no':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            <XCircle className="w-3.5 h-3.5" />
            Não Funciona
          </span>
        );
      case 'caveat':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            <AlertCircle className="w-3.5 h-3.5" />
            Com Ressalva
          </span>
        );
      case 'unanswered':
        return (
          <span className={`inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
            Pendente
          </span>
        );
    }
  }

  if (severity) {
    switch (severity) {
      case 'low':
        return (
          <span className={`inline-flex items-center rounded bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
            Baixa
          </span>
        );
      case 'medium':
        return (
          <span className={`inline-flex items-center rounded bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
            Média
          </span>
        );
      case 'high':
        return (
          <span className={`inline-flex items-center rounded bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
            Alta
          </span>
        );
      case 'critical':
        return (
          <span className={`inline-flex items-center rounded bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses}`}>
            Crítica
          </span>
        );
    }
  }

  return null;
};
