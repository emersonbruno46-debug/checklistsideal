'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface FinalizeModalProps {
  isOpen: boolean;
  unansweredCount: number;
  totalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const FinalizeModal: React.FC<FinalizeModalProps> = ({
  isOpen,
  unansweredCount,
  totalCount,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        {unansweredCount > 0 ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Atenção: Testes Pendentes
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Existem <strong>{unansweredCount}</strong> de <strong>{totalCount}</strong> itens ainda não testados neste checklist. Deseja finalizar assim mesmo e gerar o relatório final?
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={onCancel}
                className="w-full sm:w-1/2 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
              >
                Voltar ao checklist
              </button>
              <button
                onClick={onConfirm}
                className="w-full sm:w-1/2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                Finalizar mesmo assim
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Finalizar Auditoria?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Todos os {totalCount} testes foram respondidos. Ao concluir, o status do projeto será atualizado e o relatório oficial será gerado.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-2xs"
              >
                Confirmar e Gerar Relatório
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
