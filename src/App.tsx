/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Package, 
  DollarSign, 
  Bot, 
  Settings, 
  User as UserIcon, 
  Plus, 
  TrendingUp, 
  Star, 
  Search, 
  ChevronRight,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogOut,
  ShieldCheck,
  CreditCard,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { chatWithAI } from './services/geminiService';
import { AuthProvider, useAuth } from './contexts/AuthContext';

type View = 'dashboard' | 'agenda' | 'barbers' | 'estoque' | 'financeiro' | 'ia' | 'admin';

interface Message {
  role: 'ia' | 'user';
  text: string;
  time: string;
}

const ADMIN_EMAIL = "michaelmarianodasilva81@gmail.com";

function MainApp() {
  const { user, logout } = useAuth();
  const isAdmin = user?.email === ADMIN_EMAIL;
  const [activeView, setActiveView] = React.useState<View>('dashboard');
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: 'ia',
      text: 'Olá! Sou a IA da Kernel Barber Shopper. Posso te ajudar com agendamentos, controle de estoque, relatórios financeiros e muito mais. Como posso ajudar hoje?',
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim()) return;

    const newMsg: Message = {
      role: 'user',
      text,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);

    // Context for AI
    const context = `
      User is: ${user?.displayName || 'Admin'}. View: ${activeView}. 
      Shop stats: Monthly Revenue R$ 12.4k, 18 appointments today, 2 critical stock items.
    `;

    const aiResponse = await chatWithAI(text, context);
    
    setIsTyping(false);
    setMessages(prev => [...prev, {
      role: 'ia',
      text: aiResponse,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: Calendar, badge: 7 },
    { id: 'barbers', label: 'Barbeiros', icon: Users },
    { id: 'estoque', label: 'Estoque', icon: Package, badge: 2, badgeColor: 'bg-red-500' },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'ia', label: 'IA Assistente', icon: Bot },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#C9A84C] selection:text-black">
      {/* Top Navigation */}
      <nav className="h-16 bg-[#141414] border-b border-[#2A2A2A] flex items-center px-6 gap-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C9A84C] rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.2" className="w-6 h-6">
              <path d="M6 2l1.5 5.5L12 5l4.5 2.5L18 2" strokeLinecap="round" />
              <path d="M6 22l1.5-5.5L12 19l4.5-2.5L18 22" strokeLinecap="round" />
              <line x1="12" y1="5" x2="12" y2="19" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </div>
          <span className="text-[#C9A84C] font-display font-bold tracking-tight text-lg">Kernel Barber</span>
        </div>

        <div className="hidden md:flex items-center gap-1 ml-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200",
                activeView === item.id 
                  ? "bg-[#C9A84C] text-[#0A0A0A] shadow-lg shadow-[#C9A84C]/20" 
                  : "text-[#888] hover:text-[#C9A84C] hover:bg-[#C9A84C]/10"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-[#2A2A2A]">
           <button 
            onClick={logout}
            className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-[#888] hover:text-red-500 hover:border-red-500/30 transition-all"
           >
             <LogOut className="w-4 h-4" />
           </button>
           <div className="hidden sm:block text-right">
             <p className="text-[10px] text-[#888] font-bold uppercase tracking-widest leading-none mb-1">Logado como</p>
             <p className="text-xs font-bold text-white leading-none">{user?.displayName?.split(' ')[0] || 'Usuário'}</p>
           </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-[#141414] border-r border-[#2A2A2A] py-8 hidden lg:flex flex-col gap-8 flex-shrink-0">
          <div className="px-6 flex flex-col gap-2">
            <p className="text-[10px] text-[#888] uppercase tracking-[2px] font-bold mb-4 opacity-50">Menu principal</p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all relative group font-medium",
                  activeView === item.id 
                    ? "text-[#C9A84C] bg-[#C9A84C]/10 shadow-[inset_2px_0_0_0_#C9A84C]" 
                    : "text-[#888] hover:text-[#C9A84C] hover:bg-[#C9A84C]/5"
                )}
              >
                <item.icon className={cn("w-4 h-4", activeView === item.id ? "text-[#C9A84C]" : "")} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    "ml-auto text-[10px] font-black px-2 py-0.5 rounded-full",
                    item.badgeColor || "bg-[#C9A84C] text-[#0A0A0A]"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}

            {isAdmin && (
              <button
                onClick={() => setActiveView('admin')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all relative group font-bold mt-4",
                  activeView === 'admin' 
                    ? "text-[#E8C96A] bg-[#C9A84C]/20 shadow-[inset_2px_0_0_0_#C9A84C]" 
                    : "text-[#C9A84C] border border-[#C9A84C]/20 hover:bg-[#C9A84C]/10"
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Painel SaaS</span>
              </button>
            )}
          </div>

          <div className="px-6 flex flex-col gap-2 mt-auto pb-6">
            <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#888] hover:text-[#C9A84C] hover:bg-[#C9A84C]/5 transition-all outline-none">
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scroll">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && <DashboardView key="dashboard" onNavigate={setActiveView} />}
            {activeView === 'agenda' && <AgendaView key="agenda" onNavigate={setActiveView} />}
            {activeView === 'barbers' && <BarbersView key="barbers" />}
            {activeView === 'estoque' && <StockView key="estoque" onNavigate={setActiveView} />}
            {activeView === 'financeiro' && <FinanceiroView key="financeiro" />}
            {activeView === 'admin' && <AdminView key="admin" />}
            {activeView === 'ia' && (
              <IAAssistantView 
                key="ia" 
                messages={messages} 
                input={input} 
                setInput={setInput} 
                sendMessage={handleSendMessage} 
                isTyping={isTyping}
                chatEndRef={chatEndRef}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function LoginScreen() {
  const { signIn } = useAuth();
  
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1a1a1a] to-[#0A0A0A]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#141414] border border-[#2A2A2A] rounded-[32px] p-10 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#C9A84C]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#C9A84C]/5 rounded-full blur-3xl" />
        
        <div className="relative">
          <div className="w-20 h-20 bg-[#C9A84C] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-[#C9A84C]/20 border-b-4 border-[#9A7A30]">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" className="w-10 h-10">
              <path d="M6 2l1.5 5.5L12 5l4.5 2.5L18 2" strokeLinecap="round" />
              <path d="M6 22l1.5-5.5L12 19l4.5-2.5L18 22" strokeLinecap="round" />
              <line x1="12" y1="5" x2="12" y2="19" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">Kernel Barber</h1>
          <p className="text-[#888] text-sm mb-10 font-medium">A gestão de luxo para sua barbearia,<br />agora com inteligência artificial.</p>
          
          <button 
            onClick={signIn}
            className="w-full bg-white text-[#0A0A0A] py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#E8C96A] hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </button>
          
          <p className="mt-8 text-[10px] text-[#555] uppercase font-black tracking-widest">Enterprise Edition / 2026</p>
        </div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  return user ? <MainApp /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function DashboardView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const metrics = [
    { label: 'Receita Hoje', val: 'R$ 1.240', sub: '+12% vs ontem', positive: true },
    { label: 'Agendamentos', val: '18', sub: '3 pendentes', positive: true },
    { label: 'Clientes Novos', val: '4', sub: '+2 vs ontem', positive: true },
    { label: 'Avaliação Média', val: '4.8 ★', sub: '32 avaliações', positive: true },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-[#C9A84C]">Visão Geral</h1>
          <p className="text-[#888] text-sm">Bem-vindo ao Kernel Barber Shopper, seu painel do dia.</p>
        </div>
        <button className="bg-[#C9A84C] text-[#0A0A0A] px-5 py-2.5 rounded-xl font-semibold text-sm hover:scale-[1.02] active:scale-95 transition-all">
          Baixar Relatório
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-2xl">
            <p className="text-[#888] text-xs font-medium uppercase tracking-wider mb-2">{m.label}</p>
            <div className="text-2xl font-bold text-[#E8C96A]">{m.val}</div>
            <p className={cn("text-[10px] mt-1 font-medium", m.positive ? "text-green-500" : "text-red-500")}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Próximos Agendamentos" action="Ver agenda" onAction={() => onNavigate('agenda')}>
          <div className="space-y-4">
            <AgendaRow status="ok" time="09:00" client="Carlos Mendes" service="Corte + Barba" barber="Rafael" />
            <AgendaRow status="wait" time="10:30" client="Lucas Ferreira" service="Corte Degradê" barber="Bruno" />
            <AgendaRow status="ok" time="11:00" client="Pedro Alves" service="Barba Completa" barber="Marcos" />
            <AgendaRow status="wait" time="14:00" client="André Costa" service="Corte + Pézinho" barber="Rafael" />
          </div>
        </Card>

        <Card title="Alertas de Estoque" action="Ver estoque" onAction={() => onNavigate('estoque')}>
          <div className="space-y-4">
            <StockAlert status="critical" item="Pomada Modeladora" qty="2 un" />
            <StockAlert status="low" item="Gel de Barba" qty="5 un" />
            <StockAlert status="low" item="Toalhas Descartáveis" qty="12 un" />
            <StockAlert status="ok" item="Shampoo Profissional" qty="28 un" />
          </div>
          <button 
            onClick={() => onNavigate('ia')}
            className="w-full mt-6 bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20 py-3 rounded-xl text-sm font-medium hover:bg-[#C9A84C]/20 transition-all flex items-center justify-center gap-2"
          >
            <Bot className="w-4 h-4" />
            Analisar Reposição com IA
          </button>
        </Card>
      </div>

      <Card title="Receita Semanal">
        <div className="h-48 flex items-end gap-3 pt-6">
          {[40, 65, 55, 100, 75, 50, 30].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3">
               <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className={cn(
                  "w-full rounded-t-lg transition-all",
                  h === 100 ? "bg-[#C9A84C]" : "bg-[#C9A84C]/30"
                )}
               />
               <span className="text-[10px] text-[#888] font-medium">{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function AgendaView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const days = [
    { name: 'Seg', num: '05' },
    { name: 'Ter', num: '06' },
    { name: 'Qua', num: '07' },
    { name: 'Qui', num: '08', active: true },
    { name: 'Sex', num: '09' },
    { name: 'Sáb', num: '10' },
    { name: 'Dom', num: '11' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#C9A84C]">Agenda</h1>
        <button 
           onClick={() => onNavigate('ia')}
           className="bg-[#C9A84C] text-[#0A0A0A] px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Novo com IA
        </button>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {days.map((d, i) => (
          <button 
            key={i} 
            className={cn(
              "flex flex-col items-center p-4 rounded-2xl border transition-all",
              d.active 
                ? "bg-[#C9A84C] border-[#C9A84C] text-[#0A0A0A]" 
                : "bg-[#1A1A1A] border-[#2A2A2A] text-[#888] hover:border-[#C9A84C]/50"
            )}
          >
            <span className="text-[10px] uppercase font-bold tracking-widest mb-1">{d.name}</span>
            <span className="text-xl font-bold">{d.num}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-5 p-4 border-b border-[#2A2A2A] text-[10px] uppercase font-bold tracking-widest text-[#C9A84C]">
          <div className="col-span-1">Horário</div>
          <div className="col-span-1">Cliente</div>
          <div className="col-span-1">Serviço</div>
          <div className="col-span-1">Barbeiro</div>
          <div className="col-span-1 text-right">Status</div>
        </div>
        <div className="divide-y divide-[#2A2A2A]">
          {[
            { t: '08:30', c: 'João Paulo Silva', s: 'Corte Social', b: 'Rafael', st: 'ok' },
            { t: '09:00', c: 'Carlos Mendes', s: 'Corte + Barba', b: 'Bruno', st: 'ok' },
            { t: '10:00', c: 'Felipe Rocha', s: 'Pézinho', b: 'Marcos', st: 'wait' },
            { t: '10:30', c: 'Lucas Ferreira', s: 'Corte Degradê', b: 'Rafael', st: 'wait' },
            { t: '11:00', c: 'Pedro Alves', s: 'Barba Completa', b: 'Bruno', st: 'ok' },
            { t: '13:00', c: 'Rodrigo Lima', s: 'Corte Afro', b: 'Marcos', st: 'cancel' },
            { t: '14:00', c: 'André Costa', s: 'Corte + Pézinho', b: 'Rafael', st: 'wait' },
          ].map((item, i) => (
            <div key={i} className="grid grid-cols-5 p-4 items-center text-sm group hover:bg-[#2A2A2A]/30 transition-all">
              <div className="col-span-1 font-bold text-[#C9A84C] flex items-center gap-2">
                <StatusDot status={item.st as any} /> {item.t}
              </div>
              <div className="col-span-1 text-[#eee]">{item.c}</div>
              <div className="col-span-1 text-[#888]">{item.s}</div>
              <div className="col-span-1">
                <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wider">
                  {item.b}
                </span>
              </div>
              <div className="col-span-1 text-right">
                <button className="text-[#888] hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-end gap-1 ml-auto">
                   <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function BarbersView() {
  const barbers = [
    { name: 'Rafael Souza', role: 'Barbeiro Sênior', stats: { cuts: 127, rev: 'R$4.8k', rating: 4.9 }, initials: 'RF' },
    { name: 'Bruno Nascimento', role: 'Barbeiro Pleno', stats: { cuts: 98, rev: 'R$3.2k', rating: 4.7 }, initials: 'BN' },
    { name: 'Marcos Carvalho', role: 'Barbeiro Júnior', stats: { cuts: 64, rev: 'R$2.1k', rating: 4.4 }, initials: 'MC' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#C9A84C]">Equipe de Profissionais</h1>
        <button className="bg-[#C9A84C] text-[#0A0A0A] px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#C9A84C]/10">
          Adicionar Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {barbers.map((b, i) => (
          <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8 text-center group hover:border-[#C9A84C]/50 transition-all">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#9A7A30] to-[#E8C96A] mx-auto mb-6 flex items-center justify-center text-2xl font-bold text-black border-4 border-[#141414] shadow-xl group-hover:scale-105 transition-all">
              {b.initials}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{b.name}</h3>
            <p className="text-[#888] text-xs font-medium uppercase tracking-widest mb-4">{b.role}</p>
            
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className={cn("w-3.5 h-3.5", j < Math.floor(b.stats.rating) ? "text-[#C9A84C] fill-[#C9A84C]" : "text-[#2A2A2A]")} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 border-y border-[#2A2A2A] py-4 mb-6">
              <div>
                <p className="text-sm font-bold text-[#C9A84C]">{b.stats.cuts}</p>
                <p className="text-[9px] text-[#888] uppercase font-bold tracking-wider">Cortes</p>
              </div>
              <div>
                <p className="text-sm font-bold text-[#C9A84C]">{b.stats.rev}</p>
                <p className="text-[9px] text-[#888] uppercase font-bold tracking-wider">Faturado</p>
              </div>
              <div>
                <p className="text-sm font-bold text-[#C9A84C]">{b.stats.rating}</p>
                <p className="text-[9px] text-[#888] uppercase font-bold tracking-wider">Nota</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-2.5 border border-[#C9A84C] text-[#C9A84C] rounded-xl text-xs font-bold hover:bg-[#C9A84C] hover:text-black transition-all">Ver Agenda</button>
              <button className="flex-1 py-2.5 border border-[#2A2A2A] text-[#888] rounded-xl text-xs font-bold hover:bg-[#2A2A2A] transition-all">Perfil</button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function StockView({ onNavigate }: { onNavigate: (v: View) => void }) {
  const stock = [
    { name: 'Pomada Modeladora Pro', cat: 'Finalizador', qty: '2 un', st: 'critical' },
    { name: 'Gel de Barba Hidratante', cat: 'Barba', qty: '5 un', st: 'low' },
    { name: 'Toalhas Descartáveis', cat: 'Descartável', qty: '12 un', st: 'low' },
    { name: 'Shampoo Profissional', cat: 'Cabelo', qty: '28 un', st: 'ok' },
    { name: 'Lâminas de Barbear', cat: 'Descartável', qty: '45 un', st: 'ok' },
    { name: 'Óleo de Barba Premium', cat: 'Barba', qty: '18 un', st: 'ok' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#C9A84C]">Controle de Estoque</h1>
        <button className="bg-[#C9A84C] text-[#0A0A0A] px-5 py-2.5 rounded-xl font-bold text-sm">Novo Item</button>
      </div>

      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#888]" />
          <input 
            type="text" 
            placeholder="Pesquisar produto..." 
            className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C] transition-all"
          />
        </div>
        <select className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm focus:outline-none appearance-none cursor-pointer">
          <option>Todos os itens</option>
          <option>Estoque baixo</option>
        </select>
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-4 p-4 border-b border-[#2A2A2A] text-[10px] uppercase font-bold tracking-widest text-[#C9A84C]">
          <div>Produto</div>
          <div>Categoria</div>
          <div className="text-center">Quantidade</div>
          <div className="text-right">Ação</div>
        </div>
        <div className="divide-y divide-[#2A2A2A]">
          {stock.map((item, i) => (
             <div key={i} className="grid grid-cols-4 p-4 items-center text-sm hover:bg-[#2A2A2A]/20 transition-all">
                <div className="text-[#eee] flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    item.st === 'critical' ? 'bg-red-500' : item.st === 'low' ? 'bg-orange-500' : 'bg-green-500'
                  )} />
                  {item.name}
                </div>
                <div className="text-[#888]">{item.cat}</div>
                <div className="flex justify-center">
                  <span className={cn(
                    "px-3 py-1 rounded-lg font-bold text-[11px]",
                    item.st === 'critical' ? 'bg-red-500/10 text-red-500' : item.st === 'low' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'
                  )}>
                    {item.qty}
                  </span>
                </div>
                <div className="text-right">
                  <button className="text-[#C9A84C] hover:underline text-xs font-bold">Gerenciar</button>
                </div>
             </div>
          ))}
        </div>
      </div>

      <div className="text-center py-4">
        <button 
           onClick={() => onNavigate('ia')}
           className="bg-[#C9A84C] text-[#0A0A0A] px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-[#C9A84C]/5"
        >
          Analisar Estoque com IA ↗
        </button>
      </div>
    </motion.div>
  );
}

function FinanceiroView() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <h1 className="text-2xl font-bold text-[#C9A84C]">Financeiro</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Faturamento Mensal', val: 'R$ 12.4k', sub: '+8% vs mês ant.' },
          { label: 'Despesas Gerais', val: 'R$ 4.2k', sub: '+3%', neg: true },
          { label: 'Lucro Líquido', val: 'R$ 8.2k', sub: '+11% vs mês ant.' },
          { label: 'Ticket Médio', val: 'R$ 68', sub: '+5%' },
        ].map((m, i) => (
          <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-2xl">
            <p className="text-[#888] text-xs font-semibold uppercase tracking-wider mb-2">{m.label}</p>
            <div className="text-2xl font-bold text-[#E8C96A]">{m.val}</div>
            <p className={cn("text-[10px] items-center flex gap-1 mt-1 font-medium", m.neg ? "text-red-500" : "text-green-500")}>
              <TrendingUp className="w-3 h-3" /> {m.sub}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Receita por Serviço">
          <div className="space-y-6 mt-4">
            <FinBar label="Corte Regular" val="R$ 5.4k" percentage={75} />
            <FinBar label="Barba Designer" val="R$ 3.2k" percentage={45} />
            <FinBar label="Corte Degradê" val="R$ 2.5k" percentage={35} />
            <FinBar label="Combos VIP" val="R$ 1.3k" percentage={18} />
          </div>
        </Card>
        <Card title="Canais de Pagamento">
           <div className="h-48 flex items-center justify-center p-6 mt-4">
             {/* Simple visual representation for "Payment Methods" */}
             <div className="relative w-36 h-36">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="#2A2A2A" strokeWidth="4" />
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="#C9A84C" strokeWidth="4" strokeDasharray="60 100" />
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="#9A7A30" strokeWidth="4" strokeDasharray="28 100" strokeDashoffset="-60" />
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="#555" strokeWidth="4" strokeDasharray="12 100" strokeDashoffset="-88" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-xl font-bold text-white">PIX</span>
                  <span className="text-[10px] text-[#888] font-bold">MAJORITÁRIO</span>
                </div>
             </div>
             <div className="flex flex-col gap-3 ml-10">
                <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded-full bg-[#C9A84C]" /> <span>PIX (60%)</span></div>
                <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded-full bg-[#9A7A30]" /> <span>Cartão (28%)</span></div>
                <div className="flex items-center gap-2 text-xs"><div className="w-3 h-3 rounded-full bg-[#555]" /> <span>Dinheiro (12%)</span></div>
             </div>
           </div>
        </Card>
      </div>
    </motion.div>
  );
}

function IAAssistantView({ messages, input, setInput, sendMessage, isTyping, chatEndRef }: any) {
  const quickPrompts = [
    'Quais horários livres hoje?',
    'Relatório de estoque crítico',
    'Ranking de barbeiros do mês',
    'Previsão de receita semanal',
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full max-w-4xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#C9A84C]">IA Assistente</h1>
        <p className="text-[#888] text-sm">Consultor em agendamentos, estoque e estratégia de negócio.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {quickPrompts.map((p, i) => (
          <button 
            key={i} 
            onClick={() => sendMessage(p)}
            className="text-[11px] font-bold px-4 py-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/5 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all uppercase tracking-tight"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 mb-6 flex flex-col gap-6 custom-scroll">
        {messages.map((m: any, i: number) => (
          <div key={i} className={cn(
            "flex gap-4 max-w-[85%]",
            m.role === 'user' ? "ml-auto flex-row-reverse" : ""
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
              m.role === 'ia' ? "bg-[#C9A84C] text-[#0A0A0A]" : "bg-[#2A2A2A] text-[#C9A84C]"
            )}>
              {m.role === 'ia' ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="space-y-1">
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                m.role === 'ia' ? "bg-[#1A1A1A] text-[#eee] border border-[#2A2A2A]" : "bg-[#C9A84C]/10 text-[#fff] border border-[#C9A84C]/20"
              )}>
                {m.text}
              </div>
              <p className={cn("text-[9px] text-[#888] font-medium uppercase tracking-wider", m.role === 'user' ? "text-right" : "")}>{m.time}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-4 items-center animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-[#0A0A0A] animate-spin" />
            </div>
            <p className="text-xs text-[#888] font-bold tracking-widest uppercase">IA está processando...</p>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="relative group">
        <textarea 
          placeholder="Pergunte sobre agendamentos, receita ou estoque..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 pr-16 text-sm focus:outline-none focus:border-[#C9A84C] transition-all min-h-[60px] max-h-[150px] resize-none"
          rows={2}
        />
        <button 
          onClick={() => sendMessage()}
          disabled={!input.trim()}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#C9A84C] text-[#0A0A0A] rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-[#C9A84C]/10"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function AdminView() {
  const stats = [
    { label: 'Lojas Ativas', val: '42', icon: Building2, color: 'text-blue-500' },
    { label: 'Assinaturas MRR', val: 'R$ 8.400', icon: CreditCard, color: 'text-green-500' },
    { label: 'Usuários Totais', val: '156', icon: Users, color: 'text-purple-500' },
    { label: 'Novas Lojas (30d)', val: '12', icon: TrendingUp, color: 'text-[#C9A84C]' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-display font-bold text-[#E8C96A] mb-2 tracking-tight">Painel de Administrador SaaS</h1>
        <p className="text-[#888] text-sm">Gestão global de lojas, assinaturas e saúde do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-[#141414] border border-[#2A2A2A] p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-12 h-12 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all" />
            <s.icon className={cn("w-5 h-5 mb-4", s.color)} />
            <p className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-1">{s.label}</p>
            <div className="text-2xl font-bold text-white">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Lojas Recentes">
            <div className="space-y-1">
              {[
                { name: 'Barber Elit', owner: 'Joao Silva', plan: 'Pro', status: 'Ativo' },
                { name: 'Retro Cuts', owner: 'Marcos Braz', plan: 'Basic', status: 'Ativo' },
                { name: 'VIP Shave', owner: 'Lucas Neto', plan: 'Pro', status: 'Inadimplente' },
                { name: 'The Legend', owner: 'Felipe M.', plan: 'Pro', status: 'Ativo' },
              ].map((shop, i) => (
                <div key={i} className="flex items-center gap-4 py-4 px-2 hover:bg-white/5 rounded-2xl transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] flex items-center justify-center font-bold text-[#888]">
                    {shop.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{shop.name}</p>
                    <p className="text-xs text-[#888]">{shop.owner}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-[#2A2A2A] text-white rounded-md mb-1 block">
                      {shop.plan}
                    </span>
                    <span className={cn(
                      "text-[9px] font-bold",
                      shop.status === 'Ativo' ? "text-green-500" : "text-red-500"
                    )}>{shop.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Ações Rápidas">
            <div className="grid grid-cols-1 gap-2">
              <button className="w-full py-3 bg-[#C9A84C] text-[#0A0A0A] rounded-xl font-bold text-xs hover:bg-[#E8C96A] transition-all">
                Criar Cupom Promocional
              </button>
              <button className="w-full py-3 bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl font-bold text-xs hover:bg-[#222] transition-all">
                Enviar E-mail Global
              </button>
              <button className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-bold text-xs hover:bg-red-500/20 transition-all">
                Manutenção do Sistema
              </button>
            </div>
          </Card>
          
          <div className="bg-gradient-to-br from-[#9A7A30] to-[#E8C96A] p-6 rounded-[32px] text-black">
            <ShieldCheck className="w-8 h-8 mb-4" />
            <h3 className="text-xl font-bold mb-2">Modo Admin Ativo</h3>
            <p className="text-sm opacity-80 leading-relaxed">Você tem acesso total aos dados de todas as filiais e faturamento da plataforma.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Subcomponents
function Card({ title, children, action, onAction }: { title: string, children: React.ReactNode, action?: string, onAction?: () => void }) {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 flex flex-col">
       <div className="flex justify-between items-center mb-6">
        <h3 className="text-[11px] uppercase font-bold tracking-widest text-[#C9A84C]">{title}</h3>
        {action && (
          <button onClick={onAction} className="text-xs font-bold text-[#888] flex items-center gap-1 hover:text-[#C9A84C] transition-all">
            {action} <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function AgendaRow({ status, time, client, service, barber }: any) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-[#2A2A2A]/50 last:border-0 group">
       <StatusDot status={status} />
       <div className="text-sm font-bold text-white w-14 group-hover:text-[#C9A84C] transition-all">{time}</div>
       <div className="flex-1">
         <p className="text-sm text-[#eee] font-medium">{client}</p>
         <p className="text-[10px] text-[#888]">{service}</p>
       </div>
       <span className="text-[9px] font-bold text-[#C9A84C] bg-[#C9A84C]/10 py-1 px-3 rounded-full uppercase tracking-wider">{barber}</span>
    </div>
  );
}

function StockAlert({ status, item, qty }: any) {
  return (
    <div className="flex items-center gap-4 py-2 group">
      {status === 'critical' && <AlertCircle className="w-4 h-4 text-red-500" />}
      {status === 'low' && <Clock className="w-4 h-4 text-orange-500" />}
      {status === 'ok' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
      <span className="text-sm text-[#eee] flex-1 group-hover:text-white transition-all">{item}</span>
      <span className={cn(
        "text-[10px] font-bold px-2 py-1 rounded-md",
        status === 'critical' ? 'bg-red-500/10 text-red-500' : 
        status === 'low' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'
      )}>{qty}</span>
    </div>
  );
}

function StatusDot({ status }: { status: 'ok' | 'wait' | 'cancel' }) {
  const colors = {
    ok: 'bg-green-500 shadow-green-500/20',
    wait: 'bg-[#C9A84C] shadow-[#C9A84C]/20',
    cancel: 'bg-red-500 shadow-red-500/20',
  };
  return <div className={cn("w-2 h-2 rounded-full shadow-lg shrink-0", colors[status])} />;
}

function FinBar({ label, val, percentage }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-[#888]">{label}</span>
        <span className="text-[#C9A84C]">{val}</span>
      </div>
      <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className="h-full bg-[#C9A84C]" 
        />
      </div>
    </div>
  );
}
