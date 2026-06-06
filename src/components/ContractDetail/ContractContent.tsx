import React from 'react';

interface ContractContentProps {
  content: string;
  onContentChange: (content: string) => void;
  readOnly?: boolean;
}

export function ContractContent({ content, onContentChange, readOnly = true }: ContractContentProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Conteúdo do Contrato</h3>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {readOnly ? (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Conteúdo do contrato..."
          />
        )}
      </div>
    </div>
  );
}
