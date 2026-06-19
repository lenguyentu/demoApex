import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

const AuditLogPage = lazy(() => import("./pages/AuditLogPage").then(m => ({ default: m.AuditLogPage })));

export const adminRoutes: FeatureRoute[] = [
  {
    path: "/admin/audit-logs",
    element: <AuditLogPage />,
    permission: PERMISSIONS.AUDIT_LOGS,
  },
];
