import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHasPermission } from '../hooks/usePermissions';

interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({ 
  permission, 
  permissions, 
  requireAll = true,
  fallback = null,
  children 
}: PermissionGuardProps) {
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useHasPermission();

  // Se não estiver autenticado, mostrar fallback
  if (!user) {
    return <>{fallback}</>;
  }

  // Verificar permissão única
  if (permission) {
    if (!hasPermission(permission)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // Verificar múltiplas permissões
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasAccess) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // Se não houver requisitos de permissão, mostrar children
  return <>{children}</>;
}
