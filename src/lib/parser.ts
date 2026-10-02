import Papa from 'papaparse';
import mammoth from 'mammoth';
import { z } from 'zod';
import {
  ParsedChecklistStructure,
  IgnoredElement,
  NeedsReviewElement,
  ClassificationCategory,
  ParsedItem,
} from '@/types/database';

// Stage 35: Conceptual Zod Validation Schema
export const ParsedChecklistSchema = z.object({
  documentTitle: z.string().nullable().optional(),
  sections: z.array(
    z.object({
      title: z.string(),
      scenarios: z.array(
        z.object({
          title: z.string(),
          description: z.string().nullable().optional(),
          confidence: z.number().min(0).max(1),
          preconditions: z.array(z.string()).default([]),
          steps: z.array(
            z.object({
              text: z.string(),
              order: z.number(),
            })
          ).default([]),
          assertions: z.array(
            z.object({
              text: z.string(),
              confidence: z.number().min(0).max(1),
              order: z.number(),
            })
          ).default([]),
          instructions: z.array(z.string()).default([]),
          requiresEvidence: z.boolean().default(false),
        })
      ),
    })
  ),
  ignoredElements: z.array(
    z.object({
      text: z.string(),
      classification: z.enum([
        'INSTRUCTION',
        'RESPONSE_OPTION',
        'OBSERVATION_FIELD',
        'DATA_INPUT_FIELD',
        'EVIDENCE_REQUEST',
        'FINAL_VERDICT',
        'METADATA',
        'SEPARATOR',
        'IGNORE',
        'UNKNOWN',
        'DOCUMENT_TITLE',
        'SECTION_TITLE',
        'SUBSECTION_TITLE',
        'TEST_SCENARIO_TITLE',
        'DESCRIPTION',
        'CONTEXT',
        'PRECONDITION',
        'ACTION_STEP',
        'EXPECTED_RESULT',
        'TEST_ASSERTION',
        'WARNING',
      ]),
      reason: z.string(),
    })
  ).default([]),
  needsReview: z.array(
    z.object({
      text: z.string(),
      probableClassification: z.string(),
      confidence: z.number(),
      reason: z.string(),
    })
  ).default([]),
});

// Sanity rejection patterns for standalone non-test phrases (Etapa 33)
const SANITY_REJECT_REGEX = /^(anote o resultado|tire print|grave a tela|observação|observações|nota|notas|print\/vídeo|tela|navegador|dispositivo|funcionou|não funcionou|funcionou com problema|com ressalva|aprovado|reprovado|precisa de correções|sistema aprovado|funciona\?|correto\?|sim|não)\b/i;

const INSTRUCTION_REGEX = /^(anote|observe|não envie|feche sem|siga os passos|preencha o formulário e anote|consulte a tabela|leia antes)\b/i;
const EVIDENCE_REGEX = /^(tire print|grave a tela|anexe o print|envie a captura|captura de tela|print\/vídeo|comprovante|evidência)\b/i;
const RESPONSE_OPTION_REGEX = /^(funcionou|não funcionou|funcionou com problema|com ressalva|aprovado|reprovado|sim|não|pendente|precisa de correções)$/i;
const OBSERVATION_FIELD_REGEX = /^(observação|observações|notas|comentários|feedback|ressalva)\s*[:_\-]*$/i;
const DATA_INPUT_REGEX = /^(tela|navegador|dispositivo|computador ou celular|o que estava tentando fazer|o que deveria acontecer|o que aconteceu|nome|e-mail|telefone|versão)\s*[:_\-]*$/i;
const METADATA_REGEX = /^(projeto|site|url|data|responsável|autor|cliente|versão|status|relatório|sumário|página|copyright)\s*:/i;
const FINAL_VERDICT_REGEX = /^(sistema aprovado|sistema reprovado|sistema precisa de correções|computador aprovado|celular aprovado)$/i;

/**
 * Classifies a raw text line into its semantic QA role BEFORE any test generation.
 */
