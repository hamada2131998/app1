import { ReactNode } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { hasPermission, hasAnyPermission, type Permission, type AppRole } from '@/data/roles';
import { mapDbRoleToAppRole } from '@/lib/roleMapping';
import { Shield, Lock } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback,
  showMessage = false,
}: PermissionGuardProps) {
  const { role } = useCompany();
  const userRole = mapDbRoleToAppRole(role) || 'employee';

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(userRole, permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? permissions.every(p => hasPermission(userRole, p))
      : hasAnyPermission(userRole, permissions);
  } else {
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showMessage) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">صلاحية غير متوفرة</h3>
        <p className="text-slate-500 max-w-sm">
          ليس لديك الصلاحية للوصول إلى هذا المحتوى. تواصل مع المسؤول لطلب الصلاحية.
        </p>
      </div>
    );
  }

  return null;
}

// Higher-order component for page-level protection
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: Permission
) {
  return function ProtectedComponent(props: P) {
    return (
      <PermissionGuard permission={requiredPermission} showMessage>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

// Hook for checking permissions
export function usePermission(permission: Permission): boolean {
  const { role } = useCompany();
  const userRole = mapDbRoleToAppRole(role) || 'employee';
  return hasPermission(userRole, permission);
}

// Hook for checking multiple permissions
export function usePermissions(permissions: Permission[], requireAll = false): boolean {
  const { role } = useCompany();
  const userRole = mapDbRoleToAppRole(role) || 'employee';
  
  if (requireAll) {
    return permissions.every(p => hasPermission(userRole, p));
  }
  return hasAnyPermission(userRole, permissions);
}
