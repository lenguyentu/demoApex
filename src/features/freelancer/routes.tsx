import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

const FreelancerManagementPage = lazy(() => import("./pages/FreelancerManagementPage").then(m => ({ default: m.FreelancerManagementPage })));
const FreelancerCVListPage = lazy(() => import("./pages/FreelancerCVListPage").then(m => ({ default: m.FreelancerCVListPage })));
const FreelancerRejectedCVListPage = lazy(() => import("./pages/FreelancerRejectedCVListPage").then(m => ({ default: m.FreelancerRejectedCVListPage })));

export const freelancerRoutes: FeatureRoute[] = [
  {
    path: "/freelancer-management",
    element: <FreelancerManagementPage />,
    permission: PERMISSIONS.MANAGE_USERS,
  },
  {
    path: "/freelancer-management/:id/cv-to-tdc",
    element: <FreelancerCVListPage />,
    permission: PERMISSIONS.MANAGE_USERS,
  },
  {
    path: "/freelancer-management/:id/rejected",
    element: <FreelancerRejectedCVListPage />,
    permission: PERMISSIONS.MANAGE_USERS,
  },
];
