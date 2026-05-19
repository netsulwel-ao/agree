import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { 
  Save, 
  X, 
  Sparkles, 
  AlertCircle,
  Calendar as CalendarIcon,
  DollarSign,
  Paperclip,
  File,
  Loader2
} from 'lucide-react';
import { analyzeContractRisks } from '../services/gemini';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { v4 as uuidv4 } from 'uuid';

interface ContractFormProps {
  onComplete: () => void;
}

export default function ContractForm({ onComplete }: ContractFormProps) {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [risks, setRisks] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    value: '',
    startDate: '',
    endDate: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleAnalyze = async () => {
    if (!formData.content) {
      toast.error("Adicione o conteúdo do contrato para analisar riscos");
      return;
    }
    setAnalyzing(true);
    try {
      const results = await analyzeContractRisks(formData.content);
      setRisks(results);
      toast.success("Análise de riscos concluída!");
    } catch (error) {
      toast.error("Erro ao analisar riscos");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    try {
      const uploadedAttachments = [];
      if (attachments.length > 0) {
        setUploading(true);
        for (const file of attachments) {
          const filePath = `${user.id}/${Date.now()}_${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('contracts')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('contracts')
            .getPublicUrl(filePath);

          uploadedAttachments.push({
            id: uuidv4(),
            name: file.name,
            url: publicUrl,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            uploadedBy: user.id
          });
        }
      }

      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          title: formData.title,
          description: formData.description,
          content: formData.content,
          value: parseFloat(formData.value) || 0,
          status: 'draft',
          owner_id: user.id,
          start_date: formData.startDate || null,
          end_date: formData.endDate || null,
          risks: risks,
          attachments: uploadedAttachments,
        })
        .select()
        .single();

      if (contractError) throw contractError;
      
      // Create initial version
      await supabase.from('contract_versions').insert({
        contract_id: contract.id,
        content: formData.content,
        version_number: 1
      });

      toast.success("Contrato criado com sucesso!");
      onComplete();
    } catch (error) {
      console.error("Error saving contract:", error);
      toast.error("Erro ao salvar contrato");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <form onSubmit={handleSubmit}>
        <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
          <CardHeader className="bg-card border-b border-border p-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-[20px] font-bold text-foreground">Novo Contrato</CardTitle>
                <CardDescription className="text-muted-foreground text-[14px]">Preencha os detalhes para iniciar a gestão</CardDescription>
              </div>
              <Button type="button" variant="ghost" className="text-muted-foreground hover:text-foreground h-8 w-8 p-0" onClick={onComplete}>
                <X size={20} />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[12px] text-muted-foreground uppercase tracking-[0.5px] font-semibold">Título do Contrato</Label>
                <Input 
                  id="title" 
                  required 
                  placeholder="Ex: Contrato de Prestação de Serviços TI"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="rounded-lg border-border bg-card h-10 text-[14px] text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value" className="text-[12px] text-muted-foreground uppercase tracking-[0.5px] font-semibold">Valor (AOA)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">Kz</span>
                  <Input 
                    id="value" 
                    type="number" 
                    placeholder="0,00"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    className="pl-10 rounded-lg border-border bg-card h-10 text-[14px] text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-[12px] text-muted-foreground uppercase tracking-[0.5px] font-semibold">Breve Descrição</Label>
              <Input 
                id="description" 
                placeholder="Resumo do objetivo do contrato"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="rounded-lg border-border bg-card h-10 text-[14px] text-foreground"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-[12px] text-muted-foreground uppercase tracking-[0.5px] font-semibold">Data de Início</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    id="startDate" 
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="pl-10 rounded-lg border-border bg-card h-10 text-[14px] text-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-[12px] text-muted-foreground uppercase tracking-[0.5px] font-semibold">Data de Término</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    id="endDate" 
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="pl-10 rounded-lg border-border bg-card h-10 text-[14px] text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-[12px] text-muted-foreground uppercase tracking-[0.5px] font-semibold">Anexos (PDF Assinado, Documentos)</Label>
                <div className="relative">
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleFileChange} 
                    className="hidden" 
                    id="file-upload"
                  />
                  <Label 
                    htmlFor="file-upload" 
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-[12px] font-semibold text-muted-foreground hover:bg-muted"
                  >
                    <Paperclip size={14} />
                    Adicionar Arquivos
                  </Label>
                </div>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <File size={18} className="text-primary shrink-0" />
                        <div className="truncate">
                          <p className="text-[13px] font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-[11px] text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeAttachment(idx)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="content" className="text-[12px] text-muted-foreground uppercase tracking-[0.5px] font-semibold">Conteúdo do Contrato</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-primary border-border hover:bg-secondary rounded-lg text-[12px] font-semibold"
                  onClick={handleAnalyze}
                  disabled={analyzing || !formData.content}
                >
                  <Sparkles size={14} className={analyzing ? 'animate-pulse' : ''} />
                  {analyzing ? 'Analisando...' : 'Identificar Riscos com IA'}
                </Button>
              </div>
              <Textarea 
                id="content" 
                placeholder="Cole aqui o texto completo do contrato..."
                className="min-h-[300px] rounded-xl border-border bg-card resize-none font-mono text-[13px] p-4 focus:ring-1 focus:ring-primary text-foreground"
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
              />
            </div>

            {risks.length > 0 && (
              <div className="space-y-4 p-6 bg-muted rounded-xl border border-border">
                <h3 className="text-[14px] font-semibold flex items-center gap-2 text-foreground">
                  <AlertCircle className="text-amber-500" size={18} />
                  Riscos Identificados pela IA
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {risks.map((risk, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold shrink-0 ${
                        risk.severity === 'high' ? 'bg-destructive text-white' :
                        risk.severity === 'medium' ? 'bg-amber-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {risk.severity.toUpperCase()}
                      </span>
                      <p className="text-[13px] text-muted-foreground">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="p-6 bg-muted border-t border-border flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onComplete} className="rounded-lg px-6 text-[13px] font-semibold text-muted-foreground">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || uploading} className="bg-primary hover:bg-primary/90 text-white rounded-lg px-8 gap-2 text-[13px] font-semibold h-10">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {uploading ? 'Enviando Arquivos...' : loading ? 'Salvando...' : 'Salvar Contrato'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
