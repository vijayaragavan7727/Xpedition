import { Metadata } from "next";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { signPassportSnapshot } from "@/lib/cryptoSign";
import PublicPassportViewer from "@/components/PublicPassportViewer";

export const metadata: Metadata = {
  title: "XPedition Verified Skill Passport",
  description: "Verifiable adaptive learning skill passport powered by XPedition.",
};

interface SharePageProps {
  params: Promise<{ shareId: string }>;
}

export default async function PublicPassportPage({ params }: SharePageProps) {
  const resolvedParams = await params;
  const { shareId } = resolvedParams;

  let snapshot = {
    snapshotId: shareId,
    shareId,
    userName: "Learner",
    goalTitle: "Adaptive Learning Passport",
    skills: [] as { name: string; pKnow: number }[],
    overallReadiness: 0.0,
    issuedAt: new Date().toISOString(),
    signature: "",
  };

  if (isSupabaseConfigured()) {
    try {
      // 1. Check if shareId matches a row in passport_snapshots directly
      const { data: snapshotData } = await supabase
        .from("passport_snapshots")
        .select("*")
        .or(`share_id.eq.${shareId},id.eq.${shareId}`)
        .limit(1);

      if (snapshotData && snapshotData.length > 0) {
        const snap = snapshotData[0];

        // Fetch user name
        let name = "Adventurer";
        const { data: userData } = await supabase
          .from("users")
          .select("display_name, email")
          .eq("id", snap.user_id)
          .single();

        if (userData) {
          name = userData.display_name || userData.email?.split("@")[0] || "Adventurer";
        }

        snapshot = {
          snapshotId: snap.id,
          shareId: snap.share_id,
          userName: name,
          goalTitle: snap.goal_title,
          skills: Array.isArray(snap.skills_json) ? snap.skills_json : [],
          overallReadiness: snap.overall_readiness,
          issuedAt: snap.issued_at,
          signature: snap.signature,
        };
      } else {
        // Fallback: look up user by share_id and generate a fresh signed snapshot
        const { data: userData } = await supabase
          .from("users")
          .select("id, display_name, email")
          .eq("share_id", shareId)
          .single();

        if (userData) {
          snapshot.userName = userData.display_name || userData.email?.split("@")[0] || "Adventurer";
          snapshot.signature = signPassportSnapshot(
            userData.id,
            snapshot.goalTitle,
            snapshot.overallReadiness,
            snapshot.skills
          );
        }
      }
    } catch (err) {
      console.warn("Public passport snapshot query notice:", err);
    }
  }

  if (!snapshot.signature) {
    snapshot.signature = signPassportSnapshot(
      "demo-user-1",
      snapshot.goalTitle,
      snapshot.overallReadiness,
      snapshot.skills
    );
  }

  return <PublicPassportViewer snapshot={snapshot} />;
}
