import { supabase, isSupabaseConfigured } from "./supabase";

export interface ArenaRound {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "active" | "closed";
}

export interface ArenaEntry {
  roundId: string;
  userId: string;
  userName: string;
  score: number;
  rank: number;
  status: "advancing" | "on_the_line" | "eliminated";
}

/**
 * Lazy round check run whenever /arena loads.
 * If current active round's ends_at has passed, closes current round,
 * ranks participants (top 50% advancing, bottom 50% eliminated), and opens a new 24h round.
 */
export async function getOrRefreshActiveRound(
  userId?: string,
  userName?: string
): Promise<{ activeRound: ArenaRound; entries: ArenaEntry[] }> {
  const now = new Date();
  const nowIso = now.toISOString();

  // Sample fallback round for local/offline demo
  const fallbackRound: ArenaRound = {
    id: "round-demo-active",
    startsAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
    status: "active",
  };

  const sampleEntries: ArenaEntry[] = [
    { roundId: "round-demo-active", userId: "u1", userName: "CyberKnight_99", score: 980, rank: 1, status: "advancing" },
    { roundId: "round-demo-active", userId: "u2", userName: "QuantumLearner", score: 850, rank: 2, status: "advancing" },
    { roundId: "round-demo-active", userId: userId || "u3", userName: userName || "You", score: 720, rank: 3, status: "advancing" },
    { roundId: "round-demo-active", userId: "u4", userName: "ByteWizard", score: 610, rank: 4, status: "on_the_line" },
    { roundId: "round-demo-active", userId: "u5", userName: "AlgoSeeker", score: 490, rank: 5, status: "eliminated" },
    { roundId: "round-demo-active", userId: "u6", userName: "CodeNeophyte", score: 320, rank: 6, status: "eliminated" },
  ];

  if (!isSupabaseConfigured()) {
    return { activeRound: fallbackRound, entries: sampleEntries };
  }

  try {
    // 1. Fetch active round
    const { data: roundData } = await supabase
      .from("arena_rounds")
      .select("*")
      .eq("status", "active")
      .order("starts_at", { ascending: false })
      .limit(1);

    let activeRoundRecord = roundData && roundData.length > 0 ? roundData[0] : null;

    // 2. Check if active round has expired (ends_at passed)
    if (activeRoundRecord && new Date(activeRoundRecord.ends_at).getTime() <= now.getTime()) {
      // Close expired round & rank entries
      const roundIdToClose = activeRoundRecord.id;

      const { data: entriesToRank } = await supabase
        .from("arena_entries")
        .select("*")
        .eq("round_id", roundIdToClose)
        .order("score", { ascending: false });

      if (entriesToRank && entriesToRank.length > 0) {
        const total = entriesToRank.length;
        const cutoff = Math.ceil(total / 2);

        for (let i = 0; i < total; i++) {
          const rank = i + 1;
          const status = rank <= cutoff ? "advancing" : "eliminated";
          await supabase
            .from("arena_entries")
            .update({ rank, status })
            .eq("round_id", roundIdToClose)
            .eq("user_id", entriesToRank[i].user_id);
        }
      }

      await supabase
        .from("arena_rounds")
        .update({ status: "closed" })
        .eq("id", roundIdToClose);

      activeRoundRecord = null;
    }

    // 3. If no active round exists, open a new 24h round
    if (!activeRoundRecord) {
      const newStartsAt = nowIso;
      const newEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const { data: createdRound } = await supabase
        .from("arena_rounds")
        .insert({
          starts_at: newStartsAt,
          ends_at: newEndsAt,
          status: "active",
        })
        .select("*")
        .single();

      activeRoundRecord = createdRound;
    }

    // 4. Fetch entries for current active round
    const { data: currentEntries } = await supabase
      .from("arena_entries")
      .select("*")
      .eq("round_id", activeRoundRecord.id)
      .order("score", { ascending: false });

    const formattedEntries: ArenaEntry[] = (currentEntries || []).map((e: any, idx: number) => ({
      roundId: e.round_id,
      userId: e.user_id,
      userName: e.user_name || "Adventurer",
      score: e.score,
      rank: idx + 1,
      status: e.status || (idx + 1 <= Math.ceil((currentEntries?.length || 1) / 2) ? "advancing" : "eliminated"),
    }));

    return {
      activeRound: {
        id: activeRoundRecord.id,
        startsAt: activeRoundRecord.starts_at,
        endsAt: activeRoundRecord.ends_at,
        status: activeRoundRecord.status,
      },
      entries: formattedEntries.length > 0 ? formattedEntries : sampleEntries,
    };
  } catch (err) {
    console.warn("Arena round lifecycle error:", err);
    return { activeRound: fallbackRound, entries: sampleEntries };
  }
}
