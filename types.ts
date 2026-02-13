export interface StartupQuiz {
  valueProposition: string;
  targetAudience: string;
  essentialFeatures: string;
  businessGoal: string;
}

export interface PrototypeData {
  title: string;
  code: string;
  theme: {
    primary: string;
    secondary: string;
    font: string;
  };
}

export interface Project {
  id: string;
  name: string;
  prompt: string;
  code: string;
  created_at: string;
  user_id?: string;
}

export interface SynthesisMemory {
  id?: string;
  error_pattern: string;
  solution_logic: string;
  brief_context: string;
  created_at?: string;
}

export enum AppStep {
  LANDING = 'LANDING',
  QUIZ = 'QUIZ',
  UPLOAD = 'UPLOAD',
  GENERATING = 'GENERATING',
  REPAIRING = 'REPAIRING',
  DASHBOARD = 'DASHBOARD',
  VAULT = 'VAULT',
  AUTH = 'AUTH',
  ADMIN = 'ADMIN'
}

export interface UserState {
  id?: string;
  email?: string;
  generationCount: number;
  isSubscribed: boolean;
  subscriptionExpiry: number | null;
  lastGenerationDate?: string | null;
}

export interface AuthMode {
  type: 'LOGIN' | 'SIGNUP';
}