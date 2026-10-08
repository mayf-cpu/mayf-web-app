import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { INITIAL_CHAPTERS, INITIAL_FORMULAS } from '../../../data/curriculumData';
import { STUDENT_COURSES } from '../../../data/coursesData';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';

export const AdminContentSection: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const contentItems = [
    ...INITIAL_CHAPTERS.map((ch) => ({
      id: ch.id,
      title: ch.title,
      type: 'Chapter / PDF',
      classes: [ch.classLevel],
      category: ch.category,
      accessType: 'free',
      status: 'published',
      views: 1240,
      slug: ch.slug,
      url: `/study/${ch.slug}`,
    })),
    ...INITIAL_FORMULAS.map((f) => ({
      id: f.id,
      title: f.title,
      type: 'Formula Flashcard',
      classes: f.applicableClasses,
      category: f.category,
      accessType: 'free',
      status: 'published',
      views: 3180,
      slug: f.slug,
      url: `/formula/${f.slug}`,
    })),
    ...STUDENT_COURSES.map((c) => ({
      id: c.id,
      title: c.title,
      type: 'Structured Course',
      classes: [c.targetClass],
      category: 'Curriculum',
      accessType: 'paid',
      status: 'published',
      views: 890,
      slug: c.slug,
      url: `/course/${c.slug}`,
    })),
  ];

  const filteredItems = contentItems.filter((item) => {
    if (selectedClass !== 'All' && !item.classes.includes(selectedClass as any)) return false;
    if (selectedType !== 'All' && item.type !== selectedType) return false;
    if (
      searchQuery &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.category.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Academic Content Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage public curriculum resources, KaTeX formula decks, test papers, and video courses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" className="gap-1.5 shadow-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Resource</span>
          </Button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by topic, theorem name, chapter (e.g. 'Quadratic', 'BPT', 'Pythagoras')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              aria-label="Filter content by grade"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-heading font-medium text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="All">All Grades (5–10)</option>
              <option value="Class 5">Class 5</option>
              <option value="Class 6">Class 6</option>
              <option value="Class 7">Class 7</option>
              <option value="Class 8">Class 8</option>
              <option value="Class 9">Class 9</option>
              <option value="Class 10">Class 10</option>
            </select>

            <select
              aria-label="Filter content by type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-heading font-medium text-slate-700 cursor-pointer focus:outline-hidden"
            >
              <option value="All">All Resource Types</option>
              <option value="Chapter / PDF">Chapter / PDF</option>
              <option value="Formula Flashcard">Formula Flashcard</option>
              <option value="Structured Course">Structured Course</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>{filteredItems.length} Content Resources Found</span>
          <span className="font-mono text-[11px] text-blue-700">Standalone indexable canonical URLs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-heading text-[10px]">
              <tr>
                <th className="px-5 py-3">Resource Title</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Target Grades</th>
                <th className="px-4 py-3">Subject Category</th>
                <th className="px-4 py-3">Access Tier</th>
                <th className="px-4 py-3 text-right">Views</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-heading font-bold text-slate-900 line-clamp-1">{item.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">{item.url}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-blue-700">{item.classes.join(', ')}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{item.category}</td>
                  <td className="px-4 py-3.5">
                    {item.accessType === 'free' ? (
                      <Badge variant="free">FREE</Badge>
                    ) : (
                      <Badge variant="pro">ANNUAL PASS</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums text-slate-600">
                    {item.views.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 inline-block"
                      title="Open standalone page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 inline-block cursor-pointer"
                      title="Edit metadata"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
