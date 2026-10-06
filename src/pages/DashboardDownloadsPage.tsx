import React, { useState } from 'react';
import { DownloadCloud, FileText, CheckCircle2, Download } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';

interface DownloadItem {
  id: string;
  title: string;
  classLevel: string;
  fileSize: string;
  pages: number;
  category: string;
  description: string;
}

export const DashboardDownloadsPage: React.FC = () => {
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);

  const downloads: DownloadItem[] = [
    {
      id: 'dl-10-cheatsheet',
      title: 'Class 10 Board Exam Complete Formula Cheatsheet',
      classLevel: 'Class 10',
      fileSize: '2.4 MB',
      pages: 14,
      category: 'Formula Flashcards',
      description: 'Every formula in Real Numbers, Polynomials, Linear Systems, Quadratics, AP, Triangles, Trig, Circles, and Surface Areas in printable high-resolution PDF format.',
    },
    {
      id: 'dl-10-theorems',
      title: 'Class 10 Essential Geometry Proofs & Theorems Reference',
      classLevel: 'Class 10',
      fileSize: '1.8 MB',
      pages: 8,
      category: 'Theorems & Axioms',
      description: 'Complete step-by-step proofs for Basic Proportionality Theorem (BPT), Tangent Theorem, and cyclic properties with diagrams.',
    },
    {
      id: 'dl-9-circles',
      title: 'Class 9 Geometry & Mensuration Formula Handbook',
      classLevel: 'Class 9',
      fileSize: '1.5 MB',
      pages: 10,
      category: 'Formula Flashcards',
      description: 'Quick reference for Herons formula, Surface Areas & Volumes of cylinders/cones, and Circle chord angle properties.',
    },
    {
      id: 'dl-8-algebra',
      title: 'Class 8 Linear Equations & Factorisation Workbook',
      classLevel: 'Class 8',
      fileSize: '1.2 MB',
      pages: 12,
      category: 'Practice Sheet',
      description: 'Handcrafted word problems with step-by-step worked solutions for algebraic expressions and identities.',
    },
    {
      id: 'dl-foundation',
      title: 'Classes 5–7 Mental Math & Foundations Master Chart',
      classLevel: 'Classes 5–7',
      fileSize: '950 KB',
      pages: 6,
      category: 'Foundation',
      description: 'Fraction addition rules, divisibility tricks, LCM/HCF shortcuts, and integer sign rules chart for study table wall mounting.',
    },
  ];

  const handleDownload = (item: DownloadItem) => {
    // Generate text/blob file download simulation
    const blob = new Blob(
      [
        `=======================================================\n` +
        `MATHS AT YOUR FINGERTIPS (mayf.co.in)\n` +
        `Official Student Revision Asset: ${item.title}\n` +
        `Target Grade: ${item.classLevel} | Category: ${item.category}\n` +
        `=======================================================\n\n` +
        `Document Contents:\n` +
        `${item.description}\n\n` +
        `Verified by Professor Sigma. All CBSE & ICSE syllabus standards included.\n` +
        `Download generated: ${new Date().toLocaleString()}\n`
      ],
      { type: 'text/plain' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.id}-${item.classLevel.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedIds((prev) => [...prev, item.id]);
  };

  return (
    <DashboardLayout
      title="Downloadable Revision Materials"
      subtitle="High-resolution, printable PDF notes and formula cheat sheets for offline study."
    >
      <div className="space-y-4">
        {downloads.map((item) => {
          const isDownloaded = downloadedIds.includes(item.id);
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
