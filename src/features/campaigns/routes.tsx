import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

const CampaignsPage = lazy(() => import("./pages/CampaignsPage").then(m => ({ default: m.CampaignsPage })));

export const campaignsRoutes: FeatureRoute[] = [
  {
    path: "/admin/campaigns",
    element: <CampaignsPage />,
    permission: PERMISSIONS.MANAGE_USERS, // Admin role usually has MANAGE_USERS or specific admin permission
  },
];
