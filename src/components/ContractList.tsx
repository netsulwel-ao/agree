import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContracts } from '../hooks/useContracts';
import { 
  Search, 
  Filter, 
  Eye, 
  FileEdit, 
  Trash2,
  Sparkles,
  Calendar as CalendarIcon,
  FileText,
  Download
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { intelligentSearch } from '../services/gemini';
import { exportContractListToPdf } from '../services/exportPdf';
import { toast } from 'sonner';

export default function ContractList() {
  const navigate = useNavigate();
  const { data: contracts = [], isLoading } = useContracts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [filteredContracts, setFilteredContracts] = useState(contracts);

  // Sync filtered contracts when data changes or if search term is empty
  React.useEffect(() => {
    if (!searchTerm.trim() && !isAiSearching) {
      setFilteredContracts(contracts);
    }
  }, [contracts, searchTerm, isAiSearching]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setFilteredContracts(contracts);
      return;
    }

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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-teal-500/10 text-teal-600';
      case 'pending': return 'bg-amber-500/10 text-amber-600';
      case 'rejected': return 'bg-red-500/10 text-red-600';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getRiskColorClass = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      default: return 'text-teal-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 font-[Poppins]">
        <div className="h-16 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-[500px] rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-[Poppins]">
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex gap-3 w-full md:max-w-[500px]">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Pesquisa inteligente..."
              className="w-full py-2.5 pl-10 pr-4 text-sm text-slate-900 bg-white border border-slate-200 focus:border-teal-500 focus:outline-none transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={handleAiSearch}
            disabled={isAiSearching}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold border transition-colors ${
              isAiSearching 
                ? 'bg-teal-50 border-teal-500 text-teal-600 cursor-not-allowed' 
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer'
            }`}
          >
            <Sparkles size={16} className={isAiSearching ? 'animate-pulse' : ''} />
            {isAiSearching ? 'Analisando...' : 'IA'}
          </button>
        </form>

        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors">
            <Filter size={16} />
            Filtros
          </button>
          <button className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-colors">
            <CalendarIcon size={16} />
            Data
          </button>
        </div>
      </div>

      {/* Contract Table */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white/50">
          <h2 className="text-base font-bold text-slate-900">
            Contratos em Gestão
          </h2>
          <button
            onClick={() => exportContractListToPdf(filteredContracts)}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-transparent border-none cursor-pointer transition-colors"
          >
            <Download size={14} />
            Exportar PDF
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Identificação</th>
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Versão</th>
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Risco</th>
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Vencimento</th>
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Valor</th>
                <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length > 0 ? (
                filteredContracts.map((contract) => (
                  <tr 
                    key={contract.id} 
                    className="border-b border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/contracts/${contract.id}`)}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-900">
                          {contract.title}
                        </span>
                        <span className="text-[11px] text-slate-500 max-w-[200px] truncate">
                          {contract.description || 'Sem descrição'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 font-medium">
                      v{contract.version || '1.0'}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className={`flex items-center gap-1.5 font-semibold ${getRiskColorClass(contract.risk_level)}`}>
                        <span className="text-[10px]">●</span>
                        <span className="capitalize">
                          {contract.risk_level === 'high' ? 'Alto' : contract.risk_level === 'medium' ? 'Médio' : 'Baixo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {contract.end_date ? format(parseISO(contract.end_date), 'dd MMM yyyy', { locale: ptBR }) : 'N/A'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 font-medium">
                      {contract.value ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contract.value) : 'Kz 0,00'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg ${getStatusBadgeClass(contract.status)}`}>
                        {contract.status === 'approved' ? 'Assinado' : 
                         contract.status === 'pending' ? 'Aprovação' : 
                         contract.status === 'rejected' ? 'Rejeitado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-transparent border-none text-slate-400 hover:bg-slate-100 hover:text-teal-600 rounded-lg cursor-pointer transition-colors"
                          onClick={() => navigate(`/contracts/${contract.id}`)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-transparent border-none text-slate-400 hover:bg-slate-100 hover:text-slate-900 rounded-lg cursor-pointer transition-colors"
                        >
                          <FileEdit size={16} />
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-transparent border-none text-slate-400 hover:bg-slate-100 hover:text-red-500 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <FileText size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-medium">
                        Nenhum contrato encontrado
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
