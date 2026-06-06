import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { usePermissions, useUserPermissions, type Permission } from '../../hooks/usePermissions';
import { Shield, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface PermissionsManagerProps {
  userId: string;
  userName: string;
}

export function PermissionsManager({ userId, userName }: PermissionsManagerProps) {
  const { data: permissions } = usePermissions();
  const { data: userPermissions, refetch: refetchUserPermissions } = useUserPermissions(userId);
  const queryClient = useQueryClient();
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());

  // Group permissions by category
  const groupedPermissions = permissions?.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>) || {};

  // Initialize selected permissions
  useState(() => {
    if (userPermissions) {
      const granted = new Set(userPermissions.map(up => up.permission.code));
      setSelectedPermissions(granted);
    }
  });

  const grantPermission = useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await supabase.from('user_permissions').insert({
        user_id: userId,
        permission_id: permissionId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Permissão concedida');
      refetchUserPermissions();
      queryClient.invalidateQueries({ queryKey: ['user_permissions'] });
    },
    onError: (error) => {
      toast.error('Erro ao conceder permissão');
      console.error(error);
    },
  });

  const revokePermission = useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId)
        .eq('permission_id', permissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Permissão revogada');
      refetchUserPermissions();
      queryClient.invalidateQueries({ queryKey: ['user_permissions'] });
    },
    onError: (error) => {
      toast.error('Erro ao revogar permissão');
      console.error(error);
    },
  });

  const togglePermission = (permission: Permission) => {
    const isGranted = selectedPermissions.has(permission.code);
    
    if (isGranted) {
      revokePermission.mutate(permission.id);
      setSelectedPermissions(prev => {
        const next = new Set(prev);
        next.delete(permission.code);
        return next;
      });
    } else {
      grantPermission.mutate(permission.id);
      setSelectedPermissions(prev => new Set(prev).add(permission.code));
    }
  };

  const categoryIcons: Record<string, string> = {
    contracts: '📄',
    clients: '👥',
    users: '👤',
    reports: '📊',
    finance: '💰',
    settings: '⚙️',
    audit: '🔍',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-semibold">Permissões: {userName}</h3>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([category, perms]) => (
          <div key={category} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{categoryIcons[category] || '📁'}</span>
              <h4 className="font-medium capitalize">{category}</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {perms.map((permission) => {
                const isGranted = selectedPermissions.has(permission.code);
                return (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-3 rounded border hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => togglePermission(permission)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{permission.name}</p>
                      {permission.description && (
                        <p className="text-xs text-gray-500">{permission.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isGranted ? (
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <X className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
