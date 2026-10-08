import React, { useState, useEffect } from 'react';
import {
  LayoutTemplate,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Save,
  RotateCcw,
  Sliders,
  Megaphone,
  Info,
  X,
  ExternalLink,
  Eye,
  Lock,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { PromotionsManagementTab } from '../PromotionsManagementTab';
import { adminService } from '../../../services/adminService';
import { auth } from '../../../lib/firebase/client';
import {
  AdSenseSettings,
  DEFAULT_ADSENSE_SETTINGS,
  AdSensePageZone,
} from '../../../lib/adsense/adsenseTypes';

type AdsTab = 'adsense_general' | 'placements' | 'promotions';

const ZONE_LABELS: Record<AdSensePageZone, { title: string; desc: string }> = {
  homepage: {
    title: 'Homepage Placement',
    desc: 'Rendered below core curriculum cards and before educational footer.',
  },
  catalogue: {
    title: 'Study Materials Catalogue',
    desc: 'Header banner above Class 5–10 chapter selector cards.',
  },
  search: {
    title: 'Global Math Search',
    desc: 'Placed below verified theorem and formula search query results.',
  },
  content: {
    title: 'Study Chapter / Material View',
    desc: 'Bottom section of chapter notes; strictly outside test questions or formulas.',
  },
  formulaPages: {
    title: 'Formula Deck & Detail Pages',
    desc: 'Subordinate placement below formula proofs and KaTeX cards.',
  },
};

export const AdminAdsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdsTab>('adsense_general');
  const [config, setConfig] = useState<AdSenseSettings>(DEFAULT_ADSENSE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [token, setToken] = useState('Bearer dev-admin-token-2026vivekkushwah@gmail.com');

  useEffect(() => {
    if (auth?.currentUser) {
      auth.currentUser.getIdToken().then((t) => setToken(`Bearer ${t}`));
    }
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminAdSenseConfig();
      if (res.success && res.config) {
        setConfig(res.config);
      }
    } catch (e: any) {
      showMessage('Could not load AdSense settings; displaying defaults.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await adminService.updateAdminAdSenseConfig(config);
      if (res.success && res.config) {
        setConfig(res.config);
        showMessage('AdSense configuration and minor protection settings saved.');
      } else {
        showMessage(res.error || 'Failed to update settings.', 'error');
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to update settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Reset all AdSense placements and minor protection settings to default safe configuration?'
    );
    if (!confirmed) return;

    setSaving(true);
    try {
      const res = await adminService.resetAdminAdSenseConfig();
      if (res.success && res.config) {
        setConfig(res.config);
        showMessage('AdSense configuration reset to safe child-compliant defaults.');
      } else {
        showMessage(res.error || 'Failed to reset settings.', 'error');
      }
    } catch (e: any) {
      showMessage(e?.message || 'Failed to reset settings.', 'error');
    } finally {
      setSaving(false);
    }
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
            <LayoutTemplate className="w-5 h-5 text-blue-600" />
            <span>AdSense & Educational Promotions Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage reusable AdSense slots, minor/child-safe age treatment (COPPA), and CLS dimension reservation.
          </p>
        </div>

        {activeTab !== 'promotions' && (
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
              <span>{saving ? 'Saving...' : 'Save Ad Settings'}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {[
          { id: 'adsense_general', label: 'AdSense & Minor Protection (COPPA)', icon: ShieldCheck },
          { id: 'placements', label: 'Placement Slots & CLS Dimensions', icon: Sliders },
          { id: 'promotions', label: 'Promotional Banners & Marketing', icon: Megaphone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdsTab)}
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
      {/* TAB 1: ADSENSE & MINOR PROTECTION (COPPA / DPDP)              */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'adsense_general' && (
        <div className="space-y-6">
          {/* Master Enable and Publisher ID */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <h3 className="font-heading font-bold text-sm text-slate-900">
              Master AdSense Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">AdSense Master Toggle</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    When disabled, all advertising slots across the portal are completely hidden.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={config.adsenseEnabled}
                    onChange={(e) => setConfig({ ...config, adsenseEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Google Publisher ID:</label>
                <input
                  type="text"
                  value={config.publisherId}
                  onChange={(e) => setConfig({ ...config, publisherId: e.target.value.trim() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white"
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                />
                <p className="text-[10px] text-slate-400">Must start with ca-pub-</p>
              </div>
            </div>
          </div>

          {/* Child & Minor Protection Architecture */}
          <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-base text-slate-900">
                  Child & Teen Age-Treatment Architecture (COPPA & DPDP Act)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Because Maths at Your Fingertips serves school students in Classes 5 to 10 (ages 10–16), standard
                  personalized behavioral profiling is <strong>strictly prohibited</strong>. AdSense requests must tag
                  requests with child-directed and under-age flags.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* TFCD */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">Tag For Child-Directed Treatment (TFCD)</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
                      COPPA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Flags requests under the US COPPA statute so Google treats them as child-directed content.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.minorProtection.tagForChildDirectedTreatment}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      minorProtection: {
                        ...config.minorProtection,
                        tagForChildDirectedTreatment: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 mt-1 cursor-pointer"
                />
              </div>

              {/* TFUA */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900">Tag For Under Age of Consent (TFUA)</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 font-mono font-bold">
                      GDPR-K / DPDP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Treats users as under the age of digital consent; completely disables remarketing cookies.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.minorProtection.tagForUnderAgeOfConsent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      minorProtection: {
                        ...config.minorProtection,
                        tagForUnderAgeOfConsent: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 mt-1 cursor-pointer"
                />
              </div>

              {/* NPA */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900">Enforce Non-Personalized Ads (NPA) Only</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Serves only contextual ads based on mathematical topic; disables user identifier tracking.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={config.minorProtection.nonPersonalizedAdsOnly}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      minorProtection: {
                        ...config.minorProtection,
                        nonPersonalizedAdsOnly: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 mt-1 cursor-pointer"
                />
              </div>

              {/* Max Content Rating */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-bold text-xs text-slate-900">Maximum Ad Content Rating</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Restricts ads to General Audiences. Teen/mature advertising categories are blocked.
                  </p>
                </div>
                <select
                  value={config.minorProtection.maxAdContentRating}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      minorProtection: {
                        ...config.minorProtection,
                        maxAdContentRating: e.target.value as 'G' | 'PG',
                      },
                    })
                  }
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="G">G – General Audiences (Recommended)</option>
                  <option value="PG">PG – Parental Guidance</option>
                </select>
              </div>
            </div>
          </div>

          {/* Strict Prohibited Zones Policy Box */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="font-heading font-extrabold text-sm text-rose-900">
                Authoritative Prohibited Zones (Zero Advertising Enforced)
              </h3>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              In accordance with educational pedagogical standards and anti-deceptive UX rules, ads are programmatically blocked in the following zones:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
              <div className="p-3 bg-white rounded-lg border border-rose-200 font-semibold text-rose-900 flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Inside individual AI Teacher solution steps</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-rose-200 font-semibold text-rose-900 flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Over purchase / Annual Pass controls</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-rose-200 font-semibold text-rose-900 flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Over navigation bars or modals</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-rose-200 font-semibold text-rose-900 flex items-center gap-2">
                <X className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Over forms or verification fields</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: PLACEMENT SLOTS & CLS DIMENSIONS                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'placements' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-heading font-bold block">CLS (Cumulative Layout Shift) Dimension Reservation</span>
              <p className="mt-0.5 text-blue-800 leading-relaxed">
                Each placement pre-allocates an exact reserved height (<code className="font-mono">minHeightPx</code>) in the DOM prior to script execution. This eliminates content shifts and keeps Google Core Web Vitals at a perfect score.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {(['homepage', 'catalogue', 'search', 'content', 'formulaPages'] as AdSensePageZone[]).map((zone) => {
              const p = config.placements[zone];
              const meta = ZONE_LABELS[zone];

              return (
                <div
                  key={zone}
                  className={`bg-white rounded-xl border p-5 shadow-2xs transition-all ${
                    p.enabled ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200 opacity-90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-extrabold text-sm text-slate-900">
                          {meta.title}
                        </span>
                        <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          Zone: {zone}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={p.enabled}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            placements: {
                              ...config.placements,
                              [zone]: { ...p, enabled: e.target.checked },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-2 text-xs font-semibold text-slate-700">
                        {p.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Ad Slot Identifier:</label>
                      <input
                        type="text"
                        value={p.slotId}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            placements: {
                              ...config.placements,
                              [zone]: { ...p, slotId: e.target.value.trim() },
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
                        placeholder="e.g. 1001-mayf-slot"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Placement Position:</label>
                      <select
                        value={p.position}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            placements: {
                              ...config.placements,
                              [zone]: { ...p, position: e.target.value as any },
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs cursor-pointer"
                      >
                        <option value="top">Top Banner (Header Strip)</option>
                        <option value="inline">Inline (Between Cards)</option>
                        <option value="bottom">Bottom (Above Footer)</option>
                        <option value="sidebar">Sidebar Slot</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Reserved Min Height (CLS Guard):</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={50}
                          max={600}
                          value={p.minHeightPx}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              placements: {
                                ...config.placements,
                                [zone]: { ...p, minHeightPx: Number(e.target.value) },
                              },
                            })
                          }
                          className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                        <span className="text-slate-500 font-mono text-[11px]">px reserved</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: PROMOTIONAL BANNERS                                    */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <PromotionsManagementTab authHeaders={{ Authorization: token }} />
        </div>
      )}
    </div>
  );
};
