import React from 'react';
import { ArrowLeft, FileText, Download, Share2, FileEdit, Trash2, RefreshCw } from 'lucide-react';

interface ContractHeaderProps {
  contract: any;
  onBack: () => void;
  onExportPdf: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRenew: () => void;
  exportingPdf: boolean;
}

export function ContractHeader({
  contract,
  onBack,
  onExportPdf,
  onShare,
  onEdit,
  onDelete,
  onRenew,
  exportingPdf,
}: ContractHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{contract?.title}</h1>
          <p className="text-sm text-gray-500">
            {contract?.status === 'draft' && 'Rascunho'}
            {contract?.status === 'pending' && 'Pendente'}
            {contract?.status === 'approved' && 'Aprovado'}
            {contract?.status === 'rejected' && 'Rejeitado'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onExportPdf}
          disabled={exportingPdf}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>

        <button
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Partilhar
        </button>

        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileEdit className="w-4 h-4" />
          Editar
        </button>

        {contract?.auto_renew && (
          <button
            onClick={onRenew}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Renovar
          </button>
        )}

        <button
          onClick={onDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
