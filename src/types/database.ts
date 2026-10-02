export type UserRole = 'admin' | 'employee';

export type ProjectStatus = 'not_started' | 'in_progress' | 'needs_review' | 'completed';

export type AnswerResult = 'yes' | 'no' | 'caveat' | 'unanswered';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AssertionResultStatus = 'pending' | 'passed' | 'failed' | 'caveat';

export type ClassificationCategory =
  | 'DOCUMENT_TITLE'
  | 'SECTION_TITLE'
  | 'SUBSECTION_TITLE'
  | 'TEST_SCENARIO_TITLE'
  | 'DESCRIPTION'
  | 'CONTEXT'
  | 'PRECONDITION'
  | 'ACTION_STEP'
  | 'INSTRUCTION'
  | 'EXPECTED_RESULT'
  | 'TEST_ASSERTION'
  | 'RESPONSE_OPTION'
  | 'OBSERVATION_FIELD'
  | 'DATA_INPUT_FIELD'
  | 'EVIDENCE_REQUEST'
  | 'WARNING'
  | 'FINAL_VERDICT'
  | 'METADATA'
  | 'SEPARATOR'
  | 'IGNORE'
  | 'UNKNOWN';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  website_url?: string;
  description?: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistSection {
  id: string;
  checklist_template_id: string;
  title: string;
  order: number;
}

export interface ChecklistStep {
  id: string;
  scenario_id: string;
  text: string;
  order: number;
}

export interface ChecklistAssertion {
  id: string;
  scenario_id: string;
  text: string;
  order: number;
  confidence: number;
}

export interface ChecklistScenario {
  id: string;
  checklist_template_id: string;
  section_id: string;
  section_title?: string;
  title: string;
  description?: string | null;
  confidence: number;
  order: number;
  preconditions?: string[];
  steps: ChecklistStep[];
  assertions: ChecklistAssertion[];
  instructions?: string[];
  requiresEvidence?: boolean;
  created_at: string;
}

// Legacy structures for backwards compatibility
export interface ChecklistCategory {
  id: string;
  checklist_template_id: string;
  name: string;
  order: number;
}

export interface ChecklistItem {
  id: string;
  checklist_template_id: string;
  category_id: string;
  category_name?: string;
  question: string;
  order: number;
  created_at: string;
}

export interface ChecklistTemplate {
  id: string;
  project_id: string;
  title: string;
  source_file?: string;
  created_at: string;
  sections?: ChecklistSection[];
  scenarios?: ChecklistScenario[];
  categories?: ChecklistCategory[];
  items?: ChecklistItem[];
}

export interface Attachment {
  id: string;
  test_answer_id?: string;
  scenario_result_id?: string;
  file_url: string;
  file_name?: string;
  file_type: string;
  created_at: string;
}

export interface ScenarioResult {
  id: string;
  test_run_id: string;
  scenario_id: string;
  result: AnswerResult;
  note?: string;
  severity?: IssueSeverity;
  assertion_results?: Record<string, AssertionResultStatus>; // key: assertion_id
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

export interface TestAnswer {
  id: string;
  test_run_id: string;
  checklist_item_id: string;
  result: AnswerResult;
  note?: string;
  severity?: IssueSeverity;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

export interface TestRun {
  id: string;
  project_id: string;
  checklist_template_id: string;
  tester_id: string;
  tester_name: string;
  status: ProjectStatus;
  started_at: string;
  completed_at?: string;
  created_at: string;
  scenario_results?: Record<string, ScenarioResult>; // key: scenario_id
  answers?: Record<string, TestAnswer>; // key: checklist_item_id (legacy)
}

export interface IgnoredElement {
  text: string;
  classification: ClassificationCategory;
  reason: string;
}

export interface NeedsReviewElement {
  text: string;
  probableClassification: string;
  confidence: number;
  reason: string;
}

export interface ParsedChecklistStructure {
  documentTitle?: string | null;
  sections: Array<{
    title: string;
    scenarios: Array<{
      title: string;
      description?: string | null;
      confidence: number;
      preconditions: string[];
      steps: Array<{ text: string; order: number }>;
      assertions: Array<{ text: string; confidence: number; order: number }>;
      instructions: string[];
      requiresEvidence: boolean;
    }>;
  }>;
  ignoredElements: IgnoredElement[];
  needsReview: NeedsReviewElement[];
}

export interface ParsedItem {
  id: string;
  category: string;
  question: string;
  order: number;
}
