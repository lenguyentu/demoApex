import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

const ManageUserTab = lazy(() => import("./index").then(m => ({ default: m.ManageUserTab })));

export const manageUserRoutes: FeatureRoute[] = [
  {
    path: "/users",
    element: <ManageUserTab />,
    permission: PERMISSIONS.MANAGE_USERS,
  },
];
