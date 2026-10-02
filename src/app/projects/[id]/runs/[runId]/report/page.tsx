'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ReportView } from '@/components/ReportView';
import { getStorageData } from '@/lib/storage';

export default function AuditReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const runId = params?.runId as string;

  const [data, setData] = useState(() => getStorageData());

  useEffect(() => {
    setData(getStorageData());
  }, [projectId, runId]);

  const project = data.projects.find((p) => p.id === projectId);
  const run = data.runs.find((r) => r.id === runId);
  const template = data.templates.find((t) => t.project_id === projectId);

  if (!project || !run || !template) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Relatório não encontrado</h2>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  const items = data.items.filter((i) => i.checklist_template_id === template.id);
  const categories = data.categories.filter((c) => c.checklist_template_id === template.id);
  const answers = data.answers;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentRole={data.currentUser.role} userName={data.currentUser.name} />

      <main className="flex-1">
        <ReportView
          project={project}
          run={run}
          items={items}
          categories={categories}
          answers={answers}
        />
      </main>
    </div>
  );
}
