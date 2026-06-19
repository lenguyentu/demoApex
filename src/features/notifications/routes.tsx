import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

const NotificationsPage = lazy(() => import("./index").then(m => ({ default: m.NotificationsPage })));

export const notificationRoutes: FeatureRoute[] = [
  {
    path: "/notifications",
    element: <NotificationsPage />,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
];
