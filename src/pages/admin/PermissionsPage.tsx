import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { PermissionGuard } from '../../components/PermissionGuard';
import { PermissionsManager } from '../../components/admin/PermissionsManager';
import { Shield, Search } from 'lucide-react';
import { Input } from '../../components/ui/input';

export default function PermissionsPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users_for_permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, company_id, is_super_admin')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredUsers = users?.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (selectedUserId) {
    const user = users?.find(u => u.id === selectedUserId);
    return (
      <PermissionGuard permission="users.manage_permissions">
        <div className="space-y-6">
          <button
            onClick={() => setSelectedUserId(null)}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            ← Voltar à lista de usuários
          </button>
          {user && (
            <PermissionsManager 
              userId={user.id} 
              userName={user.email || 'Usuário'} 
            />
          )}
        </div>
      </PermissionGuard>
    );
  }

  return (
    <PermissionGuard permission="users.manage_permissions">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Gestão de Permissões</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Super Admin</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    A carregar...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_super_admin ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          Sim
                        </span>
                      ) : (
                        <span className="text-gray-400">Não</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedUserId(user.id)}
                        className="text-blue-500 hover:text-blue-600 font-medium text-sm"
                      >
                        Gerenciar Permissões
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PermissionGuard>
  );
}
