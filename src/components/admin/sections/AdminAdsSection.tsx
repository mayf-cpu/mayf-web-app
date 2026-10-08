import React, { useState, useEffect } from 'react';
import { PromotionsManagementTab } from '../PromotionsManagementTab';
import { auth } from '../../../lib/firebase/client';

export const AdminAdsSection: React.FC = () => {
  const [token, setToken] = useState('Bearer dev-admin-token-2026vivekkushwah@gmail.com');

  useEffect(() => {
    if (auth?.currentUser) {
      auth.currentUser.getIdToken().then((t) => setToken(`Bearer ${t}`));
    }
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
          Promotional Banners & Marketing Blocks
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage homepage and curriculum catalogue marketing blocks, CTA destinations, and countdown timers.
        </p>
      </div>
      <PromotionsManagementTab authHeaders={{ Authorization: token }} />
    </div>
  );
};
