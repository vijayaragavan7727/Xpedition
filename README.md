# XPedition — AI-Powered Gamified Quest & Adaptive Skill Engine

XPedition is an AI-driven, gamified learning platform that turns career goals, syllabi, and coding objectives into adaptive RPG-style quest lines.

---

## 🌟 Key Features

1. **Goal Engine (Tavily + Groq AI)**:
   - Grounded open web research harvesting live sources (GeeksforGeeks, MDN, freeCodeCamp, official docs).
   - Dynamic curriculum generation with Llama-3.3-70b via Groq API.
2. **Bayesian Knowledge Tracing (BKT)**:
   - Real-time $P(\text{know})$ mastery estimation tracking acquisition, slip, guess, and transition probabilities.
3. **Hysteresis Flow Controller**:
   - Maintains learner focus in the optimal 70%–85% accuracy flow state, providing algorithmic "Why?" adaptation cards.
4. **Thompson Sampling Multi-Armed Bandit**:
   - Dynamic reward drop engine (Badges, Secret Lore, Guild Passes, Multipliers, Cosmetics) using Beta distribution sampling with 24-hour return visit signals.
5. **Spaced Repetition Memory Raids**:
   - Half-life memory decay engine scheduling concept reviews before forgetting occurs.
6. **Voice AI Tutor**:
   - Web Speech API integration (SpeechRecognition + SpeechSynthesis) providing maximum 2-sentence guidance hints without revealing direct answers.
7. **Cryptographic Skill Passport & Public Verification**:
   - Immutable passport credential snapshots signed with server-side HMAC-SHA256 and live `/api/verify/[snapshotId]` verification.
8. **Built-In A/B Research Harness**:
   - 50/50 cohort assignment (`adaptive` vs `control`), pre/post baseline test harness, measuring Hake's Normalized Gain ($g = \frac{\text{post}-\text{pre}}{\text{max}-\text{pre}}$) at `/research`.
9. **Social Layer**:
   - Guild XP aggregation, synchronized co-op boss raids with honest AI partner fallbacks (`/raid-coop`), and peer quest creation (`/teach`).
10. **Shadow Duel & Elimination Arena Modes**:
    - Backlit silhouette duel UI on high difficulty quests & 24-hour lazy tournament round lifecycle resets on `/arena`.
11. **Google Classroom Integration**:
    - OAuth scopes (`classroom.courses.readonly`, `classroom.coursework.me.readonly`) importing real coursework into Goal Engine.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables (`.env.local`)
```ini
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
PASSPORT_SIGNING_SECRET=your_hmac_secret

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to launch XPedition.

---

## 🛡️ Database Setup

Run the SQL migration script located in [`supabase/schema.sql`](file:///c:/Users/VIJAYA%20RAGAVAN/XPedition/supabase/schema.sql) in your Supabase SQL Editor to enable Row-Level Security (RLS) and create all required tables.
