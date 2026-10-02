'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { getStorageData, saveStorageData } from '@/lib/storage';
import { ChecklistItem, ChecklistCategory, ParsedItem } from '@/types/database';
import { ChecklistReviewScreen } from '@/components/ChecklistReviewScreen';
import { ArrowLeft } from 'lucide-react';

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

  const existingItems = data.items.filter((i) => i.checklist_template_id === template.id);

  const initialParsedItems: ParsedItem[] = existingItems.map((it) => ({
    id: it.id,
    category: it.category_name || 'Geral',
    question: it.question,
    order: it.order,
  }));

  const handleSaveChecklist = (categories: string[], updatedItems: ParsedItem[]) => {
    const tplId = template.id;

    // Filter out existing categories and items for this template
    const otherCategories = data.categories.filter((c) => c.checklist_template_id !== tplId);
    const otherItems = data.items.filter((i) => i.checklist_template_id !== tplId);

    // Build new category entities
    const newCategories: ChecklistCategory[] = categories.map((catName, index) => ({
      id: `cat-edit-${Date.now()}-${index}`,
      checklist_template_id: tplId,
      name: catName,
      order: index + 1,
    }));

    const catNameMap = new Map(newCategories.map((c) => [c.name, c.id]));

    // Build new item entities
    const newItems: ChecklistItem[] = updatedItems.map((item, index) => ({
      id: item.id.startsWith('parsed-') || item.id.startsWith('custom-') ? `item-edit-${Date.now()}-${index}` : item.id,
      checklist_template_id: tplId,
      category_id: catNameMap.get(item.category) || newCategories[0].id,
      category_name: item.category,
      question: item.question,
      order: index + 1,
      created_at: new Date().toISOString(),
    }));

    const updated = { ...data };
    updated.categories = [...otherCategories, ...newCategories];
    updated.items = [...otherItems, ...newItems];

    saveStorageData(updated);
    router.push(`/projects/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentRole={data.currentUser.role} userName={data.currentUser.name} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao projeto
        </Link>

        <ChecklistReviewScreen
          initialItems={initialParsedItems}
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
