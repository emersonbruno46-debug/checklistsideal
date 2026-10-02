import { Project, ChecklistTemplate, ChecklistCategory, ChecklistItem, TestRun, TestAnswer, Attachment, ParsedItem } from '@/types/database';

const LOCAL_STORAGE_KEY = 'ideal_checklists_db_v1';

interface StorageData {
  projects: Project[];
  templates: ChecklistTemplate[];
  categories: ChecklistCategory[];
  items: ChecklistItem[];
  runs: TestRun[];
  answers: Record<string, TestAnswer>; // key: `${runId}_${itemId}`
  attachments: Attachment[];
  currentUser: {
    name: string;
    email: string;
    role: 'admin' | 'employee';
  };
}

// Initial seed project: Cuidare
export const INITIAL_SEED: StorageData = {
  currentUser: {
    name: 'Bruno (Admin)',
    email: 'bruno@idealchecklists.com',
    role: 'admin',
  },
  projects: [
    {
      id: 'proj-cuidare-01',
      name: 'Cuidare',
      website_url: 'https://cuidare.com.br',
      description: 'Landing page e sistema de agendamento da Cuidare Saúde.',
      created_by: 'user-admin-01',
      created_by_name: 'Bruno',
      created_at: '2026-10-02T10:00:00.000Z',
      updated_at: '2026-10-02T10:00:00.000Z',
    },
  ],
  templates: [
    {
      id: 'tpl-cuidare-01',
      project_id: 'proj-cuidare-01',
      title: 'Checklist de Funcionalidades',
      source_file: 'checklist-cuidare.pdf',
      created_at: '2026-10-02T10:00:00.000Z',
    },
  ],
  categories: [
    { id: 'cat-nav', checklist_template_id: 'tpl-cuidare-01', name: 'Navegação', order: 1 },
    { id: 'cat-sched', checklist_template_id: 'tpl-cuidare-01', name: 'Agendamento', order: 2 },
    { id: 'cat-contact', checklist_template_id: 'tpl-cuidare-01', name: 'Contato', order: 3 },
    { id: 'cat-resp', checklist_template_id: 'tpl-cuidare-01', name: 'Responsividade', order: 4 },
  ],
  items: [
    // Navegação
    { id: 'item-1', checklist_template_id: 'tpl-cuidare-01', category_id: 'cat-nav', category_name: 'Navegação', question: 'O menu principal funciona corretamente?', order: 1, created_at: '2026-10-02T10:00:00.000Z' },
    { id: 'item-2', checklist_template_id: 'tpl-cuidare-01', category_id: 'cat-nav', category_name: 'Navegação', question: 'O menu mobile abre e fecha sem falhas?', order: 2, created_at: '2026-10-02T10:00:00.000Z' },
    { id: 'item-3', checklist_template_id: 'tpl-cuidare-01', category_id: 'cat-nav', category_name: 'Navegação', question: 'Todos os links internos direcionam para as seções corretas?', order: 3, created_at: '2026-10-02T10:00:00.000Z' },
    // Agendamento
    { id: 'item-4', checklist_template_id: 'tpl-cuidare-01', category_id: 'cat-sched', category_name: 'Agendamento', question: 'O botão "Agendar consulta" abre o fluxo de agendamento?', order: 4, created_at: '2026-10-02T10:00:00.000Z' },
    { id: 'item-5', checklist_template_id: 'tpl-cuidare-01', category_id: 'cat-sched', category_name: 'Agendamento', question: 'É possível realizar um agendamento completo?', order: 5, created_at: '2026-10-02T10:00:00.000Z' },
    { id: 'item-6', checklist_template_id: 'tpl-cuidare-01', category_id: 'cat-sched', category_name: 'Agendamento', question: 'É possível remarcar uma consulta existente?', order: 6, created_at: '2026-10-02T10:00:00.000Z' },
    { id: 'item-7', checklist_template_id: 'tpl-cuidare-01', category_id: 'cat-sched', category_name: 'Agendamento', question: 'É possível cancelar um agendamento?', order: 7, created_at: '2026-10-02T10:00:00.000Z' },
    // Contato
    { id: 'item-8', checklist_template_id: 'tpl-cuidare-01', category_id: 'cat-contact', category_name: 'Contato', question: 'O botão do WhatsApp abre a conversa corretamente?', order: 8, created_at: '2026-10-02T10:00:00.000Z' },
    { id: 'item-9', checklist_template_id: 'tpl-cuidare-01', category_id: 'cat-contact', category_name: 'Contato', question: 'O formulário de contato envia as mensagens e exibe sucesso?', order: 9, created_at: '2026-10-02T10:00:00.000Z' },
    // Responsividade
    { id: 'item-10', checklist_template_id: 'tpl-cuidare-01', category_id: 'cat-resp', category_name: 'Responsividade', question: 'O site funciona perfeitamente em telas Desktop?', order: 10, created_at: '2026-10-02T10:00:00.000Z' },
    { id: 'item-11', checklist_template_id: 'tpl-cuidare-01', category_id: 'cat-resp', category_name: 'Responsividade', question: 'O site funciona perfeitamente em dispositivos celulares (Mobile)?', order: 11, created_at: '2026-10-02T10:00:00.000Z' },
  ],
  runs: [
    {
      id: 'run-cuidare-01',
      project_id: 'proj-cuidare-01',
      checklist_template_id: 'tpl-cuidare-01',
      tester_id: 'user-admin-01',
      tester_name: 'Bruno',
      status: 'in_progress',
      started_at: '2026-10-02T10:15:00.000Z',
      created_at: '2026-10-02T10:15:00.000Z',
    },
  ],
  answers: {
    'run-cuidare-01_item-1': {
      id: 'ans-1',
      test_run_id: 'run-cuidare-01',
      checklist_item_id: 'item-1',
      result: 'yes',
      created_at: '2026-10-02T10:16:00.000Z',
      updated_at: '2026-10-02T10:16:00.000Z',
    },
    'run-cuidare-01_item-2': {
      id: 'ans-2',
      test_run_id: 'run-cuidare-01',
      checklist_item_id: 'item-2',
      result: 'caveat',
      note: 'Funciona, porém existe pequena sobreposição do menu em telas abaixo de 360px.',
      created_at: '2026-10-02T10:17:00.000Z',
      updated_at: '2026-10-02T10:17:00.000Z',
    },
    'run-cuidare-01_item-7': {
      id: 'ans-7',
      test_run_id: 'run-cuidare-01',
      checklist_item_id: 'item-7',
      result: 'no',
      note: 'Após confirmar o cancelamento, a tela fica carregando indefinidamente.',
      severity: 'high',
      created_at: '2026-10-02T10:18:00.000Z',
      updated_at: '2026-10-02T10:18:00.000Z',
    },
  },
  attachments: [],
};

export function getStorageData(): StorageData {
  if (typeof window === 'undefined') return INITIAL_SEED;
  try {
    const dataStr = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!dataStr) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SEED));
      return INITIAL_SEED;
    }
    const parsed = JSON.parse(dataStr);
    return parsed;
  } catch (e) {
    console.error('Error reading localStorage data', e);
    return INITIAL_SEED;
  }
}

export function saveStorageData(data: StorageData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving localStorage data', e);
  }
}
