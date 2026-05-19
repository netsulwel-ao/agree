import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ContractList from './components/ContractList';
import ContractForm from './components/ContractForm';
import ContractDetail from './components/ContractDetail';
import Analytics from './components/Analytics';
import Compliance from './components/Compliance';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { ShieldAlert, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncUserProfile(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        syncUserProfile(currentUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncUserProfile = async (user: any) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || 'Usuário',
        role: 'user'
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Erro na autenticação");
    } finally {
      setAuthLoading(false);
    }
  };

  const navigateToDetail = (id: string) => {
    setSelectedContractId(id);
    setActiveTab('detail');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="animate-pulse text-blue-400" size={48} />
          <p className="text-lg font-medium">Carregando SGC Pro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden relative">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-md w-full p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-600/30">
            <ShieldAlert size={40} className="text-white" />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">SGC Pro</h1>
            <p className="text-slate-400">Sistema de Gestão de Contratos Inteligente</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <Button 
              type="submit"
              disabled={authLoading}
              className="w-full py-6 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 mt-6"
            >
              <LogIn size={20} />
              {authLoading ? 'Aguarde...' : 'Entrar'}
            </Button>
          </form>
          
          <p className="mt-8 text-xs text-slate-500 text-center">
            Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user}>
      {activeTab === 'dashboard' && <Dashboard onSelectContract={navigateToDetail} />}
      {activeTab === 'contracts' && <ContractList onSelectContract={navigateToDetail} />}
      {activeTab === 'analytics' && <Analytics />}
      {activeTab === 'compliance' && <Compliance />}
      {activeTab === 'create' && <ContractForm onComplete={() => setActiveTab('contracts')} />}
      {activeTab === 'detail' && selectedContractId && (
        <ContractDetail 
          contractId={selectedContractId} 
          onBack={() => setActiveTab('contracts')} 
        />
      )}
    </Layout>
  );
}
