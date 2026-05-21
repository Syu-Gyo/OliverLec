export type Role = 'viewer' | 'admin';
export type ProgressStatus = 'in_progress' | 'completed';

export interface Profile {
  id: string;
  email: string;
  role: Role;
  display_name: string | null;
  created_at: string;
}

export interface Series {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Session {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  series_id: string | null;
  series_order: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Material {
  id: string;
  session_id: string;
  title: string;
  file_path: string;
  display_order: number;
  created_at: string;
}

export interface UserSessionProgress {
  id: string;
  user_id: string;
  session_id: string;
  status: ProgressStatus;
  started_at: string;
  completed_at: string | null;
}

export type SessionWithProgress = Session & {
  progress: UserSessionProgress | null;
};

export type QuestionType = 'rating' | 'text' | 'choice';

export interface Survey {
  id: string;
  session_id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  display_order: number;
  required: boolean;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  session_id: string;
  user_id: string;
  answers: Record<string, string | number | null>;
  submitted_at: string;
}

export interface GlossaryEntry {
  id: string;
  session_id: string;
  term: string;
  definition: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string;
}
