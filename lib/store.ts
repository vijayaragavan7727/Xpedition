'use client';

import { updateTheta, thetaToPercent } from '@/lib/engine/mastery';

export function computeItemHash(prompt: string, options: string[]): string {
  const normPrompt = (prompt || '').trim().toLowerCase();
  const normOptions = (options || []).map((o) => (o || '').trim().toLowerCase()).join('||');
  const raw = `${normPrompt}||${normOptions}`;

  // FNV-1a 32-bit hash algorithm producing an 8-character hex string
  let hash = 0x811c9dc5;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  return `item_${hex}`;
}

export interface Attempt {
  id: string;
  conceptId: string;
  conceptName: string;
  isCorrect: boolean;
  timestamp: number;
  confidence?: 'known' | 'unsure';
  isSolo?: boolean;
  isVoid?: boolean;
  chosenIndex?: number;
  chosenText?: string;
  correctIndex?: number;
  itemHash?: string;
}

export interface DistractorStat {
  itemHash: string;
  chosenIndex: number;
  chosenText: string;
  prompt?: string;
  timesChosen: number;
  timesThisWasCorrect: number;
  firstSeen: number;
  lastSeen: number;
}

export interface ConceptMastery {
  id: string;
  name: string;
  masteryPercentage: number;
  itemsNext: number;
  retentionRisk: number; // 0 to 1 scale. >0.35 means fading
  ptsSinceCalibration: number;
  baselineTheta?: number; // Frozen starting ability from 5-item calibration
  thetaAssisted?: number;
  thetaSolo?: number; // undefined/null if < 3 attempts
  soloAttemptsCount?: number;
}

export type FlowState = 'flow' | 'bored' | 'frustrated' | 'drifting' | 'unknown';

export interface LearnerProfileData {
  name?: string;
  voiceMuted?: boolean;
  pathType: 'goal' | 'syllabus';
  topic: string;
  language: 'english' | 'tanglish' | 'tamil';
  dailyMinutes: number;
  startingLevel: string;
  whyGoal?: string;
  deadlineDate?: string;
  testDate?: string;
  syllabusText?: string;
  learningMode?: 'tutor' | 'quest' | 'read';
  currentStep?: number;
  studyPlan?: {
    totalHours: number;
    weeks: number;
    topics: { id: string; title: string; hours: number; why: string }[];
    milestones: { afterTopic: string; checkpoint: string }[];
    guidance?: string;
  };
}

export interface ActiveSessionState {
  conceptId: string;
  conceptName: string;
  currentIndex: number;
  totalLength: number;
  completedItemIds: string[];
  updatedAt: number;
  lastCompletedConceptName?: string;
}

export interface SkillGraph {
  id: string;
  goalText: string;
  createdAt: number;
  concepts: ConceptMastery[];
  quests?: any[];
  attempts: Attempt[];
  calibratedTheta?: number;
  calibrationCompletedAt?: number;
  learnerProfile?: LearnerProfileData;
  isSeededFallback?: boolean;
  activeSession?: ActiveSessionState;
  distractorStats?: DistractorStat[];
}

export interface UserStoreData {
  handle: string;
  activeGraphId: string;
  graphs: SkillGraph[];
  rewardsCount: number;
  flowState: FlowState;
  
  // Backward compatibility fields mapped to active graph
  goalText: string;
  concepts: ConceptMastery[];
  quests?: any[];
  attempts: Attempt[];
  calibratedTheta?: number;
  calibrationCompletedAt?: number;
  learnerProfile?: LearnerProfileData;
  isSeededFallback?: boolean;
  activeSession?: ActiveSessionState;
  distractorStats?: DistractorStat[];
}

export interface FeedbackRecord {
  id: string;
  rating?: number;
  body: string;
  route: string;
  createdAt: number;
}

const STORAGE_KEY = 'xpedition_user_store_v3';
const DEFAULT_GRAPH_ID = 'graph_default';

export const INITIAL_ZERO_STATE: UserStoreData = {
  handle: 'Learner',
  activeGraphId: DEFAULT_GRAPH_ID,
  graphs: [
    {
      id: DEFAULT_GRAPH_ID,
      goalText: 'Initial Skill Goal',
      createdAt: Date.now(),
      concepts: [],
      quests: [],
      attempts: [],
    },
  ],
  goalText: 'Initial Skill Goal',
  concepts: [],
  quests: [],
  attempts: [],
  rewardsCount: 0,
  flowState: 'unknown',
};

