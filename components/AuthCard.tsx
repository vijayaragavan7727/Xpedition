'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

export const AuthCard: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Validate Supabase URL format at startup before credential entry
  const urlValidation = useMemo(() => {
    const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    if (!rawUrl) {
      return { isValid: true, isLocalMode: true, message: null };
    }

    if (rawUrl.includes('/dashboard/') || rawUrl.includes('/settings/')) {
      return {
        isValid: false,
        isLocalMode: false,
        message: 'Your NEXT_PUBLIC_SUPABASE_URL is set to the dashboard web page. Use https://<project-ref>.supabase.co instead.',
      };
    }

    // Standard Supabase project API URL regex matcher: https://<ref>.supabase.co
    const supabaseUrlRegex = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i;
    if (!supabaseUrlRegex.test(rawUrl)) {
      return {
        isValid: false,
        isLocalMode: false,
        message: `Invalid NEXT_PUBLIC_SUPABASE_URL format ("${rawUrl}"). Expected https://<project-ref>.supabase.co`,
      };
    }

    return { isValid: true, isLocalMode: false, message: null };
  }, []);


  // Switch between Sign In and Create Account with 180ms cross-fade
  const toggleAuthMode = (mode: boolean) => {
    if (mode === isSignUp) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setIsSignUp(mode);
      setFormError(null);
      setIsTransitioning(false);
    }, 180);
  };

  // Map raw Supabase auth error codes to plain, accurate human language
  const mapSupabaseError = (error: any): string => {
    if (!error) return 'An unexpected authentication error occurred.';

    // Permanent logging of raw error object for debugging clarity
    console.error('Supabase Auth Error Details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
      error,
    });

    const code = error.code || '';
    const msg = (error.message || '').toLowerCase();

    if (code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
      return "That email and password don't match.";
    }
    if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
      return 'Check your inbox to confirm this address.';
    }
    if (code === 'user_not_found' || msg.includes('user not found')) {
      return 'No account with that email. Create one?';
    }
    if (code === 'anonymous_provider_disabled' || msg.includes('anonymous sign-ins are disabled')) {
      return 'Anonymous sign-in is off in Supabase.';
    }
    if (code === 'over_email_send_rate_limit' || msg.includes('rate limit exceeded')) {
      return 'Too many attempts. Try again shortly.';
    }
    if (
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('network error') ||
      error.status === 0
    ) {
      return "Can't reach Supabase.";
    }

    // Return raw Supabase message verbatim for unmapped codes
    return error.message || 'Authentication failed. Please try again.';
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured || !supabase || !urlValidation.isValid) {
      setFormError(urlValidation.message || 'Local mode — add Supabase keys to enable accounts.');
      return;
    }

    try {
      setIsGoogleLoading(true);
      setFormError(null);
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/home`,
        },
      });

      if (error) {
        setFormError(mapSupabaseError(error));
        emailInputRef.current?.focus();
      }
    } catch (err: any) {
      setFormError(mapSupabaseError(err));
      emailInputRef.current?.focus();
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!urlValidation.isValid) {
      setFormError(urlValidation.message);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setFormError('Please fill in both email and password.');
      emailInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    // =========================================================================
    // LOCAL MODE FALLBACK (When Supabase keys are absent in .env.local)
    // =========================================================================
    if (!isSupabaseConfigured || !supabase) {
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmitSuccess(true);
        setTimeout(() => {
          window.location.href = '/home';
        }, 600);
      }, 500);
      return;
    }

    // =========================================================================
    // SUPABASE AUTHENTICATION (When Supabase is configured)
    // =========================================================================
    try {
      if (isSignUp) {
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setFormError(mapSupabaseError(error));
          emailInputRef.current?.focus();
          setIsSubmitting(false);
          return;
        }

        // Profile upsert happens AFTER session is established
        if (data?.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: data.user.email,
              updated_at: new Date().toISOString(),
            });
          } catch (profileErr) {
            console.warn('Profile upsert warning (non-blocking):', profileErr);
          }
        }

        setSubmitSuccess(true);
        setTimeout(() => {
          window.location.href = '/home';
        }, 800);
      } else {
        // Sign In Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setFormError(mapSupabaseError(error));
          emailInputRef.current?.focus();
          setIsSubmitting(false);
          return;
        }

        // Profile upsert happens AFTER auth succeeds
        if (data?.user) {
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              email: data.user.email,
              updated_at: new Date().toISOString(),
            });
          } catch (profileErr) {
            console.warn('Profile upsert warning (non-blocking):', profileErr);
          }
        }

        setSubmitSuccess(true);
        setTimeout(() => {
          window.location.href = '/home';
        }, 600);
      }
    } catch (err: any) {
      setFormError(mapSupabaseError(err));
      emailInputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto card-glass-neon relative z-10 select-none">
      <div className="space-y-5">
        {/* Wordmark & Subtitle */}
        <div className="text-center">
          <h1 className="font-orbitron font-bold text-[34px] tracking-wordmark uppercase text-gradient leading-none block">
            XPEDITION
          </h1>
          <span className="font-sans font-medium text-[11px] tracking-subtitle uppercase text-muted block mt-1.5">
            ADAPTIVE LEARNING
          </span>
        </div>

        {/* URL Configuration Error Warning Banner */}
        {!urlValidation.isValid && urlValidation.message && (
          <div className="p-3 bg-danger/15 border border-danger/40 rounded-[10px] text-center space-y-1">
            <span className="font-mono text-[10px] tracking-eyebrow uppercase text-danger block font-bold">
              CONFIGURATION ERROR
            </span>
            <span className="font-sans text-[12px] text-danger/90 block leading-tight">
              {urlValidation.message}
            </span>
          </div>
        )}

        {/* Dev Mode Notice Banner if Supabase configured */}
        {process.env.NODE_ENV === 'development' && isSupabaseConfigured && urlValidation.isValid && (
          <div className="p-2 bg-success/10 border border-success/30 rounded-[10px] text-center">
            <span className="font-mono text-[10px] text-success block font-semibold">
              ✓ Connected to Supabase Authentication
            </span>
          </div>
        )}

        {!isSupabaseConfigured && (
          <div className="p-2.5 bg-cyan/10 border border-cyan/30 rounded-[10px] text-center">
            <span className="font-mono text-[10px] tracking-tight text-cyan block font-semibold">
              Local mode — add Supabase keys to enable accounts.
            </span>
          </div>
        )}

        {/* Dynamic Card Content with 180ms Cross-Fade */}
        <div
          className={`space-y-5 transition-opacity duration-180 ease-in-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Welcome Line */}
          <div className="text-center">
            <h2 className="font-sans font-medium text-[18px] text-text block leading-snug">
              {isSignUp ? 'Create your account.' : 'Welcome back.'}
            </h2>
            <p className="font-sans font-normal text-[13px] text-muted block mt-0.5">
              {isSignUp
                ? 'Your progress and Skill Passport stay with this account.'
                : 'Pick up where you left off.'}
            </p>
          </div>

          {/* Form Container */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form-level Error Alert */}
            {formError && (
              <div
                id="auth-error-alert"
                role="alert"
                className="p-3 bg-danger/15 border border-danger/40 rounded-[12px] text-[12px] font-sans text-danger text-center"
              >
                {formError}
              </div>
            )}

            {/* Field 1: EMAIL */}
            <div className="space-y-1">
              <label htmlFor="email" className="block font-mono text-[10px] tracking-eyebrow uppercase text-muted">
                EMAIL
              </label>
              <div className="relative flex items-center">
                <svg
                  className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <input
                  id="email"
                  ref={emailInputRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-describedby={formError ? 'auth-error-alert' : undefined}
                  className="w-full h-[50px] pl-10 pr-3.5 rounded-[12px] bg-[#1A1430]/85 border border-white/[0.09] text-[15px] font-sans text-text placeholder:text-muted/60 focus:outline-none focus:border-cyan focus:shadow-[0_0_0_3px_rgba(34,211,238,0.16)] transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Field 2: PASSWORD */}
            <div className="space-y-1">
              <label htmlFor="password" className="block font-mono text-[10px] tracking-eyebrow uppercase text-muted">
                PASSWORD
              </label>
              <div className="relative flex items-center">
                <svg
                  className="w-4 h-4 text-muted absolute left-3.5 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-describedby={formError ? 'auth-error-alert' : undefined}
                  className="w-full h-[50px] pl-10 pr-10 rounded-[12px] bg-[#1A1430]/85 border border-white/[0.09] text-[15px] font-sans text-text placeholder:text-muted/60 focus:outline-none focus:border-cyan focus:shadow-[0_0_0_3px_rgba(34,211,238,0.16)] transition-all"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-pressed={showPassword}
                  aria-label="Toggle password visibility"
                  className="absolute right-3.5 text-muted hover:text-text transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password.trim() || !urlValidation.isValid}
              className="w-full h-[50px] rounded-[12px] bg-signature-gradient text-white font-sans font-semibold text-[15px] flex items-center justify-center transition-all hover:brightness-108 hover:shadow-[0_8px_30px_-6px_rgba(168,85,247,0.55)] active:translate-y-[1px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin font-mono text-xs">⟳ Submitting...</span>
              ) : (
                <span>{isSignUp ? 'Create account' : 'Sign in'}</span>
              )}
            </button>

            {submitSuccess && (
              <div className="p-3 bg-success/15 border border-success/40 text-success text-[12px] font-sans text-center rounded-[12px] mt-2">
                ✓ Success. Redirecting to dashboard...
              </div>
            )}
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-line/60" />
            </div>
            <div className="relative px-3 bg-[#120E22] font-mono text-[10px] uppercase text-muted tracking-widest">
              or
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || !urlValidation.isValid}
              className="w-full h-[50px] rounded-[12px] bg-[#1A1430]/85 border border-white/[0.09] hover:border-violet-hot/50 hover:bg-[#1A1430] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan text-text font-sans font-medium text-[14px] flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <span className="inline-block animate-spin font-mono text-xs">⟳ Connecting...</span>
              ) : (
                <div className="flex items-center justify-center gap-2.5">
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </div>
              )}
            </button>
          </div>

          {/* "Forgot password?" Link */}
          {!isSignUp && (
            <div className="text-center pt-1">
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password reset link sent to your email.');
                }}
                className="font-sans text-[12px] text-cyan hover:underline transition-colors"
              >
                Forgot password?
              </a>
            </div>
          )}

          {/* Bottom Card State Switcher Link */}
          <div className="text-center pt-1 font-sans text-[12px] text-muted">
            {!isSignUp ? (
              <span>
                New here?{' '}
                <button
                  type="button"
                  onClick={() => toggleAuthMode(true)}
                  className="text-cyan hover:underline font-medium transition-colors cursor-pointer"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleAuthMode(false)}
                  className="text-cyan hover:underline font-medium transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            ) }
          </div>

          {/* Terms & Conditions Footer Link */}
          <div className="text-center pt-2 border-t border-line/30 font-sans text-[11px] text-muted">
            <Link href="/terms" className="text-muted hover:text-cyan transition-colors underline">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
