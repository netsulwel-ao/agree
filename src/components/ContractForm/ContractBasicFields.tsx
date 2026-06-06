import React from 'react';
import { Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import CurrencySelect from '../CurrencySelect';

interface ContractBasicFieldsProps {
  formData: {
    title: string;
    description: string;
    value: string;
    currency: string;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    renewalPeriod: string;
    notificationDays: number;
  };
  onChange: (field: string, value: any) => void;
  clientId: string;
  onClientIdChange: (value: string) => void;
  clients: any[];
}

export function ContractBasicFields({
  formData,
  onChange,
  clientId,
  onClientIdChange,
  clients,
}: ContractBasicFieldsProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Título do contrato"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="Descrição breve do contrato"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="number"
              value={formData.value}
              onChange={(e) => onChange('value', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moeda
          </label>
          <CurrencySelect
            value={formData.currency}
            onChange={(value) => onChange('currency', value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Início
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => onChange('startDate', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Término
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => onChange('endDate', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cliente
        </label>
        <select
          value={clientId}
          onChange={(e) => onClientIdChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Sem cliente</option>
          {clients?.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Renovação Automática</h3>
        
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="autoRenew"
            checked={formData.autoRenew}
            onChange={(e) => onChange('autoRenew', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <label htmlFor="autoRenew" className="text-sm text-gray-700">
            Activar renovação automática
          </label>
        </div>

        {formData.autoRenew && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de Renovação
              </label>
              <select
                value={formData.renewalPeriod}
                onChange={(e) => onChange('renewalPeriod', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar</option>
                <option value="monthly">Mensal</option>
                <option value="quarterly">Trimestral</option>
                <option value="semi_annually">Semestral</option>
                <option value="annually">Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dias de Notificação
              </label>
              <input
                type="number"
                value={formData.notificationDays}
                onChange={(e) => onChange('notificationDays', parseInt(e.target.value))}
                min={1}
                max={365}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