// Calculate streak: consecutive calendar days with attempts up to today
export function calculateStreak(attempts: Attempt[]): number {
  if (!attempts || attempts.length === 0) return 0;

  const daysWithAttempts = new Set<string>();
  attempts.forEach((att) => {
    const d = new Date(att.timestamp);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    daysWithAttempts.add(dateStr);
  });

  const checkDate = new Date();
  const todayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

  if (!daysWithAttempts.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (!daysWithAttempts.has(yesterdayStr)) {
      return 0;
    }
  }

  let currentStreak = 0;
  while (true) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (daysWithAttempts.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return currentStreak;
}

// Normalize store data ensuring multi-graph support and activeGraph sync
function syncActiveGraph(data: UserStoreData): UserStoreData {
  if (!data.graphs || !Array.isArray(data.graphs) || data.graphs.length === 0) {
    const fallbackGraph: SkillGraph = {
      id: DEFAULT_GRAPH_ID,
      goalText: data.goalText || 'Initial Skill Goal',
      createdAt: Date.now(),
      concepts: data.concepts || [],
      quests: data.quests || [],
      attempts: data.attempts || [],
      calibratedTheta: data.calibratedTheta,
      calibrationCompletedAt: data.calibrationCompletedAt,
      learnerProfile: data.learnerProfile,
      isSeededFallback: data.isSeededFallback,
      activeSession: data.activeSession,
    };
    data.graphs = [fallbackGraph];
    data.activeGraphId = DEFAULT_GRAPH_ID;
  }

  let active = data.graphs.find((g) => g.id === data.activeGraphId);
  if (!active) {
    active = data.graphs[0];
    data.activeGraphId = active.id;
  }

  // Sync legacy compatibility fields to active graph
  data.goalText = active.goalText;
  data.concepts = active.concepts || [];
  data.quests = active.quests || [];
  data.attempts = active.attempts || [];
  data.calibratedTheta = active.calibratedTheta;
  data.calibrationCompletedAt = active.calibrationCompletedAt;
  data.learnerProfile = active.learnerProfile;
  data.isSeededFallback = active.isSeededFallback;
  data.activeSession = active.activeSession;

  return data;
}

export function getStoreData(): UserStoreData {
  if (typeof window === 'undefined') return INITIAL_ZERO_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('xpedition_user_store_v2');
    if (!raw) return INITIAL_ZERO_STATE;
    const data = JSON.parse(raw);
    if (data.handle === 'Operator') {
      data.handle = 'Learner';
    }
    return syncActiveGraph(data);
  } catch (e) {
    return INITIAL_ZERO_STATE;
  }
}

export function saveStoreData(data: UserStoreData): void {
  if (typeof window === 'undefined') return;
  try {
    const synced = syncActiveGraph(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
  } catch (e) {
    console.error('Failed to save store data:', e);
  }
}

export function clearStoreData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('xpedition_user_store_v2');
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear();
  }
}

// Single source of truth for Next Target computation
export interface NextTargetResult {
  conceptId: string;
  conceptName: string;
  itemsRemaining: number;
  totalLength: number;
  currentIndex: number;
  masteryPercentage: number;
  reason: string;
  inProgress: boolean;
  hasAttempts: boolean;
  lastCompletedConceptName?: string;
}

export function selectNextTarget(store: UserStoreData): NextTargetResult {
  const activeGraph = store.graphs?.find((g) => g.id === store.activeGraphId) || store.graphs?.[0];
  const concepts = activeGraph?.concepts || [];
  const attempts = activeGraph?.attempts || [];
  const activeSession = activeGraph?.activeSession;

  // 1. If an in-progress session exists and has uncompleted items, return it directly
  if (activeSession && activeSession.conceptId && activeSession.currentIndex < activeSession.totalLength) {
    const concept = concepts.find((c) => c.id === activeSession.conceptId);
    const hasAtt = attempts.some((a) => a.conceptId === activeSession.conceptId);
    return {
      conceptId: activeSession.conceptId,
      conceptName: activeSession.conceptName || concept?.name || activeGraph?.goalText || 'Active Topic',
      itemsRemaining: activeSession.totalLength - activeSession.currentIndex,
      totalLength: activeSession.totalLength,
      currentIndex: activeSession.currentIndex,
      masteryPercentage: concept?.masteryPercentage ?? 0,
      reason: `Resume session in progress (${activeSession.currentIndex} of ${activeSession.totalLength} completed)`,
      inProgress: true,
      hasAttempts: hasAtt,
      lastCompletedConceptName: activeSession.lastCompletedConceptName,
    };
  }

  // 2. Otherwise find the concept with highest retention risk or lowest mastery
  if (concepts.length === 0) {
    return {
      conceptId: 'default',
      conceptName: activeGraph?.goalText || 'Starter Skill',
      itemsRemaining: 6,
      totalLength: 6,
      currentIndex: 0,
      masteryPercentage: 0,
      reason: 'Initial skill practice',
      inProgress: false,
      hasAttempts: false,
      lastCompletedConceptName: activeSession?.lastCompletedConceptName,
    };
  }

  // Priority: 1. Fading concept (risk > 0.35), 2. Lowest mastery percentage
  const sorted = [...concepts].sort((a, b) => {
    if (a.retentionRisk > 0.35 && b.retentionRisk <= 0.35) return -1;
    if (b.retentionRisk > 0.35 && a.retentionRisk <= 0.35) return 1;
    return a.masteryPercentage - b.masteryPercentage;
  });

  const target = sorted[0];
  const hasAtt = attempts.some((a) => a.conceptId === target.id);
  const itemsNeeded = Math.max(3, Math.min(6, Math.ceil((100 - target.masteryPercentage) / 15)));

  let reason = `Recommended to boost mastery from ${target.masteryPercentage}%`;
  if (target.retentionRisk > 0.35) {
    reason = `Memory fading risk (${Math.round(target.retentionRisk * 100)}%) — review needed`;
  }

  return {
    conceptId: target.id,
    conceptName: target.name,
    itemsRemaining: itemsNeeded,
    totalLength: itemsNeeded,
    currentIndex: 0,
    masteryPercentage: target.masteryPercentage,
    reason,
    inProgress: false,
    hasAttempts: hasAtt,
    lastCompletedConceptName: activeSession?.lastCompletedConceptName,
  };
}

