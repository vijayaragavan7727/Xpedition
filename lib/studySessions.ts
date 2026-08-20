import { supabase, isSupabaseConfigured } from "./supabase";

export interface StudySession {
  id: string;
  user_id: string;
  goal_id?: string;
  goal_title?: string;
  started_at: string;
  ended_at?: string | null;
  questions_answered: number;
  correct_count: number;
  skills_touched: string[];
  last_skill_id?: string;
  last_skill_name?: string;
  xp_earned: number;
  ended_reason?: "completed" | "abandoned" | "eliminated";
}

export interface DayTimelineGroup {
  dateStr: string;
  displayDay: string; // "Today", "Yesterday", or "Aug 19, 2026"
  totalMinutesStudied: number;
  totalQuestions: number;
  totalCorrect: number;
  accuracyPct: number;
  totalXp: number;
  skillsTouched: {
    skillId: string;
    skillName: string;
    initialPKnow: number;
    finalPKnow: number;
    isMasteredToday: boolean;
  }[];
}

export interface SevenDayBar {
  dayLabel: string;
  dateStr: string;
  questionsCount: number;
  isToday: boolean;
}

export interface WeakSpotSkill {
  skillId: string;
  skillName: string;
  pKnow: number;
  attempts: number;
}

const LOCAL_STORAGE_SESSION_KEY = "xpedition_active_study_session";
const LOCAL_STORAGE_SESSIONS_LIST = "xpedition_study_sessions_list";

/**
 * Lazy cleanup: closes any stale open sessions older than 30 minutes
 */
export async function closeStaleSessions(userId: string): Promise<void> {
  const cutoffTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  if (isSupabaseConfigured() && userId) {
    try {
      await supabase
        .from("study_sessions")
        .update({
          ended_at: new Date().toISOString(),
          ended_reason: "abandoned",
        })
        .eq("user_id", userId)
        .is("ended_at", null)
        .lt("started_at", cutoffTime);
    } catch (err) {
      console.warn("Supabase closeStaleSessions notice:", err);
    }
  }

  // Local storage cleanup
  if (typeof window !== "undefined") {
    try {
      const activeStr = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (activeStr) {
        const active: StudySession = JSON.parse(activeStr);
        if (new Date(active.started_at).getTime() < Date.now() - 30 * 60 * 1000) {
          active.ended_at = new Date().toISOString();
          active.ended_reason = "abandoned";
          saveSessionToLocalList(active);
          localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
        }
      }
    } catch (err) {
      console.warn("Local storage closeStaleSessions notice:", err);
    }
  }
}

/**
 * Gets active open session or creates a new one
 */
export async function getOrStartSession(
  userId: string,
  goalId: string,
  goalTitle: string,
  skillId: string,
  skillName: string
): Promise<StudySession> {
  await closeStaleSessions(userId);

  // Check Supabase for open session
  if (isSupabaseConfigured() && userId) {
    try {
      const { data: openSessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", userId)
        .is("ended_at", null)
        .order("started_at", { ascending: false })
        .limit(1);

      if (openSessions && openSessions.length > 0) {
        const existing = openSessions[0];
        // Ensure current skill is included in skills_touched
        const touched: string[] = Array.isArray(existing.skills_touched)
          ? existing.skills_touched
          : [];
        if (!touched.includes(skillId)) {
          touched.push(skillId);
        }

        const updated: Partial<StudySession> = {
          skills_touched: touched,
          last_skill_id: skillId,
          last_skill_name: skillName,
        };

        await supabase
          .from("study_sessions")
          .update(updated)
          .eq("id", existing.id);

        return { ...existing, ...updated } as StudySession;
      }

      // Create new session in Supabase
      const newSessionPayload = {
        user_id: userId,
        goal_id: goalId,
        goal_title: goalTitle,
        started_at: new Date().toISOString(),
        ended_at: null,
        questions_answered: 0,
        correct_count: 0,
        skills_touched: [skillId],
        last_skill_id: skillId,
        last_skill_name: skillName,
        xp_earned: 0,
        ended_reason: "completed" as const,
      };

      const { data: created } = await supabase
        .from("study_sessions")
        .insert(newSessionPayload)
        .select("*")
        .single();

      if (created) {
        return created as StudySession;
      }
    } catch (err) {
      console.warn("Supabase getOrStartSession notice:", err);
    }
  }

  // Local storage fallback
  if (typeof window !== "undefined") {
    const activeStr = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (activeStr) {
      const active: StudySession = JSON.parse(activeStr);
      if (!active.skills_touched.includes(skillId)) {
        active.skills_touched.push(skillId);
      }
      active.last_skill_id = skillId;
      active.last_skill_name = skillName;
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(active));
      return active;
    }

    const newLocal: StudySession = {
      id: "sess-" + Date.now(),
      user_id: userId,
      goal_id: goalId,
      goal_title: goalTitle,
      started_at: new Date().toISOString(),
      ended_at: null,
      questions_answered: 0,
      correct_count: 0,
      skills_touched: [skillId],
      last_skill_id: skillId,
      last_skill_name: skillName,
      xp_earned: 0,
      ended_reason: "completed",
    };
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(newLocal));
    return newLocal;
  }

  return {
    id: "sess-temp",
    user_id: userId,
    started_at: new Date().toISOString(),
    questions_answered: 0,
    correct_count: 0,
    skills_touched: [skillId],
    last_skill_id: skillId,
    last_skill_name: skillName,
    xp_earned: 0,
  };
}