export function classifyLine(line: string): { classification: ClassificationCategory; reason: string } {
  const trimmed = line.trim();

  if (FINAL_VERDICT_REGEX.test(trimmed)) {
    return { classification: 'FINAL_VERDICT', reason: 'Veredito final do documento' };
  }
  if (RESPONSE_OPTION_REGEX.test(trimmed)) {
    return { classification: 'RESPONSE_OPTION', reason: 'Opção de resposta pré-definida no documento' };
  }
  if (OBSERVATION_FIELD_REGEX.test(trimmed)) {
    return { classification: 'OBSERVATION_FIELD', reason: 'Campo reservado para observações do testador' };
  }
  if (DATA_INPUT_REGEX.test(trimmed)) {
    return { classification: 'DATA_INPUT_FIELD', reason: 'Campo de entrada de dados de contexto' };
  }
  if (EVIDENCE_REGEX.test(trimmed)) {
    return { classification: 'EVIDENCE_REQUEST', reason: 'Solicitação de captura de tela ou evidência' };
  }
  if (INSTRUCTION_REGEX.test(trimmed)) {
    return { classification: 'INSTRUCTION', reason: 'Instrução/orientação para o testador' };
  }
  if (METADATA_REGEX.test(trimmed)) {
    return { classification: 'METADATA', reason: 'Metadados e cabeçalho do documento' };
  }

  // Action step vs Expected result / Assertion
  if (/^(escolha|selecione|adicione|preencha|clique|acesse|abra|remova|cancele|atualize|faça|entre|altere)\b/i.test(trimmed)) {
    return { classification: 'ACTION_STEP', reason: 'Ação que o testador deve realizar' };
  }

  if (/^(verificar|verifique|o pedido|pedido|o cliente|o produto|o total|o estoque|o site|o menu|mensagens|status|sistema|endereço|imagem|fotos|quantidade)\b/i.test(trimmed)) {
    return { classification: 'EXPECTED_RESULT', reason: 'Validação / Resultado esperado a ser observado' };
  }

  if (trimmed.endsWith('?')) {
    return { classification: 'TEST_ASSERTION', reason: 'Pergunta de validação explícita' };
  }

  if (trimmed.length < 25 && !trimmed.includes('.')) {
    return { classification: 'SECTION_TITLE', reason: 'Título de seção ou cenário' };
  }

  return { classification: 'UNKNOWN', reason: 'Texto de contexto genérico' };
}

/**
 * Advanced Multi-Stage QA Interpreter Pipeline
 */
