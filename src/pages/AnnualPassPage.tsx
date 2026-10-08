import React, { useState, useEffect } from 'react';
import { Check, Sparkles, ShieldCheck, HelpCircle, ArrowRight, Star, Calendar } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Link } from '../context/NavigationContext';
import { SeoHead } from '../components/common/SeoHead';
import { ShareButton } from '../components/ui/ShareButton';
import { PromotionalBanner } from '../components/ui/PromotionalBanner';
import { AnnualPassSettings } from '../lib/payments/types';

export const AnnualPassPage: React.FC = () => {
  const [config, setConfig] = useState<AnnualPassSettings>({
    enabled: true,
    name: 'All-Class Annual Pass',
    regularPrice: 1999,
    salePrice: 999,
    currency: 'INR',
    durationDays: 365,
    description: 'Complete, unrestricted access to the entire Class 5–10 mathematics curriculum.',
    benefits: [
      'All 50+ Chapters across Class 5, 6, 7, 8, 9 & 10',
      '80+ Formula Flashcards with step derivations',
      'Unlimited 24/7 AI Teacher Doubt Resolutions',
      'Printable PDF formula sheets & summary cards',
      'NCERT Exemplar & Board Exam Past Paper steps',
      '100% 7-Day Money-Back Guarantee',
    ],
    eligibleContent: ['Class 5–10 Math', 'Formula Deck', 'AI Teacher', 'Mock Tests'],
    promotionalStartDate: '2026-04-01',
    promotionalEndDate: '2027-03-31',
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/annual-pass/config');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings) {
            setConfig(data.settings);
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic pass config, using standard defaults:', err);
      }
    }
    loadConfig();
  }, []);

  const isPromoActive = Boolean(
    config.promotionalStartDate &&
    config.promotionalEndDate &&
    new Date(config.promotionalStartDate) <= new Date() &&
    new Date(config.promotionalEndDate) >= new Date()
  );

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

  const canonicalUrl = 'https://mayf.co.in/annual-pass';
  const pageTitle = 'All-Class Annual Pass (Classes 5–10)';
  const pageDesc = 'Unrestricted access to all Class 5 to 10 mathematics courses, 80+ formula decks, printable summaries, and 24/7 AI tutor guidance with coupon discount support.';

  return (
    <SharedLayout>
      <SeoHead
        title={pageTitle}
        description={pageDesc}
        canonicalUrl="/annual-pass"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Annual Pass', item: '/annual-pass' },
        ]}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'MAYF All-Class Annual Pass',
          description: pageDesc,
          offers: {
            '@type': 'Offer',
            price: '999',
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            url: 'https://mayf.co.in/annual-pass',
          },
        }}
      />

      <div className="space-y-10 max-w-4xl mx-auto">
        {/* Promotional Banner with Coupon Codes */}
        <PromotionalBanner placement="homepage" />

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="pro" size="md">
              ANNUAL PASS 2026–2027
            </Badge>
            <ShareButton
              canonicalUrl={canonicalUrl}
              title={pageTitle}
              description={pageDesc}
              buttonText="Share Pass"
              buttonSize="xs"
            />
          </div>
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
              <span>{isPromoActive ? 'Special Promotional Offer' : 'Recommended for Board Prep'}</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-heading font-bold text-xl text-[#0F172A]">{config.name}</span>
              </div>
              <p className="text-xs text-[#64748B] mb-6">
                {config.description}
              </p>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-mono tabular-nums text-4xl sm:text-5xl font-extrabold text-[#0037B0]">
                  ₹{config.salePrice}
                </span>
                {config.regularPrice > config.salePrice && (
                  <span className="font-mono text-base text-[#94A3B8] line-through">
                    ₹{config.regularPrice}
                  </span>
                )}
                <span className="text-xs text-[#64748B]">/ {config.durationDays} days</span>
              </div>
              <p className="text-xs text-[#059669] font-semibold mb-6">
                Less than ₹{Math.max(1, Math.round(config.salePrice / config.durationDays))} per day for full access.
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-[#0F172A] border-t border-[#F1F5F9] pt-6 font-medium">
                {config.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#1D4ED8] shrink-0" strokeWidth={3} />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              {config.enabled ? (
                <Link href="/checkout?plan=annual-pass">
                  <Button variant="accent" fullWidth size="lg" className="font-bold text-base shadow-md">
                    <span>Get Annual Pass for ₹{config.salePrice}</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" fullWidth size="lg" disabled className="font-bold text-base">
                  Enrollment Currently Closed
                </Button>
              )}
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
