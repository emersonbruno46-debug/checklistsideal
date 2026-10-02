'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { RunHistoryList } from '@/components/RunHistoryList';
import { getStorageData, saveStorageData } from '@/lib/storage';
import { Project, TestRun, ChecklistTemplate, ChecklistScenario, ChecklistSection } from '@/types/database';
import { ArrowLeft, ExternalLink, Edit3, Copy, Plus } from 'lucide-react';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [data, setData] = useState(() => getStorageData());

  useEffect(() => {
    setData(getStorageData());
  }, [projectId]);

  const project = data.projects.find((p) => p.id === projectId);
  const template = data.templates.find((t) => t.project_id === projectId);
  const runs = data.runs
    .filter((r) => r.project_id === projectId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Projeto não encontrado</h2>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  const scenarios = template
    ? data.scenarios.filter((s) => s.checklist_template_id === template.id)
    : [];

  const sections = template
    ? data.sections.filter((sec) => sec.checklist_template_id === template.id)
    : [];

  const handleStartNewRun = () => {
    if (!template) return;

    const runId = `run-${Date.now()}`;
    const newRun: TestRun = {
      id: runId,
      project_id: projectId,
      checklist_template_id: template.id,
      tester_id: 'user-admin',
      tester_name: data.currentUser.name,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const updated = { ...data };
    updated.runs.unshift(newRun);
    saveStorageData(updated);
    router.push(`/projects/${projectId}/runs/${runId}`);
  };

  const handleDuplicateChecklist = () => {
    const targetName = prompt('Digite o nome do novo projeto para o qual deseja duplicar este checklist:', `${project.name} (Cópia)`);
    if (!targetName) return;

    const newProjId = `proj-${Date.now()}`;
    const newTplId = `tpl-${Date.now()}`;
    const newRunId = `run-${Date.now()}`;

    const newProj: Project = {
      id: newProjId,
      name: targetName.trim(),
      website_url: project.website_url,
      description: `Duplicado a partir do projeto ${project.name}`,
      created_by: 'user-admin',
      created_by_name: data.currentUser.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newTpl: ChecklistTemplate = {
      id: newTplId,
      project_id: newProjId,
      title: template?.title || 'Checklist de Funcionalidades',
      source_file: template?.source_file,
      created_at: new Date().toISOString(),
    };

    const newSections: ChecklistSection[] = sections.map((sec, idx) => ({
      id: `sec-dup-${Date.now()}-${idx}`,
      checklist_template_id: newTplId,
      title: sec.title,
      order: sec.order,
    }));

    const secTitleMap = new Map(newSections.map((ns) => [ns.title, ns.id]));

    const newScenarios: ChecklistScenario[] = scenarios.map((scen, idx) => ({
      id: `scen-dup-${Date.now()}-${idx}`,
      checklist_template_id: newTplId,
      section_id: secTitleMap.get(scen.section_title || '') || newSections[0]?.id,
      section_title: scen.section_title,
      title: scen.title,
      description: scen.description,
      confidence: scen.confidence,
      order: scen.order,
      steps: scen.steps.map((st) => ({ ...st, id: `st-${Date.now()}-${Math.random()}` })),
      assertions: scen.assertions.map((as) => ({ ...as, id: `as-${Date.now()}-${Math.random()}` })),
      requiresEvidence: scen.requiresEvidence,
      created_at: new Date().toISOString(),
    }));

    const newRun: TestRun = {
      id: newRunId,
      project_id: newProjId,
      checklist_template_id: newTplId,
      tester_id: 'user-admin',
      tester_name: data.currentUser.name,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const updated = { ...data };
    updated.projects.unshift(newProj);
    updated.templates.unshift(newTpl);
    updated.sections.push(...newSections);
    updated.scenarios.push(...newScenarios);
    updated.runs.unshift(newRun);

    saveStorageData(updated);
    router.push(`/projects/${newProjId}/runs/${newRunId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentRole={data.currentUser.role} userName={data.currentUser.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar aos projetos
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {project.name}
              </h1>
              {project.website_url && (
                <a
                  href={project.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-medium mt-1"
                >
                  <span>{project.website_url}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleStartNewRun}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Novo Teste</span>
              </button>

              <Link
                href={`/projects/${project.id}/checklist/edit`}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Checklist</span>
              </Link>

              <button
                onClick={handleDuplicateChecklist}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Criado em</span>
              <strong className="text-slate-800">{new Date(project.created_at).toLocaleDateString('pt-BR')}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Cenários de Teste</span>
              <strong className="text-slate-800">{scenarios.length} cenários</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Seções</span>
              <strong className="text-slate-800">{sections.length} ativas</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Execuções</span>
              <strong className="text-slate-800">{runs.length} realizadas</strong>
            </div>
          </div>
        </div>

        <RunHistoryList
          projectId={project.id}
          runs={runs}
          scenarioResults={data.scenarioResults}
          onNewRun={handleStartNewRun}
        />
      </main>
    </div>
  );
}
