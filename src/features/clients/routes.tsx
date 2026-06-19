import { lazy } from "react";
import type { FeatureRoute } from "../../routes/utils";
import { PERMISSIONS } from "../auth/constants";

const ClientsPage = lazy(() => import("./index").then(m => ({ default: m.ClientsPage })));
const AddClientPage = lazy(() => import("./index").then(m => ({ default: m.AddClientPage })));

export const clientRoutes: FeatureRoute[] = [
  {
    path: "/clients",
    element: <ClientsPage />,
    permission: PERMISSIONS.VIEW_CLIENTS,
  },
  {
    path: "/tables/clients/new",
    element: <AddClientPage />,
    permission: PERMISSIONS.MANAGE_CLIENTS,
  },
  {
    path: "/tables/clients/new/:id",
    element: <AddClientPage />,
    permission: PERMISSIONS.MANAGE_CLIENTS,
  },
];
