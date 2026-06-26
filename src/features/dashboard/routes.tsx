import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

const FreelancerManagementPage = lazy(() => import("../freelancer/pages/FreelancerManagementPage").then(m => ({ default: m.FreelancerManagementPage })));

export const dashboardRoutes: FeatureRoute[] = [
  {
    path: "/",
    element: <FreelancerManagementPage />,
    permission: PERMISSIONS.MANAGE_USERS,
  },
];
