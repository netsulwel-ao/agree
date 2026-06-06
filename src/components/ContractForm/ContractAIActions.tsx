import React from 'react';
import { Sparkles, Loader2, Wand2, FileUp, ScanText } from 'lucide-react';

interface ContractAIActionsProps {
  onAnalyze: () => void;
  onGenerate: () => void;
  onPdfUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOcrUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  analyzing: boolean;
  generating: boolean;
  extractingPdf: boolean;
  ocrRunning: boolean;
  ocrProgress: number;
  hasContent: boolean;
  hasDescription: boolean;
}

export function ContractAIActions({
  onAnalyze,
  onGenerate,
  onPdfUpload,
  onOcrUpload,
  analyzing,
  generating,
  extractingPdf,
  ocrRunning,
  ocrProgress,
  hasContent,
  hasDescription,
}: ContractAIActionsProps) {
  return (
    <div className="space-y-3">
      <button
        onClick={onAnalyze}
        disabled={!hasContent || analyzing}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            A analisar...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Analisar Riscos
          </>
        )}
      </button>

      <button
        onClick={onGenerate}
        disabled={!hasDescription || generating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {generating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            A gerar...
          </>
        ) : (
          <>
            <Wand2 className="w-5 h-5" />
            Gerar com IA
          </>
        )}
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <input
            type="file"
            id="pdf-upload"
            accept=".pdf"
            onChange={onPdfUpload}
            className="hidden"
            disabled={extractingPdf}
          />
          <label
            htmlFor="pdf-upload"
            className={`flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors ${extractingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {extractingPdf ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                PDF...
              </>
            ) : (
              <>
                <FileUp className="w-5 h-5" />
                PDF
              </>
            )}
          </label>
        </div>

        <div>
          <input
            type="file"
            id="ocr-upload"
            accept="image/*"
            onChange={onOcrUpload}
            className="hidden"
            disabled={ocrRunning}
          />
          <label
            htmlFor="ocr-upload"
            className={`flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors ${ocrRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {ocrRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {ocrProgress}%
              </>
            ) : (
              <>
                <ScanText className="w-5 h-5" />
                OCR
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}
