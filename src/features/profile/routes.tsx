import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";

const ProfilePage = lazy(() => import("./pages/ProfilePage")); // Default import

export const profileRoutes: FeatureRoute[] = [
  {
    path: "/profile",
    element: <ProfilePage />,
  },
];
