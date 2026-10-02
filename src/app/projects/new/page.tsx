'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ChecklistReviewScreen } from '@/components/ChecklistReviewScreen';
import { parseChecklistFile } from '@/lib/parser';
import { getStorageData, saveStorageData } from '@/lib/storage';
import { ParsedItem, Project, ChecklistTemplate, ChecklistCategory, ChecklistItem, TestRun } from '@/types/database';
import { Upload, FileText, ArrowLeft, Loader2, Plus, Sparkles, CheckCircle2 } from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const [data, setData] = useState(() => getStorageData());

  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingText, setLoadingText] = useState('Analisando checklist...');
  const [parsedItems, setParsedItems] = useState<ParsedItem[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome do projeto.');
      return;
    }
    if (!file) {
      setErrorMessage('Por favor, anexe um arquivo (PDF, DOCX, TXT ou CSV) ou escolha criar manualmente.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    // Discrete loading feedback steps
    setLoadingText('Analisando checklist...');
    setTimeout(() => setLoadingText('Interpretando seu checklist...'), 800);
    setTimeout(() => setLoadingText('Identificando funcionalidades...'), 1600);
    setTimeout(() => setLoadingText('Organizando testes por categoria...'), 2400);

    try {
      const items = await parseChecklistFile(file);
      setIsAnalyzing(false);
      setParsedItems(items);
    } catch (err: unknown) {
      setIsAnalyzing(false);
      const msg = err instanceof Error ? err.message : 'Não foi possível interpretar este arquivo.';
      setErrorMessage(msg);
    }
  };

  const handleCreateManual = () => {
    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome do projeto.');
      return;
    }
    // Default starting questions for manual creation
    const manualDefaultItems: ParsedItem[] = [
      { id: 'm-1', category: 'Navegação', question: 'O menu principal funciona corretamente?', order: 1 },
      { id: 'm-2', category: 'Navegação', question: 'O menu mobile abre e fecha sem falhas?', order: 2 },
      { id: 'm-3', category: 'Formulários', question: 'O formulário de contato envia as mensagens?', order: 3 },
      { id: 'm-4', category: 'Contato', question: 'O botão do WhatsApp abre a conversa?', order: 4 },
      { id: 'm-5', category: 'Responsividade', question: 'O site é responsivo em dispositivos móveis?', order: 5 },
    ];
    setParsedItems(manualDefaultItems);
  };

  const handleConfirmReview = (categories: string[], items: ParsedItem[]) => {
    const projId = `proj-${Date.now()}`;
    const tplId = `tpl-${Date.now()}`;
    const runId = `run-${Date.now()}`;

    const newProject: Project = {
      id: projId,
      name: name.trim(),
      website_url: websiteUrl.trim() || undefined,
      description: description.trim() || undefined,
      created_by: 'user-admin',
      created_by_name: data.currentUser.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newTemplate: ChecklistTemplate = {
      id: tplId,
      project_id: projId,
      title: 'Checklist de Funcionalidades',
      source_file: file ? file.name : 'Criado manualmente',
      created_at: new Date().toISOString(),
    };

    // Build Category Entities
    const categoryEntities: ChecklistCategory[] = categories.map((catName, index) => ({
      id: `cat-${Date.now()}-${index}`,
      checklist_template_id: tplId,
      name: catName,
      order: index + 1,
    }));

    const catNameToIdMap = new Map(categoryEntities.map((c) => [c.name, c.id]));

    // Build Item Entities
    const itemEntities: ChecklistItem[] = items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      checklist_template_id: tplId,
      category_id: catNameToIdMap.get(item.category) || categoryEntities[0].id,
      category_name: item.category,
      question: item.question,
      order: index + 1,
      created_at: new Date().toISOString(),
    }));

    // Initial Test Run
    const newRun: TestRun = {
      id: runId,
      project_id: projId,
      checklist_template_id: tplId,
      tester_id: 'user-admin',
      tester_name: data.currentUser.name,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const updated = { ...data };
    updated.projects.unshift(newProject);
    updated.templates.unshift(newTemplate);
    updated.categories.push(...categoryEntities);
    updated.items.push(...itemEntities);
    updated.runs.unshift(newRun);

    saveStorageData(updated);
    router.push(`/projects/${projId}/runs/${runId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentRole={data.currentUser.role} userName={data.currentUser.name} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </button>

        {/* Render Review Screen if file has been analyzed */}
        {parsedItems ? (
          <ChecklistReviewScreen
            initialItems={parsedItems}
            projectName={name || 'Novo Projeto'}
            websiteUrl={websiteUrl}
            sourceFileName={file?.name}
            onConfirm={handleConfirmReview}
            onCancel={() => setParsedItems(null)}
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="border-b border-slate-100 pb-5 mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Novo Projeto
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Envie o arquivo do seu checklist para transformar em uma auditoria digital interativa.
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  onClick={handleCreateManual}
                  className="font-bold underline text-rose-800 hover:text-rose-900 ml-2"
                >
                  Criar checklist manualmente
                </button>
              </div>
            )}

            <form onSubmit={handleAnalyze} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cuidare ou Landing Page Café Bonjour"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  URL do Site (opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://exemplo.com.br"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Descrição / Observações do Projeto (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Teste da versão de produção pré-entrega..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Anexar Arquivo do Checklist
                </label>

                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 text-center bg-slate-50/50 transition-colors relative cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  {file ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{file.name}</span>
                      <span className="text-xs text-slate-500 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB • Clique para trocar arquivo
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        Arraste seu arquivo aqui ou clique para buscar
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Formatos aceitos: <strong>PDF, DOCX, TXT ou CSV</strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Analyze or Manual Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCreateManual}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
                >
                  Criar checklist manualmente
                </button>

                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{loadingText}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analisar checklist</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
