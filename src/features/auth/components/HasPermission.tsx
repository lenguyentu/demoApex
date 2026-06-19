import type { ReactNode } from "react";
import { useAuthStore } from "../store";
import type { Permission } from "../constants";

interface HasPermissionProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component bọc quanh các phần tử UI (Button, Link, Section...)
 * Chỉ hiển thị children nếu User có quyền tương ứng.
 */
export const HasPermission = ({
  permission,
  children,
  fallback = null,
}: HasPermissionProps) => {
  const { can } = useAuthStore();

  if (!can(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
