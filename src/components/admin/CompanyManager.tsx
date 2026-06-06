import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Building2, Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  plan_expires_at: string | null;
  max_users: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function CompanyManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'free',
    max_users: 5,
  });

  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Company[];
    },
  });

  const { data: userCounts } = useQuery({
    queryKey: ['company_user_counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('company_id')
        .not('company_id', 'is', null);
      
      if (error) throw error;
      
      // Count users per company
      const counts = (data || []).reduce((acc, profile) => {
        const companyId = profile.company_id;
        acc[companyId] = (acc[companyId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return counts;
    },
  });

  const createCompany = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.slug.toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase.from('companies').insert({
        name: data.name,
        slug,
        plan: data.plan,
        max_users: data.max_users,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Empresa criada com sucesso');
      setIsDialogOpen(false);
      setFormData({ name: '', slug: '', plan: 'free', max_users: 5 });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error) => {
      toast.error('Erro ao criar empresa');
      console.error(error);
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const slug = data.slug.toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase
        .from('companies')
        .update({
          name: data.name,
          slug,
          plan: data.plan,
          max_users: data.max_users,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Empresa atualizada com sucesso');
      setIsDialogOpen(false);
      setEditingCompany(null);
      setFormData({ name: '', slug: '', plan: 'free', max_users: 5 });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar empresa');
      console.error(error);
    },
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Empresa eliminada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error) => {
      toast.error('Erro ao eliminar empresa');
      console.error(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCompany) {
      updateCompany.mutate({ id: editingCompany.id, data: formData });
    } else {
      createCompany.mutate(formData);
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      slug: company.slug,
      plan: company.plan,
      max_users: company.max_users,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja eliminar esta empresa?')) {
      deleteCompany.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCompany(null);
    setFormData({ name: '', slug: '', plan: 'free', max_users: 5 });
  };

  if (isLoading) {
    return <div>A carregar...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold">Empresas</h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button onClick={() => setEditingCompany(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="plan">Plano</Label>
                <select
                  id="plan"
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <Label htmlFor="max_users">Máximo de Usuários</Label>
                <Input
                  id="max_users"
                  type="number"
                  value={formData.max_users}
                  onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCompany ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Empresa</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Plano</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Usuários</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {companies?.map((company) => (
              <tr key={company.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {company.logo_url && (
                      <img
                        src={company.logo_url}
                        alt={company.name}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-sm text-gray-500">{company.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {company.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>{userCounts?.[company.id] || 0}</span>
                    <span className="text-gray-500">/ {company.max_users}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      company.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {company.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(company)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(company.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
