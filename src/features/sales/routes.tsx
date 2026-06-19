import { lazy } from 'react';
import type { FeatureRoute } from '../../routes/utils';
import { PERMISSIONS } from '../auth/constants';

const SalesDataPage = lazy(() => import('./pages/SalesDataPage'));
const DebtTrackingPage = lazy(() => import('./pages/DebtTrackingPage'));
const RevenueDashboardPage = lazy(() => import('./pages/RevenueDashboardPage'));
const CommissionPage = lazy(() => import('./pages/CommissionPage'));

export const salesRoutes: FeatureRoute[] = [
  {
    path: '/sales/data',
    element: <SalesDataPage />,
    permission: PERMISSIONS.VIEW_ALL_SALES,
  },
  {
    path: '/sales/debt',
    element: <DebtTrackingPage />,
    permission: PERMISSIONS.VIEW_ALL_SALES,
  },
  {
    path: '/sales/dashboard',
    element: <RevenueDashboardPage />,
    permission: PERMISSIONS.VIEW_ALL_SALES,
  },
  {
    path: '/sales/commission',
    element: <CommissionPage />,
    permission: PERMISSIONS.VIEW_ALL_SALES,
  },
];
