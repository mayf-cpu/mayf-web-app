import React, { useState } from 'react';
import { Palette, CheckCircle2, Save, Type, Eye } from 'lucide-react';
import { Button } from '../../ui/Button';

export const AdminBrandingSection: React.FC = () => {
  const [appName, setAppName] = useState('Maths at Your Fingertips');
  const [wordmarkGlyph, setWordmarkGlyph] = useState('Σ');
  const [primaryColor, setPrimaryColor] = useState('#1D4ED8');
  const [accentColor, setAccentColor] = useState('#06B6D4');
  const [tagline, setTagline] = useState('The authoritative digital math companion for Class 5–10 students.');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
            Brand Identity & Visual Design Tokens
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure academic typography, Greek Sigma mark, color harmonies, and official brand copy.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={handleSave} className="gap-1.5 shadow-xs">
          <Save className="w-3.5 h-3.5" />
          <span>{saved ? 'Saved Branding!' : 'Save Brand Settings'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Editor Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-600" />
            <span>Brand Constants</span>
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Platform Brand Name:</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-bold focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Logo Glyph (Greek Sigma):</label>
            <input
              type="text"
              value={wordmarkGlyph}
              onChange={(e) => setWordmarkGlyph(e.target.value)}
              className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-lg text-center font-extrabold text-blue-700 focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Academic Tagline:</label>
            <textarea
              rows={2}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Primary Color:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <span className="font-mono text-xs text-slate-700">{primaryColor}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Accent Color:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <span className="font-mono text-xs text-slate-700">{accentColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Brand Preview Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Live Header Brand Preview</span>
          </h3>

          <div className="p-4 rounded-xl border border-slate-200 bg-[#F7F9FB] space-y-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-heading font-extrabold text-xl shadow-xs"
                style={{ backgroundColor: primaryColor }}
              >
                {wordmarkGlyph}
              </div>
              <div>
                <span className="font-heading font-extrabold text-lg tracking-tight text-slate-900 block">
                  {appName}
                </span>
                <span className="text-[11px] font-mono text-slate-500">Official Portal · mayf.co.in</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed italic">
              &ldquo;{tagline}&rdquo;
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2 py-0.5 rounded text-white text-[11px] font-bold" style={{ backgroundColor: primaryColor }}>
                Primary Action
              </span>
              <span className="px-2 py-0.5 rounded text-slate-900 text-[11px] font-bold" style={{ backgroundColor: accentColor + '30', color: accentColor }}>
                Math Highlighting
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
