import { lazy } from 'react';
import type { FeatureRoute } from '../../routes/utils';
import { PERMISSIONS } from '../auth/constants';

const TeamDashboardPage = lazy(() => import('./pages/TeamDashboardPage'));
const HHDashboardPage   = lazy(() => import('./pages/HHDashboardPage'));
const JobFocusPage      = lazy(() => import('./pages/JobFocusPage'));
const HHKPIPage         = lazy(() => import('./pages/HHKPIPage'));
const WeeklyReportPage  = lazy(() => import('./pages/WeeklyReportPage'));
const HHProcessPage     = lazy(() => import('./pages/HHProcessPage'));

export const managerRoutes: FeatureRoute[] = [
  { path: '/manager/team',    element: <TeamDashboardPage />, permission: PERMISSIONS.VIEW_PROCESSES },
  { path: '/hh/dashboard',   element: <HHDashboardPage />,   permission: PERMISSIONS.VIEW_PROCESSES },
  { path: '/hh/jobs',        element: <JobFocusPage />,       permission: PERMISSIONS.VIEW_PROCESSES },
  { path: '/hh/process',     element: <HHProcessPage />,      permission: PERMISSIONS.VIEW_PROCESSES },
  { path: '/hh/kpi',         element: <HHKPIPage />,          permission: PERMISSIONS.VIEW_PROCESSES },
  { path: '/hh/report',      element: <WeeklyReportPage />,   permission: PERMISSIONS.VIEW_PROCESSES },
];
