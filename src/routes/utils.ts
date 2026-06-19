import type { RouteObject } from 'react-router-dom';

export interface FeatureRoute extends RouteObject {
  requiredPermission?: string;
}
