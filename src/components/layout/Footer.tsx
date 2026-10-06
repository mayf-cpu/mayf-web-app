import React from 'react';
import { ShieldCheck, Award, Heart, CheckCircle2 } from 'lucide-react';
import { Link } from '../../context/NavigationContext';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] mt-16 pb-20 md:pb-12 text-[#64748B]">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1D4ED8] flex items-center justify-center text-white font-heading font-extrabold text-base">
                Σ
              </div>
              <span className="font-heading font-bold text-base text-[#0F172A]">
                Maths at Your Fingertips
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Authoritative mathematical learning companion specifically crafted for Class 5 to 10 school students across CBSE and ICSE boards.
            </p>
            <div className="text-[11px] text-[#00687A] flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
              <span>Official portal: mayf.co.in</span>
            </div>
          </div>

          {/* Quick Syllabus by Class */}
          <div>
            <div className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F172A] mb-3">
              Curriculum (Classes 5–10)
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/study-material?class=Class+10" className="hover:text-[#1D4ED8] transition-colors">
                  Class 10 Board Revision & Theorems
                </Link>
              </li>
              <li>
                <Link href="/study-material?class=Class+9" className="hover:text-[#1D4ED8] transition-colors">
                  Class 9 Polynomials & Triangles
                </Link>
              </li>
              <li>
                <Link href="/study-material?class=Class+8" className="hover:text-[#1D4ED8] transition-colors">
                  Class 8 Linear Equations & Mensuration
                </Link>
              </li>
              <li>
                <Link href="/study-material?class=Class+7" className="hover:text-[#1D4ED8] transition-colors">
                  Class 7 Integers & Fractions
                </Link>
              </li>
              <li>
                <Link href="/study-material?class=Class+6" className="hover:text-[#1D4ED8] transition-colors">
                  Class 5 & 6 Foundations & Ratios
                </Link>
              </li>
            </ul>
          </div>

          {/* Core Tools */}
          <div>
            <div className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F172A] mb-3">
              Learning Tools
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/formula-deck" className="hover:text-[#1D4ED8] transition-colors">
                  Interactive Formula Flashcards
                </Link>
              </li>
              <li>
                <Link href="/ai-teacher" className="hover:text-[#1D4ED8] transition-colors">
                  AI Teacher (Step-by-Step Doubt Tutor)
                </Link>
              </li>
              <li>
                <Link href="/annual-pass" className="hover:text-[#1D4ED8] transition-colors">
                  Annual Pass & Syllabus Coverage
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-[#1D4ED8] transition-colors">
                  Maths Index & Search
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Student Security */}
          <div>
            <div className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F172A] mb-3">
              Trust & Security
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="hover:text-[#1D4ED8] transition-colors">
                  Privacy Policy (DPDP Act & COPPA)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#1D4ED8] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-[#1D4ED8] transition-colors">
                  7-Day 100% Refund Guarantee
                </Link>
              </li>
              <li className="pt-2 flex items-center gap-1.5 text-[#10B981] font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cloudflare & Firebase Protected</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#94A3B8]">
          <p>© {new Date().getFullYear()} Maths at Your Fingertips (mayf.co.in). All rights reserved.</p>
          <p className="flex items-center gap-1 text-[#64748B]">
            <span>Crafted for school mathematics mastery</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
