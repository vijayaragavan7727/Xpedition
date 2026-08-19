export interface SourceItem {
  title: string;
  url: string;
  domain: string;
}

export interface Skill {
  id: string;
  name: string;
  difficulty: number; // 1 to 5
  description?: string;
  estimatedHours?: number;
  sourceUrl?: string;
}

export interface Question {
  prompt: string;
  options: [string, string, string, string] | string[];
  correctIndex: number;
  explanation?: string;
  isPeerQuest?: boolean;
  authorName?: string;
}

export interface GoalEngineResponse {
  title: string;
  skills: Skill[];
  firstQuestion: Question;
  summary?: string;
  sources?: SourceItem[];
}

export interface UserSession {
  email: string;
  name: string;
}
