import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ShieldCheck, Download, AlertCircle, CheckCircle2, Lock, X, RefreshCw, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clientConfig } from '../../config/env';
import { requestDownloadAuthorization, triggerAuthorizedDownload } from '../../lib/download/downloadClient';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingState';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          action?: string;
          cData?: string;
          appearance?: 'always' | 'execute' | 'interaction-only';
          theme?: 'auto' | 'light' | 'dark';
          callback?: (token: string) => void;
          'error-callback'?: (error: any) => void;
          'expired-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

interface TurnstileModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  title: string;
  accessType?: 'free' | 'paid';
  classLevel?: string;
  fallbackFileName?: string;
  onDownloadSuccess?: (fileName: string) => void;
}

export const TurnstileModal: React.FC<TurnstileModalProps> = ({
  isOpen,
  onClose,
  contentId,
  title,
  accessType = 'free',
  classLevel,
  fallbackFileName = 'MAYF_Study_Document.pdf',
  onDownloadSuccess,
}) => {
  const { user, firebaseUser, entitlements, signInWithGoogle } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  const [phase, setPhase] = useState<'idle' | 'verifying' | 'authorizing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(false);

  const isPaid = accessType === 'paid';
  const isLoggedIn = Boolean(user && (firebaseUser || user.uid));
  const isEntitled = Boolean(
    entitlements.hasAnnualPass ||
    entitlements.isPro ||
    entitlements.isAdmin ||
    entitlements.isSuperAdmin
  );

  // Clean state whenever modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPhase('idle');
      setErrorMessage(null);
    } else {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors
        }
        widgetIdRef.current = null;
      }
    }
  }, [isOpen]);

  // Load Cloudflare Turnstile script dynamically
  useEffect(() => {
    if (!isOpen) return;

    if (window.turnstile) {
      setTurnstileReady(true);
      return;
    }

    const scriptId = 'cloudflare-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setTurnstileReady(true);
      };
      script.onerror = () => {
        setErrorMessage('Could not load Cloudflare security challenge. Please verify your connection.');
      };
      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          setTurnstileReady(true);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, [isOpen]);

  // Handle Turnstile token submission
  const handleTurnstileSuccess = useCallback(async (token: string) => {
    setPhase('authorizing');
    setErrorMessage(null);

    try {
      let idToken: string | null = null;
      if (firebaseUser) {
        idToken = await firebaseUser.getIdToken();
      } else if (user) {
        // Dev fallback token when authenticated locally
        idToken = `dev-token-${user.uid}`;
      }

      const response = await requestDownloadAuthorization(contentId, token, idToken);

      // Trigger download using the single-use short-lived download URL
      await triggerAuthorizedDownload(response.downloadUrl, response.fileName || fallbackFileName);

      setPhase('success');
      if (onDownloadSuccess) {
        onDownloadSuccess(response.fileName || fallbackFileName);
      }

      // Close modal after brief success feedback
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('[MAYF Download Security] Authorization error:', err);
      setPhase('error');
      setErrorMessage(err?.message || 'Server failed to authorize download. Please try again.');
      
      // Reset Turnstile widget for retry
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    }
  }, [contentId, firebaseUser, user, fallbackFileName, onDownloadSuccess, onClose]);

  // Render Turnstile widget inside the container
  useEffect(() => {
    if (!isOpen || !turnstileReady || !containerRef.current) return;

    // For paid files, wait until logged in and entitled
    if (isPaid && (!isLoggedIn || !isEntitled)) return;

    const siteKey = clientConfig.turnstile.siteKey || '1x00000000000000000000AA';

    // Clear previous widget if any
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // ignore
      }
      widgetIdRef.current = null;
    }

    try {
      if (window.turnstile) {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: 'secure-download',
          cData: contentId,
          appearance: 'always', // Managed mode
          theme: 'light',
          callback: (token: string) => {
            handleTurnstileSuccess(token);
          },
          'error-callback': () => {
            setPhase('error');
            setErrorMessage('Turnstile verification failed. Please check network connectivity and try again.');
          },
          'expired-callback': () => {
            setPhase('error');
            setErrorMessage('Turnstile challenge expired. Please check the box again.');
          },
        });
        widgetIdRef.current = id;
      }
    } catch (renderError) {
      console.warn('[MAYF Turnstile] Render warning:', renderError);
    }
  }, [isOpen, turnstileReady, isPaid, isLoggedIn, isEntitled, contentId, handleTurnstileSuccess]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h3 id="download-modal-title" className="font-heading font-bold text-sm tracking-wide text-white">
                Cloudflare Secure Download
              </h3>
              <p className="text-[11px] text-blue-100/90">
                Verified Cloudflare Turnstile Protection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close download dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Item Summary Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                {classLevel && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                    {classLevel}
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    isPaid ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {isPaid ? 'Paid Asset · Annual Pass' : 'Free Resource · No Login Needed'}
                </span>
              </div>
              <h4 className="font-heading font-bold text-xs sm:text-sm text-slate-900 truncate">
                {title}
              </h4>
            </div>
          </div>

          {/* PAID FILE: Step 1 - Google Authentication Check */}
          {isPaid && !isLoggedIn && (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-xs">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Step 1 of 2: Account Login Required</span>
                  <p className="mt-0.5 text-amber-800 text-[11px] leading-relaxed">
                    This premium study material requires verified account entitlement. Sign in with Google to confirm your Annual Pass or active purchase.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                className="w-full justify-center gap-2"
                disabled={loginLoading}
                onClick={async () => {
                  try {
                    setLoginLoading(true);
                    await signInWithGoogle();
                  } catch (err: any) {
                    setErrorMessage('Login failed: ' + (err?.message || 'Could not complete sign in'));
                  } finally {
                    setLoginLoading(false);
                  }
                }}
              >
                {loginLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign in with Google</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* PAID FILE: Step 2 - Entitlement Check */}
          {isPaid && isLoggedIn && !isEntitled && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Annual Pass Required</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You are signed in as <strong>{user?.email || 'Student'}</strong>, but an active Annual Pass or individual course order is needed for this file.
                </p>
              </div>

              <div className="flex gap-2">
                <a href="/annual-pass" className="flex-1">
                  <Button variant="accent" size="sm" className="w-full justify-center font-bold">
                    Get Annual Pass (₹999/yr)
                  </Button>
                </a>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* TURNSTILE VERIFICATION STEP (Required for Free AND Paid) */}
          {(!isPaid || (isLoggedIn && isEntitled)) && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-xs font-semibold text-slate-700">
                  Complete the security challenge to initiate download
                </p>
                <p className="text-[11px] text-slate-500">
                  Managed Cloudflare Turnstile protects against automated bots.
                </p>
              </div>

              {/* Turnstile Container */}
              <div className="flex flex-col items-center justify-center min-h-[90px] p-3 rounded-xl bg-slate-50/80 border border-slate-200">
                {phase === 'authorizing' ? (
                  <div className="py-4 text-center space-y-2">
                    <LoadingSpinner size="md" message="Issuing short-lived authorized download..." />
                    <p className="text-[11px] text-slate-500 font-mono">
                      Verifying token server-side via Cloudflare Siteverify...
                    </p>
                  </div>
                ) : phase === 'success' ? (
                  <div className="py-4 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="font-heading font-bold text-xs sm:text-sm text-emerald-800">
                      Security Verified! Download starting...
                    </p>
                  </div>
                ) : (
                  <div ref={containerRef} className="flex justify-center" />
                )}
              </div>

              {/* Error state */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-[11px] leading-relaxed">
                    <span>{errorMessage}</span>
                  </div>
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setPhase('idle');
                      if (widgetIdRef.current && window.turnstile) {
                        try {
                          window.turnstile.reset(widgetIdRef.current);
                        } catch {
                          // ignore
                        }
                      }
                    }}
                    className="text-rose-700 hover:text-rose-900 p-0.5"
                    title="Retry verification"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Security info footnote */}
              <div className="pt-1 text-center">
                <span className="text-[10px] text-slate-400 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-slate-400" />
                  Single-use download token valid for 60 seconds. Rate limited for fair access.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
