import React from 'react';
import { Calendar, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ContractStatsProps {
  contract: any;
}

export function ContractStats({ contract }: ContractStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Início</p>
            <p className="text-sm font-medium text-gray-900">
              {contract?.start_date
                ? new Date(contract.start_date).toLocaleDateString('pt-PT')
                : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Término</p>
            <p className="text-sm font-medium text-gray-900">
              {contract?.end_date
                ? new Date(contract.end_date).toLocaleDateString('pt-PT')
                : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Valor</p>
            <p className="text-sm font-medium text-gray-900">
              {contract?.value
                ? `${contract.currency || 'AOA'} ${Number(contract.value).toLocaleString('pt-AO')}`
                : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            contract?.risk_level === 'high' ? 'bg-red-100' :
            contract?.risk_level === 'medium' ? 'bg-yellow-100' :
            'bg-green-100'
          }`}>
            {contract?.risk_level === 'high' ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">Risco</p>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {contract?.risk_level === 'high' ? 'Alto' :
               contract?.risk_level === 'medium' ? 'Médio' :
               contract?.risk_level === 'low' ? 'Baixo' : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
