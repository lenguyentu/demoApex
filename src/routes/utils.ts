import type { RouteObject } from 'react-router-dom';

export type FeatureRoute = RouteObject & {
  requiredPermission?: string;
  permission?: string;
};
