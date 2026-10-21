import React from 'react';
import { CouponsManagementTab } from '../CouponsManagementTab';

export const AdminCouponsSection: React.FC = () => {
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
      <CouponsManagementTab />
    </div>
  );
};
