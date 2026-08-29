"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { GoalEngineResponse, Question, Skill, LearningStyle, LearnerProfile } from "./types";
import { supabase, isSupabaseConfigured } from "./supabase";
import { updateMastery, predictCorrect, BKT_PARAMS } from "./bkt";
import {
  determineNextDifficulty,
  FlowState,
  FlowDecision,
  TARGET_BAND,
} from "./flowController";
import { ArmType } from "./bandit";
import { updateHalfLife, computeNextReviewAt } from "./forgetting";
import { levelFromXp } from "./progression";
import { calculateUpdatedStreak, StreakState } from "./streak";
import { CohortType, assignCohort } from "./abTesting";

export type RewardType = "+20 XP" | "Streak Bonus" | "Rare Badge Unlocked";

export interface RewardDrop {
  type: RewardType;
  arm?: ArmType;
  title: string;
  xpBonus: number;
  description: string;
  badgeName?: string;
}

export type VisualTheme = "Classic" | "Shadow Duel" | "Arena";

export interface AccessibilitySettings {
  focusMode: boolean;
  dyslexiaFriendly: boolean;
  dyslexiaFont?: boolean;
  reducedMotion: boolean;
  shadowEscapeMode?: boolean;
}

interface UserProfile {
  id?: string;
  shareId?: string;
  name: string;
  email: string;
  xp: number;
  level: number;
  streak: number;
  longestStreak: number;
  streakFreezes: number;
  lastActiveDate: string;
  timezone: string;
  motivationType: string;
  learningStyle: LearningStyle;
  styleStats?: Record<LearningStyle, { attempts: number; correct: number }>;
  cohort: CohortType;
  unlockedBadges: string[];
  profile?: LearnerProfile;
}

interface QuestContextType {
  user: UserProfile;
  isAuthLoading: boolean;
  course: GoalEngineResponse | null;
  activeSkillIndex: number;
  currentQuestion: Question | null;
  flowDifficulty: number; // 1 to 5
  pKnow: number; // P(know) Bayesian Knowledge Tracing estimate
  halfLifeHours: number;
  correctStreak: number;
  wrongStreak: number;
  goalText: string;
  flowExplanation: string;
  visualTheme: VisualTheme;
  accessibilitySettings: AccessibilitySettings;
  setVisualTheme: (theme: VisualTheme) => void;
  updateAccessibilitySettings: (newSettings: Partial<AccessibilitySettings>) => void;
  setLearningStyle: (style: LearningStyle) => Promise<void>;
  setCourseData: (course: GoalEngineResponse, goal: string) => void;
  answerQuestion: (isCorrect: boolean, latencyMs?: number, hintsUsed?: number) => void;
  claimReward: (reward: RewardDrop) => void;
  setNextQuestion: (question: Question) => void;
  setActiveSkillIndex: (index: number) => void;
  addSkillToCourse: (skillName: string) => Promise<void>;
  resetProgress: () => void;
  saveUserProfile: (updatedUser: UserProfile) => Promise<void>;
}

const DEFAULT_USER: UserProfile = {
  id: "guest-user",
  shareId: "guest-share",
  name: "Learner",
  email: "learner@xpedition.com",
  xp: 0,
  level: levelFromXp(0),
  streak: 0,
  longestStreak: 0,
  streakFreezes: 0,
  lastActiveDate: new Date().toISOString().split("T")[0],
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : "UTC",
  motivationType: "badge",
  learningStyle: "story",
  styleStats: {
    story: { attempts: 0, correct: 0 },
    theory: { attempts: 0, correct: 0 },
    code: { attempts: 0, correct: 0 },
    stepwise: { attempts: 0, correct: 0 },
  },
  cohort: "adaptive",
  unlockedBadges: [],
};

