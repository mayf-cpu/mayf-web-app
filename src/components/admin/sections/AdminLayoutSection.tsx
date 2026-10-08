import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Save,
  Menu,
} from 'lucide-react';
import { Button } from '../../ui/Button';

interface LayoutBlock {
  id: string;
  name: string;
  placement: string;
  enabled: boolean;
  order: number;
}

const INITIAL_BLOCKS: LayoutBlock[] = [
  { id: 'b-hero', name: 'Academic Hero & Wordmark', placement: 'Homepage Top', enabled: true, order: 1 },
  { id: 'b-promo', name: 'Authoritative Promotional Banner', placement: 'Homepage & Catalogue', enabled: true, order: 2 },
  { id: 'b-selector', name: 'Class 5–10 Standard Selector', placement: 'Homepage Middle', enabled: true, order: 3 },
  { id: 'b-formulas', name: 'Live Formula Flashcards Preview', placement: 'Homepage Middle', enabled: true, order: 4 },
  { id: 'b-solved', name: 'Worked NCERT Exemplar Problems', placement: 'Homepage Middle', enabled: true, order: 5 },
  { id: 'b-pass', name: 'Annual Pass Pricing & Value Comparison', placement: 'Homepage Lower', enabled: true, order: 6 },
  { id: 'b-iab-banner', name: 'In-App Browser Recommendation Banner', placement: 'Top Sticky Header', enabled: true, order: 7 },
];

export const AdminLayoutSection: React.FC = () => {
  const [blocks, setBlocks] = useState<LayoutBlock[]>(INITIAL_BLOCKS);
  const [saved, setSaved] = useState(false);

  const toggleBlock = (id: string) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...blocks];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setBlocks(next);
  };

  const moveDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const next = [...blocks];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setBlocks(next);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Homepage & Public Layout Composition
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure section hierarchy, visibility, and navigation structure across desktop and mobile.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleSave} className="gap-1.5 shadow-xs">
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? 'Saved Layout!' : 'Save Layout Order'}</span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs font-semibold text-slate-600">
          <span>Managed Page Blocks</span>
          <span className="font-mono text-[11px] text-blue-700">Client-Side Dynamic Assembly</span>
        </div>

        <div className="divide-y divide-slate-100">
          {blocks.map((block, idx) => (
            <div
              key={block.id}
              className="p-4 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400 font-bold w-4 text-center">
                  {idx + 1}
                </span>
                <div>
                  <p className="font-heading font-bold text-slate-900">{block.name}</p>
                  <p className="text-[11px] text-slate-500">{block.placement}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleBlock(block.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                    block.enabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {block.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{block.enabled ? 'Enabled' : 'Hidden'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveUp(idx)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    title="Move up"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === blocks.length - 1}
                    onClick={() => moveDown(idx)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
