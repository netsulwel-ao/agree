import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ShieldCheck, 
  Lock, 
  History, 
  Users, 
  FileCheck, 
  AlertTriangle,
  UserCheck,
  Key,
  Eye,
  Search,
  Download,
  Filter,
  Activity,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';

export default function Compliance() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('user');

  useEffect(() => {
    fetchData();

    // Subscribe to logs
    const logsChannel = supabase
      .channel('audit_logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    // Subscribe to profiles
    const profilesChannel = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile) setCurrentUserRole(profile.role || 'user');
    }

    await Promise.all([fetchLogs(), fetchProfiles()]);
    setLoading(false);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
    setAuditLogs(data || []);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*');
    setUsers(data || []);
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (currentUserRole !== 'admin') {
      toast.error("Apenas administradores podem alterar permissões");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success("Permissão atualizada com sucesso");
    } catch (error) {
      toast.error("Erro ao atualizar permissão");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="animate-spin text-[#0055FF]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[24px] font-bold text-foreground flex items-center gap-3">
            <ShieldCheck className="text-primary" size={28} />
            Segurança & Compliance
          </h1>
          <p className="text-[14px] text-muted-foreground">Gestão de acessos, auditoria e conformidade legal</p>
        </div>
        <Badge variant="outline" className="bg-secondary text-primary border-border px-3 py-1">
          Nível de Segurança: Elevado
        </Badge>
      </div>

      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="w-full justify-start h-12 bg-transparent border-b border-border rounded-none p-0 gap-8">
          <TabsTrigger value="audit" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 text-[14px] font-medium text-muted-foreground">
            <History size={16} className="mr-2" />
            Logs de Auditoria
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 text-[14px] font-medium text-muted-foreground">
            <Users size={16} className="mr-2" />
            Perfis e Permissões
          </TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 text-[14px] font-medium text-muted-foreground">
            <FileCheck size={16} className="mr-2" />
            Conformidade Legal
          </TabsTrigger>
        </TabsList>

        {/* Audit Logs Content */}
        <TabsContent value="audit" className="pt-6 m-0">
          <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[16px] font-bold text-foreground">Rastro de Auditoria</CardTitle>
                <CardDescription className="text-muted-foreground">Registro imutável de todas as ações críticas no sistema</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2 border-border text-muted-foreground hover:bg-muted">
                <Download size={14} />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Data/Hora</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Usuário</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Ação</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Recurso</th>
                      <th className="px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.length > 0 ? auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted transition-colors">
                        <td className="px-6 py-4 text-[13px] text-muted-foreground">
                          {log.timestamp ? format(parseISO(log.timestamp), 'dd/MM/yyyy HH:mm:ss') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-primary">
                              {log.user_name?.charAt(0)}
                            </div>
                            <span className="text-[13px] font-medium text-foreground">{log.user_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="ghost" className="bg-secondary text-primary text-[11px] font-semibold">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-muted-foreground">{log.resource}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-green-500">
                            <CheckCircle2 size={14} />
                            <span className="text-[12px] font-medium">Sucesso</span>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-[14px]">
                          Nenhum log de auditoria encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Content */}
        <TabsContent value="permissions" className="pt-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
                <CardHeader className="p-6 border-b border-border">
                  <CardTitle className="text-[16px] font-bold text-foreground">Gestão de Usuários e Perfis</CardTitle>
                  <CardDescription className="text-muted-foreground">Atribua níveis de acesso baseados em funções (RBAC)</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {users.map((u) => (
                      <div key={u.id} className="p-6 flex items-center justify-between hover:bg-muted transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                            {u.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-foreground">{u.name}</p>
                            <p className="text-[12px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select 
                            value={u.role || 'user'} 
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            disabled={currentUserRole !== 'admin'}
                            className="bg-card border border-border rounded-lg px-3 py-1.5 text-[13px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="user">Usuário Padrão</option>
                            <option value="manager">Gestor de Contratos</option>
                            <option value="legal">Jurídico</option>
                            <option value="admin">Administrador</option>
                          </select>
                          {u.role === 'admin' && <ShieldCheck size={16} className="text-primary" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card className="border border-border shadow-none bg-card rounded-xl p-6">
                <h3 className="text-[14px] font-bold text-foreground mb-4 flex items-center gap-2">
                  <Lock size={16} className="text-primary" />
                  Definição de Perfis
                </h3>
                <div className="space-y-4">
                  <div className="p-3 bg-secondary rounded-lg border border-border">
                    <p className="text-[12px] font-bold text-primary mb-1">Administrador</p>
                    <p className="text-[11px] text-muted-foreground">Acesso total ao sistema, gestão de usuários e configurações de compliance.</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg border border-border">
                    <p className="text-[12px] font-bold text-foreground mb-1">Jurídico</p>
                    <p className="text-[11px] text-muted-foreground">Visualização de todos os contratos, análise de riscos e aprovação legal.</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg border border-border">
                    <p className="text-[12px] font-bold text-foreground mb-1">Gestor</p>
                    <p className="text-[11px] text-muted-foreground">Criação, edição e acompanhamento de fluxos de aprovação.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Compliance Content */}
        <TabsContent value="compliance" className="pt-6 m-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-border shadow-none bg-card rounded-xl p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <FileCheck size={32} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-foreground">LGPD Compliance</h3>
                <p className="text-[13px] text-muted-foreground mt-2">Proteção de dados pessoais em conformidade com a legislação vigente.</p>
              </div>
              <Badge className="bg-green-500 text-white">ATIVO</Badge>
            </Card>

            <Card className="border border-border shadow-none bg-card rounded-xl p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-primary">
                <UserCheck size={32} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-foreground">Assinatura Digital</h3>
                <p className="text-[13px] text-muted-foreground mt-2">Validade jurídica garantida por certificados e trilhas de auditoria.</p>
              </div>
              <Badge className="bg-green-500 text-white">ATIVO</Badge>
            </Card>

            <Card className="border border-border shadow-none bg-card rounded-xl p-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-destructive">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-foreground">Análise de Riscos</h3>
                <p className="text-[13px] text-muted-foreground mt-2">Identificação proativa de cláusulas abusivas ou de alto risco.</p>
              </div>
              <Badge className="bg-amber-500 text-white">EM MONITORAMENTO</Badge>
            </Card>
          </div>

          <Card className="mt-8 border border-border shadow-none bg-card rounded-xl overflow-hidden">
            <CardHeader className="p-6 border-b border-border">
              <CardTitle className="text-[16px] font-bold text-foreground">Políticas de Retenção de Dados</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <Key size={18} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-foreground">Criptografia em Repouso</p>
                    <p className="text-[13px] text-muted-foreground mt-1">Todos os documentos e dados sensíveis são criptografados utilizando o padrão AES-256 nos servidores do Google Cloud.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                    <History size={18} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-foreground">Retenção de Logs</p>
                    <p className="text-[13px] text-muted-foreground mt-1">Os logs de auditoria são mantidos por um período mínimo de 5 anos para fins de conformidade legal e fiscal.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
