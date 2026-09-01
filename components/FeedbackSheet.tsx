'use client';

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

export const FeedbackSheet: React.FC = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('feedback').insert({
          rating,
          body: body.trim(),
          route: pathname,
          created_at: new Date().toISOString(),
        });
      } else if (typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('xpedition_feedback') || '[]');
        stored.push({ rating, body: body.trim(), route: pathname, created_at: Date.now() });
        localStorage.setItem('xpedition_feedback', JSON.stringify(stored));
      }
    } catch (err) {
      console.warn('Feedback write fallback:', err);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setIsOpen(false);
        setBody('');
        setRating(null);
      }, 1200);
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[84px] lg:bottom-6 right-4 z-40 h-9 px-3.5 rounded-full bg-signature-gradient text-white font-sans font-medium text-xs shadow-[0_4px_20px_rgba(168,85,247,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <span>💬</span>
        <span>Feedback</span>
      </button>

      {/* Feedback Sheet Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-[#120E22] border border-line rounded-t-[20px] sm:rounded-[20px] p-6 space-y-4 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <span className="font-mono text-[10px] tracking-eyebrow uppercase text-cyan font-bold">
                STUDENT FEEDBACK
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted hover:text-text font-mono text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {isSubmitted ? (
              <div className="py-6 text-center text-success font-sans text-sm font-medium animate-fadeIn">
                Thanks — that helps.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1-5 Optional Rating Stars */}
                <div className="space-y-1">
                  <label className="block font-mono text-[10px] uppercase text-muted">
                    RATING (OPTIONAL)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(rating === star ? null : star)}
                        className={`w-9 h-9 rounded-lg font-mono text-xs font-bold transition-all ${
                          rating === star
                            ? 'bg-signature-gradient text-white'
                            : 'bg-raised border border-line text-muted hover:text-text'
                        }`}
                      >
                        {star}★
                      </button>
                    ))}
                  </div>
                </div>

                {/* Free Text Feedback Field */}
                <div className="space-y-1">
                  <label htmlFor="feedbackBody" className="block font-mono text-[10px] uppercase text-muted">
                    YOUR FEEDBACK
                  </label>
                  <textarea
                    id="feedbackBody"
                    rows={3}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    placeholder="What felt good? What got in your way?"
                    className="w-full p-3 rounded-[12px] bg-[#1A1430]/85 border border-white/[0.09] text-[16px] font-sans text-text placeholder:text-muted/60 focus:outline-none focus:border-cyan"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !body.trim()}
                  className="w-full h-11 rounded-[10px] bg-signature-gradient text-white font-sans font-semibold text-xs flex items-center justify-center gap-2 hover:brightness-108 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="font-mono text-xs animate-spin">⟳ Submitting...</span>
                  ) : (
                    <span>Submit Feedback</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
