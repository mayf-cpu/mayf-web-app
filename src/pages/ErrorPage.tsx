import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export interface ErrorPageProps {
  error?: Error | null;
  onReset?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error, onReset }) => {
  return (
    <main role="alert" className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md mx-auto text-center py-12 sm:py-20 space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div>
          <h1 className="font-heading font-extrabold text-2xl text-[#991B1B]">
            This page could not load
          </h1>
          <p className="text-xs sm:text-sm text-[#7F1D1D] mt-2 leading-relaxed">
            {error && /dynamically imported|Loading chunk|Importing a module/i.test(error.message)
              ? 'The website may have been updated. Reload this page to continue.'
              : 'Please reload this page and try again.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onReset && (
            <Button
              size="md"
              variant="primary"
              onClick={onReset}
              className="gap-2 w-full sm:w-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload page</span>
            </Button>
          )}

          <a href="/">
            <Button size="md" variant="outline" className="gap-2 w-full sm:w-auto">
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </a>
        </div>
      </div>
    </main>
  );
};