export function saveActiveSession(sessionState: ActiveSessionState): UserStoreData {
  const current = getStoreData();
  const activeGraph = current.graphs?.find((g) => g.id === current.activeGraphId) || current.graphs?.[0];
  if (activeGraph) {
    activeGraph.activeSession = sessionState;
    saveStoreData(current);
  }
  return current;
}

export function clearActiveSession(lastCompletedConceptName?: string): UserStoreData {
  const current = getStoreData();
  const activeGraph = current.graphs?.find((g) => g.id === current.activeGraphId) || current.graphs?.[0];
  if (activeGraph) {
    activeGraph.activeSession = {
      conceptId: '',
      conceptName: '',
      currentIndex: 0,
      totalLength: 0,
      completedItemIds: [],
      updatedAt: Date.now(),
      lastCompletedConceptName,
    };
    saveStoreData(current);
  }
  return current;
}

// Switch active skill graph by ID
export function switchActiveGraph(graphId: string): UserStoreData {
  const current = getStoreData();
  const target = current.graphs.find((g) => g.id === graphId);
  if (target) {
    current.activeGraphId = graphId;
    saveStoreData(current);
  }
  return current;
}

// Create a new skill graph and set it active
export function createNewSkillGraph(goalText: string, concepts: ConceptMastery[] = [], quests: any[] = []): UserStoreData {
  const current = getStoreData();
  const newGraphId = `graph_${Date.now()}`;
  const newGraph: SkillGraph = {
    id: newGraphId,
    goalText: goalText || 'New Skill Goal',
    createdAt: Date.now(),
    concepts,
    quests,
    attempts: [],
    calibratedTheta: undefined,
    calibrationCompletedAt: undefined,
  };

  current.graphs.push(newGraph);
  current.activeGraphId = newGraphId;
  saveStoreData(current);
  return current;
}

// Set concepts and quests generated for the active graph
export function setGraphContent(
  goalText: string,
  concepts: ConceptMastery[],
  quests: any[] = [],
  isSeededFallback = false
): UserStoreData {
  const current = getStoreData();
  const activeGraph = current.graphs.find((g) => g.id === current.activeGraphId) || current.graphs[0];

  activeGraph.goalText = goalText;
  activeGraph.concepts = concepts;
  activeGraph.quests = quests;
  activeGraph.isSeededFallback = isSeededFallback;

  saveStoreData(current);
  return current;
}

export function saveLearnerProfile(profile: Partial<LearnerProfileData>): UserStoreData {
  const current = getStoreData();
  const activeGraph = current.graphs.find((g) => g.id === current.activeGraphId) || current.graphs[0];

  const updatedProfile: LearnerProfileData = {
    pathType: 'goal',
    topic: activeGraph.goalText || 'Skill Goal',
    language: 'english',
    dailyMinutes: 60,
    startingLevel: 'Complete beginner',
    ...(activeGraph.learnerProfile || {}),
    ...profile,
  };

  activeGraph.learnerProfile = updatedProfile;
  current.learnerProfile = updatedProfile;
  if (updatedProfile.topic) {
    activeGraph.goalText = updatedProfile.topic;
    current.goalText = updatedProfile.topic;
  }

  saveStoreData(current);
  return current;
}

