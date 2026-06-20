import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

const DashboardPage = lazy(() => import("./pages/DashboardPage").then(m => ({ default: m.DashboardPage })));

export const dashboardRoutes: FeatureRoute[] = [
  {
    path: "/",
    element: <DashboardPage />,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
];
