'use client';

import React, { useState } from 'react';
import {
  ParsedChecklistStructure,
  IgnoredElement,
  NeedsReviewElement,
  ChecklistScenario,
  ChecklistStep,
  ChecklistAssertion,
  ParsedItem,
} from '@/types/database';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Copy,
  Layers,
  Split,
  EyeOff,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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

interface ChecklistReviewScreenProps {
  initialStructure?: ParsedChecklistStructure;
  initialItems?: ParsedItem[]; // legacy fallback
  projectName: string;
  websiteUrl?: string;
  sourceFileName?: string;
  onConfirm: (
    sections: Array<{ title: string; scenarios: ScenarioDraft[] }>,
    legacyItems?: ParsedItem[]
  ) => void;
  onCancel: () => void;
}

export const ChecklistReviewScreen: React.FC<ChecklistReviewScreenProps> = ({
  initialStructure,
  initialItems,
  projectName,
  websiteUrl,
  sourceFileName,
  onConfirm,
  onCancel,
}) => {
  // Convert structure to scenario drafts
  const [scenarios, setScenarios] = useState<ScenarioDraft[]>(() => {
    if (initialStructure && initialStructure.sections.length > 0) {
      const drafts: ScenarioDraft[] = [];
      let scCounter = 1;

      initialStructure.sections.forEach((sec) => {
        sec.scenarios.forEach((scen) => {
          drafts.push({
            id: `scen-draft-${Date.now()}-${scCounter++}`,
            sectionTitle: sec.title || 'Geral',
            title: scen.title,
            description: scen.description,
            confidence: scen.confidence || 0.95,
            steps: scen.steps.map((st, idx) => ({
              id: `st-draft-${idx}`,
              text: st.text,
              order: idx + 1,
            })),
            assertions: scen.assertions.map((as, idx) => ({
              id: `as-draft-${idx}`,
              text: as.text,
              confidence: as.confidence || 0.95,
              order: idx + 1,
            })),
            requiresEvidence: scen.requiresEvidence || false,
          });
        });
      });
      return drafts;
    }

    // Legacy items fallback conversion
    if (initialItems && initialItems.length > 0) {
      const catMap = new Map<string, ParsedItem[]>();
      initialItems.forEach((it) => {
        const cat = it.category || 'Geral';
        if (!catMap.has(cat)) catMap.set(cat, []);
        catMap.get(cat)!.push(it);
      });

      const drafts: ScenarioDraft[] = [];
      let counter = 1;

      catMap.forEach((items, catName) => {
        drafts.push({
          id: `scen-leg-${Date.now()}-${counter++}`,
          sectionTitle: catName,
          title: `Validação de ${catName}`,
          description: `Testes de funcionalidades da seção ${catName}`,
          confidence: 0.95,
          steps: [{ id: 'st-1', text: `Navegue até a área de ${catName}`, order: 1 }],
          assertions: items.map((it, idx) => ({
            id: `as-leg-${idx}`,
            text: it.question,
            confidence: 0.95,
            order: idx + 1,
          })),
          requiresEvidence: false,
        });
      });
      return drafts;
    }

    // Default fallback scenario
    return [
      {
        id: 'scen-default-1',
        sectionTitle: 'Geral',
        title: 'Navegação e funcionamento principal',
        confidence: 0.98,
        steps: [{ id: 's1', text: 'Acesse o site principal', order: 1 }],
        assertions: [{ id: 'a1', text: 'O site carrega normalmente sem erros', confidence: 0.99, order: 1 }],
        requiresEvidence: false,
      },
    ];
  });

  const [ignoredElements, setIgnoredElements] = useState<IgnoredElement[]>(
    initialStructure?.ignoredElements || []
  );
  const [needsReview, setNeedsReview] = useState<NeedsReviewElement[]>(
    initialStructure?.needsReview || []
  );

  const [selectedScenarioIds, setSelectedScenarioIds] = useState<string[]>([]);
  const [showIgnored, setShowIgnored] = useState<boolean>(false);

  // Edit modal / inline edit states
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSection, setEditSection] = useState('');
  const [newStepText, setNewStepText] = useState('');
  const [newAssertionText, setNewAssertionText] = useState('');

  // Total Counts for Summary Card (Etapa 44)
  const totalScenarios = scenarios.length;
  const totalAssertions = scenarios.reduce((acc, s) => acc + s.assertions.length, 0);
  const totalSteps = scenarios.reduce((acc, s) => acc + s.steps.length, 0);

  // Checkbox selection for Merging Scenarios (Etapa 20)
  const handleToggleSelect = (id: string) => {
    if (selectedScenarioIds.includes(id)) {
      setSelectedScenarioIds(selectedScenarioIds.filter((sId) => sId !== id));
    } else {
      setSelectedScenarioIds([...selectedScenarioIds, id]);
    }
  };

  // Merge selected scenarios (Etapa 20)
  const handleMergeSelected = () => {
    if (selectedScenarioIds.length < 2) {
      alert('Selecione pelo menos 2 cenários para juntar.');
      return;
    }

    const selectedScenarios = scenarios.filter((s) => selectedScenarioIds.includes(s.id));
    const mergedTitle = selectedScenarios.map((s) => s.title).join(' + ');
    const mergedSection = selectedScenarios[0].sectionTitle;

    const mergedSteps: Array<{ id: string; text: string; order: number }> = [];
    const mergedAssertions: Array<{ id: string; text: string; confidence: number; order: number }> = [];

    selectedScenarios.forEach((s) => {
      s.steps.forEach((st) => mergedSteps.push({ ...st, id: `st-m-${Date.now()}-${Math.random()}` }));
      s.assertions.forEach((as) => mergedAssertions.push({ ...as, id: `as-m-${Date.now()}-${Math.random()}` }));
    });

    const newMergedScenario: ScenarioDraft = {
      id: `scen-merged-${Date.now()}`,
      sectionTitle: mergedSection,
      title: mergedTitle,
      confidence: 0.95,
      steps: mergedSteps.map((st, idx) => ({ ...st, order: idx + 1 })),
      assertions: mergedAssertions.map((as, idx) => ({ ...as, order: idx + 1 })),
      requiresEvidence: selectedScenarios.some((s) => s.requiresEvidence),
    };

    setScenarios([
      ...scenarios.filter((s) => !selectedScenarioIds.includes(s.id)),
      newMergedScenario,
    ]);
    setSelectedScenarioIds([]);
  };

  // Split scenario into individual assertions (Etapa 21)
  const handleSplitScenario = (scenarioId: string) => {
    const target = scenarios.find((s) => s.id === scenarioId);
    if (!target || target.assertions.length <= 1) {
      alert('O cenário precisa ter pelo menos 2 validações para ser separado.');
      return;
    }

    const splittedScenarios: ScenarioDraft[] = target.assertions.map((as, idx) => ({
      id: `scen-split-${Date.now()}-${idx}`,
      sectionTitle: target.sectionTitle,
      title: as.text.replace(/\.$/, ''),
      confidence: as.confidence || 0.9,
      steps: [...target.steps],
      assertions: [{ ...as, order: 1 }],
      requiresEvidence: target.requiresEvidence,
    }));

    setScenarios([
      ...scenarios.filter((s) => s.id !== scenarioId),
      ...splittedScenarios,
    ]);
  };

  // Duplicate scenario
  const handleDuplicateScenario = (scen: ScenarioDraft) => {
    const dup: ScenarioDraft = {
      ...scen,
      id: `scen-dup-${Date.now()}`,
      title: `${scen.title} (Cópia)`,
      steps: scen.steps.map((st) => ({ ...st, id: `st-${Date.now()}-${Math.random()}` })),
      assertions: scen.assertions.map((as) => ({ ...as, id: `as-${Date.now()}-${Math.random()}` })),
    };
    setScenarios([...scenarios, dup]);
  };

  // Delete scenario
  const handleDeleteScenario = (id: string) => {
    setScenarios(scenarios.filter((s) => s.id !== id));
  };

  // Accept uncertain item into a scenario (Etapa 17)
  const handleAcceptUncertainItem = (item: NeedsReviewElement) => {
    const newScenario: ScenarioDraft = {
      id: `scen-unc-${Date.now()}`,
      sectionTitle: 'Geral',
      title: `Validação de ${item.text}`,
      confidence: 0.85,
      steps: [],
      assertions: [{ id: `as-unc-${Date.now()}`, text: item.text, confidence: 0.85, order: 1 }],
      requiresEvidence: false,
    };
    setScenarios([...scenarios, newScenario]);
    setNeedsReview(needsReview.filter((n) => n.text !== item.text));
  };

  // Ignore uncertain item
  const handleIgnoreUncertainItem = (item: NeedsReviewElement) => {
    setIgnoredElements([
      ...ignoredElements,
      { text: item.text, classification: 'IGNORE', reason: item.reason },
    ]);
    setNeedsReview(needsReview.filter((n) => n.text !== item.text));
  };

  // Final Confirmation
  const handleFinalConfirm = () => {
    if (scenarios.length === 0) {
      alert('Adicione pelo menos um cenário de teste antes de gerar o checklist.');
      return;
    }

    // Group scenarios by sectionTitle
    const sectionMap = new Map<string, ScenarioDraft[]>();
    scenarios.forEach((s) => {
      const sec = s.sectionTitle || 'Geral';
      if (!sectionMap.has(sec)) sectionMap.set(sec, []);
      sectionMap.get(sec)!.push(s);
    });

    const finalSections = Array.from(sectionMap.entries()).map(([title, scens]) => ({
      title,
      scenarios: scens,
    }));

    onConfirm(finalSections);
  };

  // Unique section titles list
  const sectionTitles = Array.from(new Set(scenarios.map((s) => s.sectionTitle || 'Geral')));

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-5 mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Estrutura de QA Reconstruída</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Revisão do Checklist de Auditoria
        </h2>
        <p className="text-xs text-slate-600 mt-1">
          O sistema analisou <strong>{sourceFileName || 'o documento'}</strong> para o projeto <strong>{projectName}</strong> e organizou o checklist na estrutura oficial de Quality Assurance: <strong>SEÇÃO ➔ CENÁRIO ➔ PASSOS ➔ VALIDAÇÕES</strong>.
        </p>
      </div>

      {/* Interpretation Summary Metrics Card (Etapa 44) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Resumo da Interpretação Semântica
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium">Cenários</span>
            <div className="text-xl font-black text-indigo-600 mt-0.5">{totalScenarios}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium">Validações</span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{totalAssertions}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium">Passos</span>
            <div className="text-xl font-black text-slate-800 mt-0.5">{totalSteps}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500 font-medium">Ignorados</span>
            <div className="text-xl font-black text-slate-600 mt-0.5">{ignoredElements.length}</div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-slate-500 font-medium">Revisões</span>
            <div className="text-xl font-black text-amber-600 mt-0.5">{needsReview.length}</div>
          </div>
        </div>
      </div>

      {/* Merge Action Bar (Etapa 20) */}
      {selectedScenarioIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl mb-6 flex items-center justify-between animate-fadeIn">
          <span className="text-xs font-bold text-indigo-800">
            {selectedScenarioIds.length} cenários selecionados
          </span>
          <button
            onClick={handleMergeSelected}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Layers className="w-4 h-4" />
            <span>[ JUNTAR CENÁRIOS ]</span>
          </button>
        </div>
      )}

      {/* Uncertain Interpretations Section (Etapa 17) */}
      {needsReview.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-xs uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Interpretações Incertas (Confiança &lt; 70%)</span>
          </div>
          <p className="text-xs text-amber-800 mb-3">
            Estes trechos apresentaram ambiguidades no documento. Escolha se deseja aceitar como validação ou ignorar:
          </p>
          <div className="space-y-2">
            {needsReview.map((nr, idx) => (
              <div key={idx} className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between text-xs gap-3">
                <div>
                  <span className="font-bold text-slate-900">&ldquo;{nr.text}&rdquo;</span>
                  <span className="text-[11px] text-amber-700 ml-2">
                    ({Math.round(nr.confidence * 100)}% de confiança)
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleAcceptUncertainItem(nr)}
                    className="bg-emerald-600 text-white px-2.5 py-1 rounded text-[11px] font-bold hover:bg-emerald-700"
                  >
                    Aceitar como Validação
                  </button>
                  <button
                    onClick={() => handleIgnoreUncertainItem(nr)}
                    className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-[11px] font-medium hover:bg-slate-300"
                  >
                    Ignorar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Scenarios List grouped by Section */}
      <div className="space-y-8 mb-8">
        {sectionTitles.map((sectionTitle) => {
          const sectionScenarios = scenarios.filter((s) => (s.sectionTitle || 'Geral') === sectionTitle);

          return (
            <div key={sectionTitle} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
                  SEÇÃO: {sectionTitle}
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {sectionScenarios.length} cenário{sectionScenarios.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {sectionScenarios.map((scenario) => {
                  const isSelected = selectedScenarioIds.includes(scenario.id);

                  return (
                    <div
                      key={scenario.id}
                      className={`bg-white rounded-xl border p-5 transition-all shadow-xs ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Scenario Title Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(scenario.id)}
                            className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            title="Selecionar para juntar cenários"
                          />
                          <div>
                            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                              CENÁRIO DE TESTE
                            </span>
                            <h4 className="text-base font-bold text-slate-900 leading-snug">
                              {scenario.title}
                            </h4>
                            {scenario.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{scenario.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 mr-2">
                            Confiança: {Math.round(scenario.confidence * 100)}%
                          </span>

                          <button
                            onClick={() => handleSplitScenario(scenario.id)}
                            disabled={scenario.assertions.length <= 1}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 disabled:opacity-30 rounded hover:bg-slate-100"
                            title="Separar em múltiplos cenários"
                          >
                            <Split className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDuplicateScenario(scenario)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                            title="Duplicar cenário"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteScenario(scenario.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Excluir cenário"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Scenario Steps Section */}
                      {scenario.steps.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 mb-3 text-xs">
                          <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                            Passos para execução:
                          </span>
                          <ol className="list-decimal list-inside space-y-1 text-slate-800 font-medium pl-1">
                            {scenario.steps.map((st) => (
                              <li key={st.id}>{st.text}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Scenario Assertions / Validations Section */}
                      <div className="space-y-1.5 text-xs">
                        <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                          Validações esperadas:
                        </span>
                        {scenario.assertions.map((as) => (
                          <div
                            key={as.id}
                            className="flex items-center gap-2 p-2 rounded-md bg-slate-50 border border-slate-200/60 font-semibold text-slate-800"
                          >
                            <div className="w-4 h-4 rounded border-2 border-indigo-600 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 text-indigo-600 stroke-[3]" />
                            </div>
                            <span>{as.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapsible Ignored Elements Accordion (Etapa 18) */}
      {ignoredElements.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
          <button
            onClick={() => setShowIgnored(!showIgnored)}
            className="w-full bg-slate-50 p-4 flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-slate-500" />
              ELEMENTOS IGNORADOS PELA IA ({ignoredElements.length} itens não-testáveis)
            </span>
            {showIgnored ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showIgnored && (
            <div className="p-4 bg-white divide-y divide-slate-100 space-y-2 text-xs">
              {ignoredElements.map((ig, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">&ldquo;{ig.text}&rdquo;</span>
                    <span className="text-[11px] text-slate-400 ml-2">({ig.reason})</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    {ig.classification}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors"
        >
          Voltar / Enviar outro arquivo
        </button>

        <button
          onClick={handleFinalConfirm}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Criar Checklist Oficial</span>
        </button>
      </div>
    </div>
  );
};
