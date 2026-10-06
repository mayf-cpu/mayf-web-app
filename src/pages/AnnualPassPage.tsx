import React from 'react';
import { Check, Sparkles, ShieldCheck, HelpCircle, ArrowRight, Star } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Link } from '../context/NavigationContext';

export const AnnualPassPage: React.FC = () => {
  const faqs = [
    {
      q: 'Does the Annual Pass cover both CBSE and ICSE syllabus?',
      a: 'Yes! The Pass includes all curriculum requirements for CBSE, ICSE, and standard State Boards from Class 5 through Class 10.',
    },
    {
      q: 'Can my child switch between Class 9 and Class 10 anytime?',
      a: 'Absolutely. A single Annual Pass grants unrestricted access to all standards (Class 5, 6, 7, 8, 9, and 10), so students can revise previous year foundations or preview upcoming board chapters anytime.',
    },
    {
      q: 'How does the 7-day money-back guarantee work?',
      a: 'If you or your child are not completely delighted with Maths at Your Fingertips within 7 days of purchase, email support@mayf.co.in or request a refund from your dashboard for a 100% full refund.',
    },
    {
      q: 'How does Professor Sigma (AI Teacher) help with homework?',
      a: 'Rather than just dumping the final numeric answer, our AI Teacher leads students through the underlying theorem, provides incremental step hints, and ensures the student genuinely grasps the concept.',
    },
  ];

  return (
    <SharedLayout>
      <div className="space-y-12 max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <Badge variant="pro" size="md">
            ANNUAL PASS 2026–2027
          </Badge>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#0F172A] tracking-tight">
            One Pass. Every Class. Complete Math Mastery.
          </h1>
          <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto">
            Give your child the confidence to ace exams with structured derivations, step-by-step problem breakdowns, and 24/7 AI tutor guidance.
          </p>
        </div>

        {/* Pricing Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          
          {/* Free Starter Tier */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-heading font-bold text-lg text-[#0F172A]">Free Preview</span>
                <Badge variant="free">STARTER</Badge>
              </div>
              <p className="text-xs text-[#64748B] mb-6">
                Explore foundational formulas and sample chapter modules.
              </p>

              <div className="font-mono tabular-nums text-4xl font-extrabold text-[#0F172A] mb-6">
                ₹0 <span className="text-xs font-sans text-[#64748B] font-normal">/ forever</span>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-[#334155] border-t border-[#F1F5F9] pt-6">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Access to 3 preview chapters per grade</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>Basic formula lookup with definitions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>5 AI Teacher questions per day</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#94A3B8]">
                  <span className="w-4 h-4 text-center shrink-0">—</span>
                  <span>No offline PDF revision sheets</span>
                </div>
                <div className="flex items-center gap-2.5 text-[#94A3B8]">
                  <span className="w-4 h-4 text-center shrink-0">—</span>
                  <span>No board exam exemplar derivations</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/study-material">
                <Button variant="outline" fullWidth size="lg">
                  Explore Free Content
                </Button>
              </Link>
            </div>
          </div>

          {/* Full Annual Pass Tier */}
          <div className="relative bg-white rounded-xl border-2 border-[#1D4ED8] p-6 sm:p-8 flex flex-col justify-between shadow-[0_10px_25px_-4px_rgba(29,78,216,0.12)] overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-r from-[#FF6B4A] to-[#F97316] text-white text-[11px] font-heading font-bold px-4 py-1 rounded-bl-lg tracking-wider uppercase flex items-center gap-1 shadow-xs">
              <Star className="w-3 h-3 fill-white stroke-none" />
              <span>Recommended for Board Prep</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-heading font-bold text-xl text-[#0F172A]">All-Class Annual Pass</span>
              </div>
              <p className="text-xs text-[#64748B] mb-6">
                Complete, unrestricted access to the entire Class 5–10 mathematics curriculum.
              </p>

              <div className="font-mono tabular-nums text-4xl sm:text-5xl font-extrabold text-[#0037B0] mb-1">
                ₹999
              </div>
              <p className="text-xs text-[#059669] font-semibold mb-6">
                Less than ₹3 per day for a complete academic year.
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-[#0F172A] border-t border-[#F1F5F9] pt-6 font-medium">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1D4ED8] shrink-0" strokeWidth={3} />
                  <span>All 50+ Chapters across Class 5, 6, 7, 8, 9 & 10</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1D4ED8] shrink-0" strokeWidth={3} />
                  <span>80+ Formula Flashcards with step derivations</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1D4ED8] shrink-0" strokeWidth={3} />
                  <span>Unlimited 24/7 AI Teacher Doubt Resolutions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1D4ED8] shrink-0" strokeWidth={3} />
                  <span>Printable PDF formula sheets & summary cards</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1D4ED8] shrink-0" strokeWidth={3} />
                  <span>NCERT Exemplar & Board Exam Past Paper steps</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#1D4ED8] shrink-0" strokeWidth={3} />
                  <span>100% 7-Day Money-Back Guarantee</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/checkout?plan=annual-pass">
                <Button variant="accent" fullWidth size="lg" className="font-bold text-base shadow-md">
                  <span>Get Annual Pass for ₹999</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>

        </div>

        {/* Trust & Guarantee Banner */}
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-14 h-14 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-[#065F46] mb-1">
              7-Day 100% Student Satisfaction Guarantee
            </h3>
            <p className="text-xs sm:text-sm text-[#047857] leading-relaxed">
              We stand firmly behind the academic quality of Maths at Your Fingertips. If you feel this does not significantly boost your child's mathematical confidence, notify us within 7 days for a prompt, courteous full refund.
            </p>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-6 pt-4">
          <h2 className="font-heading font-bold text-2xl text-[#0F172A] text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs">
                <h4 className="font-heading font-semibold text-sm sm:text-base text-[#0F172A] mb-2 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#06B6D4] shrink-0" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </SharedLayout>
  );
};
