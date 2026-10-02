import {
  Project,
  ChecklistTemplate,
  ChecklistSection,
  ChecklistScenario,
  ScenarioResult,
  Attachment,
  ChecklistCategory,
  ChecklistItem,
  TestRun,
  TestAnswer,
} from '@/types/database';

const LOCAL_STORAGE_KEY = 'ideal_checklists_db_v2';

interface StorageData {
  projects: Project[];
  templates: ChecklistTemplate[];
  sections: ChecklistSection[];
  scenarios: ChecklistScenario[];
  runs: TestRun[];
  scenarioResults: Record<string, ScenarioResult>; // key: `${runId}_${scenarioId}`
  // Legacy fields
  categories: ChecklistCategory[];
  items: ChecklistItem[];
  answers: Record<string, TestAnswer>;
  attachments: Attachment[];
  currentUser: {
    name: string;
    email: string;
    role: 'admin' | 'employee';
  };
}

// Initial seed project: Cuidare with Scenario Architecture
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
  sections: [
    { id: 'sec-nav', checklist_template_id: 'tpl-cuidare-01', title: 'Navegação e Layout', order: 1 },
    { id: 'sec-sched', checklist_template_id: 'tpl-cuidare-01', title: 'Agendamento e Consultas', order: 2 },
    { id: 'sec-contact', checklist_template_id: 'tpl-cuidare-01', title: 'Contato e Suporte', order: 3 },
  ],
  scenarios: [
    {
      id: 'scen-1',
      checklist_template_id: 'tpl-cuidare-01',
      section_id: 'sec-nav',
      section_title: 'Navegação e Layout',
      title: 'Navegação principal e menu mobile',
      description: 'Verificar o comportamento do menu em resoluções desktop e mobile.',
      confidence: 0.98,
      order: 1,
      steps: [
        { id: 'st-1', scenario_id: 'scen-1', text: 'Acesse o site principal.', order: 1 },
        { id: 'st-2', scenario_id: 'scen-1', text: 'Redimensione para a versão mobile (<360px).', order: 2 },
        { id: 'st-3', scenario_id: 'scen-1', text: 'Clique no ícone de menu hambúrguer.', order: 3 },
      ],
      assertions: [
        { id: 'as-1', scenario_id: 'scen-1', text: 'O menu principal carrega sem erros de layout.', order: 1, confidence: 0.99 },
        { id: 'as-2', scenario_id: 'scen-1', text: 'O menu mobile abre e fecha suavemente.', order: 2, confidence: 0.97 },
        { id: 'as-3', scenario_id: 'scen-1', text: 'Os elementos do menu não se sobrepõem em telas menores que 360px.', order: 3, confidence: 0.95 },
      ],
      created_at: '2026-10-02T10:00:00.000Z',
    },
    {
      id: 'scen-2',
      checklist_template_id: 'tpl-cuidare-01',
      section_id: 'sec-sched',
      section_title: 'Agendamento e Consultas',
      title: 'Fluxo completo de agendamento de consulta',
      description: 'Testar criação, confirmação e reserva de horário.',
      confidence: 0.99,
      order: 2,
      steps: [
        { id: 'st-4', scenario_id: 'scen-2', text: 'Clique no botão "Agendar Consulta".', order: 1 },
        { id: 'st-5', scenario_id: 'scen-2', text: 'Selecione a especialidade e o horário desejado.', order: 2 },
        { id: 'st-6', scenario_id: 'scen-2', text: 'Preencha os dados de contato e confirme.', order: 3 },
      ],
      assertions: [
        { id: 'as-4', scenario_id: 'scen-2', text: 'O formulário de agendamento abre corretamente.', order: 1, confidence: 0.99 },
        { id: 'as-5', scenario_id: 'scen-2', text: 'O horário selecionado é reservado com sucesso.', order: 2, confidence: 0.98 },
        { id: 'as-6', scenario_id: 'scen-2', text: 'Mensagem de confirmação é exibida ao final do processo.', order: 3, confidence: 0.96 },
      ],
      created_at: '2026-10-02T10:00:00.000Z',
    },
    {
      id: 'scen-3',
      checklist_template_id: 'tpl-cuidare-01',
      section_id: 'sec-sched',
      section_title: 'Agendamento e Consultas',
      title: 'Cancelamento de agendamento',
      description: 'Testar o cancelamento de uma consulta previamente agendada.',
      confidence: 0.97,
      order: 3,
      steps: [
        { id: 'st-7', scenario_id: 'scen-3', text: 'Acesse a área de consultas agendadas.', order: 1 },
        { id: 'st-8', scenario_id: 'scen-3', text: 'Selecione a consulta e clique em "Cancelar Agendamento".', order: 2 },
        { id: 'st-9', scenario_id: 'scen-3', text: 'Confirme o cancelamento no modal.', order: 3 },
        { id: 'st-10', scenario_id: 'scen-3', text: 'Atualize a página.', order: 4 },
      ],
      assertions: [
        { id: 'as-7', scenario_id: 'scen-3', text: 'O agendamento muda para o status Cancelado.', order: 1, confidence: 0.98 },
        { id: 'as-8', scenario_id: 'scen-3', text: 'A consulta permanece cancelada após atualizar a página.', order: 2, confidence: 0.97 },
        { id: 'as-9', scenario_id: 'scen-3', text: 'O horário cancelado fica novamente disponível na agenda.', order: 3, confidence: 0.95 },
      ],
      created_at: '2026-10-02T10:00:00.000Z',
    },
    {
      id: 'scen-4',
      checklist_template_id: 'tpl-cuidare-01',
      section_id: 'sec-contact',
      section_title: 'Contato e Suporte',
      title: 'Integração com botão do WhatsApp e Formulário de Contato',
      description: 'Validar canais de atendimento direto.',
      confidence: 0.96,
      order: 4,
      steps: [
        { id: 'st-11', scenario_id: 'scen-4', text: 'Clique no botão flutuante do WhatsApp.', order: 1 },
        { id: 'st-12', scenario_id: 'scen-4', text: 'Preencha o formulário de contato do rodapé e envie.', order: 2 },
      ],
      assertions: [
        { id: 'as-10', scenario_id: 'scen-4', text: 'O botão do WhatsApp abre o chat oficial com mensagem pré-definida.', order: 1, confidence: 0.99 },
        { id: 'as-11', scenario_id: 'scen-4', text: 'O formulário de contato valida os campos obrigatórios.', order: 2, confidence: 0.97 },
        { id: 'as-12', scenario_id: 'scen-4', text: 'Mensagem de sucesso é exibida após o envio do formulário.', order: 3, confidence: 0.98 },
      ],
      created_at: '2026-10-02T10:00:00.000Z',
    },
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
  scenarioResults: {
    'run-cuidare-01_scen-1': {
      id: 'res-1',
      test_run_id: 'run-cuidare-01',
      scenario_id: 'scen-1',
      result: 'caveat',
      note: 'O menu funciona, porém existe pequena sobreposição em telas abaixo de 360px.',
      assertion_results: {
        'as-1': 'passed',
        'as-2': 'passed',
        'as-3': 'caveat',
      },
      created_at: '2026-10-02T10:16:00.000Z',
      updated_at: '2026-10-02T10:16:00.000Z',
    },
    'run-cuidare-01_scen-2': {
      id: 'res-2',
      test_run_id: 'run-cuidare-01',
      scenario_id: 'scen-2',
      result: 'yes',
      assertion_results: {
        'as-4': 'passed',
        'as-5': 'passed',
        'as-6': 'passed',
      },
      created_at: '2026-10-02T10:17:00.000Z',
      updated_at: '2026-10-02T10:17:00.000Z',
    },
    'run-cuidare-01_scen-3': {
      id: 'res-3',
      test_run_id: 'run-cuidare-01',
      scenario_id: 'scen-3',
      result: 'no',
      note: 'Após confirmar o cancelamento, a tela fica carregando indefinidamente e o status não é atualizado.',
      severity: 'high',
      assertion_results: {
        'as-7': 'failed',
        'as-8': 'failed',
        'as-9': 'passed',
      },
      created_at: '2026-10-02T10:18:00.000Z',
      updated_at: '2026-10-02T10:18:00.000Z',
    },
  },
  // Legacy structures initialized for compatibility
  categories: [
    { id: 'cat-nav', checklist_template_id: 'tpl-cuidare-01', name: 'Navegação', order: 1 },
    { id: 'cat-sched', checklist_template_id: 'tpl-cuidare-01', name: 'Agendamento', order: 2 },
  ],
  items: [],
  answers: {},
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
