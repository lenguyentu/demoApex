import { lazy } from 'react';
import type { FeatureRoute } from '../../routes/utils';
import { PERMISSIONS } from '../auth/constants';

const ResearchQueuePage = lazy(() =>
  import('./pages/ResearchQueuePage').then(m => ({ default: m.ResearchQueuePage }))
);

const ResearchDashboardPage = lazy(() =>
  import('./pages/ResearchDashboardPage').then(m => ({ default: m.ResearchDashboardPage }))
);



export const researchRoutes: FeatureRoute[] = [
  {
    path: '/research/queue',
    element: <ResearchQueuePage />,
    permission: PERMISSIONS.VIEW_RESEARCH_QUEUE,
  },
  {
    path: '/research/dashboard',
    element: <ResearchDashboardPage />,
    permission: PERMISSIONS.VIEW_RESEARCH_QUEUE,
  },

];
