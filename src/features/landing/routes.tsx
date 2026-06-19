import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { FeatureRoute } from '../../routes/utils';

const LandingPage = lazy(() => import('./pages/LandingPage'));

export const landingRoutes: FeatureRoute[] = [
  { path: '/hh/landing', element: <Navigate to="/landing/setup" replace /> },
  { path: '/landing/:tab', element: <LandingPage /> },
  { path: '/landing', element: <Navigate to="/landing/setup" replace /> },
];
