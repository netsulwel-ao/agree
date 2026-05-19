import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  FileEdit, 
  Trash2,
  Sparkles,
  Calendar as CalendarIcon,
  FileText
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { intelligentSearch } from '../services/gemini';
import { toast } from 'sonner';

interface ContractListProps {
  onSelectContract: (id: string) => void;
}

export default function ContractList({ onSelectContract }: ContractListProps) {
  const [contracts, setContracts] = useState<any[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);

  useEffect(() => {
    fetchContracts();

    const channel = supabase
      .channel('contracts_list_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, () => {
        fetchContracts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchContracts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching contracts:", error);
    } else {
      setContracts(data || []);
      setFilteredContracts(data || []);
    }
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setFilteredContracts(contracts);
      return;
    }

    // Basic search
    const basicResults = contracts.filter(c => 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContracts(basicResults);
  };

  const handleAiSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error("Digite algo para a pesquisa inteligente");
      return;
    }

    setIsAiSearching(true);
    try {
      const results = await intelligentSearch(searchTerm, contracts);
      setFilteredContracts(results);
      toast.success(`Encontrados ${results.length} contratos relevantes`);
    } catch (error) {
      toast.error("Erro na pesquisa inteligente");
    } finally {
      setIsAiSearching(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Aprovado</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Pendente</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Rejeitado</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">Rascunho</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:max-w-md flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Pesquisa inteligente..." 
              className="pl-10 h-10 bg-card border-border rounded-lg text-[14px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            type="button"
            variant="outline" 
            className="h-10 px-4 gap-2 border-border text-primary hover:bg-secondary rounded-lg text-[13px] font-semibold"
            onClick={handleAiSearch}
            disabled={isAiSearching}
          >
            <Sparkles size={16} className={isAiSearching ? 'animate-pulse' : ''} />
            {isAiSearching ? 'Analisando...' : 'IA'}
          </Button>
        </form>

        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-10 gap-2 border-border text-muted-foreground hover:bg-muted rounded-lg text-[13px] font-semibold">
            <Filter size={16} />
            Filtros
          </Button>
          <Button variant="outline" className="flex-1 md:flex-none h-10 gap-2 border-border text-muted-foreground hover:bg-muted rounded-lg text-[13px] font-semibold">
            <CalendarIcon size={16} />
            Data
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex justify-between items-center">
          <h2 className="text-[16px] font-semibold text-foreground">Contratos em Gestão</h2>
          <div className="text-[12px] text-primary cursor-pointer font-medium">Ver histórico completo</div>
        </div>
        
        <div className="overflow-x-auto">
          <Table className="w-full border-collapse font-sans text-[13px]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted border-b border-border">
                <TableHead className="text-left px-5 py-3 text-muted-foreground font-medium uppercase text-[11px] tracking-[0.5px]">Identificação</TableHead>
                <TableHead className="text-left px-5 py-3 text-muted-foreground font-medium uppercase text-[11px] tracking-[0.5px]">Versão</TableHead>
                <TableHead className="text-left px-5 py-3 text-muted-foreground font-medium uppercase text-[11px] tracking-[0.5px]">Risco</TableHead>
                <TableHead className="text-left px-5 py-3 text-muted-foreground font-medium uppercase text-[11px] tracking-[0.5px]">Vencimento</TableHead>
                <TableHead className="text-left px-5 py-3 text-muted-foreground font-medium uppercase text-[11px] tracking-[0.5px]">Valor</TableHead>
                <TableHead className="text-left px-5 py-3 text-muted-foreground font-medium uppercase text-[11px] tracking-[0.5px]">Status</TableHead>
                <TableHead className="text-right px-5 py-3 text-muted-foreground font-medium uppercase text-[11px] tracking-[0.5px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <TableRow key={contract.id} className="border-b border-border hover:bg-muted transition-colors group">
                    <TableCell className="px-5 py-3.5 font-medium text-foreground">
                      <div className="flex flex-col">
                        <span>{contract.title}</span>
                        <span className="text-[11px] text-muted-foreground font-normal truncate max-w-xs">{contract.description || 'Sem descrição'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-muted-foreground">v{contract.version || '1.0'}</TableCell>
                    <TableCell className="px-5 py-3.5">
                      <div className={`flex items-center gap-1.5 font-semibold ${
                        contract.risk_level === 'high' ? 'text-destructive' :
                        contract.risk_level === 'medium' ? 'text-amber-500' : 'text-green-500'
                      }`}>
                        <span>●</span>
                        <span className="capitalize">{contract.risk_level === 'high' ? 'Alto' : contract.risk_level === 'medium' ? 'Médio' : 'Baixo'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-muted-foreground">
                      {contract.end_date ? format(parseISO(contract.end_date), 'dd MMM yyyy', { locale: ptBR }) : 'N/A'}
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-muted-foreground font-medium">
                      {contract.value ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contract.value) : 'Kz 0,00'}
                    </TableCell>
                    <TableCell className="px-5 py-3.5">
                      <span className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold ${
                        contract.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                        contract.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                        contract.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground'
                      }`}>
                        {contract.status === 'approved' ? 'Assinado' : 
                         contract.status === 'pending' ? 'Aprovação' : 
                         contract.status === 'rejected' ? 'Rejeitado' : 'Rascunho'}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => onSelectContract(contract.id)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <FileEdit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <FileText size={48} className="mb-4 opacity-10" />
                      <p>Nenhum contrato encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
