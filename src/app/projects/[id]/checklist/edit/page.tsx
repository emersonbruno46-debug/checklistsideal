'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { getStorageData, saveStorageData } from '@/lib/storage';
import { ChecklistSection, ChecklistScenario, ParsedChecklistStructure } from '@/types/database';
import { ChecklistReviewScreen } from '@/components/ChecklistReviewScreen';
import { ArrowLeft } from 'lucide-react';

interface ScenarioDraft {
  id: string;
  sectionTitle: string;
  title: string;
  description?: string | null;
  confidence: number;
  steps: Array<{ id: string; text: string; order: number }>;
  assertions: Array<{ id: string; text: string; confidence: number; order: number }>;
  requiresEvidence: boolean;
}

export default function EditChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [data, setData] = useState(() => getStorageData());

  useEffect(() => {
    setData(getStorageData());
  }, [projectId]);

  const project = data.projects.find((p) => p.id === projectId);
  const template = data.templates.find((t) => t.project_id === projectId);

  if (!project || !template) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Checklist não encontrado</h2>
        <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
          Voltar ao dashboard
        </Link>
      </div>
    );
  }

  const existingScenarios = data.scenarios.filter((s) => s.checklist_template_id === template.id);
  const existingSections = data.sections.filter((sec) => sec.checklist_template_id === template.id);

  const initialStructure: ParsedChecklistStructure = {
    documentTitle: template.title,
    sections: existingSections.map((sec) => ({
      title: sec.title,
      scenarios: existingScenarios
        .filter((scen) => scen.section_id === sec.id || scen.section_title === sec.title)
        .map((scen) => ({
          title: scen.title,
          description: scen.description,
          confidence: scen.confidence || 0.95,
          preconditions: scen.preconditions || [],
          steps: scen.steps.map((st) => ({ text: st.text, order: st.order })),
          assertions: scen.assertions.map((as) => ({ text: as.text, confidence: as.confidence || 0.95, order: as.order })),
          instructions: scen.instructions || [],
          requiresEvidence: scen.requiresEvidence || false,
        })),
    })),
    ignoredElements: [],
    needsReview: [],
  };

  const handleSaveChecklist = (
    sections: Array<{ title: string; scenarios: ScenarioDraft[] }>
  ) => {
    const tplId = template.id;

    const otherSections = data.sections.filter((s) => s.checklist_template_id !== tplId);
    const otherScenarios = data.scenarios.filter((s) => s.checklist_template_id !== tplId);

    const newSections: ChecklistSection[] = [];
    const newScenarios: ChecklistScenario[] = [];

    let secOrder = 1;
    let scenOrder = 1;

    sections.forEach((sec) => {
      const secId = `sec-edit-${Date.now()}-${secOrder}`;
      newSections.push({
        id: secId,
        checklist_template_id: tplId,
        title: sec.title,
        order: secOrder++,
      });

      sec.scenarios.forEach((scen) => {
        const scenId = `scen-edit-${Date.now()}-${scenOrder}`;
        newScenarios.push({
          id: scenId,
          checklist_template_id: tplId,
          section_id: secId,
          section_title: sec.title,
          title: scen.title,
          description: scen.description,
          confidence: scen.confidence,
          order: scenOrder++,
          steps: scen.steps.map((st, idx) => ({
            id: `st-${scenId}-${idx}`,
            scenario_id: scenId,
            text: st.text,
            order: idx + 1,
          })),
          assertions: scen.assertions.map((as, idx) => ({
            id: `as-${scenId}-${idx}`,
            scenario_id: scenId,
            text: as.text,
            confidence: as.confidence,
            order: idx + 1,
          })),
          requiresEvidence: scen.requiresEvidence,
          created_at: new Date().toISOString(),
        });
      });
    });

    const updated = { ...data };
    updated.sections = [...otherSections, ...newSections];
    updated.scenarios = [...otherScenarios, ...newScenarios];

    saveStorageData(updated);
    router.push(`/projects/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentRole={data.currentUser.role} userName={data.currentUser.name} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao projeto
        </Link>

        <ChecklistReviewScreen
          initialStructure={initialStructure}
          projectName={project.name}
          websiteUrl={project.website_url}
          sourceFileName={template.source_file}
          onConfirm={handleSaveChecklist}
          onCancel={() => router.push(`/projects/${projectId}`)}
        />
      </main>
    </div>
  );
}
