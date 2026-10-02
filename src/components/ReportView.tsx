'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Project, TestRun, ChecklistItem, TestAnswer, ChecklistCategory } from '@/types/database';
import { StatusBadge } from './StatusBadge';
import { generatePDFReport, exportToCSV, exportToJSON, copyProblemsToClipboard } from '@/lib/pdf-export';
import {
  Download,
  Copy,
  Printer,
  FileSpreadsheet,
  FileCode,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface ReportViewProps {
  project: Project;
  run: TestRun;
  items: ChecklistItem[];
  categories: ChecklistCategory[];
  answers: Record<string, TestAnswer>;
}

export const ReportView: React.FC<ReportViewProps> = ({
  project,
  run,
  items,
  categories,
  answers,
}) => {
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [exportingPDF, setExportingPDF] = useState<boolean>(false);

  // Compute Statistics
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

  const approvalRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const handleCopyProblems = () => {
    copyProblemsToClipboard(project, items, answers);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleExportPDF = async (onlyProblems: boolean = false) => {
    setExportingPDF(true);
    const id = onlyProblems ? 'report-content-problems' : 'report-content-full';
    const name = onlyProblems
      ? `relatorio_problemas_${project.name.toLowerCase().replace(/\s+/g, '_')}`
      : `relatorio_auditoria_${project.name.toLowerCase().replace(/\s+/g, '_')}`;

    await generatePDFReport(id, name);
    setExportingPDF(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Action Header Bar (Screen Only) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <div>
          <Link
            href={`/projects/${project.id}/runs/${run.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao checklist
          </Link>
          <h2 className="text-xl font-bold text-slate-900">
            Relatório Oficial de Auditoria
          </h2>
          <p className="text-xs text-slate-500">
            Exportável para cliente e equipe de desenvolvimento
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyProblems}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-2xs"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText ? 'Copiado!' : 'Copiar problemas'}</span>
          </button>

          <button
            onClick={() => handleExportPDF(false)}
            disabled={exportingPDF}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingPDF ? 'Gerando PDF...' : 'Exportar PDF'}</span>
          </button>

          <button
            onClick={() => handleExportPDF(true)}
            disabled={exportingPDF}
            className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-2xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Exportar só problemas</span>
          </button>

          <button
            onClick={() => exportToCSV(project, run, items, categories, answers)}
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={() => exportToJSON(project, run, items, answers)}
            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Main Print-Ready Document Container */}
      <div id="report-content-full" className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        {/* Document Header Branding */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                Ideal Checklist&apos;s
              </span>
              <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                AUDITORIA WEB
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Sistema de Controle de Qualidade e Validação de Interfaces
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Relatório de Testes
            </span>
            <div className="text-sm font-semibold text-slate-800 mt-1">
              Data: {new Date(run.started_at).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>

        {/* Project Meta Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-8 text-xs">
          <div>
            <span className="font-semibold text-slate-500 block uppercase tracking-wider">Projeto</span>
            <strong className="text-slate-900 text-sm">{project.name}</strong>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block uppercase tracking-wider">Website URL</span>
            {project.website_url ? (
              <a
                href={project.website_url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>{project.website_url}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-slate-400">Não especificada</span>
            )}
          </div>
          <div>
            <span className="font-semibold text-slate-500 block uppercase tracking-wider">Responsável pelo Teste</span>
            <strong className="text-slate-900 text-sm">{run.tester_name}</strong>
          </div>
        </div>

        {/* Executive Summary Metrics Card */}
        <div className="mb-8">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
            Resumo Executivo
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-xs font-medium text-slate-500">Total de Testes</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalCount}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
              <span className="text-xs font-semibold text-emerald-700">Aprovados</span>
              <div className="text-2xl font-black text-emerald-800 mt-1">{approvedCount}</div>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
              <span className="text-xs font-semibold text-rose-700">Problemas</span>
              <div className="text-2xl font-black text-rose-800 mt-1">{problemCount}</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
              <span className="text-xs font-semibold text-amber-700">Com Ressalva</span>
              <div className="text-2xl font-black text-amber-800 mt-1">{caveatCount}</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 text-center col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-indigo-700">Taxa de Aprovação</span>
              <div className="text-2xl font-black text-indigo-800 mt-1">{approvalRate}%</div>
            </div>
          </div>
        </div>

        {/* Detailed Results List */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-4">
            Detalhamento dos Testes Executados
          </h3>

          <div className="space-y-4">
            {items.map((item, idx) => {
              const ans = answers[item.id];
              const result = ans?.result || 'unanswered';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    result === 'yes'
                      ? 'bg-emerald-50/20 border-emerald-200'
                      : result === 'no'
                      ? 'bg-rose-50/30 border-rose-200'
                      : result === 'caveat'
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Result Icon */}
                      <div className="mt-0.5">
                        {result === 'yes' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                        {result === 'no' && <XCircle className="w-5 h-5 text-rose-600" />}
                        {result === 'caveat' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                        {result === 'unanswered' && <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                          {item.category_name && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                              {item.category_name}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {item.question}
                        </h4>
                      </div>
                    </div>

                    <StatusBadge result={result} />
                  </div>

                  {/* Notes & Severity Details */}
                  {ans && (ans.note || ans.severity || (ans.attachments && ans.attachments.length > 0)) && (
                    <div className="mt-3 pt-3 border-t border-slate-200/60 pl-8 space-y-2 text-xs">
                      {ans.severity && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-600">Gravidade:</span>
                          <StatusBadge severity={ans.severity} size="sm" />
                        </div>
                      )}

                      {ans.note && (
                        <div>
                          <span className="font-semibold text-slate-700 block mb-0.5">
                            {result === 'no' ? 'Problema encontrado:' : result === 'caveat' ? 'Ressalva:' : 'Observação:'}
                          </span>
                          <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                            &ldquo;{ans.note}&rdquo;
                          </p>
                        </div>
                      )}

                      {/* Evidence Image */}
                      {ans.attachments && ans.attachments.length > 0 && (
                        <div className="pt-1">
                          <span className="font-semibold text-slate-600 block mb-1">Evidência:</span>
                          <img
                            src={ans.attachments[0].file_url}
                            alt="Evidência"
                            className="max-h-48 rounded-lg border border-slate-300 object-cover shadow-2xs"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-10 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          Ideal Checklist&apos;s • Relatório de Auditoria de Software e Interfaces Web • Gerado automaticamente
        </div>
      </div>
    </div>
  );
};
