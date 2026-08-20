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

export interface ReinforcementQuestion {
  whyItMatters: string;
  format: "true_false" | "fill_blank";
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

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
  difficulty?: number;
  sourceSection?: number;
  reinforcement?: ReinforcementQuestion;
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

export interface LearnerProfile {
  name?: string;
  currentStatus?: string;
  yearAndBranch?: string;
  learnerRating?: string;
  lastExamMarks?: string;
  learningStyle?: LearningStyle;
  dailyTime?: string;
  interests?: string[];
}

export interface UserSession {
  email: string;
  name: string;
  profile?: LearnerProfile;
}

export interface CodingExample {
  input: string;
  expectedOutput: string;
  explanation: string;
}

export interface CodingTestCase {
  input: string;
  expectedOutput: string;
  hidden?: boolean;
}

export interface CodingChallenge {
  id: string;
  title: string;
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  examples: CodingExample[];
  testCases: CodingTestCase[];
  starterCode: {
    python: string;
    java: string;
    cpp: string;
  };
  difficulty: number;
  xpReward: number;
  conceptTested: string;
}
