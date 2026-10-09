import React, { useState, useEffect } from 'react';
import {
  Palette,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Save,
  RotateCcw,
  Eye,
  Globe,
  Share2,
  Headphones,
  Sliders,
  ShieldCheck,
  ShieldAlert,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  Type,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { adminService } from '../../../services/adminService';
import {
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
} from '../../../lib/settings/siteSettingsTypes';
import { inspectSecuritySafety } from '../../../lib/security/sanitizer';

type ActiveTab = 'brand' | 'colors' | 'social_contact' | 'homepage_copy' | 'security';

export const AdminBrandingSection: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('brand');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Security test sandbox state
  const [testInput, setTestInput] = useState<string>('<script>alert("xss")</script> Welcome to Maths');
  const [securityTestResult, setSecurityTestResult] = useState<{ safe: boolean; violations: string[] } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminSiteSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (e: any) {
      showMessage('Failed to load site settings from server. Showing local defaults.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);

    // Pre-flight client-side security inspection
    const safetyCheck = inspectSecuritySafety(settings);
    if (!safetyCheck.safe) {
      setSaving(false);
      showMessage(
        `Security Notice: Prohibited executable markup detected (${safetyCheck.violations[0]}). Please remove script/HTML tags.`,
        'error'
      );
      return;
    }

    try {
      const res = await adminService.updateAdminSiteSettings(settings);
      if (res.success && res.settings) {
        setSettings(res.settings);
        showMessage('Site settings and branding successfully saved to Firestore & live cache.');
      } else {
        showMessage(res.error || 'Failed to save settings.', 'error');
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const res = await adminService.resetAdminSiteSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
        showMessage('Site settings reset to canonical defaults.');
      } else {
        showMessage(res.error || 'Failed to reset settings.', 'error');
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to reset settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const runSecurityTest = () => {
    const inspection = inspectSecuritySafety({ testField: testInput });
    setSecurityTestResult(inspection);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between gap-3 shadow-xs transition-all ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            <span>Brand Identity & Global Site Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage logos, favicon, colors, social channels, support contacts, and controlled homepage copy.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={saving || loading}
            className="gap-1.5 shadow-xs text-slate-600 hover:text-rose-600"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleSave}
            disabled={saving || loading}
            className="gap-1.5 shadow-xs bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Site Settings'}</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'brand', label: 'Logo & Brand Identity', icon: ImageIcon },
          { id: 'colors', label: 'Color Palette & Theme', icon: Palette },
          { id: 'social_contact', label: 'Social & Support Links', icon: Share2 },
          { id: 'homepage_copy', label: 'Controlled Homepage Copy', icon: Sliders },
          { id: 'security', label: 'Security & Sanitization Shield', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-heading font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: LOGO & BRAND IDENTITY                                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'brand' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Visual Brand Assets & Official Nomenclature
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Official Site Name:</label>
                <input
                  type="text"
                  value={settings.brand.siteName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      brand: { ...settings.brand, siteName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white"
                  placeholder="Maths at Your Fingertips"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Short Name / Monogram:</label>
                <input
                  type="text"
                  value={settings.brand.shortName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      brand: { ...settings.brand, shortName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:bg-white"
                  placeholder="MAYF"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Logo Image URL (Primary):</label>
                <input
                  type="text"
                  value={settings.brand.logoUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      brand: { ...settings.brand, logoUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white"
                  placeholder="https://.../logo.png or /logo.svg (Optional)"
                />
                <p className="text-[10px] text-slate-400">Leave blank to use default Greek Sigma mark</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Alternative Logo URL (Dark / Monochrome):</label>
                <input
                  type="text"
                  value={settings.brand.altLogoUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      brand: { ...settings.brand, altLogoUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white"
                  placeholder="https://.../logo-white.png (Optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Favicon URL / Path:</label>
                <input
                  type="text"
                  value={settings.brand.faviconUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      brand: { ...settings.brand, faviconUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white"
                  placeholder="/favicon.ico or https://.../favicon.png"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Wordmark Fallback Glyph:</label>
                <input
                  type="text"
                  maxLength={4}
                  value={settings.brand.wordmarkGlyph}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      brand: { ...settings.brand, wordmarkGlyph: e.target.value },
                    })
                  }
                  className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-lg text-center font-extrabold text-blue-700 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Academic Tagline:</label>
              <textarea
                rows={2}
                value={settings.brand.tagline}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    brand: { ...settings.brand, tagline: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Global Footer Description Text:</label>
              <textarea
                rows={3}
                value={settings.brand.footerText}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    brand: { ...settings.brand, footerText: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Copyright Statement:</label>
              <input
                type="text"
                value={settings.brand.copyrightText}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    brand: { ...settings.brand, copyrightText: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:bg-white"
              />
            </div>
          </div>

          {/* Live Preview Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Live Brand Preview</span>
              </h3>

              {/* Header Wordmark Preview */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Header Appearance</span>
                <div className="flex items-center gap-2.5">
                  {settings.brand.logoUrl ? (
                    <img
                      src={settings.brand.logoUrl}
                      alt={settings.brand.siteName}
                      className="w-8 h-8 rounded-lg object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-heading font-extrabold text-base shadow-xs"
                      style={{ backgroundColor: settings.colors.primaryColor }}
                    >
                      {settings.brand.wordmarkGlyph || 'Σ'}
                    </div>
                  )}
                  <div>
                    <span className="font-heading font-extrabold text-sm text-slate-900 block leading-tight">
                      {settings.brand.siteName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {settings.brand.shortName} · mayf.co.in
                    </span>
                  </div>
                </div>
              </div>

              {/* Tagline Card */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-1.5">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Tagline</span>
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  &ldquo;{settings.brand.tagline}&rdquo;
                </p>
              </div>

              {/* Footer Preview */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Footer Text</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {settings.brand.footerText}
                </p>
                <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400">
                  © {new Date().getFullYear()} {settings.brand.copyrightText}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: COLOR PALETTE & THEME                                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'colors' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Color Token Values
            </h3>
            <p className="text-xs text-slate-500">
              Changes apply instantly across headers, buttons, highlights, and math formula callouts.
            </p>

            <div className="space-y-4">
              {/* Primary Color */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-900 block">Primary Brand Color</label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Used for primary action buttons, header monogram, and authoritative headings.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <input
                    type="color"
                    value={settings.colors.primaryColor}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        colors: { ...settings.colors, primaryColor: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer shadow-xs"
                  />
                  <input
                    type="text"
                    value={settings.colors.primaryColor}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        colors: { ...settings.colors, primaryColor: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-slate-800 text-center uppercase"
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-900 block">Secondary Deep Color</label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Used for card headers, deeper navigation chrome, and annual pass banners.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <input
                    type="color"
                    value={settings.colors.secondaryColor}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        colors: { ...settings.colors, secondaryColor: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer shadow-xs"
                  />
                  <input
                    type="text"
                    value={settings.colors.secondaryColor}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        colors: { ...settings.colors, secondaryColor: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-slate-800 text-center uppercase"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-900 block">Accent Highlight Color</label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Used for math badges, step indicators, solved tags, and formula chips.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <input
                    type="color"
                    value={settings.colors.accentColor}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        colors: { ...settings.colors, accentColor: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer shadow-xs"
                  />
                  <input
                    type="text"
                    value={settings.colors.accentColor}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        colors: { ...settings.colors, accentColor: e.target.value.toUpperCase() },
                      })
                    }
                    className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-mono text-xs font-bold text-slate-800 text-center uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Palette Harmonies Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Theme Composition Preview</span>
            </h3>

            <div className="p-5 rounded-xl border border-slate-200 bg-[#F7F9FB] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="font-heading font-extrabold text-sm text-slate-900">Button & Chip Harmony</span>
                <span
                  className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-2xs"
                  style={{ backgroundColor: settings.colors.primaryColor }}
                >
                  Primary
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-white font-heading font-bold text-xs shadow-xs"
                  style={{ backgroundColor: settings.colors.primaryColor }}
                >
                  Explore Curriculum
                </button>

                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-white font-heading font-bold text-xs shadow-xs"
                  style={{ backgroundColor: settings.colors.secondaryColor }}
                >
                  Ask AI Doubt
                </button>

                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: settings.colors.accentColor + '20',
                    color: settings.colors.accentColor,
                  }}
                >
                  Theorem Proof
                </span>
              </div>

              {/* Sample Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">Class 10 · Quadratic Equations</span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                    style={{ backgroundColor: settings.colors.accentColor + '25', color: settings.colors.accentColor }}
                  >
                    100% Free
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Derivation of Sridharacharya formula with discriminant analysis.
                </p>
                <div
                  className="text-xs font-bold pt-1 cursor-pointer"
                  style={{ color: settings.colors.primaryColor }}
                >
                  View Step-by-Step Breakdown →
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: SOCIAL & SUPPORT LINKS                                 */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'social_contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Social Links */}
          <div className="space-y-4 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              <span>Official Social Media Communities</span>
            </h3>
            <p className="text-xs text-slate-500">
              Appears in footer navigation and homepage community blocks.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">YouTube Channel:</label>
                <input
                  type="text"
                  value={settings.social.youtube}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, youtube: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  placeholder="https://youtube.com/@MathsAtYourFingertips"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Telegram Channel:</label>
                <input
                  type="text"
                  value={settings.social.telegram}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, telegram: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  placeholder="https://t.me/mayf_mathematics"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">WhatsApp Community Invite:</label>
                <input
                  type="text"
                  value={settings.social.whatsapp}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, whatsapp: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Instagram Profile:</label>
                <input
                  type="text"
                  value={settings.social.instagram}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, instagram: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  placeholder="https://instagram.com/mayf_math"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Facebook Page:</label>
                <input
                  type="text"
                  value={settings.social.facebook}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, facebook: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  placeholder="https://facebook.com/mayfmath"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">X (Twitter) Handle:</label>
                <input
                  type="text"
                  value={settings.social.twitter}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      social: { ...settings.social, twitter: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  placeholder="https://x.com/mayf_math"
                />
              </div>
            </div>
          </div>

          {/* Contact & Support Links */}
          <div className="space-y-4 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-emerald-600" />
              <span>Contact & Student Support Helpdesk</span>
            </h3>
            <p className="text-xs text-slate-500">
              Official student inquiry and statutory Grievance Officer contacts.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Support Email:</label>
                <input
                  type="email"
                  value={settings.contact.supportEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, supportEmail: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  placeholder="support@mayf.co.in"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Support Phone / Hotline:</label>
                <input
                  type="text"
                  value={settings.contact.supportPhone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, supportPhone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">WhatsApp Direct Support URL:</label>
                <input
                  type="text"
                  value={settings.contact.whatsappSupport}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, whatsappSupport: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  placeholder="https://wa.me/919876543210"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Help Desk / FAQ Link:</label>
                <input
                  type="text"
                  value={settings.contact.helpDeskUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, helpDeskUrl: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  placeholder="/study-material"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Grievance Officer Email:</label>
                <input
                  type="email"
                  value={settings.contact.grievanceEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, grievanceEmail: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800"
                  placeholder="grievance@mayf.co.in"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Support Hours:</label>
                <input
                  type="text"
                  value={settings.contact.operatingHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, operatingHours: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  placeholder="Monday to Saturday, 9:00 AM – 7:00 PM IST"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: CONTROLLED HOMEPAGE COPY                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'homepage_copy' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
            <Sliders className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-heading font-bold block">Controlled Section Text Manager</span>
              <p className="mt-0.5 text-blue-800 leading-relaxed">
                Configure standard text copy for core homepage sections. Arbitrary HTML or JavaScript tags are
                automatically sanitized and stripped before persistence to ensure 100% execution safety.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* HERO SECTION */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <span className="text-[10px] uppercase font-mono font-bold text-blue-600">Section 1</span>
              <h4 className="font-heading font-bold text-sm text-slate-900">Hero Section</h4>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Headline:</label>
                <input
                  type="text"
                  value={settings.homepageCopy.heroHeadline}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, heroHeadline: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Subheadline:</label>
                <textarea
                  rows={3}
                  value={settings.homepageCopy.heroSubheadline}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, heroSubheadline: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Academic Kicker:</label>
                <input
                  type="text"
                  value={settings.homepageCopy.heroKicker}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, heroKicker: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>

            {/* SEARCH & CATEGORIES */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <span className="text-[10px] uppercase font-mono font-bold text-blue-600">Section 2 & 3</span>
              <h4 className="font-heading font-bold text-sm text-slate-900">Search & Class Categories</h4>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Global Search Input Placeholder:</label>
                <input
                  type="text"
                  value={settings.homepageCopy.searchPlaceholder}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, searchPlaceholder: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Class Categories Title:</label>
                <input
                  type="text"
                  value={settings.homepageCopy.categoriesTitle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, categoriesTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Class Categories Subtitle:</label>
                <input
                  type="text"
                  value={settings.homepageCopy.categoriesSubtitle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, categoriesSubtitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>

            {/* AI TEACHER & FORMULA DECK */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <span className="text-[10px] uppercase font-mono font-bold text-blue-600">Section 4 & 5</span>
              <h4 className="font-heading font-bold text-sm text-slate-900">AI Teacher & Formula Deck</h4>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">AI Teacher Headline:</label>
                <input
                  type="text"
                  value={settings.homepageCopy.aiTeacherHeadline}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, aiTeacherHeadline: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">AI Teacher Subheadline:</label>
                <textarea
                  rows={2}
                  value={settings.homepageCopy.aiTeacherSubheadline}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, aiTeacherSubheadline: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Formula Deck Title:</label>
                <input
                  type="text"
                  value={settings.homepageCopy.formulaDeckTitle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, formulaDeckTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>

            {/* ANNUAL PASS & COMMUNITY */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <span className="text-[10px] uppercase font-mono font-bold text-blue-600">Section 6 & 7</span>
              <h4 className="font-heading font-bold text-sm text-slate-900">Annual Pass & Community</h4>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Annual Pass CTA Title:</label>
                <input
                  type="text"
                  value={settings.homepageCopy.annualPassTitle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, annualPassTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Annual Pass Guarantee Text:</label>
                <input
                  type="text"
                  value={settings.homepageCopy.annualPassGuarantee}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, annualPassGuarantee: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Social Community Title:</label>
                <input
                  type="text"
                  value={settings.homepageCopy.socialJoinTitle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      homepageCopy: { ...settings.homepageCopy, socialJoinTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: SECURITY & SANITIZATION SHIELD                         */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900">
                  Authoritative Anti-XSS & Code Injection Neutralizer
                </h3>
                <p className="text-xs text-slate-500">
                  Compliance with rule: &ldquo;Do not allow arbitrary executable HTML or JavaScript through the CMS.&rdquo;
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  HTML Stripping
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  All text copy fields strip <code className="text-blue-700">&lt;script&gt;</code>, <code className="text-blue-700">&lt;iframe&gt;</code>, <code className="text-blue-700">&lt;object&gt;</code>, and all DOM markup before storage.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  URL Scheme Protection
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Logos and links strictly permit <code className="text-blue-700">https://</code> or relative paths. Pseudo-protocols like <code className="text-rose-600">javascript:</code> or <code className="text-rose-600">data:</code> are blocked.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Style Injection Guard
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Colors are strictly enforced to match hexadecimal tokens (<code className="text-blue-700">#RRGGBB</code>). CSS expressions and breakout quotes are invalidated.
                </p>
              </div>
            </div>

            {/* Interactive Sanitizer Sandbox */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-600">
                Interactive Malscript Sandbox Test
              </h4>
              <p className="text-xs text-slate-500">
                Test input string below against the active security sanitizer to verify that executable code is detected and neutralized.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white"
                  placeholder="Enter sample text with HTML/script..."
                />
                <Button size="sm" variant="secondary" onClick={runSecurityTest} className="gap-1.5 shrink-0">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  <span>Test Security Engine</span>
                </Button>
              </div>

              {securityTestResult && (
                <div
                  className={`p-3.5 rounded-lg border text-xs ${
                    securityTestResult.safe
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {securityTestResult.safe ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Input is completely safe and free of executable markup.</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Security Block Triggered (Safe Neutralization Active):</span>
                      </div>
                      <ul className="list-disc list-inside text-[11px] opacity-90 pl-1">
                        {securityTestResult.violations.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
