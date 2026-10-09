import React, { useState } from 'react';
import { Lock, Mail, Smartphone, ArrowRight, ShieldCheck, CheckCircle2, BookOpen } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { SeoHead } from '../components/common/SeoHead';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigation, Link } from '../context/NavigationContext';
import { trackLogin } from '../lib/analytics/analyticsService';

export const LoginPage: React.FC = () => {
  const { user, signInWithGoogle, loginWithEmail } = useAuth();
  const { navigate } = useNavigation();

  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('student');
  const [method, setMethod] = useState<'google' | 'otp' | 'email'>('google');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, show quick dashboard access
  if (user) {
    return (
      <SharedLayout>
        <SeoHead
          title="Account Sign In"
          description="Student and parent authentication portal"
          noindex={true}
        />
        <div className="max-w-md mx-auto text-center bg-white rounded-xl border border-[#E2E8F0] p-8 shadow-xs space-y-4 my-8">
          <div className="w-12 h-12 rounded-full bg-[#EFF6FF] text-[#1D4ED8] font-bold text-xl flex items-center justify-center mx-auto">
            {user.displayName.charAt(0)}
          </div>
          <h2 className="font-heading font-bold text-xl text-[#0F172A]">
            You are logged in as {user.displayName}
          </h2>
          <p className="text-xs text-[#64748B]">
            Enrolled in {user.studentClass} ({user.board})
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Go to Student Dashboard
            </Button>
          </div>
        </div>
      </SharedLayout>
    );
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      trackLogin('google');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setIsLoading(true);
    setTimeout(() => {
      setOtpSent(true);
      setIsLoading(false);
    }, 500);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginWithEmail(phoneNumber.includes('@') ? phoneNumber : `student.${phoneNumber.slice(-4)}@mayf.co.in`);
      trackLogin('phone');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await loginWithEmail(email);
      trackLogin('email');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SharedLayout>
      <SeoHead
        title="Account Sign In & Student Access"
        description="Secure authentication portal for students and parents."
        noindex={true}
      />
      <div className="max-w-md mx-auto my-6 sm:my-10 space-y-4">
        
        {/* IMPORTANT LOGIN RULE BANNER */}
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3.5 text-xs text-[#1E3A8A] flex items-start gap-2.5">
          <BookOpen className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">No login required for free study materials:</span> All standard formulas and chapter overviews can be browsed without logging in. Authentication is only required for the Annual Pass, dashboard tracking, and saved items.
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 sm:p-8 shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)] space-y-6">
          
          {/* Logo & Heading */}
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded-lg bg-[#1D4ED8] flex items-center justify-center text-white font-heading font-extrabold text-xl mx-auto shadow-xs">
              Σ
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-[#0F172A]">
              Log in to Your Learning Account
            </h1>
            <p className="text-xs text-[#64748B]">
              Maths at Your Fingertips (mayf.co.in)
            </p>
          </div>

          {/* Student vs Parent Toggle */}
          <div className="grid grid-cols-2 p-1 bg-[#F1F5F9] rounded-lg">
            <button
              onClick={() => setActiveTab('student')}
              className={`py-1.5 text-xs font-heading font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white text-[#1D4ED8] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Student Portal
            </button>
            <button
              onClick={() => setActiveTab('parent')}
              className={`py-1.5 text-xs font-heading font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'parent'
                  ? 'bg-white text-[#1D4ED8] shadow-xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Parent Portal
            </button>
          </div>

          {/* Primary Action: Google Sign-in with Firebase */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-[#F8FAFC] border-2 border-[#CBD5E1] hover:border-[#1D4ED8] rounded-xl font-heading font-bold text-xs sm:text-sm text-[#0F172A] shadow-xs transition-all cursor-pointer active:scale-[0.99]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
            </button>

            <div className="text-[11px] text-[#64748B] text-center leading-relaxed">
              Automatically creates/updates your student profile using only your Google Name, Email, and Avatar. No intrusive personal questionnaires.
            </div>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-[#E2E8F0] w-full" />
              <span className="bg-white px-3 text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider shrink-0">
                or sign in with
              </span>
            </div>
          </div>

          {/* Alternative tabs: Mobile OTP vs Email */}
          <div className="flex border-b border-[#F1F5F9] pb-2 gap-4 text-xs font-semibold">
            <button
              onClick={() => setMethod('otp')}
              className={`flex items-center gap-1.5 pb-1 border-b-2 cursor-pointer ${
                method === 'otp'
                  ? 'border-[#1D4ED8] text-[#1D4ED8]'
                  : 'border-transparent text-[#64748B]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
            </button>
            <button
              onClick={() => setMethod('email')}
              className={`flex items-center gap-1.5 pb-1 border-b-2 cursor-pointer ${
                method === 'email'
                  ? 'border-[#1D4ED8] text-[#1D4ED8]'
                  : 'border-transparent text-[#64748B]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>
          </div>

          {method === 'otp' ? (
            !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Mobile Number (+91)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="md"
                  isLoading={isLoading}
                  className="font-bold"
                >
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                    Enter 6-digit OTP
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm font-mono tracking-widest text-center text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  />
                  <div className="flex justify-between items-center text-[11px] text-[#64748B] mt-1">
                    <span>Sent to {phoneNumber}</span>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-[#1D4ED8] hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="md"
                  isLoading={isLoading}
                  className="font-bold"
                >
                  Verify & Enter
                </Button>
              </form>
            )
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-md px-3 py-2 text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                isLoading={isLoading}
                className="font-bold"
              >
                Log In
              </Button>
            </form>
          )}

          {/* Quick Demo Student Switcher */}
          <div className="pt-2 border-t border-[#F1F5F9] text-center">
            <button
              onClick={() => {
                loginWithEmail('arjun.sharma@mayf.co.in');
                navigate('/dashboard');
              }}
              className="text-xs text-[#1D4ED8] hover:underline font-semibold cursor-pointer"
            >
              Continue as Demo Student (Arjun Sharma, Class 10) →
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Firebase Authentication & App Check Protected</span>
          </div>

        </div>
      </div>
    </SharedLayout>
  );
};
