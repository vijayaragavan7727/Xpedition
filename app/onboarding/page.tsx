'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getStoreData, saveLearnerProfile, LearnerProfileData, applySeededCourse, createNewSkillGraph, setGraphContent } from '@/lib/store';
import { SEEDED_PYTHON_COURSE } from '@/lib/seed';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { WORLD_THEMES, WorldThemeId } from '@/lib/themes';
import WorldRenderer from '@/components/WorldRenderer';
import { Sparkles, Check, Globe, Play } from 'lucide-react';

type PathType = 'goal' | 'syllabus';
type LanguageType = 'english' | 'tanglish' | 'tamil';

export default function OnboardingPage() {
  const router = useRouter();

  // Intake State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [pathType, setPathType] = useState<PathType>('goal');
  const [topic, setTopic] = useState<string>('');
  const [language, setLanguage] = useState<LanguageType>('english');
  const [dailyMinutes, setDailyMinutes] = useState<number>(60);
  const [startingLevel, setStartingLevel] = useState<string>('Complete beginner');
  
  // Goal Path specific
  const [whyGoal, setWhyGoal] = useState<string>('Job');
  const [deadlineDate, setDeadlineDate] = useState<string>('');
  
  // Syllabus Path specific
  const [testDate, setTestDate] = useState<string>('');
  const [syllabusText, setSyllabusText] = useState<string>('');
  const [isExtractingFile, setIsExtractingFile] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Theme selection state
  const [selectedTheme, setSelectedTheme] = useState<WorldThemeId>('cosmos');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingFile(true);
    setUploadStatus(`Extracting text from ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/extract-syllabus', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.text) {
        setSyllabusText(data.text);
        setUploadStatus(`Extracted ${data.text.length} characters from ${file.name}`);
        updateProfileStep(6, { syllabusText: data.text });
      } else {
        setUploadStatus(data.error || data.warning || 'Could not extract text automatically. Please paste topics manually.');
      }
    } catch (err) {
      setUploadStatus('File processing failed. Please paste topics manually below.');
    } finally {
      setIsExtractingFile(false);
    }
  };

  // Generated Plan & Mode State
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [studyPlan, setStudyPlan] = useState<{
    totalHours: number;
    weeks: number;
    topics: { id: string; title: string; hours: number; why: string }[];
    milestones: { afterTopic: string; checkpoint: string }[];
    guidance?: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Resume step on mount
  useEffect(() => {
    const store = getStoreData();
    if (store.learnerProfile) {
      const p = store.learnerProfile;
      setPathType(p.pathType || 'goal');
      setTopic(p.topic || '');
      setLanguage(p.language || 'english');
      setDailyMinutes(p.dailyMinutes || 60);
      setStartingLevel(p.startingLevel || 'Complete beginner');
      setWhyGoal(p.whyGoal || 'Job');
      setDeadlineDate(p.deadlineDate || '');
      setTestDate(p.testDate || '');
      setSyllabusText(p.syllabusText || '');
      if (p.worldTheme) {
        setSelectedTheme(p.worldTheme);
      }
      if (p.currentStep && p.currentStep < 9) {
        setCurrentStep(p.currentStep);
      }
      if (p.studyPlan) {
        setStudyPlan(p.studyPlan);
      }
    }
  }, []);

  // Save progress step locally
  const updateProfileStep = (newStep: number, profileData?: Partial<LearnerProfileData>) => {
    setCurrentStep(newStep);
    const updated = saveLearnerProfile({
      pathType,
      topic,
      language,
      dailyMinutes,
      startingLevel,
      whyGoal,
      deadlineDate,
      testDate,
      syllabusText,
      worldTheme: selectedTheme,
      currentStep: newStep,
      studyPlan: studyPlan || undefined,
      ...profileData,
    });

    // Best-effort database sync to learner_profile table
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      client.auth.getUser().then(({ data }) => {
        if (data?.user) {
          client.from('learner_profile').upsert({
            user_id: data.user.id,
            path_type: updated.learnerProfile?.pathType,
            topic: updated.learnerProfile?.topic || 'Python Programming',
            language: updated.learnerProfile?.language,
            daily_minutes: updated.learnerProfile?.dailyMinutes,
            starting_level: updated.learnerProfile?.startingLevel,
            why_goal: updated.learnerProfile?.whyGoal,
            deadline_date: updated.learnerProfile?.deadlineDate || null,
            test_date: updated.learnerProfile?.testDate || null,
            syllabus_text: updated.learnerProfile?.syllabusText || null,
            world_theme: updated.learnerProfile?.worldTheme || selectedTheme,
            current_step: newStep,
            updated_at: new Date().toISOString(),
          }).then(() => {});
        }
      });
    }
  };

  const handleNextStep = async () => {
    const next = currentStep + 1;

    // Trigger plan generation on step 6 before rendering step 7
    if (currentStep === 6) {
      setIsGeneratingPlan(true);
      try {
        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pathType,
            topic: topic.trim() || 'Python Programming',
            language,
            dailyMinutes,
            startingLevel,
            whyGoal,
            deadlineDate,
            testDate,
            syllabusText,
          }),
        });

        if (res.ok) {
          const planData = await res.json();
          setStudyPlan(planData);
          updateProfileStep(7, { studyPlan: planData });
        } else {
          updateProfileStep(7);
        }
      } catch (err) {
        updateProfileStep(7);
      } finally {
        setIsGeneratingPlan(false);
      }
      return;
    }

    updateProfileStep(next);
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      updateProfileStep(currentStep - 1);
    }
  };

  // Final course generation and routing with chosen World Theme
  const handleBeginJourney = async () => {
    setIsSubmitting(true);
    setStatusNotice('Generating skill graph & terraforming world...');

    const finalGoalTopic = topic.trim() || 'Python Core & Data Structures';

    // Create a new skill graph object so existing graphs are never destroyed
    createNewSkillGraph(finalGoalTopic);
    saveLearnerProfile({
      learningMode: 'tutor',
      language: language as any,
      worldTheme: selectedTheme,
    });

    try {
      const res = await fetch('/api/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: finalGoalTopic }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.concepts) && Array.isArray(data.quests)) {
          const formattedConcepts = data.concepts.map((c: any) => ({
            id: c.id,
            name: c.name,
            masteryPercentage: 0,
            itemsNext: 3,
            retentionRisk: 0.0,
            ptsSinceCalibration: 0,
          }));
          setGraphContent(finalGoalTopic, formattedConcepts, data.quests, false);
        } else {
          setStatusNotice('Using starter Python path.');
          applySeededCourse(finalGoalTopic, SEEDED_PYTHON_COURSE.concepts, SEEDED_PYTHON_COURSE.items);
        }
      } else {
        setStatusNotice('Using starter Python path.');
        applySeededCourse(finalGoalTopic, SEEDED_PYTHON_COURSE.concepts, SEEDED_PYTHON_COURSE.items);
      }
    } catch (err) {
      setStatusNotice('Using starter Python path.');
      applySeededCourse(finalGoalTopic, SEEDED_PYTHON_COURSE.concepts, SEEDED_PYTHON_COURSE.items);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
        const store = getStoreData();
        const firstConceptId = store.concepts[0]?.id || 'c_1';
        router.push(`/tutor/${encodeURIComponent(firstConceptId)}`);
      }, 600);
    }
  };

  const themeList = Object.values(WORLD_THEMES);

  return (
    <div className="min-h-[100dvh] bg-ink text-text flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Background Neon Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-violet/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-[#120E22]/90 border border-line rounded-[20px] p-6 sm:p-8 backdrop-blur-xl relative z-10 space-y-6">
        
        {/* Header Action Bar with Working Back Arrow & Cancel */}
        <div className="flex items-center justify-between border-b border-line/60 pb-3.5">
          <div className="flex items-center gap-3">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="font-mono text-xs text-muted hover:text-text flex items-center gap-1 transition-colors cursor-pointer"
              >
                &larr; Back
              </button>
            ) : (
              <span className="font-mono text-[10px] tracking-eyebrow text-cyan uppercase font-bold">
                TUTOR INTAKE
              </span>
            )}
          </div>

          {/* Progress Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === currentStep
                    ? 'w-6 bg-cyan'
                    : s < currentStep
                    ? 'w-2 bg-violet font-bold'
                    : 'w-1.5 bg-line/80'
                }`}
              />
            ))}
          </div>

          <Link href="/home" className="font-mono text-xs text-muted hover:text-text transition-colors">
            Exit
          </Link>
        </div>

        {/* Status Notice Banner */}
        {statusNotice && (
          <div className="p-3 bg-cyan/15 border border-cyan/40 rounded-[10px] text-xs font-mono text-cyan text-center">
            {statusNotice}
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 0: THE FORK CHOICE (Goal vs Syllabus) */}
        {/* =================================================================== */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-1.5">
              <h1 className="font-sans font-semibold text-xl sm:text-2xl text-text">
                What brings you here today?
              </h1>
              <p className="font-sans text-xs text-muted">
                Choose the path that fits your current objective best.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* GOAL CARD */}
              <button
                type="button"
                onClick={() => {
                  setPathType('goal');
                  updateProfileStep(1, { pathType: 'goal' });
                }}
                className="bg-[#1A1430]/85 border border-white/[0.09] hover:border-violet-hot p-5 rounded-[16px] text-left transition-all hover:bg-[#1A1430] group cursor-pointer space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-violet/20 text-violet flex items-center justify-center font-mono font-bold text-lg group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-base text-text group-hover:text-violet-hot transition-colors">
                    Learning something new
                  </h3>
                  <p className="font-sans text-xs text-muted mt-1 leading-relaxed">
                    Measured in weeks or months. Build deep foundations for a job, project, or long-term skill.
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase text-cyan font-semibold block pt-1">
                  Goal Path &rarr;
                </span>
              </button>

              {/* SYLLABUS CARD */}
              <button
                type="button"
                onClick={() => {
                  setPathType('syllabus');
                  updateProfileStep(1, { pathType: 'syllabus' });
                }}
                className="bg-[#1A1430]/85 border border-white/[0.09] hover:border-cyan p-5 rounded-[16px] text-left transition-all hover:bg-[#1A1430] group cursor-pointer space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-cyan/20 text-cyan flex items-center justify-center font-mono font-bold text-lg group-hover:scale-110 transition-transform">
                  📝
                </div>
                <div>
                  <h3 className="font-sans font-semibold text-base text-text group-hover:text-cyan transition-colors">
                    Studying for a specific exam
                  </h3>
                  <p className="font-sans text-xs text-muted mt-1 leading-relaxed">
                    Measured in days or weeks. Upload or paste a fixed syllabus with a hard deadline.
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase text-violet font-semibold block pt-1">
                  Syllabus Path &rarr;
                </span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 1: TOPIC ENTRY */}
        {/* =================================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                QUESTION 1 OF 6
              </span>
              <h1 className="font-sans font-semibold text-xl text-text">
                {pathType === 'goal' ? 'What do you want to learn?' : 'What exam or subject are you preparing for?'}
              </h1>
              <p className="font-sans text-xs text-muted">
                Be as specific as possible (e.g. &ldquo;Python for Backend&rdquo; or &ldquo;Blender 3D Modeling&rdquo;).
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Python Programming, Blender 3D, SQL Database"
                className="w-full h-[52px] px-4 rounded-[12px] bg-[#1A1430]/85 border border-white/[0.09] text-[15px] font-sans text-text focus:outline-none focus:border-cyan transition-all"
                autoFocus
              />

              <button
                type="button"
                disabled={!topic.trim()}
                onClick={handleNextStep}
                className="w-full h-[50px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-108 transition-all disabled:opacity-40 cursor-pointer"
              >
                <span>Continue</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 2: LANGUAGE */}
        {/* =================================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                QUESTION 2 OF 6
              </span>
              <h1 className="font-sans font-semibold text-xl text-text">
                What language do you prefer for explanations?
              </h1>
              <p className="font-sans text-xs text-muted">
                XYRA speaks with fluent native voice and text in these languages.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'english', label: 'English', desc: 'Global technical standard' },
                { id: 'tanglish', label: 'Tanglish', desc: 'Tamil + English mix' },
                { id: 'tamil', label: 'Tamil', desc: 'Full native Tamil' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.id as LanguageType);
                    updateProfileStep(3, { language: lang.id as LanguageType });
                  }}
                  className={`p-4 rounded-[14px] border text-center transition-all cursor-pointer ${
                    language === lang.id
                      ? 'bg-cyan/20 border-cyan text-text'
                      : 'bg-[#1A1430]/85 border-white/[0.09] hover:border-line text-muted hover:text-text'
                  }`}
                >
                  <span className="font-sans font-semibold text-sm block">{lang.label}</span>
                  <span className="font-sans text-[10px] text-muted block mt-1">{lang.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: DAILY COMMITMENT */}
        {/* =================================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                QUESTION 3 OF 6
              </span>
              <h1 className="font-sans font-semibold text-xl text-text">
                How much time can you spend each day?
              </h1>
              <p className="font-sans text-xs text-muted">
                Used to calculate an honest, realistic study schedule.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { min: 30, label: '30 mins', badge: 'Micro' },
                { min: 60, label: '1 hour', badge: 'Standard' },
                { min: 120, label: '2 hours', badge: 'Intensive' },
                { min: 180, label: '3+ hours', badge: 'Immersive' },
              ].map((item) => (
                <button
                  key={item.min}
                  type="button"
                  onClick={() => {
                    setDailyMinutes(item.min);
                    updateProfileStep(4, { dailyMinutes: item.min });
                  }}
                  className={`p-4 rounded-[14px] border text-center transition-all cursor-pointer ${
                    dailyMinutes === item.min
                      ? 'bg-violet/20 border-violet-hot text-text'
                      : 'bg-[#1A1430]/85 border-white/[0.09] hover:border-line text-muted hover:text-text'
                  }`}
                >
                  <span className="font-mono text-[10px] uppercase text-violet font-semibold block mb-1">
                    {item.badge}
                  </span>
                  <span className="font-sans font-bold text-base block">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 4: STARTING LEVEL */}
        {/* =================================================================== */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                QUESTION 4 OF 6
              </span>
              <h1 className="font-sans font-semibold text-xl text-text">
                Where are you starting from?
              </h1>
              <p className="font-sans text-xs text-muted">
                We calibrate difficulty to avoid boring you with basics or overwhelming you.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { title: 'Complete beginner', desc: 'Starting from scratch, never touched this before.' },
                { title: 'Some familiarity', desc: 'Know high-level terms, but haven\'t built or practiced much.' },
                { title: 'Working knowledge', desc: 'Used it before, want to master edge-cases and go deep.' },
              ].map((lvl) => (
                <button
                  key={lvl.title}
                  type="button"
                  onClick={() => {
                    setStartingLevel(lvl.title);
                    updateProfileStep(5, { startingLevel: lvl.title });
                  }}
                  className={`w-full p-4 rounded-[14px] border text-left transition-all cursor-pointer ${
                    startingLevel === lvl.title
                      ? 'bg-cyan/15 border-cyan text-text'
                      : 'bg-[#1A1430]/85 border-white/[0.09] hover:border-line text-muted hover:text-text'
                  }`}
                >
                  <span className="font-sans font-semibold text-sm block text-text">{lvl.title}</span>
                  <span className="font-sans text-xs text-muted block mt-0.5">{lvl.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 5: WHY GOAL */}
        {/* =================================================================== */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-1">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                QUESTION 5 OF 6
              </span>
              <h1 className="font-sans font-semibold text-xl text-text">
                Why are you learning this?
              </h1>
              <p className="font-sans text-xs text-muted">
                Helps XYRA tailor examples and analogies to your real context.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Job / Placement', desc: 'Preparing for interviews' },
                { label: 'College Exam', desc: 'Passing university tests' },
                { label: 'Building a Project', desc: 'Shipping a real app' },
                { label: 'Curiosity & Fun', desc: 'Exploring for fun' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setWhyGoal(item.label);
                    updateProfileStep(6, { whyGoal: item.label });
                  }}
                  className={`p-4 rounded-[14px] border text-left transition-all cursor-pointer ${
                    whyGoal === item.label
                      ? 'bg-violet/20 border-violet-hot text-text'
                      : 'bg-[#1A1430]/85 border-white/[0.09] hover:border-line text-muted hover:text-text'
                  }`}
                >
                  <span className="font-sans font-semibold text-sm block text-text">{item.label}</span>
                  <span className="font-sans text-xs text-muted block mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 6: DEADLINE OR SYLLABUS UPLOAD */}
        {/* =================================================================== */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-fadeIn">
            {pathType === 'goal' ? (
              <>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                    QUESTION 6 OF 6
                  </span>
                  <h1 className="font-sans font-semibold text-xl text-text">
                    Do you have a target deadline in mind?
                  </h1>
                  <p className="font-sans text-xs text-muted">
                    Optional — helps us pace your daily milestones.
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="w-full h-[52px] px-4 rounded-[12px] bg-[#1A1430]/85 border border-white/[0.09] text-[15px] font-sans text-text focus:outline-none focus:border-cyan"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeadlineDate('');
                        handleNextStep();
                      }}
                      className="flex-1 h-[48px] rounded-[12px] bg-panel border border-line text-muted hover:text-text font-sans font-medium text-xs transition-colors cursor-pointer"
                    >
                      No strict deadline
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 h-[48px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center gap-1 hover:brightness-108 transition-all cursor-pointer"
                    >
                      <span>Continue &rarr;</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                    QUESTION 6 OF 6 (SYLLABUS PATH)
                  </span>
                  <h1 className="font-sans font-semibold text-xl text-text">
                    What is on the test?
                  </h1>
                  <p className="font-sans text-xs text-muted">
                    Paste topics manually OR upload a syllabus document.
                  </p>
                </div>

                <div className="bg-[#1A1430]/60 border border-dashed border-line/80 p-3.5 rounded-[12px] flex items-center justify-between gap-3">
                  <div className="text-xs font-sans text-muted">
                    {uploadStatus ? (
                      <span className="text-cyan font-mono">{uploadStatus}</span>
                    ) : (
                      <span>Upload document (PDF, DOCX, JPG, PNG &le; 5MB)</span>
                    )}
                  </div>

                  <label className="h-8 px-3 rounded-[8px] bg-raised border border-line text-xs font-sans text-text font-medium hover:border-cyan transition-colors cursor-pointer shrink-0 flex items-center gap-1">
                    <span>{isExtractingFile ? 'Extracting...' : '📄 Upload File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.txt"
                      disabled={isExtractingFile}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <textarea
                  rows={4}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  className="w-full p-3.5 rounded-[12px] bg-[#1A1430]/85 border border-white/[0.09] text-[15px] font-sans text-text focus:outline-none focus:border-cyan"
                  placeholder="e.g. Unit 1: Arrays, Unit 2: Stack & Queue, Unit 3: Tree traversals"
                />

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-[50px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-108 transition-all cursor-pointer"
                >
                  <span>Generate Exam Plan</span>
                  <span>&rarr;</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 7: STUDY PLAN */}
        {/* =================================================================== */}
        {currentStep === 7 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-1 border-b border-line/60 pb-3">
              <span className="font-mono text-[10px] uppercase text-cyan font-bold tracking-eyebrow">
                PERSONALIZED STUDY ESTIMATE
              </span>
              <h1 className="font-sans font-semibold text-xl text-text">
                Your Learning Roadmap
              </h1>
            </div>

            {isGeneratingPlan ? (
              <div className="py-12 text-center space-y-3">
                <div className="font-mono text-sm text-cyan animate-pulse">
                  ⟳ Calculating realistic timeline with Groq...
                </div>
                <p className="font-sans text-xs text-muted">
                  Grounding estimates in your pace of {dailyMinutes} mins/day
                </p>
              </div>
            ) : studyPlan ? (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {studyPlan.guidance && (
                  <div className="p-3.5 bg-violet/15 border border-violet/30 rounded-[12px] font-sans text-xs text-text/90 leading-relaxed">
                    💡 <span className="font-semibold text-violet-hot">Honest Estimate:</span> {studyPlan.guidance}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#150F2A] p-3 rounded-[12px] text-center">
                    <span className="block font-mono text-[9px] uppercase text-muted">TOTAL HOURS</span>
                    <span className="block font-mono text-xl font-bold text-cyan">{studyPlan.totalHours} hrs</span>
                  </div>
                  <div className="bg-[#150F2A] p-3 rounded-[12px] text-center">
                    <span className="block font-mono text-[9px] uppercase text-muted">ESTIMATED WEEKS</span>
                    <span className="block font-mono text-xl font-bold text-violet">{studyPlan.weeks} weeks</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-[10px] tracking-eyebrow uppercase text-muted font-bold block">
                    RECOMMENDED TOPICS
                  </span>

                  {studyPlan.topics.map((t) => (
                    <div key={t.id} className="bg-[#150F2A] p-3.5 rounded-[12px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-medium text-sm text-text">{t.title}</span>
                        <span className="font-mono text-xs text-cyan font-bold">{t.hours} hrs</span>
                      </div>
                      <p className="font-sans text-xs text-muted leading-snug">{t.why}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => updateProfileStep(8)}
                  className="w-full h-[50px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center gap-2 hover:brightness-108 transition-all cursor-pointer mt-2 shadow-lg"
                >
                  <span>Choose Your World Theme</span>
                  <span>&rarr;</span>
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 8: CHOOSE YOUR WORLD THEME */}
        {/* =================================================================== */}
        {currentStep === 8 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF] font-mono text-[10px] font-bold">
                <Globe className="w-3 h-3" />
                <span>SKILL PASSPORT TERRAFORMING</span>
              </div>
              <h1 className="font-sans font-bold text-2xl text-white">
                Choose Your World
              </h1>
              <p className="font-sans text-xs text-slate-400 max-w-md mx-auto">
                Your knowledge will terraform this living world as you master concepts.
              </p>
            </div>

            {/* 5 Theme Cards Grid (2-column, 5th centered) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {themeList.map((t, idx) => {
                const isSelected = selectedTheme === t.id;
                const isFifth = idx === 4;

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(t.id);
                      saveLearnerProfile({ worldTheme: t.id });
                    }}
                    className={`p-3.5 rounded-[16px] text-left transition-all cursor-pointer border flex items-start gap-3 relative ${
                      isFifth ? 'sm:col-span-2 sm:max-w-[280px] sm:mx-auto w-full' : ''
                    } ${
                      isSelected
                        ? 'bg-[#00F0FF]/15 border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)] ring-1 ring-[#00F0FF]'
                        : 'bg-[#150F2A]/90 border-white/10 hover:border-white/25 hover:bg-[#1A1430]'
                    }`}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-md border border-white/15"
                      style={{
                        background: `linear-gradient(135deg, ${t.bgGradients[2]} 0%, ${t.bgGradients[0]} 100%)`,
                      }}
                    >
                      {t.icon}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-bold text-sm text-white truncate">
                          {t.name}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#00F0FF] text-black flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-[11px] text-slate-300 line-clamp-2 leading-tight">
                        {t.subtitle}
                      </p>
                      <span className="font-mono text-[9px] text-slate-400 block pt-0.5 truncate">
                        {t.bestFor}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next: World Introduction CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => updateProfileStep(9)}
                className="w-full h-12 rounded-[14px] bg-signature-gradient text-white font-sans font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-[0_8px_30px_-6px_rgba(168,85,247,0.6)]"
              >
                <span>Continue to Your World</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 9: WORLD INTRODUCTION (YOUR WORLD BEGINS HERE) */}
        {/* =================================================================== */}
        {currentStep === 9 && (
          <div className="space-y-5 animate-fadeIn text-center">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00FF87]/15 border border-[#00FF87]/40 text-[#00FF87] font-mono text-[10px] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>EMPTY DOMAIN READY</span>
              </div>
              <h1 className="font-sans font-black text-2xl sm:text-3xl text-white tracking-tight">
                Your world begins here.
              </h1>
            </div>

            {/* Empty WorldRenderer Preview */}
            <div className="rounded-2xl overflow-hidden border border-white/15 shadow-xl">
              <WorldRenderer
                theme={selectedTheme}
                buildings={[]}
                height={180}
                isMiniPreview
              />
            </div>

            <p className="font-sans text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Every lesson you complete builds something new. This empty land is yours. Let&apos;s start filling it.
            </p>

            {/* Begin Learning CTA */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleBeginJourney}
                className="w-full h-13 rounded-2xl bg-signature-gradient text-white font-sans font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer shadow-[0_8px_30px_-6px_rgba(168,85,247,0.6)] disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isSubmitting ? 'Terraforming World...' : 'Begin Learning →'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
