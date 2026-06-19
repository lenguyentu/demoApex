import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

const CustomerListPage = lazy(() => import("./pages/CustomerListPage").then(m => ({ default: m.CustomerListPage })));
const ScheduleManagementPage = lazy(() => import("./pages/ScheduleManagementPage").then(m => ({ default: m.ScheduleManagementPage })));
const CRMStatisticPage = lazy(() => import("./pages/CRMStatisticPage").then(m => ({ default: m.CRMStatisticPage })));

export const bdRoutes: FeatureRoute[] = [
  {
    path: "/bd/customers",
    element: <CustomerListPage />,
    permission: PERMISSIONS.MANAGE_CLIENTS,
  },
  {
    path: "/bd/schedule",
    element: <ScheduleManagementPage />,
    permission: PERMISSIONS.MANAGE_CLIENTS,
  },
  {
    path: "/bd/statistic",
    element: <CRMStatisticPage />,
    permission: PERMISSIONS.MANAGE_CLIENTS,
  },
];
