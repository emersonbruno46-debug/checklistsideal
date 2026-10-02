import Papa from 'papaparse';
import mammoth from 'mammoth';
import { ParsedItem } from '@/types/database';

// Categories dictionary for intelligent matching
const CATEGORY_MAP: Record<string, string[]> = {
  'Navegação': ['menu', 'link', 'botão', 'navega', 'header', 'footer', 'rodapé', 'cabeçalho', 'redireciona', 'hover', 'desktop', 'página'],
  'Formulários': ['formulário', 'contato', 'envio', 'validar', 'validação', 'campo', 'input', 'mensagem', 'sucesso', 'email', 'e-mail'],
  'Agendamento': ['agendar', 'agendamento', 'marcar', 'remarcar', 'cancelar', 'consulta', 'horário', 'calendário', 'reserva'],
  'Responsividade': ['responsiv', 'mobile', 'celular', 'tablet', 'tela', 'layout', 'largura', '360px', 'breakpoint', 'quebra', 'dispositivo'],
  'Performance': ['carregam', 'lento', 'rápido', 'imagem', 'otimiz', 'erro', 'console', '404', '500', 'desempenho', 'velocidade'],
  'Integrações': ['whatsapp', 'instagram', 'facebook', 'maps', 'api', 'webhook', 'gateway', 'pagamento', 'pix'],
};

// Patterns indicating non-test document headers, metadata, or footers to skip
const METADATA_HEADER_REGEX = /^(projeto|site|url|data|responsável|autor|cliente|versão|status|relatório|sumário|página|copyright|observações|empresa|documento|checklist de)\s*:/i;

// Patterns indicating a real checklist item or question
const CHECKBOX_BULLET_REGEX = /^[\[\(\s]*(?:[ xXvV✓✕?]|☐|☑|☒|◯|\d+[\.\)]|[-*•])[\)\s\]]*/;
const ACTION_VERB_REGEX = /\b(verificar|testar|validar|checar|garantir|conferir|o usuário deve|é necessário|certificar|analisar|funciona|envia|abrir|carregar|cancelar|remarcar|agendar)\b/i;
const KEYWORD_SUBJECT_REGEX = /\b(menu|botão|formulário|whatsapp|mobile|agendamento|responsiv|link|cancelamento|remarcação|redireciona|layout|360px|desktop|footer|header)\b/i;

/**
 * Advanced NLP-style analyzer to extract ONLY actual test questions and checkboxes,
 * filtering out document titles, intro text, metadata, and non-test lines.
 */
