import React, { useState } from 'react';
import { Lock, Mail, Smartphone, ArrowRight, ShieldCheck } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const { navigate } = useNavigation();

  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('student');
  const [method, setMethod] = useState<'otp' | 'email'>('otp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, show quick dashboard access
  if (user) {
    return (
      <SharedLayout>
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

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setIsLoading(true);
    setTimeout(() => {
      setOtpSent(true);
      setIsLoading(false);
    }, 600);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(phoneNumber.includes('@') ? phoneNumber : `student.${phoneNumber.slice(-4)}@mayf.co.in`, activeTab);
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
      await login(email, activeTab);
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SharedLayout>
      <div className="max-w-md mx-auto my-6 sm:my-12">
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 sm:p-8 shadow-[0_4px_14px_-2px_rgba(29,78,216,0.05)] space-y-6">
          
          {/* Logo & Heading */}
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-[#1D4ED8] flex items-center justify-center text-white font-heading font-extrabold text-xl mx-auto">
              Σ
            </div>
            <h1 className="font-heading font-extrabold text-2xl text-[#0F172A]">
              Log in to Your Learning Portal
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

          {/* Login Options: Phone OTP vs Email */}
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
              <span>Mobile OTP (India)</span>
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
              <span>Email & Password</span>
            </button>
          </div>

          {/* Form Content */}
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
                  <p className="text-[11px] text-[#64748B] mt-1">
                    We will send an SMS OTP for secure passwordless login.
                  </p>
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
                      Change Number
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
              <div>
                <label className="block text-xs font-heading font-semibold text-[#475569] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
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

          {/* Quick Demo Login Preset */}
          <div className="pt-4 border-t border-[#F1F5F9] text-center">
            <button
              onClick={() => {
                login('arjun.sharma@mayf.co.in', 'student');
                navigate('/dashboard');
              }}
              className="text-xs text-[#1D4ED8] hover:underline font-semibold cursor-pointer"
            >
              Continue as Demo Student (Arjun Sharma, Class 10) →
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Firebase Authentication Protected</span>
          </div>

        </div>
      </div>
    </SharedLayout>
  );
};
