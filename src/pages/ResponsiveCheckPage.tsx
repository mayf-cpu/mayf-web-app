import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SeoHead } from '../components/common/SeoHead';

/** Staging-only, admin-only layout inspection at real iframe viewport widths. */
export function ResponsiveCheckPage() {
  const { loading, entitlements } = useAuth();
  const [width, setWidth] = useState(390);
  const [path, setPath] = useState('/');
  const [measurement, setMeasurement] = useState('Load a page, then measure its layout.');
  if (loading) return <p>Verifying administrator…</p>;
  if (!entitlements.isAdmin) return <p>Administrator sign-in required.</p>;
  const measure = () => {
    const frame = document.getElementById('responsive-preview') as HTMLIFrameElement;
    const root = frame.contentDocument?.documentElement;
    if (root) setMeasurement(`Viewport ${root.clientWidth}px; page width ${root.scrollWidth}px; ${root.scrollWidth > root.clientWidth + 1 ? 'horizontal overflow detected' : 'no horizontal overflow'}.`);
  };
  return <main className="p-4 space-y-4">
    <SeoHead title="Staging layout acceptance" description="Internal responsive layout inspection" noindex />
    <h1>Staging responsive layout acceptance</h1>
    <label>Viewport width <select aria-label="Viewport width" value={width} onChange={e => { setWidth(Number(e.target.value)); setMeasurement('Measure the resized layout.'); }}>
      {[320, 390, 768, 1280].map(value => <option key={value} value={value}>{value}px</option>)}
    </select></label>
    <label>Page <select aria-label="Preview page" value={path} onChange={e => { setPath(e.target.value); setMeasurement('Loading page…'); }}>
      {['/', '/study-material', '/formula-deck', '/annual-pass', '/checkout?plan=annual-pass', '/ai-teacher', '/dashboard/purchases', '/mgmt-sec-k92a'].map(value => <option key={value}>{value}</option>)}
    </select></label>
    <button className="border rounded p-2" onClick={measure}>Measure horizontal overflow</button>
    <p role="status">{measurement}</p>
    <div className="overflow-auto"><iframe id="responsive-preview" title="MAYF responsive preview" src={path} style={{ width, height: 850, border: '1px solid #64748b', display: 'block', maxWidth: 'none' }} /></div>
  </main>;
}
