import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  is_system: boolean;
  created_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  granted_by: string | null;
  granted_at: string;
  expires_at: string | null;
  permission: Permission;
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category, name');
      
      if (error) throw error;
      return data as Permission[];
    },
  });
}

export function useUserPermissions(userId: string) {
  return useQuery({
    queryKey: ['user_permissions', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*, permission(*)')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data as UserPermission[];
    },
    enabled: !!userId,
  });
}

export function useHasPermission() {
  const { user, isSuperAdmin } = useAuth();
  const { data: userPermissions } = useUserPermissions(user?.id || '');
  
  const hasPermission = useCallback((permissionCode: string): boolean => {
    // Super admin tem todas as permissões
    if (isSuperAdmin) return true;
    
    if (!userPermissions) return false;
    
    // Check if permission exists and is not expired
    return userPermissions.some(
      (up) => 
        up.permission.code === permissionCode &&
        (!up.expires_at || new Date(up.expires_at) > new Date())
    );
  }, [userPermissions, isSuperAdmin]);
  
  const hasAnyPermission = useCallback((permissionCodes: string[]): boolean => {
    return permissionCodes.some(code => hasPermission(code));
  }, [hasPermission]);
  
  const hasAllPermissions = useCallback((permissionCodes: string[]): boolean => {
    return permissionCodes.every(code => hasPermission(code));
  }, [hasPermission]);
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
