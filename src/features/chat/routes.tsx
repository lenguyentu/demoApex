import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

const ChatLayout = lazy(() => import("./index").then(m => ({ default: m.ChatLayout })));

export const chatRoutes: FeatureRoute[] = [
  {
    path: "/chat",
    element: <ChatLayout />,
    permission: PERMISSIONS.VIEW_CHAT,
  },
];
