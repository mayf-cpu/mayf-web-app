import React from 'react';
import { ShieldCheck, Award, Heart, CheckCircle2, Mail, Phone, MessageCircle } from 'lucide-react';
import { Link } from '../../context/NavigationContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export const Footer: React.FC = () => {
  const { settings } = useSiteSettings();

  const siteName = settings?.brand?.siteName || 'Maths at Your Fingertips';
  const logoUrl = settings?.brand?.logoUrl;
  const wordmarkGlyph = settings?.brand?.wordmarkGlyph || 'Σ';
  const primaryColor = settings?.colors?.primaryColor || '#1D4ED8';
  const footerText = settings?.brand?.footerText || 'Authoritative mathematical learning companion specifically crafted for Class 5 to 10 school students across CBSE and ICSE boards.';
  const copyrightText = settings?.brand?.copyrightText || 'Maths at Your Fingertips (mayf.co.in). All rights reserved.';
  const social = settings?.social || {};
  const contact = settings?.contact || {};

  return (
    <footer className="bg-white border-t border-[#E2E8F0] mt-16 pb-20 md:pb-12 text-[#64748B]">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 pt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="w-8 h-8 rounded-lg object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-heading font-extrabold text-base"
                  style={{ backgroundColor: primaryColor }}
                >
                  {wordmarkGlyph}
                </div>
              )}
              <span className="font-heading font-bold text-base text-[#0F172A]">
                {siteName}
              </span>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {footerText}
            </p>
            <div className="text-[11px] text-[#00687A] flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#06B6D4]" />
              <span>Official portal: mayf.co.in</span>
            </div>

            {/* Social channels strip */}
            <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
              {social.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md bg-slate-100 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="YouTube"
                >
                  YT
                </a>
              )}
              {social.telegram && (
                <a
                  href={social.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md bg-slate-100 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                  title="Telegram"
                >
                  TG
                </a>
              )}
              {social.whatsapp && (
                <a
                  href={social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  title="WhatsApp"
                >
                  WA
                </a>
              )}
              {social.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md bg-slate-100 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                  title="Instagram"
                >
                  IG
                </a>
              )}
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

          {/* Core Tools & Support */}
          <div>
            <div className="font-heading font-bold text-xs uppercase tracking-wider text-[#0F172A] mb-3">
              Tools & Support
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/courses" className="hover:text-[#1D4ED8] transition-colors">
                  Structured Curriculum Courses
                </Link>
              </li>
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
              {contact.supportEmail && (
                <li className="pt-1 text-[11px] text-[#475569] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <a href={`mailto:${contact.supportEmail}`} className="hover:underline">
                    {contact.supportEmail}
                  </a>
                </li>
              )}
              {contact.supportPhone && (
                <li className="text-[11px] text-[#475569] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{contact.supportPhone}</span>
                </li>
              )}
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
          <p>© {new Date().getFullYear()} {copyrightText}</p>
          <p className="flex items-center gap-1 text-[#64748B]">
            <span>Crafted for school mathematics mastery</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
