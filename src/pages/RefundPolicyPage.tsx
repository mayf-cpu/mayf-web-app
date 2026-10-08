import React from 'react';
import { RotateCcw, ShieldCheck, CheckCircle2, Clock, Mail } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { Button } from '../components/ui/Button';
import { Link } from '../context/NavigationContext';
import { SeoHead } from '../components/common/SeoHead';

export const RefundPolicyPage: React.FC = () => {
  return (
    <SharedLayout>
      <SeoHead
        title="100% Refund Policy & Guarantee"
        description="Maths at Your Fingertips 7-day unconditional refund policy for Annual Passes and digital courses."
        canonicalUrl="/refund-policy"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Refund Policy', item: '/refund-policy' },
        ]}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Student Trust & Protection Assurance</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A]">
            7-Day 100% Refund Policy
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Zero-risk guarantee for parents and students · Official Portal: https://mayf.co.in
          </p>
        </div>

        {/* Highlight Guarantee Box */}
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-6 sm:p-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading font-bold text-base sm:text-lg text-[#065F46]">
              No Questions Asked Money-Back Guarantee
            </h2>
            <p className="text-xs sm:text-sm text-[#047857] leading-relaxed">
              If your child does not experience immediate clarity and learning enjoyment with Maths at Your Fingertips, you are entitled to a full 100% refund of your ₹999 Annual Pass within 7 days of activation.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-heading font-bold text-base text-[#0F172A]">
              1. Eligibility Criteria
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Request submitted within 7 calendar days from the moment of payment completion.</li>
              <li>Applies to the Maths at Your Fingertips Annual Pass (₹999).</li>
              <li>No minimum learning hours or tests required—if it's not the right fit for your child, you get your money back.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-heading font-bold text-base text-[#0F172A]">
              2. How to Claim Your Refund
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#0F172A]">Method A: Instant One-Click via Dashboard</div>
                  <div className="text-[11px] text-[#64748B]">Navigate to Dashboard → Purchases → Click "Request 7-Day Refund".</div>
                </div>
                <Link href="/dashboard/purchases">
                  <Button size="sm" variant="outline">
                    Go to Purchases
                  </Button>
                </Link>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md">
                <div className="font-semibold text-[#0F172A]">Method B: Direct Email Support</div>
                <div className="text-[11px] text-[#64748B]">
                  Send an email to <span className="font-mono text-[#1D4ED8]">refunds@mayf.co.in</span> with your Order ID or registered mobile number.
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-heading font-bold text-base text-[#0F172A]">
              3. Processing Speed & Reimbursement Method
            </h3>
            <p>
              Refunds are initiated within 24 business hours. Funds will be credited directly back to your original source of payment (UPI ID, Net Banking account, or credit/debit card) within 3 to 5 banking days.
            </p>
          </section>
        </div>
      </div>
    </SharedLayout>
  );
};
