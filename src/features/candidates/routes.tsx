import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

const CandidatesPage = lazy(() => import("./pages/CandidatesPage").then(m => ({ default: m.CandidatesPage })));
const CandidateDetailPage = lazy(() => import("./pages/CandidateDetailPage").then(m => ({ default: m.CandidateDetailPage })));

export const candidateRoutes: FeatureRoute[] = [
  {
    path: "/candidates",
    element: <CandidatesPage mode="database" />,
    permission: PERMISSIONS.VIEW_CANDIDATES,
  },
  {
    path: "/candidates/my",
    element: <CandidatesPage mode="my" />,
    permission: PERMISSIONS.VIEW_CANDIDATES,
  },
  {
    path: "/candidates/:id",
    element: <CandidateDetailPage />,
    permission: PERMISSIONS.VIEW_CANDIDATES,
  },
];