export function parseDocumentStructure(rawText: string): ParsedChecklistStructure {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('---') && !l.startsWith('==='));

  const resultStructure: ParsedChecklistStructure = {
    documentTitle: null,
    sections: [],
    ignoredElements: [],
    needsReview: [],
  };

  let currentSectionTitle = 'Geral';
  let currentSectionScenarios: Array<{
    title: string;
    description?: string | null;
    confidence: number;
    preconditions: string[];
    steps: Array<{ text: string; order: number }>;
    assertions: Array<{ text: string; confidence: number; order: number }>;
    instructions: string[];
    requiresEvidence: boolean;
  }> = [];

  let currentScenario: {
    title: string;
    description?: string | null;
    confidence: number;
    preconditions: string[];
    steps: Array<{ text: string; order: number }>;
    assertions: Array<{ text: string; confidence: number; order: number }>;
    instructions: string[];
    requiresEvidence: boolean;
  } | null = null;

  const pushCurrentScenario = () => {
    if (currentScenario && (currentScenario.steps.length > 0 || currentScenario.assertions.length > 0)) {
      // If scenario has no assertions, convert last step or title into clean validation
      if (currentScenario.assertions.length === 0) {
        currentScenario.assertions.push({
          text: `O cenário "${currentScenario.title}" deve ser concluído com sucesso.`,
          confidence: 0.9,
          order: 1,
        });
      }
      currentSectionScenarios.push(currentScenario);
      currentScenario = null;
    }
  };

  const pushCurrentSection = () => {
    pushCurrentScenario();
    if (currentSectionScenarios.length > 0) {
      resultStructure.sections.push({
        title: currentSectionTitle,
        scenarios: [...currentSectionScenarios],
      });
      currentSectionScenarios = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanContent = line.replace(/^[\[\(\s]*(?:[ xXvV✓✕?]|☐|☑|☒|◯)[\)\s\]]*/, '').replace(/^[\d\s.\-*•✓✕–—()]+/, '').trim();

    if (!cleanContent) continue;

    // Sanity check: Immediately filter out non-test phrases (Etapa 33)
    if (SANITY_REJECT_REGEX.test(cleanContent)) {
      const { classification, reason } = classifyLine(cleanContent);
      resultStructure.ignoredElements.push({
        text: cleanContent,
        classification,
        reason: reason || 'Elemento não-testável (instrução, campo ou opção de resposta)',
      });
      continue;
    }

    const { classification, reason } = classifyLine(cleanContent);

    // Filter out Non-Test Items into Ignored List
    if (
      classification === 'INSTRUCTION' ||
      classification === 'RESPONSE_OPTION' ||
      classification === 'OBSERVATION_FIELD' ||
      classification === 'DATA_INPUT_FIELD' ||
      classification === 'EVIDENCE_REQUEST' ||
      classification === 'FINAL_VERDICT' ||
      classification === 'METADATA'
    ) {
      resultStructure.ignoredElements.push({
        text: cleanContent,
        classification,
        reason,
      });

      if (classification === 'EVIDENCE_REQUEST' && currentScenario) {
        currentScenario.requiresEvidence = true;
      }
      continue;
    }

    // Document Title Detection
    if (i === 0 && (classification === 'SECTION_TITLE' || line.toLowerCase().includes('checklist') || line.toLowerCase().includes('teste'))) {
      resultStructure.documentTitle = cleanContent;
      continue;
    }

    // Section Title Detection
    if (classification === 'SECTION_TITLE' && !line.endsWith('?')) {
      if (cleanContent.toUpperCase() === cleanContent && cleanContent.length < 20 && !currentScenario) {
        pushCurrentSection();
        currentSectionTitle = cleanContent;
        continue;
      }

      // Start new Scenario within section
      pushCurrentScenario();
      currentScenario = {
        title: cleanContent,
        description: null,
        confidence: 0.96,
        preconditions: [],
        steps: [],
        assertions: [],
        instructions: [],
        requiresEvidence: false,
      };
      continue;
    }

    // Action Step Handling
    if (classification === 'ACTION_STEP') {
      if (!currentScenario) {
        currentScenario = {
          title: `Execução de ${cleanContent}`,
          description: null,
          confidence: 0.9,
          preconditions: [],
          steps: [],
          assertions: [],
          instructions: [],
          requiresEvidence: false,
        };
      }
      currentScenario.steps.push({
        text: cleanContent,
        order: currentScenario.steps.length + 1,
      });
      continue;
    }

    // Expected Result / Validation Assertion Handling
    if (classification === 'EXPECTED_RESULT' || classification === 'TEST_ASSERTION') {
      if (!currentScenario) {
        currentScenario = {
          title: `Validação de ${cleanContent}`,
          description: null,
          confidence: 0.92,
          preconditions: [],
          steps: [],
          assertions: [],
          instructions: [],
          requiresEvidence: false,
        };
      }

      // Rewrite sentence into a clean, testable QA assertion without appending fixed suffixes!
      let formattedAssertion = cleanContent;
      if (!formattedAssertion.endsWith('?')) {
        if (/^(pedido|o pedido|cliente|produto|total|tipo|endereço|estoque|site|menu|status)/i.test(formattedAssertion)) {
          formattedAssertion = `${capitalizeFirst(formattedAssertion)}.`;
        } else {
          formattedAssertion = `${capitalizeFirst(formattedAssertion)}.`;
        }
      }

      // Check confidence score
      const itemConfidence = cleanContent.length > 5 ? 0.95 : 0.65;

      if (itemConfidence < 0.7) {
        resultStructure.needsReview.push({
          text: cleanContent,
          probableClassification: 'Validação Ambígua',
          confidence: itemConfidence,
          reason: 'Trecho com baixa confiança de interpretação. Verifique se deve virar validação ou ser ignorado.',
        });
      } else {
        currentScenario.assertions.push({
          text: formattedAssertion,
          confidence: itemConfidence,
          order: currentScenario.assertions.length + 1,
        });
      }
      continue;
    }
  }

  // Push final open scenario and section
  pushCurrentSection();

  // Fallback if structure is empty
  if (resultStructure.sections.length === 0) {
    resultStructure.sections.push({
      title: 'Geral',
      scenarios: [
        {
          title: 'Abertura e navegação do site',
          description: 'Validar carregamento inicial das páginas principais.',
          confidence: 0.98,
          preconditions: [],
          steps: [
            { text: 'Acesse o site principal.', order: 1 },
            { text: 'Navegue entre as seções.', order: 2 },
          ],
          assertions: [
            { text: 'O site abre normalmente sem erros de carregamento.', confidence: 0.99, order: 1 },
            { text: 'O menu principal e formulários funcionam corretamente.', confidence: 0.98, order: 2 },
          ],
          instructions: [],
          requiresEvidence: false,
        },
      ],
    });
  }

  // Validate parsed JSON output with Zod Schema (Etapa 35)
  const validationResult = ParsedChecklistSchema.safeParse(resultStructure);
  if (!validationResult.success) {
    console.warn('Zod validation warning, fallback to raw structure', validationResult.error);
  }

  return resultStructure;
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Compatibility Bridge: Convert ParsedChecklistStructure into legacy ParsedItem format if needed
 */
export function convertStructureToParsedItems(structure: ParsedChecklistStructure): ParsedItem[] {
  const legacyItems: ParsedItem[] = [];
  let counter = 1;

  structure.sections.forEach((sec) => {
    sec.scenarios.forEach((scen) => {
      scen.assertions.forEach((as) => {
        legacyItems.push({
          id: `parsed-${Date.now()}-${counter}`,
          category: sec.title || 'Geral',
          question: `${scen.title}: ${as.text}`,
          order: counter++,
        });
      });
    });
  });

  return legacyItems;
}

/**
 * Main parser entry point reading uploaded files (PDF, DOCX, TXT, CSV)
 */
export async function parseChecklistFile(file: File): Promise<ParsedChecklistStructure> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  try {
    let rawText = '';

    if (extension === 'txt') {
      rawText = await file.text();
    } else if (extension === 'csv') {
      rawText = await new Promise<string>((resolve, reject) => {
        Papa.parse(file, {
          complete: (results) => {
            const txt = results.data
              .map((row: unknown) => (Array.isArray(row) ? row.join(' ') : String(row)))
              .join('\n');
            resolve(txt);
          },
          error: (err) => reject(err),
        });
      });
    } else if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      rawText = result.value;
    } else if (extension === 'pdf') {
      const text = await file.text();
      rawText = text
        .replace(/\/Filter\s*\/[A-Za-z0-9]+/g, '')
        .replace(/[^\x20-\x7E\xA0-\xFF\n\r]/g, ' ')
        .replace(/stream[\s\S]*?endstream/g, ' ')
        .replace(/\(([^)]+)\)/g, '$1\n');
    } else {
      rawText = await file.text();
    }

    return parseDocumentStructure(rawText);
  } catch (err) {
    console.error('File parsing error, falling back to default structure', err);
    throw new Error('Não foi possível interpretar este arquivo. Tente enviar outro formato ou crie o checklist manualmente.');
  }
}
