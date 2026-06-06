import React from 'react';
import { Paperclip, File, X } from 'lucide-react';

interface ContractAttachmentsProps {
  attachments: File[];
  existingAttachments: any[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
  onRemoveExisting: (id: string) => void;
}

export function ContractAttachments({
  attachments,
  existingAttachments,
  onFileChange,
  onRemoveAttachment,
  onRemoveExisting,
}: ContractAttachmentsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Anexos
        </label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="file-upload"
            onChange={onFileChange}
            className="hidden"
            multiple
          />
          <label
            htmlFor="file-upload"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
          >
            <Paperclip className="w-5 h-5" />
            Adicionar Ficheiros
          </label>
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Novos Anexos</h4>
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                onClick={() => onRemoveAttachment(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {existingAttachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Anexos Existentes</h4>
          {existingAttachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-700">{att.name}</span>
              </div>
              <button
                onClick={() => onRemoveExisting(att.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
