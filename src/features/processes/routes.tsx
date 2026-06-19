import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

// 1. Processes
const ProcessPage = lazy(() => import("./pages/ProcessPage").then(m => ({ default: m.ProcessPage })));

export const processRoutes: FeatureRoute[] = [
  {
    path: "/processes",
    element: <ProcessPage />,
    permission: PERMISSIONS.VIEW_PROCESSES,
  },
];