const DEFAULT_COURSE: GoalEngineResponse = {
  title: "Python Mastery for Zoho Interview Quest",
  skills: [
    { id: "p1", name: "Python Core Syntax & Data Structures", difficulty: 1 },
    { id: "p2", name: "Object-Oriented Programming (Classes & Decorators)", difficulty: 2 },
    { id: "p3", name: "Zoho Problem Solving (Arrays & String Matrices)", difficulty: 3 },
    { id: "p4", name: "Algorithms & Time Complexity (Recursion & Sorting)", difficulty: 4 },
    { id: "p5", name: "System Design & Live Practice", difficulty: 5 },
  ],
  firstQuestion: {
    prompt: "In Python, which of the following data structures is immutable and defined using parentheses?",
    options: ["List", "Tuple", "Dictionary", "Set"],
    correctIndex: 1,
  },
};

const QuestContext = createContext<QuestContextType | undefined>(undefined);

export function QuestProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [course, setCourse] = useState<GoalEngineResponse | null>(DEFAULT_COURSE);
  const [goalText, setGoalText] = useState<string>("Python basics for a Zoho job interview");
  const [activeSkillIndex, setActiveSkillIndex] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(DEFAULT_COURSE.firstQuestion);

  const [visualTheme, setVisualTheme] = useState<VisualTheme>("Classic");
  const [accessibilitySettings, setAccessibilitySettings] = useState<AccessibilitySettings>({
    focusMode: false,
    dyslexiaFriendly: false,
    reducedMotion: false,
    shadowEscapeMode: true,
  });

  const updateAccessibilitySettings = async (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...accessibilitySettings, ...newSettings };
    setAccessibilitySettings(updated);

    try {
      localStorage.setItem("xpedition_accessibility", JSON.stringify(updated));

      if (isSupabaseConfigured() && user.id) {
        await supabase
          .from("users")
          .update({ accessibility_settings: updated })
          .eq("id", user.id);
      }
    } catch (e) {
      console.warn("Failed to persist accessibility settings:", e);
    }
  };

  // BKT & Flow Controller State
  const [pKnow, setPKnow] = useState<number>(BKT_PARAMS.pKnowPrior);
  const [halfLifeHours, setHalfLifeHours] = useState<number>(0.1667); // 10 minutes initial half-life for demo reviews
  const [flowDifficulty, setFlowDifficulty] = useState<number>(2);
  const [correctStreak, setCorrectStreak] = useState<number>(0);
  const [wrongStreak, setWrongStreak] = useState<number>(0);
  const [flowExplanation, setFlowExplanation] = useState<string>(
    "Flow initialized at Level 2. Target success probability is between 70% and 85%."
  );

  const [flowState, setFlowState] = useState<FlowState>({
    currentDifficulty: 2,
    outOfBandCounter: 0,
    outOfBandDirection: "none",
    lastAccuracyHistory: [],
  });

  // Load state from Supabase / localStorage on mount
  useEffect(() => {
    async function loadInitialState() {
      try {
        if (isSupabaseConfigured()) {
          const { data: authData } = await supabase.auth.getUser();
          const currentUser = authData?.user;

          if (currentUser) {
            const userId = currentUser.id;
            const displayName =
              currentUser.user_metadata?.display_name ||
              currentUser.email?.split("@")[0] ||
              "Adventurer";

            // Fetch game_state
            const { data: stateData } = await supabase
              .from("game_state")
              .select("*")
              .eq("user_id", userId)
              .single();

            const xp = stateData?.xp ?? 140;
            const level = levelFromXp(xp);
            const streak = stateData?.streak_days ?? 3;
            const longestStreak = stateData?.longest_streak ?? 5;
            const streakFreezes = stateData?.streak_freezes ?? 1;
            const lastActiveDate = stateData?.last_active_date || new Date().toISOString().split("T")[0];

            // Fetch or generate share_id, timezone, motivation_type from users table
            let shareId = "demo-share-8842";
            let timezone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : "UTC";
            let motivationType = "badge";

            let learningStyle: LearningStyle = "story";

            const { data: userRec } = await supabase
              .from("users")
              .select("share_id, timezone, motivation_type, learning_style")
              .eq("id", userId)
              .single();

            if (userRec) {
              if (userRec.share_id) shareId = userRec.share_id;
              if (userRec.timezone) timezone = userRec.timezone;
              if (userRec.motivation_type) motivationType = userRec.motivation_type;
              if (userRec.learning_style) learningStyle = userRec.learning_style as LearningStyle;
            } else {
              shareId = crypto.randomUUID();
              await supabase.from("users").upsert({
                id: userId,
                email: currentUser.email || "adventurer@xpedition.com",
                display_name: displayName,
                share_id: shareId,
                timezone,
                motivation_type: motivationType,
                learning_style: learningStyle,
              });
            }

            const cohort = await assignCohort(userId);

            setUser({
              id: userId,
              shareId,
              name: displayName,
              email: currentUser.email || "adventurer@xpedition.com",
              xp,
              level,
              streak,
              longestStreak,
              streakFreezes,
              lastActiveDate,
              timezone,
              motivationType,
              learningStyle,
              styleStats: {
                story: { attempts: 0, correct: 0 },
                theory: { attempts: 0, correct: 0 },
                code: { attempts: 0, correct: 0 },
                stepwise: { attempts: 0, correct: 0 },
              },
              cohort,
              unlockedBadges: [],
            });

            // Fetch active goal & skills
            const { data: goalRecords } = await supabase
              .from("goals")
              .select("id, goal_text, title")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(1);

            if (goalRecords && goalRecords.length > 0) {
              const activeGoal = goalRecords[0];
              setGoalText(activeGoal.goal_text);

              const { data: skillRecords } = await supabase
                .from("skills")
                .select("id, name, difficulty, order_index")
                .eq("goal_id", activeGoal.id)
                .order("order_index", { ascending: true });

              if (skillRecords && skillRecords.length > 0) {
                const loadedSkills = skillRecords.map((s) => ({
                  id: s.id,
                  name: s.name,
                  difficulty: s.difficulty,
                }));

                setCourse((prev) => ({
                  title: activeGoal.title,
                  skills: loadedSkills,
                  firstQuestion: prev?.firstQuestion || DEFAULT_COURSE.firstQuestion,
                }));

                // Fetch mastery P(know) and half_life_hours for active skill
                const firstSkillId = loadedSkills[0]?.id;
                if (firstSkillId) {
                  const { data: masteryData } = await supabase
                    .from("mastery")
                    .select("p_know, half_life_hours")
                    .eq("user_id", userId)
                    .eq("skill_id", firstSkillId)
                    .single();

                  if (masteryData?.p_know !== undefined) {
                    setPKnow(masteryData.p_know);
                  }
                  if (masteryData?.half_life_hours !== undefined) {
                    setHalfLifeHours(masteryData.half_life_hours);
                  }
                }
              }
            }

            // Rehydrate local storage fallbacks if stored
            if (typeof window !== "undefined") {
              const localName = localStorage.getItem("xpedition_user");
              const localEmail = localStorage.getItem("xpedition_email");
              if (localName || localEmail) {
                setUser((prev) => ({
                  ...prev,
                  name: localName || prev.name,
                  email: localEmail || prev.email,
                }));
              }
            }
          } else if (typeof window !== "undefined") {
            const localName = localStorage.getItem("xpedition_user");
            const localEmail = localStorage.getItem("xpedition_email");
            if (localName || localEmail) {
              setUser((prev) => ({
                ...prev,
                name: localName || prev.name,
                email: localEmail || prev.email,
              }));
            }
          }
        } else if (typeof window !== "undefined") {
          const localName = localStorage.getItem("xpedition_user");
          const localEmail = localStorage.getItem("xpedition_email");
          if (localName || localEmail) {
            setUser((prev) => ({
              ...prev,
              name: localName || prev.name,
              email: localEmail || prev.email,
            }));
          }
        }
      } catch (err) {
        console.warn("Supabase initial load notice:", err);
      } finally {
        setIsAuthLoading(false);
      }
    }

    loadInitialState();
  }, []);

  const saveUserProfile = async (updatedUser: UserProfile) => {
    const computedLevel = levelFromXp(updatedUser.xp);
    const userWithLevel = { ...updatedUser, level: computedLevel };
    setUser(userWithLevel);

    try {
      localStorage.setItem("xpedition_user_profile", JSON.stringify(userWithLevel));

      if (isSupabaseConfigured() && userWithLevel.id) {
        await supabase.from("game_state").upsert({
          user_id: userWithLevel.id,
          xp: userWithLevel.xp,
          level: userWithLevel.level,
          streak_days: userWithLevel.streak,
          longest_streak: userWithLevel.longestStreak,
          streak_freezes: userWithLevel.streakFreezes,
          last_active_date: userWithLevel.lastActiveDate,
        });

        await supabase.from("users").upsert({
          id: userWithLevel.id,
          timezone: userWithLevel.timezone,
          motivation_type: userWithLevel.motivationType,
        });
      }
    } catch (e) {
      console.warn("Failed to persist user profile:", e);
    }
  };

  const setLearningStyle = async (style: LearningStyle) => {
    const updatedUser: UserProfile = {
      ...user,
      learningStyle: style,
    };
    setUser(updatedUser);

    try {
      localStorage.setItem("xpedition_learning_style", style);

      if (isSupabaseConfigured() && user.id) {
        await supabase
          .from("users")
          .update({ learning_style: style })
          .eq("id", user.id);
      }
    } catch (err) {
      console.warn("Failed to persist learning style:", err);
    }
  };



  const setCourseData = (newCourse: GoalEngineResponse, goal: string) => {
    setCourse(newCourse);
    setGoalText(goal);
    setActiveSkillIndex(0);
    setCurrentQuestion(newCourse.firstQuestion);
    setPKnow(BKT_PARAMS.pKnowPrior);
    setHalfLifeHours(48.0);
    setFlowDifficulty(Math.max(1, newCourse.skills[0]?.difficulty || 2));
    setCorrectStreak(0);
    setWrongStreak(0);
  };

  const answerQuestion = async (isCorrect: boolean, latencyMs: number = 2500, hintsUsed: number = 0) => {
    // Update BKT P(know)
    const newPKnow = updateMastery(pKnow, isCorrect);
    setPKnow(newPKnow);

    // Update Half-Life Spaced Repetition Memory Decay
    const newHalfLife = updateHalfLife(halfLifeHours, isCorrect);
    setHalfLifeHours(newHalfLife);
    const nextReviewAt = computeNextReviewAt(new Date(), newHalfLife);

    // Determine Next Difficulty via Hysteresis Flow Controller (or control cohort fixed level 3)
    let decision: FlowDecision = determineNextDifficulty(newPKnow, flowDifficulty, flowState, hintsUsed);

    if (user.cohort === "control") {
      decision = {
        nextDifficulty: 3,
        explanation: "Control Cohort Active: Fixed Level 3 Medium Difficulty (Flow Controller Bypassed).",
        newOutOfBandCounter: 0,
        newOutOfBandDirection: "none",
      };
    }

    setFlowDifficulty(decision.nextDifficulty);
    setFlowExplanation(decision.explanation);

    setFlowState((prev) => ({
      currentDifficulty: decision.nextDifficulty,
      outOfBandCounter: decision.newOutOfBandCounter,
      outOfBandDirection: decision.newOutOfBandDirection,
      lastAccuracyHistory: [...prev.lastAccuracyHistory.slice(-4), isCorrect],
    }));

    if (isCorrect) {
      setCorrectStreak((prev) => prev + 1);
      setWrongStreak(0);
    } else {
      setWrongStreak((prev) => prev + 1);
      setCorrectStreak(0);
    }

    // Evaluate Real Timezone Streak & Streak Freeze
    const streakResult = calculateUpdatedStreak(
      {
        streakDays: user.streak,
        longestStreak: user.longestStreak,
        streakFreezes: user.streakFreezes,
        lastActiveDate: user.lastActiveDate,
      },
      user.timezone
    );

    const updatedUser: UserProfile = {
      ...user,
      streak: streakResult.streakDays,
      longestStreak: streakResult.longestStreak,
      streakFreezes: streakResult.streakFreezes,
      lastActiveDate: streakResult.lastActiveDate,
    };

    saveUserProfile(updatedUser);

    if (isSupabaseConfigured() && user.id) {
      try {
        const currentSkill = course?.skills[activeSkillIndex];

        await supabase.from("attempts").insert({
          user_id: user.id,
          skill_id: currentSkill?.id || null,
          correct: isCorrect,
          latency_ms: latencyMs,
          difficulty: flowDifficulty,
          hints_used: hintsUsed,
        });

        if (currentSkill?.id) {
          console.log(`[Mastery DB Write] User: ${user.id}, Skill: ${currentSkill.name}, half_life_hours: ${newHalfLife}h, next_review_at: ${nextReviewAt}`);
          await supabase.from("mastery").upsert({
            user_id: user.id,
            skill_id: currentSkill.id,
            p_know: newPKnow,
            half_life_hours: newHalfLife,
            next_review_at: nextReviewAt,
            attempts: (flowState.lastAccuracyHistory.length || 0) + 1,
            last_seen_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn("Supabase attempt logging error:", err);
      }
    }
  };

  const claimReward = (reward: RewardDrop) => {
    const newXp = user.xp + reward.xpBonus;
    const newLevel = levelFromXp(newXp);
    const newBadges = [...user.unlockedBadges];

    if (reward.badgeName && !newBadges.includes(reward.badgeName)) {
      newBadges.push(reward.badgeName);
    }

    const updatedUser: UserProfile = {
      ...user,
      xp: newXp,
      level: newLevel,
      unlockedBadges: newBadges,
    };

    saveUserProfile(updatedUser);
  };

  const setNextQuestion = (question: Question) => {
    setCurrentQuestion(question);
  };

  const addSkillToCourse = async (skillName: string) => {
    const newSkillId = "skill-" + Date.now();
    const newSkill = {
      id: newSkillId,
      name: skillName,
      difficulty: 3,
    };

    setCourse((prev) => {
      if (!prev) return prev;
      if (prev.skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
        return prev;
      }
      return {
        ...prev,
        skills: [...prev.skills, newSkill],
      };
    });

    if (isSupabaseConfigured() && user.id) {
      try {
        const { data: goalRecords } = await supabase
          .from("goals")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (goalRecords && goalRecords.length > 0) {
          await supabase.from("skills").insert({
            goal_id: goalRecords[0].id,
            name: skillName,
            difficulty: 3,
            order_index: (course?.skills.length || 0) + 1,
          });
        }
      } catch (err) {
        console.warn("Error persisting added skill to Supabase:", err);
      }
    }
  };

  const resetProgress = () => {
    setCorrectStreak(0);
    setWrongStreak(0);
    setPKnow(BKT_PARAMS.pKnowPrior);
    setHalfLifeHours(48.0);
    setFlowDifficulty(2);
  };

  return (
    <QuestContext.Provider
      value={{
        user,
        isAuthLoading,
        course,
        activeSkillIndex,
        currentQuestion,
        flowDifficulty,
        pKnow,
        halfLifeHours,
        correctStreak,
        wrongStreak,
        goalText,
        flowExplanation,
        visualTheme,
        accessibilitySettings,
        setVisualTheme,
        updateAccessibilitySettings,
        setLearningStyle,
        setCourseData,
        answerQuestion,
        claimReward,
        setNextQuestion,
        setActiveSkillIndex,
        addSkillToCourse,
        resetProgress,
        saveUserProfile,
      }}
    >
      {children}
    </QuestContext.Provider>
  );
}

export function useQuest() {
  const context = useContext(QuestContext);
  if (!context) {
    throw new Error("useQuest must be used within a QuestProvider");
  }
  return context;
}
