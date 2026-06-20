import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { JobsPage } from "../features/jobs/pages/JobsPage";
import { JobDetailPage } from "../features/jobs/pages/JobDetailPage";
import { ClientsPage } from "../features/clients/pages/ClientsPage";
import { AddClientPage } from "../features/clients/pages/AddClientPage";
import { CandidatesPage } from "../features/candidates/pages/CandidatesPage";
import { ProcessPage } from "../features/processes/pages/ProcessPage";
import DailyPlanPage from "../features/daily_plan/pages/DailyPlanPage";
import ManageDailyPlansPage from "../features/daily_plan/pages/ManageDailyPlansPage";
import { landingRoutes } from "../features/landing/routes";
import { researchRoutes } from "../features/research/routes";
import { manageUserRoutes } from "../features/manageUser/routes";
import { chatRoutes } from "../features/chat/routes";
import { notificationRoutes } from "../features/notifications/routes";
import { bdRoutes } from "../features/bd/routes";
import { salesRoutes } from "../features/sales/routes";
import { managerRoutes } from "../features/manager/routes";
import { adminRoutes } from "../features/admin/routes";
import { profileRoutes } from "../features/profile/routes";
import { dashboardRoutes } from "../features/dashboard/routes";
import { campaignsRoutes } from "../features/campaigns/routes";
import { freelancerRoutes } from "../features/freelancer/routes";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [

      {
        path: "/jobs/admin",
        element: <JobsPage mode="admin" />,
      },
      {
        path: "/jobs/open",
        element: <JobsPage mode="open" />,
      },
      {
        path: "/jobs/:id",
        element: <JobDetailPage />,
      },
      {
        path: "/daily-plan",
        element: <DailyPlanPage />,
      },
      {
        path: "/manage-daily-plans",
        element: <ManageDailyPlansPage />,
      },
      {
        path: "/clients",
        element: <ClientsPage />,
      },
      {
        path: "/tables/clients/new/:id",
        element: <AddClientPage />,
      },
      {
        path: "/candidates",
        element: <CandidatesPage mode="database" />,
      },
      {
        path: "/candidates/my",
        element: <CandidatesPage mode="my" />,
      },
      {
        path: "/processes",
        element: <ProcessPage />,
      },
      ...(landingRoutes as any),
      ...(researchRoutes as any),
      ...(manageUserRoutes as any),
      ...(chatRoutes as any),
      ...(notificationRoutes as any),
      ...(bdRoutes as any),
      ...(salesRoutes as any),
      ...(managerRoutes as any),
      ...(adminRoutes as any),
      ...(profileRoutes as any),
      ...(dashboardRoutes as any),
      ...(campaignsRoutes as any),
      ...(freelancerRoutes as any),
    ],
  },
]);
