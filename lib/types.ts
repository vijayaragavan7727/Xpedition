export type MotivationState = 'flow' | 'frustrated' | 'bored' | 'drifting' | 'unknown';

export interface Quest {
  id: string;
  conceptId: string;
  conceptName?: string;
  prompt: string;
  options: string[];
  correctIndex?: number;
  answerIndex?: number;
  explanation?: string;
  difficulty: number;
}

export interface Reward {
  id: string;
  rarity: 'common' | 'rare' | 'epic';
  label: string;
  at: number;
}
