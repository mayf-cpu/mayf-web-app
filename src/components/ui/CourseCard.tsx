import React from 'react';
import { BookOpen, Layers, ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { StudentCourse } from '../../lib/firebase/types';
import { Badge } from './Badge';
import { Link, useNavigation } from '../../context/NavigationContext';

export interface CourseCardProps {
  course: StudentCourse;
  openInNewTab?: boolean;
  className?: string;
  showProgress?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  openInNewTab = false,
  className = '',
  showProgress = true,
}) => {
  const { navigate } = useNavigation();
  const progressPct = Math.round((course.completedChapters / course.totalChapters) * 100);
  const targetUrl = `/course/${course.slug}`;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    if (openInNewTab) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate(targetUrl);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group bg-white rounded-xl border border-[#E2E8F0] shadow-[0_4px_14px_-2px_rgba(29,78,216,0.04)] hover:shadow-[0_10px_24px_-4px_rgba(29,78,216,0.12)] hover:border-[#1D4ED8]/40 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer ${className}`}
    >
      {/* Top Gradient Ribbon */}
      <div className={`h-2.5 w-full bg-gradient-to-r ${course.bannerGradient || 'from-blue-600 to-indigo-800'}`} />

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Header badges */}
          <div className="flex items-center justify-between gap-2">
            <Badge variant="pro">{course.targetClass}</Badge>
            <span className="text-[11px] font-heading font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded">
              {course.level}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-heading font-bold text-base sm:text-lg text-[#0F172A] group-hover:text-[#1D4ED8] transition-colors leading-snug">
            {openInNewTab ? (
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {course.title}
              </a>
            ) : (
              <Link href={targetUrl} className="hover:underline">
                {course.title}
              </Link>
            )}
          </h3>

          {/* Description */}
          <p className="text-xs text-[#64748B] leading-relaxed line-clamp-3">
            {course.description}
          </p>

          {/* Topic Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {course.topics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="text-[10px] font-medium bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] px-2 py-0.5 rounded"
              >
                {topic}
              </span>
            ))}
            {course.topics.length > 4 && (
              <span className="text-[10px] font-medium text-[#64748B] px-1 py-0.5">
                +{course.topics.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Course Stats */}
        <div className="space-y-3 pt-3 border-t border-[#F1F5F9]">
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#00687A]" />
              <span>{course.totalChapters} Chapters</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>{course.totalFormulas} Key Formulas</span>
            </div>
          </div>

          {showProgress && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[#64748B] font-mono">
                <span>Completed: {course.completedChapters}/{course.totalChapters}</span>
                <span className="font-bold text-[#1D4ED8]">{progressPct}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1D4ED8] rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Strip */}
      <div className="bg-[#FAFBFD] border-t border-[#F1F5F9] px-5 py-3 flex items-center justify-between text-xs">
        <span className="text-[11px] font-mono text-[#00687A] font-semibold">
          Standalone Course
        </span>
        <span className="font-heading font-semibold text-[#1D4ED8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          <span>{openInNewTab ? 'Open in New Tab' : 'View Course'}</span>
          {openInNewTab ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5" />
          )}
        </span>
      </div>
    </div>
  );
};
