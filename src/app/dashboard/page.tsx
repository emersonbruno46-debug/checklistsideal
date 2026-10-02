'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ProjectCard } from '@/components/ProjectCard';
import { getStorageData, saveStorageData } from '@/lib/storage';
import { Project, TestRun, ChecklistItem, TestAnswer, UserRole } from '@/types/database';
import { Plus, Search, FolderCheck, AlertTriangle, CheckSquare } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState(() => getStorageData());
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    setData(getStorageData());
  }, []);

  const handleToggleRole = (newRole: UserRole) => {
    const updated = { ...data };
    updated.currentUser.role = newRole;
    saveStorageData(updated);
    setData(updated);
  };

  const handleDeleteProject = (projectId: string) => {
    setDeleteConfirmId(projectId);
  };

  const confirmDeleteProject = () => {
    if (!deleteConfirmId) return;
    const updated = { ...data };
    updated.projects = updated.projects.filter((p) => p.id !== deleteConfirmId);
    updated.templates = updated.templates.filter((t) => t.project_id !== deleteConfirmId);
    updated.runs = updated.runs.filter((r) => r.project_id !== deleteConfirmId);
    saveStorageData(updated);
    setData(updated);
    setDeleteConfirmId(null);
  };

  // Filter projects by search
  const filteredProjects = data.projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.website_url && p.website_url.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        currentRole={data.currentUser.role}
        onToggleRole={handleToggleRole}
        userName={data.currentUser.name}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Seus Projetos
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Gerencie checklists digitais, audite funcionalidades e acompanhe correções.
            </p>
          </div>

          <Link
            href="/projects/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>+ Novo Projeto</span>
          </Link>
        </div>

        {/* Search & Stats Bar */}
        {data.projects.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar projeto por nome ou URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="text-xs text-slate-500 font-medium self-end sm:self-auto">
              Total de <strong>{data.projects.length}</strong> projeto{data.projects.length !== 1 ? 's' : ''} cadastrado{data.projects.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Projects Grid or Empty State */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              // Find latest run for project
              const projectRuns = data.runs
                .filter((r) => r.project_id === project.id)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              const latestRun = projectRuns[0];

              // Find template and items count
              const template = data.templates.find((t) => t.project_id === project.id);
              const itemsCount = template
                ? data.items.filter((i) => i.checklist_template_id === template.id).length
                : 0;

              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  latestRun={latestRun}
                  itemsCount={itemsCount}
                  answers={data.answers}
                  onDeleteProject={handleDeleteProject}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
              <FolderCheck className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Nenhum projeto ainda.
            </h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Crie seu primeiro projeto anexando um arquivo de checklist (PDF, DOCX, TXT ou CSV) para gerar um teste digital interativo.
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Criar primeiro projeto</span>
            </Link>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Confirmar exclusão de projeto?
            </h3>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Esta ação excluirá permanentemente o projeto, seu checklist e todas as execuções de testes associadas. Esta ação não poderá ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-2xs"
              >
                Sim, Excluir Projeto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
