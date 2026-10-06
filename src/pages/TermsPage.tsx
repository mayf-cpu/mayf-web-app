import React from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { SharedLayout } from '../components/layout/SharedLayout';

export const TermsPage: React.FC = () => {
  return (
    <SharedLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-heading font-semibold text-[#00687A] mb-1">
            <FileText className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Educational Service Agreement</span>
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#0F172A]">
            Terms of Service
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Effective: Academic Session 2026–2027 · Portal: https://mayf.co.in
          </p>
        </div>

        <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <section className="space-y-2">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or subscribing to Maths at Your Fingertips (mayf.co.in), parents and students agree to be bound by these Terms of Service. If registering on behalf of a student under 18 years of age, parental or guardian consent is affirmed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              2. License & Educational Usage
            </h2>
            <p>
              Subscribers receive a non-transferable, single-household license to access Class 5–10 study materials, formula flashcards, and AI Teacher doubt assistance. Materials and downloadable PDF cheatsheets are provided for private student study and revision. Redistribution, resale, or scraping is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              3. Annual Pass Subscription & Billing
            </h2>
            <p>
              The Annual Pass fee of ₹999 provides unrestricted access across all available standards for a period of 365 calendar days. Subscriptions are billed in Indian Rupees (INR) inclusive of applicable goods and services tax (GST).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              4. Pedagogical Nature of AI Tutor
            </h2>
            <p>
              Professor Sigma is an interactive AI study companion. While tuned for CBSE and ICSE syllabus precision, students must independently verify answers for school examinations and coursework.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-heading font-bold text-base text-[#0F172A]">
              5. Governing Law
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Republic of India.
            </p>
          </section>
        </div>
      </div>
    </SharedLayout>
  );
};
