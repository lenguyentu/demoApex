import { Navigate, useParams } from 'react-router-dom';
import { Globe } from 'lucide-react';
import PageMeta from '../../../components/common/PageMeta';
import { LandingSetupTab } from '../components/LandingSetupTab';
import { CvQueueTab } from '../components/CvQueueTab';
import type { LandingTab } from '../types';

function isLandingTab(v: string | undefined): v is LandingTab {
  return v === 'setup' || v === 'queue';
}

export default function LandingPage() {
  const { tab } = useParams<{ tab?: string }>();

  if (!tab || !isLandingTab(tab)) {
    return <Navigate to="/landing/setup" replace />;
  }

  return (
    <>
      <PageMeta title={tab === 'setup' ? 'Landing — Setup' : 'Landing — CV Queue'} />
      <div className="min-h-screen bg-gray-50 pb-6 dark:bg-gray-950">
        <div className="mx-auto w-full px-4 pt-6 sm:px-6 lg:px-8">
          {tab !== 'setup' ? (
            <div className="mb-6 flex items-center gap-3">
              <Globe className="text-brand-500" size={28} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Landing Page</h1>
                <p className="text-sm text-gray-500">Hàng đợi CV từ landing</p>
              </div>
            </div>
          ) : null}

          {tab === 'setup' ? (
            <LandingSetupTab />
          ) : (
            <CvQueueTab />
          )}
        </div>
      </div>
    </>
  );
}
