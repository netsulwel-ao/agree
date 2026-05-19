import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ArrowLeft, 
  History, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  PenTool,
  Download,
  Share2,
  AlertCircle,
  Paperclip,
  File,
  Loader2,
  ExternalLink,
  Eye,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Users,
  Calendar,
  MessageSquare,
  Plus
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { v4 as uuidv4 } from 'uuid';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface ContractDetailProps {
  contractId: string;
  onBack: () => void;
}

export default function ContractDetail({ contractId, onBack }: ContractDetailProps) {
  const [contract, setContract] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    participants: '',
    content: ''
  });
  const [savingNote, setSavingNote] = useState(false);
  const [viewingFile, setViewingFile] = useState<any>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    if (viewingFile && (
      viewingFile.type?.includes('text') || 
      viewingFile.name?.endsWith('.json') || 
      viewingFile.name?.endsWith('.csv') ||
      viewingFile.name?.endsWith('.md')
    )) {
      setLoadingText(true);
      fetch(viewingFile.url)
        .then(res => res.text())
        .then(text => {
          setTextContent(text);
          setLoadingText(false);
        })
        .catch(err => {
          console.error("Error fetching text content:", err);
          setTextContent("Erro ao carregar o conteúdo do arquivo.");
          setLoadingText(false);
        });
    } else {
      setTextContent(null);
      setImageZoom(1);
    }
  }, [viewingFile]);

  useEffect(() => {
    fetchContractData();

    // Subscribe to contract changes
    const contractChannel = supabase
      .channel(`contract_${contractId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contracts', filter: `id=eq.${contractId}` }, (payload: any) => {
        setContract(payload.new);
      })
      .subscribe();

    // Subscribe to notes changes
    const notesChannel = supabase
      .channel(`notes_${contractId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_notes', filter: `contract_id=eq.${contractId}` }, () => {
        fetchNotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(contractChannel);
      supabase.removeChannel(notesChannel);
    };
  }, [contractId]);

  const fetchContractData = async () => {
    setLoading(true);
    const { data: contractData } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();
    
    if (contractData) {
      setContract(contractData);
    }

    const { data: versionsData } = await supabase
      .from('contract_versions')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });
    
    setVersions(versionsData || []);

    fetchNotes();
    setLoading(false);
  };

  const fetchNotes = async () => {
    const { data: notesData } = await supabase
      .from('meeting_notes')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });
    
    setMeetingNotes(notesData || []);
  };

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;
      
      let statusLabel = '';
      switch(newStatus) {
        case 'draft': statusLabel = 'Rascunho'; break;
        case 'pending': statusLabel = 'Pendente de Aprovação'; break;
        case 'approved': statusLabel = 'Aprovado'; break;
        case 'rejected': statusLabel = 'Rejeitado'; break;
      }
      
      toast.success(`Status atualizado para: ${statusLabel}`);
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const WorkflowIndicator = () => {
    const steps = [
      { id: 'draft', label: 'Rascunho', icon: FileText },
      { id: 'pending', label: 'Aprovação', icon: Clock },
      { id: 'final', label: 'Finalizado', icon: CheckCircle2 },
    ];

    const getCurrentStep = () => {
      if (contract.status === 'draft') return 0;
      if (contract.status === 'pending') return 1;
      if (contract.status === 'approved' || contract.status === 'rejected') return 2;
      return 0;
    };

    const currentStep = getCurrentStep();

    return (
      <div className="flex items-center justify-between w-full mb-8 px-4">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          const isLast = idx === steps.length - 1;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-card border-primary text-primary shadow-lg shadow-primary/20' :
                  'bg-card border-border text-muted-foreground'
                }`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                </div>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.id === 'final' && contract.status === 'rejected' ? 'Rejeitado' : step.label}
                </span>
              </div>
              {!isLast && (
                <div className="flex-1 h-[2px] mx-4 bg-border relative -mt-6">
                  <div 
                    className="absolute inset-0 bg-green-500 transition-all duration-500" 
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const handleSign = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const signature = {
      userId: user.id,
      userName: user.user_metadata?.full_name || user.email,
      signedAt: new Date().toISOString()
    };

    const currentSignatures = contract.signatures || [];
    if (currentSignatures.some((s: any) => s.userId === user.id)) {
      toast.error("Você já assinou este contrato");
      return;
    }

    try {
      const { error } = await supabase
        .from('contracts')
        .update({
          signatures: [...currentSignatures, signature],
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;
      toast.success("Contrato assinado digitalmente!");
    } catch (error) {
      toast.error("Erro ao assinar contrato");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !newNote.content) return;

    setSavingNote(true);
    try {
      const { error } = await supabase
        .from('meeting_notes')
        .insert({
          contract_id: contractId,
          date: newNote.date,
          participants: newNote.participants,
          content: newNote.content,
          author_id: user.id,
          author_name: user.user_metadata?.full_name || user.email
        });

      if (error) throw error;
      
      setNewNote({
        date: format(new Date(), 'yyyy-MM-dd'),
        participants: '',
        content: ''
      });
      setIsAddingNote(false);
      toast.success("Nota de reunião adicionada!");
    } catch (error) {
      toast.error("Erro ao salvar nota");
    } finally {
      setSavingNote(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUploading(true);
    try {
      const file = e.target.files[0];
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);
      
      const newAttachment = {
        id: uuidv4(),
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user.id
      };

      const currentAttachments = contract.attachments || [];
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          attachments: [...currentAttachments, newAttachment],
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (updateError) throw updateError;
      
      toast.success("Arquivo enviado com sucesso!");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Clock className="animate-spin text-blue-500" /></div>;
  if (!contract) return <div>Contrato não encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground text-[14px] font-medium">
          <ArrowLeft size={18} />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 rounded-md border-border text-muted-foreground hover:bg-muted text-[13px] font-semibold">
            <Download size={14} />
            PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-md border-border text-muted-foreground hover:bg-muted text-[13px] font-semibold">
            <Share2 size={14} />
            Compartilhar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
            <div className="border-b border-border p-8">
              <div className="flex justify-between items-start mb-6">
                <span className={`px-2 py-1 rounded-[4px] text-[11px] font-semibold ${
                  contract.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                  contract.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                  contract.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {contract.status === 'approved' ? 'ASSINADO' : 
                   contract.status === 'pending' ? 'APROVAÇÃO' : 
                   contract.status === 'rejected' ? 'REJEITADO' : 'RASCUNHO'}
                </span>
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-[0.5px]">Valor do Contrato</p>
                  <p className="text-[24px] font-bold text-foreground">
                    {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contract.value || 0)}
                  </p>
                </div>
              </div>
              <h1 className="text-[28px] font-bold text-foreground tracking-[-0.5px]">{contract.title}</h1>
              <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">{contract.description}</p>
            </div>
            <CardContent className="p-0">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="w-full justify-start h-14 bg-muted/50 rounded-none border-b border-border px-8 gap-8">
                  <TabsTrigger value="content" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 text-[14px] font-medium text-muted-foreground">
                    Conteúdo
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 text-[14px] font-medium text-muted-foreground">
                    Histórico de Versões
                  </TabsTrigger>
                  <TabsTrigger value="signatures" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 text-[14px] font-medium text-muted-foreground">
                    Assinaturas ({contract.signatures?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 text-[14px] font-medium text-muted-foreground">
                    Notas de Reunião ({meetingNotes.length})
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-full px-0 text-[14px] font-medium text-muted-foreground">
                    Anexos ({contract.attachments?.length || 0})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="p-8 m-0">
                  <ScrollArea className="h-[500px] w-full rounded-lg border border-border bg-muted/30 p-6">
                    <pre className="whitespace-pre-wrap font-sans text-[14px] text-foreground leading-[1.6]">
                      {contract.content}
                    </pre>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="history" className="p-8 m-0">
                  <div className="space-y-4">
                    {versions.map((v, idx) => (
                      <div key={v.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-primary">
                            <History size={18} />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-foreground">Versão {v.version_number}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {format(parseISO(v.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary hover:bg-secondary text-[13px] font-semibold">Visualizar</Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="signatures" className="p-8 m-0">
                  <div className="space-y-4">
                    {contract.signatures?.length > 0 ? (
                      contract.signatures.map((s: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center text-green-500">
                              <CheckCircle2 size={18} />
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-foreground">{s.userName}</p>
                              <p className="text-[11px] text-green-500">
                                Assinado em {format(new Date(s.signedAt), "dd/MM/yyyy 'às' HH:mm")}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-[4px]">VALIDADO</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <PenTool size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="text-[14px]">Nenhuma assinatura registrada ainda.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="p-8 m-0">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[14px] font-semibold text-foreground">Notas de Reunião</h3>
                      {!isAddingNote && (
                        <Button 
                          onClick={() => setIsAddingNote(true)}
                          className="bg-primary hover:bg-primary/90 text-white rounded-lg gap-2 text-[12px] font-semibold h-9"
                        >
                          <Plus size={14} />
                          Nova Nota
                        </Button>
                      )}
                    </div>

                    {isAddingNote && (
                      <Card className="border border-primary/20 bg-primary/5 shadow-none rounded-xl overflow-hidden animate-in slide-in-from-top-2 duration-300">
                        <form onSubmit={handleAddNote}>
                          <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[11px] text-muted-foreground uppercase font-bold">Data da Reunião</Label>
                                <Input 
                                  type="date" 
                                  required
                                  value={newNote.date}
                                  onChange={(e) => setNewNote({...newNote, date: e.target.value})}
                                  className="bg-card border-border h-10 text-[13px] text-foreground"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[11px] text-muted-foreground uppercase font-bold">Participantes</Label>
                                <Input 
                                  placeholder="Ex: João, Maria, Fornecedor X"
                                  value={newNote.participants}
                                  onChange={(e) => setNewNote({...newNote, participants: e.target.value})}
                                  className="bg-card border-border h-10 text-[13px] text-foreground"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] text-muted-foreground uppercase font-bold">Conteúdo da Nota</Label>
                              <Textarea 
                                placeholder="Descreva o que foi discutido e decidido..."
                                required
                                value={newNote.content}
                                onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                                className="bg-card border-border min-h-[120px] text-[13px] resize-none text-foreground"
                              />
                            </div>
                          </CardContent>
                          <div className="p-4 bg-muted border-t border-border flex justify-end gap-3">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              onClick={() => setIsAddingNote(false)}
                              className="text-[12px] font-semibold text-muted-foreground"
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={savingNote}
                              className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 text-[12px] font-semibold h-9"
                            >
                              {savingNote ? <Loader2 size={14} className="animate-spin" /> : 'Salvar Nota'}
                            </Button>
                          </div>
                        </form>
                      </Card>
                    )}

                    <div className="space-y-4">
                      {meetingNotes.length > 0 ? (
                        meetingNotes.map((note) => (
                          <div key={note.id} className="p-6 bg-card rounded-xl border border-border hover:border-primary/30 transition-all shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                                  <MessageSquare size={18} />
                                </div>
                                <div>
                                  <p className="text-[14px] font-bold text-foreground">Reunião de Alinhamento</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <Calendar size={12} />
                                      {format(new Date(note.date + 'T12:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-border"></span>
                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                      <Users size={12} />
                                      {note.participants || 'Sem participantes listados'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-[11px] text-muted-foreground font-medium">
                                Por {note.authorName}
                              </span>
                            </div>
                            <div className="pl-[52px]">
                              <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {note.content}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
                          <p className="text-[14px]">Nenhuma nota de reunião registrada.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="p-8 m-0">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[14px] font-semibold text-foreground">Documentos Anexados</h3>
                      <div className="relative">
                        <input 
                          type="file" 
                          onChange={handleFileUpload} 
                          className="hidden" 
                          id="detail-file-upload"
                          disabled={uploading}
                        />
                        <Label 
                          htmlFor="detail-file-upload" 
                          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-[12px] font-semibold hover:bg-primary/90 transition-colors"
                        >
                          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                          {uploading ? 'Enviando...' : 'Anexar Arquivo'}
                        </Label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {contract.attachments?.length > 0 ? (
                        contract.attachments.map((file: any) => (
                          <div key={file.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border group hover:border-primary transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-primary">
                                <File size={18} />
                              </div>
                              <div>
                                <p className="text-[14px] font-semibold text-foreground">{file.name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  {(file.size / 1024).toFixed(1)} KB • {format(new Date(file.uploadedAt), "dd/MM/yyyy")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="flex items-center gap-2 text-muted-foreground hover:text-primary text-[13px] font-semibold"
                                onClick={() => setViewingFile(file)}
                              >
                                <Eye size={14} />
                                Visualizar
                              </Button>
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-primary hover:underline text-[13px] font-semibold"
                              >
                                <ExternalLink size={14} />
                                Abrir
                              </a>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Paperclip size={48} className="mx-auto mb-4 opacity-10" />
                          <p className="text-[14px]">Nenhum anexo encontrado.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="text-[16px] font-semibold text-foreground">Fluxo de Aprovação</h2>
            </div>
            <CardContent className="p-5 space-y-6">
              <WorkflowIndicator />
              
              <div className="flex flex-col gap-3">
                {contract.status === 'draft' && (
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg gap-2 text-[13px] font-semibold h-11"
                    onClick={() => updateStatus('pending')}
                  >
                    <Share2 size={16} />
                    Enviar para Aprovação
                  </Button>
                )}

                {contract.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      className="bg-green-500 hover:bg-green-600 text-white rounded-lg gap-2 text-[13px] font-semibold h-11"
                      onClick={() => updateStatus('approved')}
                    >
                      <CheckCircle2 size={16} />
                      Aprovar
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-border text-destructive hover:bg-destructive/10 rounded-lg gap-2 text-[13px] font-semibold h-11"
                      onClick={() => updateStatus('rejected')}
                    >
                      <XCircle size={16} />
                      Rejeitar
                    </Button>
                  </div>
                )}

                {(contract.status === 'approved' || contract.status === 'rejected') && (
                  <div className={`p-4 rounded-lg border flex items-center gap-3 ${
                    contract.status === 'approved' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-destructive/10 border-destructive/20 text-destructive'
                  }`}>
                    {contract.status === 'approved' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold">Fluxo Encerrado</span>
                      <span className="text-[11px] opacity-80">
                        Contrato {contract.status === 'approved' ? 'aprovado com sucesso' : 'rejeitado pela gestão'}
                      </span>
                    </div>
                  </div>
                )}

                {contract.status !== 'approved' && contract.status !== 'rejected' && (
                  <Button 
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-foreground text-[12px] h-9"
                    onClick={() => updateStatus('draft')}
                  >
                    Voltar para Rascunho
                  </Button>
                )}
              </div>

              <Separator className="bg-border" />
              
              <div className="space-y-3">
                <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">Ações Adicionais</p>
                <Button 
                  className="w-full bg-card border border-border text-foreground hover:bg-muted rounded-lg gap-2 text-[13px] font-semibold h-10"
                  onClick={handleSign}
                  disabled={contract.status === 'rejected'}
                >
                  <PenTool size={16} />
                  Assinar Digitalmente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Risks */}
          <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border bg-amber-500/10">
              <h2 className="text-[16px] font-semibold flex items-center gap-2 text-amber-600">
                <AlertCircle size={18} />
                Riscos Identificados
              </h2>
            </div>
            <CardContent className="p-4 space-y-3">
              {contract.risks?.length > 0 ? (
                contract.risks.map((risk: any, idx: number) => (
                  <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold mb-2 inline-block ${
                      risk.severity === 'high' ? 'bg-destructive text-white' :
                      risk.severity === 'medium' ? 'bg-amber-500 text-white' :
                      'bg-green-500 text-white'
                    }`}>
                      {risk.severity.toUpperCase()}
                    </span>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{risk.description}</p>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-muted-foreground text-center py-4">Nenhum risco identificado.</p>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card className="border border-border shadow-none bg-card rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="text-[16px] font-semibold text-foreground">Prazos e Datas</h2>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-muted-foreground">Início</span>
                <span className="text-[13px] font-semibold text-foreground">
                  {contract.start_date ? format(parseISO(contract.start_date), 'dd/MM/yyyy') : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-muted-foreground">Vencimento</span>
                <span className="text-[13px] font-semibold text-foreground">
                  {contract.end_date ? format(parseISO(contract.end_date), 'dd/MM/yyyy') : 'Indeterminado'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-muted-foreground">Última Atualização</span>
                <span className="text-[13px] font-semibold text-foreground">
                  {contract.updated_at ? format(parseISO(contract.updated_at), 'dd/MM/yyyy') : '-'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            onClick={() => setViewingFile(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-5xl h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border">
            <div className="p-4 border-b border-border bg-card flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-primary">
                  {viewingFile.type?.includes('image') ? <Eye size={16} /> : 
                   viewingFile.type?.includes('pdf') ? <FileText size={16} /> :
                   viewingFile.type?.includes('video') ? <Maximize2 size={16} /> : <File size={16} />}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-foreground truncate max-w-[200px] sm:max-w-md">{viewingFile.name}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {(viewingFile.size / 1024).toFixed(1)} KB • Visualização interna
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {viewingFile.type?.includes('image') && (
                  <div className="flex items-center bg-muted rounded-lg p-1 mr-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => setImageZoom(prev => Math.max(0.5, prev - 0.25))}
                    >
                      <ZoomOut size={14} />
                    </Button>
                    <span className="text-[10px] font-bold w-10 text-center text-foreground">{Math.round(imageZoom * 100)}%</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => setImageZoom(prev => Math.min(3, prev + 0.25))}
                    >
                      <ZoomIn size={14} />
                    </Button>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="h-8 gap-2 border-border text-primary hover:bg-secondary text-[12px] font-semibold"
                >
                  <a href={viewingFile.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={14} />
                    Abrir em Nova Aba
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild
                  className="hidden sm:flex h-8 gap-2 border-border text-muted-foreground text-[12px]"
                >
                  <a href={viewingFile.url} download={viewingFile.name}>
                    <Download size={14} />
                    Baixar
                  </a>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setViewingFile(null)}
                  className="rounded-full hover:bg-muted h-8 w-8"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 bg-muted/20 relative overflow-hidden flex flex-col">
              {viewingFile.type?.includes('pdf') ? (
                <div className="w-full h-full flex flex-col">
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(viewingFile.url)}&embedded=true`} 
                    className="w-full h-full border-none"
                    title={viewingFile.name}
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="bg-card/90 backdrop-blur shadow-sm text-[11px] h-8"
                      asChild
                    >
                      <a href={viewingFile.url} target="_blank" rel="noopener noreferrer">
                        Problemas na visualização? Clique aqui
                      </a>
                    </Button>
                  </div>
                </div>
              ) : viewingFile.type?.includes('image') ? (
                <ScrollArea className="w-full h-full">
                  <div className="min-h-full w-full flex items-center justify-center p-8">
                    <img 
                      src={viewingFile.url} 
                      alt={viewingFile.name} 
                      style={{ transform: `scale(${imageZoom})`, transition: 'transform 0.2s' }}
                      className="max-w-full shadow-lg rounded-lg origin-center"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </ScrollArea>
              ) : viewingFile.type?.includes('video') ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <video 
                    src={viewingFile.url} 
                    controls 
                    className="max-w-full max-h-full"
                    autoPlay
                  />
                </div>
              ) : viewingFile.type?.includes('audio') ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-8">
                  <div className="w-32 h-32 rounded-full bg-card flex items-center justify-center text-primary shadow-xl animate-pulse">
                    <RotateCw size={48} />
                  </div>
                  <audio 
                    src={viewingFile.url} 
                    controls 
                    className="w-full max-w-md"
                    autoPlay
                  />
                  <p className="text-[14px] font-medium text-foreground">{viewingFile.name}</p>
                </div>
              ) : (viewingFile.type?.includes('text') || textContent !== null) ? (
                <div className="w-full h-full flex flex-col">
                  {loadingText ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                  ) : (
                    <ScrollArea className="flex-1 p-6">
                      <pre className="p-6 bg-card rounded-xl border border-border font-mono text-[13px] text-foreground leading-relaxed whitespace-pre-wrap shadow-sm">
                        {textContent}
                      </pre>
                    </ScrollArea>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center text-muted-foreground shadow-sm">
                    <FileText size={40} />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-foreground">Visualização não disponível</h3>
                    <p className="text-[14px] text-muted-foreground max-w-xs mx-auto mt-2">
                      Este tipo de arquivo ({viewingFile.type || 'desconhecido'}) não pode ser visualizado diretamente.
                    </p>
                  </div>
                  <Button 
                    asChild
                    className="bg-primary hover:bg-primary/90 text-white rounded-lg gap-2 mt-4"
                  >
                    <a href={viewingFile.url} target="_blank" rel="noopener noreferrer">
                      <Download size={16} />
                      Baixar Arquivo
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
