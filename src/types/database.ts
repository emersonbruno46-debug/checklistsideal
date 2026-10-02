export type UserRole = 'admin' | 'employee';

export type ProjectStatus = 'not_started' | 'in_progress' | 'needs_review' | 'completed';

export type AnswerResult = 'yes' | 'no' | 'caveat' | 'unanswered';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

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
  categories?: ChecklistCategory[];
  items?: ChecklistItem[];
}

export interface Attachment {
  id: string;
  test_answer_id: string;
  file_url: string;
  file_name?: string;
  file_type: string;
  created_at: string;
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
  answers?: Record<string, TestAnswer>; // keyed by checklist_item_id
}

export interface ParsedItem {
  id: string;
  category: string;
  question: string;
  order: number;
}
