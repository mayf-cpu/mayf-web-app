import React, { useState } from 'react';
import { DownloadCloud, FileText, CheckCircle2, Download, ShieldCheck } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { TurnstileModal } from '../components/ui/TurnstileModal';

interface DownloadItem {
  id: string;
  title: string;
  classLevel: string;
  fileSize: string;
  pages: number;
  category: string;
  description: string;
  accessType?: 'free' | 'paid';
}

export const DashboardDownloadsPage: React.FC = () => {
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [activeModalItem, setActiveModalItem] = useState<DownloadItem | null>(null);

  const downloads: DownloadItem[] = [
    {
      id: 'dl-10-cheatsheet',
      title: 'Class 10 Board Exam Complete Formula Cheatsheet',
      classLevel: 'Class 10',
      fileSize: '2.4 MB',
      pages: 14,
      category: 'Formula Flashcards',
      accessType: 'free',
      description: 'Every formula in Real Numbers, Polynomials, Linear Systems, Quadratics, AP, Triangles, Trig, Circles, and Surface Areas in printable high-resolution PDF format.',
    },
    {
      id: 'dl-10-theorems',
      title: 'Class 10 Essential Geometry Proofs & Theorems Reference',
      classLevel: 'Class 10',
      fileSize: '1.8 MB',
      pages: 8,
      category: 'Theorems & Axioms',
      accessType: 'free',
      description: 'Complete step-by-step proofs for Basic Proportionality Theorem (BPT), Tangent Theorem, and cyclic properties with diagrams.',
    },
    {
      id: 'dl-9-circles',
      title: 'Class 9 Geometry & Mensuration Formula Handbook',
      classLevel: 'Class 9',
      fileSize: '1.5 MB',
      pages: 10,
      category: 'Formula Flashcards',
      accessType: 'free',
      description: 'Quick reference for Herons formula, Surface Areas & Volumes of cylinders/cones, and Circle chord angle properties.',
    },
    {
      id: 'dl-8-algebra',
      title: 'Class 8 Linear Equations & Factorisation Workbook',
      classLevel: 'Class 8',
      fileSize: '1.2 MB',
      pages: 12,
      category: 'Practice Sheet',
      accessType: 'free',
      description: 'Handcrafted word problems with step-by-step worked solutions for algebraic expressions and identities.',
    },
    {
      id: 'dl-foundation',
      title: 'Classes 5–7 Mental Math & Foundations Master Chart',
      classLevel: 'Classes 5–7',
      fileSize: '950 KB',
      pages: 6,
      category: 'Foundation',
      accessType: 'free',
      description: 'Fraction addition rules, divisibility tricks, LCM/HCF shortcuts, and integer sign rules chart for study table wall mounting.',
    },
    {
      id: 'cnt-test-class10-mock-1',
      title: 'CBSE Class 10 Standard Mathematics 80-Mark Mock Board Exam Paper',
      classLevel: 'Class 10',
      fileSize: '1.8 MB',
      pages: 16,
      category: 'Mock Exam',
      accessType: 'paid',
      description: 'Full syllabus 3-hour sample examination with Section A to Section E marking scheme and answer key.',
    },
  ];

  const handleDownload = (item: DownloadItem) => {
    setActiveModalItem(item);
  };

  return (
    <DashboardLayout
      title="Downloadable Revision Materials"
      subtitle="High-resolution, printable PDF notes and formula cheat sheets for offline study."
    >
      {/* Cloudflare Turnstile Verification Modal */}
      {activeModalItem && (
        <TurnstileModal
          isOpen={Boolean(activeModalItem)}
          onClose={() => setActiveModalItem(null)}
          contentId={activeModalItem.id}
          title={activeModalItem.title}
          classLevel={activeModalItem.classLevel}
          accessType={activeModalItem.accessType || 'free'}
          fallbackFileName={`${activeModalItem.id}.pdf`}
          onDownloadSuccess={(fileName) => {
            setDownloadedIds((prev) => [...prev, activeModalItem.id]);
          }}
        />
      )}

      {/* Security Info Banner */}
      <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center justify-between text-xs text-blue-900 gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Cloudflare Turnstile Protected:</strong> Every download uses server-verified Managed security challenges and short-lived authorized links.
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] font-mono text-blue-700 bg-blue-100 px-2 py-0.5 rounded font-semibold">
          Managed Challenge Mode
        </span>
      </div>

      <div className="space-y-4">
        {downloads.map((item) => {
          const isDownloaded = downloadedIds.includes(item.id);
          const isPaid = item.accessType === 'paid';
          return (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded">
                      {item.classLevel}
                    </span>
                    <span className="text-[11px] text-[#00687A] font-semibold bg-[#ECFEFF] px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isPaid ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isPaid ? 'Annual Pass Asset' : 'Free Resource'}
                    </span>
                    <span className="text-[11px] text-[#64748B] font-mono">
                      {item.fileSize} · {item.pages} pages
                    </span>
                  </div>
                  <h4 className="font-heading font-bold text-sm sm:text-base text-[#0F172A]">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed max-w-xl">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 sm:self-center">
                <Button
                  size="sm"
                  variant={isDownloaded ? 'outline' : 'primary'}
                  onClick={() => handleDownload(item)}
                  className="gap-1.5 w-full sm:w-auto"
                >
                  {isDownloaded ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Downloaded</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};