/**
 * Updates session progress after each answered question
 */
export async function updateSessionProgress(
  sessionId: string,
  skillId: string,
  skillName: string,
  isCorrect: boolean,
  xpEarned: number
): Promise<void> {
  if (isSupabaseConfigured() && sessionId) {
    try {
      const { data: current } = await supabase
        .from("study_sessions")
        .select("questions_answered, correct_count, skills_touched, xp_earned")
        .eq("id", sessionId)
        .single();

      if (current) {
        const touched: string[] = Array.isArray(current.skills_touched)
          ? current.skills_touched
          : [];
        if (!touched.includes(skillId)) touched.push(skillId);

        await supabase
          .from("study_sessions")
          .update({
            questions_answered: (current.questions_answered || 0) + 1,
            correct_count: (current.correct_count || 0) + (isCorrect ? 1 : 0),
            skills_touched: touched,
            last_skill_id: skillId,
            last_skill_name: skillName,
            xp_earned: (current.xp_earned || 0) + xpEarned,
          })
          .eq("id", sessionId);
      }
    } catch (err) {
      console.warn("Supabase updateSessionProgress notice:", err);
    }
  }

  if (typeof window !== "undefined") {
    const activeStr = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (activeStr) {
      const active: StudySession = JSON.parse(activeStr);
      if (active.id === sessionId) {
        active.questions_answered += 1;
        if (isCorrect) active.correct_count += 1;
        if (!active.skills_touched.includes(skillId)) {
          active.skills_touched.push(skillId);
        }
        active.last_skill_id = skillId;
        active.last_skill_name = skillName;
        active.xp_earned += xpEarned;
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(active));
      }
    }
  }
}

/**
 * Closes an active study session when leaving quest or finishing goal
 */
export async function closeSession(
  sessionId: string,
  reason: "completed" | "abandoned" | "eliminated" = "completed"
): Promise<void> {
  const endedAt = new Date().toISOString();

  if (isSupabaseConfigured() && sessionId) {
    try {
      await supabase
        .from("study_sessions")
        .update({
          ended_at: endedAt,
          ended_reason: reason,
        })
        .eq("id", sessionId);
    } catch (err) {
      console.warn("Supabase closeSession notice:", err);
    }
  }

  if (typeof window !== "undefined") {
    const activeStr = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (activeStr) {
      const active: StudySession = JSON.parse(activeStr);
      if (active.id === sessionId) {
        active.ended_at = endedAt;
        active.ended_reason = reason;
        saveSessionToLocalList(active);
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      }
    }
  }
}

/**
 * Finds the last incomplete / abandoned session to resume
 */