// Seed initialization explicit fallback
export function applySeededCourse(goalText: string, seededConcepts: ConceptMastery[], seededQuests: any[]): UserStoreData {
  const current = getStoreData();
  const activeGraph = current.graphs.find((g) => g.id === current.activeGraphId) || current.graphs[0];

  activeGraph.goalText = goalText || 'Starter Python Course';
  activeGraph.isSeededFallback = true;
  activeGraph.concepts = seededConcepts.map((c) => ({
    ...c,
    baselineTheta: c.baselineTheta ?? -0.4,
  }));
  activeGraph.quests = seededQuests;
  activeGraph.calibrationCompletedAt = Date.now();

  saveStoreData(current);
  return current;
}

// Complete calibration with frozen baselineTheta on active graph
export function completeCalibration(estimatedTheta = -0.4): UserStoreData {
  const current = getStoreData();
  const activeGraph = current.graphs.find((g) => g.id === current.activeGraphId) || current.graphs[0];

  let targetConcepts = activeGraph.concepts || [];
  const initialMastery = Math.round(100 / (1 + Math.exp(-estimatedTheta)));

  activeGraph.concepts = targetConcepts.map((concept) => ({
    ...concept,
    masteryPercentage: concept.masteryPercentage || initialMastery,
    baselineTheta: estimatedTheta,
  }));

  activeGraph.calibratedTheta = estimatedTheta;
  activeGraph.calibrationCompletedAt = Date.now();

  saveStoreData(current);
  return current;
}

// Add attempt mid-session to active graph
export function recordAttempt(attempt: Attempt): UserStoreData {
  const current = getStoreData();
  const activeGraph = current.graphs.find((g) => g.id === current.activeGraphId) || current.graphs[0];

  activeGraph.attempts = [...(activeGraph.attempts || []), attempt];

  // Accumulate distractor stats (item quality telemetry)
  if (attempt.itemHash && attempt.chosenIndex !== undefined) {
    const statsList = activeGraph.distractorStats || [];
    const statIndex = statsList.findIndex(
      (s) => s.itemHash === attempt.itemHash && s.chosenIndex === attempt.chosenIndex
    );

    if (statIndex >= 0) {
      statsList[statIndex].timesChosen += 1;
      if (attempt.isCorrect) statsList[statIndex].timesThisWasCorrect += 1;
      statsList[statIndex].lastSeen = Date.now();
      if (attempt.chosenText) statsList[statIndex].chosenText = attempt.chosenText;
    } else {
      statsList.push({
        itemHash: attempt.itemHash,
        chosenIndex: attempt.chosenIndex,
        chosenText: attempt.chosenText || `Option ${attempt.chosenIndex + 1}`,
        timesChosen: 1,
        timesThisWasCorrect: attempt.isCorrect ? 1 : 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      });
    }

    activeGraph.distractorStats = statsList;
    current.distractorStats = statsList;
  }

  // Update active concept mastery
  activeGraph.concepts = (activeGraph.concepts || []).map((concept) => {
    if (concept.id === attempt.conceptId) {
      if (attempt.isVoid) {
        // Voided attempts do NOT update thetaAssisted or thetaSolo
        return concept;
      }

      if (attempt.isSolo) {
        // SOLO ATTEMPT: Update thetaSolo ONLY
        const currentSoloTheta = concept.thetaSolo ?? concept.thetaAssisted ?? -0.4;
        const newSoloTheta = updateTheta(currentSoloTheta, attempt.isCorrect);
        const newSoloCount = (concept.soloAttemptsCount || 0) + 1;

        return {
          ...concept,
          thetaSolo: newSoloTheta,
          soloAttemptsCount: newSoloCount,
        };
      } else {
        // ASSISTED ATTEMPT: Update thetaAssisted ONLY
        const currentAssistedTheta = concept.thetaAssisted ?? concept.baselineTheta ?? -0.4;
        const newAssistedTheta = updateTheta(currentAssistedTheta, attempt.isCorrect);
        const newMastery = thetaToPercent(newAssistedTheta);
        const newPts = concept.ptsSinceCalibration + (attempt.isCorrect ? 8 : 0);
        const newRisk = attempt.isCorrect ? Math.max(0.05, concept.retentionRisk - 0.15) : Math.min(0.9, concept.retentionRisk + 0.2);

        return {
          ...concept,
          thetaAssisted: newAssistedTheta,
          masteryPercentage: newMastery,
          ptsSinceCalibration: newPts,
          retentionRisk: newRisk,
        };
      }
    }
    return concept;
  });

  // Flow state determination
  let newFlowState: FlowState = current.flowState;
  const recent3 = activeGraph.attempts.slice(-3);
  const correctCount = recent3.filter((a) => a.isCorrect).length;
  if (correctCount === 3) newFlowState = 'flow';
  else if (correctCount === 0 && recent3.length === 3) newFlowState = 'frustrated';
  else if (recent3.length > 0) newFlowState = 'flow';

  current.flowState = newFlowState;
  if (attempt.isCorrect && Math.random() > 0.6) {
    current.rewardsCount += 1;
  }

  saveStoreData(current);
  return current;
}
