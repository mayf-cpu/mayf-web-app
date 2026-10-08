import React, { useState, useEffect } from 'react';
import { CouponsManagementTab } from '../CouponsManagementTab';
import { auth } from '../../../lib/firebase/client';

export const AdminCouponsSection: React.FC = () => {
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
          Coupon & Discount Rules Engine
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Server-side validated promotional vouchers with usage limits, cart minimums, and Annual Pass restrictions.
        </p>
      </div>
      <CouponsManagementTab authHeaders={{ Authorization: token }} />
    </div>
  );
};
