import React from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';
import { SeoHead } from '../components/common/SeoHead';

export const PrivacyPage: React.FC = () => {
  return (
    <SharedLayout>
      <SeoHead
        title="Privacy Policy & Student Data Protection"
        description="Learn how Maths at Your Fingertips protects minor student data under the DPDP Act 2023 with strict child safety guidelines."
        canonicalUrl="/privacy"
        breadcrumbs={[
          { name: 'Home', item: '/' },
          { name: 'Privacy Policy', item: '/privacy' },
        ]}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Digital Personal Data Protection Act (DPDP Act) Compliant</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A]">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Effective Date: October 2026 · Official Portal: https://mayf.co.in
          </p>
        </div>

        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              1. Our Commitment to Student Safety
            </h2>
            <p>
              Maths at Your Fingertips ("MAYF", "we", "our") is designed specifically for school students in Classes 5 through 10. We adhere strictly to the highest standards of child data safety under the Indian Digital Personal Data Protection Act, 2023 (DPDP Act) and global best practices. We do not engage in targeted behavioural advertising directed at minors.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account Credentials:</strong> Mobile phone number, parent/student email, and student display name used for authentication via Firebase.</li>
              <li><strong>Academic Profile:</strong> Enrolled standard (Class 5–10) and curriculum board (CBSE/ICSE) to serve appropriate mathematical content.</li>
              <li><strong>Learning Diagnostics:</strong> Chapter completion, bookmarked formula IDs, and questions posed to the AI Teacher to personalize doubt resolution.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              3. Cloudflare & Firebase Infrastructure Security
            </h2>
            <p>
              All traffic is routed through Cloudflare edge proxy with Turnstile bot protection to mitigate unauthorized access. Data at rest and in transit is encrypted using 256-bit AES encryption across Google Cloud Platform and Firebase Firestore.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              4. AI Teacher & Doubt Processing
            </h2>
            <p>
              Questions sent to Professor Sigma (AI Teacher) are processed server-side through secure API endpoints without leaking student identifiers. Query content is utilized strictly to provide mathematical explanations and improve educational quality.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              5. Contact Our Data Protection Officer
            </h2>
            <p>
              Parents may request access, modification, or complete deletion of their child's learning history at any time by writing to:
            </p>
            <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md font-mono text-xs">
              privacy@mayf.co.in · Maths at Your Fingertips Support Cell
            </div>
          </section>
        </div>
      </div>
    </SharedLayout>
  );
};
