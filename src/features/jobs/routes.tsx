import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

// 1. Lazy load toàn bộ Pages (Hỗ trợ Named Export)
const JobsPage = lazy(() => import("./pages/JobsPage").then(m => ({ default: m.JobsPage })));
const JobDetailPage = lazy(() => import("./pages/JobDetailPage").then(m => ({ default: m.JobDetailPage })));
const AddJobPage = lazy(() => import("./pages/AddJobPage")); // AddJobPage đã là default export

/**
 * Danh sách Route của module Jobs
 * Cực kỳ "Dễ viết" cho Dev mới - Chỉ cần Copy & Paste & Đổi tên.
 */
export const jobRoutes: FeatureRoute[] = [
  {
    path: "/jobs/open",
    element: <JobsPage mode="open" />,
    permission: PERMISSIONS.VIEW_JOBS,
  },
  {
    path: "/jobs/admin",
    element: <JobsPage mode="admin" />,
    //  có thể dùng PERMISSIONS.UPDATE_JOB hoặc gộp lại
    permission: PERMISSIONS.UPDATE_JOB, 
  },
  {
    path: "/jobs/new",
    element: <AddJobPage />,
    permission: PERMISSIONS.CREATE_JOB,
  },
  {
    path: "/jobs/:id",
    element: <JobDetailPage />,
    permission: PERMISSIONS.VIEW_JOBS,
  },
  {
    path: "/jobs/:id/edit",
    element: <AddJobPage />,
    permission: PERMISSIONS.UPDATE_JOB,
  },
];