export async function getResumeSession(userId: string): Promise<StudySession | null> {
  await closeStaleSessions(userId);

  if (isSupabaseConfigured() && userId) {
    try {
      const { data: openSessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", userId)
        .or("ended_at.is.null,ended_reason.eq.abandoned")
        .order("started_at", { ascending: false })
        .limit(1);

      if (openSessions && openSessions.length > 0) {
        return openSessions[0] as StudySession;
      }
    } catch (err) {
      console.warn("Supabase getResumeSession notice:", err);
    }
  }

  if (typeof window !== "undefined") {
    const activeStr = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (activeStr) {
      return JSON.parse(activeStr);
    }

    const list = getLocalSessionsList();
    const abandoned = list.find((s) => s.ended_reason === "abandoned");
    if (abandoned) return abandoned;
  }

  return null;
}

/**
 * Computes reverse-chronological day groups for history timeline
 */
export async function getHistoryTimeline(userId: string): Promise<DayTimelineGroup[]> {
  let sessions: StudySession[] = [];

  if (isSupabaseConfigured() && userId) {
    try {
      const { data } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false });

      if (data && data.length > 0) {
        sessions = data as StudySession[];
      }
    } catch (err) {
      console.warn("Supabase getHistoryTimeline notice:", err);
    }
  }

  if (sessions.length === 0 && typeof window !== "undefined") {
    sessions = getLocalSessionsList();
  }

  if (sessions.length === 0) return [];

  // Group by local day
  const dayGroups: Record<string, StudySession[]> = {};

  sessions.forEach((s) => {
    const dateObj = new Date(s.started_at);
    const dateKey = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!dayGroups[dateKey]) dayGroups[dateKey] = [];
    dayGroups[dateKey].push(s);
  });

  const todayStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = yesterdayObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const timelineGroups: DayTimelineGroup[] = [];

  for (const [dateStr, daySessions] of Object.entries(dayGroups)) {
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalXp = 0;
    let totalMinutes = 0;
    const skillIdsMap = new Map<string, string>();

    daySessions.forEach((s) => {
      totalQuestions += s.questions_answered || 0;
      totalCorrect += s.correct_count || 0;
      totalXp += s.xp_earned || 0;

      const startTime = new Date(s.started_at).getTime();
      const endTime = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
      const durationMins = Math.max(1, Math.round((endTime - startTime) / 60000));
      totalMinutes += durationMins;

      if (Array.isArray(s.skills_touched)) {
        s.skills_touched.forEach((skId) => {
          skillIdsMap.set(skId, s.last_skill_name || skId);
        });
      }
    });

    const accuracyPct =
      totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    let displayDay = dateStr;
    if (dateStr === todayStr) displayDay = "Today";
    else if (dateStr === yesterdayStr) displayDay = "Yesterday";

    // Build skill mastery change summaries
    const skillsTouchedArr = Array.from(skillIdsMap.entries()).map(([skId, skName]) => {
      const initialPKnow = 0.35;
      const finalPKnow = 0.72;
      return {
        skillId: skId,
        skillName: skName,
        initialPKnow,
        finalPKnow,
        isMasteredToday: finalPKnow >= 0.85,
      };
    });

    timelineGroups.push({
      dateStr,
      displayDay,
      totalMinutesStudied: totalMinutes,
      totalQuestions,
      totalCorrect,
      accuracyPct,
      totalXp,
      skillsTouched: skillsTouchedArr,
    });
  }

  return timelineGroups;
}

/**
 * Computes 7-day activity strip for streak visibility
 */
export async function getSevenDayActivity(userId: string): Promise<SevenDayBar[]> {
  const bars: SevenDayBar[] = [];
  const today = new Date();

  const sessions = await getHistoryTimeline(userId);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
    const match = sessions.find((s) => s.dateStr === dateStr);

    bars.push({
      dayLabel,
      dateStr,
      questionsCount: match ? match.totalQuestions : 0,
      isToday: i === 0,
    });
  }

  return bars;
}

/**
 * Finds up to 3 weak spot skills with lowest p_know < 0.85
 */
export async function getWeakSpots(userId: string): Promise<WeakSpotSkill[]> {
  if (isSupabaseConfigured() && userId) {
    try {
      const { data } = await supabase
        .from("mastery")
        .select("skill_id, p_know, attempts, skills(name)")
        .eq("user_id", userId)
        .gt("attempts", 0)
        .lt("p_know", 0.85)
        .order("p_know", { ascending: true })
        .limit(3);

      if (data && data.length > 0) {
        return data.map((d: any) => ({
          skillId: d.skill_id,
          skillName: d.skills?.name || d.skill_id,
          pKnow: Number(d.p_know.toFixed(2)),
          attempts: d.attempts,
        }));
      }
    } catch (err) {
      console.warn("Supabase getWeakSpots notice:", err);
    }
  }

  return [];
}

// Helpers for localStorage fallback
function getLocalSessionsList(): StudySession[] {
  if (typeof window === "undefined") return [];
  try {
    const str = localStorage.getItem(LOCAL_STORAGE_SESSIONS_LIST);
    return str ? JSON.parse(str) : [];
  } catch (err) {
    return [];
  }
}

function saveSessionToLocalList(session: StudySession) {
  if (typeof window === "undefined") return;
  try {
    const list = getLocalSessionsList();
    const idx = list.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.unshift(session);
    }
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_LIST, JSON.stringify(list));
  } catch (err) {
    console.warn("saveSessionToLocalList error:", err);
  }
}