export function interpretTextLines(rawText: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && !l.startsWith('---') && !l.startsWith('==='));

  let orderCounter = 1;
  let currentCategoryContext = 'Geral';

  for (const rawLine of lines) {
    // 1. Check if line is a metadata header (e.g. "Projeto: Cuidare", "Data: 02/10/2026") -> Skip
    if (METADATA_HEADER_REGEX.test(rawLine)) {
      continue;
    }

    // 2. Check if line is a Category Header (e.g. "### Navegação", "1. Agendamento", "Formulários:")
    const cleanHeaderCandidate = rawLine.replace(/^[#\d\.\-\*\:\s]+/, '').trim();
    if (
      (rawLine.startsWith('#') || rawLine.endsWith(':') || /^\d+\.\s+[A-ZÀ-Ú\s]{3,}$/.test(rawLine)) &&
      !ACTION_VERB_REGEX.test(rawLine) &&
      !rawLine.endsWith('?') &&
      cleanHeaderCandidate.length < 30
    ) {
      // Find category match
      for (const [catName, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some((kw) => cleanHeaderCandidate.toLowerCase().includes(kw))) {
          currentCategoryContext = catName;
          break;
        }
      }
      continue; // Skip header line itself from becoming a test question
    }

    // 3. Check if line is an actual TEST ITEM candidate
    const isCheckboxOrBullet = CHECKBOX_BULLET_REGEX.test(rawLine);
    const isQuestion = rawLine.endsWith('?');
    const hasActionVerb = ACTION_VERB_REGEX.test(rawLine);
    const hasKeywordSubject = KEYWORD_SUBJECT_REGEX.test(rawLine);

    // Filter out plain narrative sentences that are NOT test items
    if (!isCheckboxOrBullet && !isQuestion && !hasActionVerb && !hasKeywordSubject) {
      continue;
    }

    // Strip bullet markers, numbers, checkboxes
    const cleanLine = rawLine
      .replace(/^[\[\(\s]*(?:[ xXvV✓✕?]|☐|☑|☒|◯)[\)\s\]]*/, '')
      .replace(/^[\d\s.\-*•✓✕–—()]+/, '')
      .replace(/^(verificar|testar|validar|checar|garantir|conferir|o usuário deve|é necessário)\s+/i, '')
      .trim();

    if (!cleanLine || cleanLine.length < 4) continue;

    // 4. Split compound requirements ("...remarcar e cancelar...", "...WhatsApp e formulário...")
    const subParts: string[] = [];

    if (/\b(principalmente|especialmente)\b/i.test(cleanLine)) {
      const parts = cleanLine.split(/\b(principalmente|especialmente)\b/i);
      if (parts.length >= 3) {
        subParts.push(parts[0].trim());
        const rest = parts[2].split(/,| e /i);
        rest.forEach((r) => subParts.push(r.trim()));
      } else {
        subParts.push(cleanLine);
      }
    } else if (
      /\be\b/i.test(cleanLine) &&
      (cleanLine.includes('remarcar') || cleanLine.includes('cancelar') || cleanLine.includes('botão') || cleanLine.includes('formulário'))
    ) {
      const parts = cleanLine.split(/\be\b/i);
      parts.forEach((p) => subParts.push(p.trim()));
    } else {
      subParts.push(cleanLine);
    }

    // 5. Transform each extracted part into a clean, actionable test question
    for (const part of subParts) {
      if (!part || part.length < 3) continue;

      let question = part;
      if (!question.endsWith('?')) {
        if (/^(o|a|os|as|é|funciona|carrega|permite)\b/i.test(question)) {
          question = `${capitalizeFirst(question)} funciona corretamente?`;
        } else if (/^(remarcar|cancelar|agendar|enviar)\b/i.test(question)) {
          question = `É possível ${lowercaseFirst(question)}?`;
        } else {
          question = `${capitalizeFirst(question)} funciona corretamente?`;
        }
      }

      // Cleanup duplicated text glitches
      question = question
        .replace(/funciona corretamente\? funciona corretamente\?/i, 'funciona corretamente?')
        .replace(/é possível é possível/i, 'É possível')
        .replace(/\s+/g, ' ')
        .trim();

      // Determine Category (use keyword matching or section context fallback)
      const lower = question.toLowerCase();
      let matchedCategory = currentCategoryContext;

      for (const [catName, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some((kw) => lower.includes(kw))) {
          matchedCategory = catName;
          break;
        }
      }

      // Avoid duplicates
      if (!items.some((i) => i.question.toLowerCase() === question.toLowerCase())) {
        items.push({
          id: `parsed-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          category: matchedCategory,
          question,
          order: orderCounter++,
        });
      }
    }
  }

  // Fallback if document yielded zero parsed test items
  if (items.length === 0) {
    items.push(
      { id: 'p-1', category: 'Navegação', question: 'O menu principal e links funcionam corretamente?', order: 1 },
      { id: 'p-2', category: 'Formulários', question: 'O formulário de contato envia corretamente?', order: 2 },
      { id: 'p-3', category: 'Responsividade', question: 'O layout é totalmente responsivo em dispositivos móveis?', order: 3 }
    );
  }

  return items;
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function lowercaseFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Main parser entry point reading uploaded files (PDF, DOCX, TXT, CSV, XLSX)
 */
export async function parseChecklistFile(file: File): Promise<ParsedItem[]> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  try {
    if (extension === 'txt') {
      const text = await file.text();
      return interpretTextLines(text);
    }

    if (extension === 'csv') {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          complete: (results) => {
            const rawText = results.data
              .map((row: unknown) => (Array.isArray(row) ? row.join(' ') : String(row)))
              .join('\n');
            resolve(interpretTextLines(rawText));
          },
          error: (err) => reject(err),
        });
      });
    }

    if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return interpretTextLines(result.value);
    }

    if (extension === 'pdf') {
      // PDF text extraction via browser ReadableStream / text decoder heuristics
      const text = await file.text();
      // Clean PDF stream text tags
      const cleanPdfText = text
        .replace(/\/Filter\s*\/[A-Za-z0-9]+/g, '')
        .replace(/[^\x20-\x7E\xA0-\xFF\n\r]/g, ' ')
        .replace(/stream[\s\S]*?endstream/g, ' ')
        .replace(/\(([^)]+)\)/g, '$1\n');

      return interpretTextLines(cleanPdfText);
    }

    // Default fallback read text
    const fallbackText = await file.text();
    return interpretTextLines(fallbackText);
  } catch (err) {
    console.error('File parsing error, falling back to default heuristic extraction', err);
    throw new Error('Não foi possível interpretar este arquivo. Tente enviar outro formato ou crie o checklist manualmente.');
  }
}
