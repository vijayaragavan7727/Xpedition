export interface SourceItem {
  title: string;
  url: string;
  domain: string;
}

export type LearningStyle = "story" | "theory" | "code" | "stepwise";

export interface Skill {
  id: string;
  name: string;
  difficulty: number; // 1 to 5
  description?: string;
  estimatedHours?: number;
  sourceUrl?: string;
  conceptIntro?: string;
}

export type QuestionType = "concept" | "code_output" | "debug" | "scenario" | "compare";

export interface Question {
  prompt: string;
  options: [string, string, string, string] | string[];
  correctIndex: number;
  questionType?: QuestionType;
  codeSnippet?: string;
  scenarioSetup?: string;
  conceptIntro?: string;
  /** Per-option explanations: index matches options[]. Why each wrong option is wrong, why the correct one is right. */
  explanations?: string[];
  /** One-paragraph concept summary shown after answering — the core insight behind the question. */
  conceptSummary?: string;
  /** Legacy single explanation field (kept for backwards compat with peer quests) */
  explanation?: string;
  isPeerQuest?: boolean;
  authorName?: string;
}

export interface GoalEngineResponse {
  title: string;
  normalizedTopic?: string;
  isWebGrounded?: boolean;
  skills: Skill[];
  firstQuestion: Question;
  summary?: string;
  sources?: SourceItem[];
}

export interface UserSession {
  email: string;
  name: string;
}
