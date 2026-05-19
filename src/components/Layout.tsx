import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  LogOut, 
  Bell, 
  Search,
  Menu,
  X,
  ShieldAlert,
  BarChart3,
  ShieldCheck,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from './ui/button';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}

export default function Layout({ children, activeTab, setActiveTab, user }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contracts', label: 'Meus Contratos', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'compliance', label: 'Segurança', icon: ShieldCheck },
    { id: 'create', label: 'Novo Contrato', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans transition-colors duration-300">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-[220px] bg-card border-r border-border flex-col p-6 gap-8 fixed inset-y-0 left-0 z-40 overflow-y-auto">
        <div className="logo font-bold text-[18px] tracking-[-0.5px] text-muted-foreground flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-[4px]"></div>
          SGC Pro
        </div>
        
        <nav className="flex-1 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-medium transition-colors ${
                activeTab === item.id 
                  ? 'bg-secondary text-secondary-foreground' 
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-4 border-t border-border">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted text-[13px] h-9 mb-4"
            onClick={toggleDarkMode}
          >
            {isDarkMode ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
            {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          </Button>

          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[13px] font-semibold truncate">{user?.displayName || 'Usuário'}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted text-[13px] h-9"
            onClick={handleLogout}
          >
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-card border-b border-border p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2 text-muted-foreground">
          <div className="w-5 h-5 bg-primary rounded-[4px]"></div>
          SGC Pro
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={toggleDarkMode} className="p-2 text-muted-foreground">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-muted-foreground">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-background p-6 flex flex-col">
          <div className="flex justify-end mb-8">
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-muted-foreground"><X size={32} /></button>
          </div>
          <nav className="space-y-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 text-xl py-4 font-medium ${
                  activeTab === item.id ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon size={24} />
                {item.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 text-xl py-4 text-destructive font-medium"
            >
              <LogOut size={24} />
              Sair
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden md:ml-[220px]">
        <header className="hidden md:flex bg-transparent h-20 items-center justify-between px-8">
          <h2 className="text-[16px] font-bold text-foreground">
            {navItems.find(i => i.id === activeTab)?.label || 'Detalhes'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Pesquisa inteligente..." 
                className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-[14px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all w-[400px]"
              />
            </div>
            <button className="p-2 text-muted-foreground hover:text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
