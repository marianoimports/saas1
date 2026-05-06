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
  Building2,
  Trash2,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Crown,
  Gift,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { chatWithAI } from './services/geminiService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';
import {
  subscribeToShops,
  subscribeToPlans,
  subscribeToUsers,
  addShop,
  updateShop,
  addPlan,
  updatePlan,
  deleteUser,
  sendPasswordResetEmail,
  getActiveShopsCount,
  getTotalUsersCount,
  getMRR,
  getNewShopsLast30Days
} from './services/dbService';

type View = 'dashboard' | 'agenda' | 'barbers' | 'estoque' | 'financeiro' | 'ia' | 'admin' | 'pricing' | 'setup';

interface Message {
  role: 'ia' | 'user';
  text: string;
  time: string;
}

export function App() {
  const { user, logout, isAdmin, userData, checkAdminStatus } = useAuth();
  
  // SIMPLE: Force admin true for this specific email - nothing else matters
  const isAdminFinal = user?.email === 'michaelmarianodasilva81@gmail.com' ? true : (isAdmin || false);
  
  React.useEffect(() => {
    if (user?.email === 'michaelmarianodasilva81@gmail.com') {
      checkAdminStatus(user).catch(() => {});
    }
  }, [user]);
  
  // Auto-redirect admin to admin panel
  React.useEffect(() => {
    if (isAdminFinal && user) {
      setActiveView('admin');
    }
  }, [isAdminFinal, user]);
  
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
  const [activeAdminTab, setActiveAdminTab] = React.useState<'overview' | 'shops' | 'users' | 'plans' | 'settings'>('overview');

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
    { id: 'pricing', label: 'Planos', icon: CreditCard },
  ];

  // Admin nav items (includes IA)
  const adminNavItems = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'shops', label: 'Lojas', icon: Building2 },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'plans', label: 'Planos', icon: Crown },
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'ia', label: 'IA Assistente', icon: Bot },
  ];

  // Admin Layout - Completely separate from barber layout
  if (isAdminFinal && activeView === 'admin') {
    return <AdminLayout 
      user={user} 
      logout={logout} 
      activeTab={activeAdminTab} 
      setActiveTab={setActiveAdminTab}
      navItems={adminNavItems}
    />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#C9A84C] selection:text-black">
      {/* Top Navigation */}
      <nav className="h-16 bg-[#141414] border-b border-[#2A2A2A] flex items-center px-6 gap-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C9A84C] rounded-xl flex items-center justify-center">
            <img src="/logo-800px.png" alt="Kernel Barber" className="w-10 h-10 object-contain" />
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

            {isAdminFinal ? (
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
            ) : user?.email === 'michaelmarianodasilva81@gmail.com' ? (
              <button
                onClick={async () => {
                  try {
                    const { setUserAsAdmin } = await import('./services/dbService');
                    await setUserAsAdmin(user?.uid || '');
                    await checkAdminStatus(user);
                    window.location.reload();
                  } catch (error) {
                    console.error('Error setting admin:', error);
                    alert('Erro ao tornar admin. Verifique o console.');
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all relative group font-bold mt-4 text-red-500 border border-red-500/30 hover:bg-red-500/10 animate-pulse"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Tornar Admin</span>
              </button>
            ) : null}
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
            {activeView === 'pricing' && <PricingView key="pricing" />}
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

function AdminLayout({ user, logout, activeTab, setActiveTab, navItems }: any) {
  const [shops, setShops] = React.useState<any[]>([]);
  const [plans, setPlans] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [allUsers, setAllUsers] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    activeShops: 0,
    mrr: 0,
    totalUsers: 0,
    newShops30d: 0
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubShops = subscribeToShops<any>((data) => {
      setShops(data);
    });

    const unsubPlans = subscribeToPlans<any>((data) => {
      setPlans(data);
    });

    // Subscribe to root users collection
    const unsubUsers = subscribeToUsers<any>((data) => {
      setUsers(data);
    });

    // Also fetch users from all shops (barbers/clients)
    const fetchAllShopUsers = async () => {
      try {
        const shopsSnapshot = await getDocs(collection(db, 'shops'));
        const allShopUsers: any[] = [];
        
        for (const shopDoc of shopsSnapshot.docs) {
          const shopId = shopDoc.id;
          const usersSnapshot = await getDocs(collection(db, `shops/${shopId}/users`));
          usersSnapshot.forEach(doc => {
            allShopUsers.push({
              id: doc.id,
              ...doc.data(),
              shopId,
              source: 'shop'
            });
          });
        }
        
        setAllUsers(allShopUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching shop users:', error);
        setLoading(false);
      }
    };

    fetchAllShopUsers();

    const calcStats = async () => {
      const [activeShops, mrr, totalUsers, newShops30d] = await Promise.all([
        getActiveShopsCount(),
        getMRR(),
        getTotalUsersCount(),
        getNewShopsLast30Days()
      ]);
      setStats({ activeShops, mrr, totalUsers: totalUsers + allUsers.length, newShops30d });
    };
    calcStats();

    return () => {
      unsubShops();
      unsubPlans();
      unsubUsers();
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleToggleShopStatus = async (shop: any) => {
    const newStatus = shop.status === 'active' ? 'suspended' : 'active';
    try {
      await updateShop(shop.id, { status: newStatus });
    } catch (error) {
      console.error('Error updating shop:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;
    try {
      await deleteUser(userId);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'shops', label: 'Lojas', icon: Building2 },
    { id: 'users', label: 'Usuários', icon: Users },
    { id: 'plans', label: 'Planos', icon: Crown },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  const statsData = [
    { label: 'Lojas Ativas', val: stats.activeShops.toString(), icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Receita Mensal (MRR)', val: formatCurrency(stats.mrr), icon: CreditCard, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Usuários Totais', val: stats.totalUsers.toString(), icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Novas Lojas (30d)', val: stats.newShops30d.toString(), icon: TrendingUp, color: 'text-[#C9A84C]', bg: 'bg-[#C9A84C]/10' }
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white font-sans">
      {/* Admin Top Navigation */}
      <nav className="h-16 bg-[#1A1A1A] border-b border-[#2A2A2A] flex items-center px-6 gap-6 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <img src="/logo-800px.png" alt="Kernel Barber" className="w-10 h-10 object-contain" />
          <div>
            <span className="text-white font-display font-bold tracking-tight text-lg">Kernel Barber</span>
            <span className="text-[#C9A84C] text-xs font-bold ml-2 px-2 py-1 bg-[#C9A84C]/10 rounded-md">SaaS Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#141414] rounded-full border border-[#2A2A2A]">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-[#888] font-bold uppercase tracking-widest">Sistema Online</span>
          </div>

          <button
            onClick={logout}
            className="w-10 h-10 rounded-full bg-[#141414] border border-[#2A2A2A] flex items-center justify-center text-[#888] hover:text-red-500 hover:border-red-500/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <div className="hidden sm:block text-right">
            <p className="text-[10px] text-[#888] font-bold uppercase tracking-widest leading-none mb-1">Admin</p>
            <p className="text-xs font-bold text-white leading-none">{user?.displayName || 'Admin'}</p>
          </div>
        </div>
      </nav>

      {/* Admin Content */}
      <div className="p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">Dashboard SaaS</h1>
          <p className="text-[#888] text-sm">Gerencie lojas, usuários, planos e monitore a saúde do sistema.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsData.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 relative overflow-hidden group hover:border-[#3A3A3A] transition-all"
            >
              <div className={cn("absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-20", s.bg)} />
              <div className="relative">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", s.bg)}>
                  <s.icon className={cn("w-5 h-5", s.color)} />
                </div>
                <p className="text-[#888] text-[10px] font-bold uppercase tracking-widest mb-1">{s.label}</p>
                <div className="text-2xl font-bold text-white">{s.val}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tabs - Use navItems passed as prop */}
        <div className="flex gap-1 mb-8 bg-[#1A1A1A] rounded-2xl p-1.5 border border-[#2A2A2A] w-fit">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-[#C9A84C] text-[#0A0A0A] shadow-lg shadow-[#C9A84C]/20"
                  : "text-[#888] hover:text-white hover:bg-[#2A2A2A]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-[#888] uppercase tracking-widest mb-4">Lojas Recentes</h3>
                  <div className="space-y-3">
                    {loading ? (
                      <Loader2 className="w-5 h-5 text-[#C9A84C] animate-spin" />
                    ) : shops.slice(0, 5).map((shop, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#141414] rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] flex items-center justify-center font-bold text-[#888]">
                            {shop.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{shop.name}</p>
                            <p className="text-xs text-[#888]">{shop.email}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-md",
                          shop.status === 'active' ? "bg-green-500/20 text-green-400" :
                          shop.status === 'suspended' ? "bg-red-500/20 text-red-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        )}>
                          {shop.status === 'active' ? 'Ativo' : shop.status === 'suspended' ? 'Suspenso' : 'Trial'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-[#888] uppercase tracking-widest mb-4">Planos Ativos</h3>
                  <div className="space-y-3">
                    {plans.filter(p => p.isActive).map((plan, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#141414] rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-white">{plan.name}</p>
                          <p className="text-xs text-[#888]">{plan.features?.length || 0} recursos</p>
                        </div>
                        <p className="text-sm font-bold text-[#C9A84C]">
                          {plan.price === 0 ? 'Grátis' : formatCurrency(plan.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'shops' && (
            <motion.div
              key="shops"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2A2A2A]">
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#888] p-4">Loja</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#888] p-4">Dono</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#888] p-4">Plano</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#888] p-4">Status</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#888] p-4">Receita</th>
                        <th className="text-right text-[10px] font-bold uppercase tracking-widest text-[#888] p-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8">
                            <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin inline" />
                          </td>
                        </tr>
                      ) : shops.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-[#888] text-sm">
                            Nenhuma loja cadastrada ainda.
                          </td>
                        </tr>
                      ) : (
                        shops.map((shop, i) => (
                          <tr key={shop.id || i} className="border-b border-[#2A2A2A]/50 hover:bg-white/5 transition-all">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#2A2A2A] flex items-center justify-center font-bold text-[#888]">
                                  {shop.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{shop.name}</p>
                                  <p className="text-xs text-[#888]">{shop.email || shop.ownerEmail}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-[#eee]">{shop.ownerName || 'N/A'}</td>
                            <td className="p-4">
                              <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                                shop.plan === 'enterprise' ? "bg-purple-500/20 text-purple-400" :
                                shop.plan === 'pro' ? "bg-blue-500/20 text-blue-400" :
                                shop.plan === 'basic' ? "bg-green-500/20 text-green-400" :
                                "bg-gray-500/20 text-gray-400"
                              )}>
                                {shop.plan || 'free'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "inline-flex items-center gap-1 text-[10px] font-bold",
                                shop.status === 'active' ? "text-green-500" :
                                shop.status === 'suspended' ? "text-red-500" :
                                "text-yellow-500"
                              )}>
                                {shop.status === 'active' ? <CheckCircle className="w-3 h-3" /> :
                                 shop.status === 'suspended' ? <XCircle className="w-3 h-3" /> :
                                 <Clock className="w-3 h-3" />}
                                {shop.status === 'active' ? 'Ativo' :
                                 shop.status === 'suspended' ? 'Suspenso' : 'Trial'}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-[#C9A84C]">
                              {shop.monthlyRevenue ? formatCurrency(shop.monthlyRevenue) : 'R$ 0,00'}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleToggleShopStatus(shop)}
                                className={cn(
                                  "text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all",
                                  shop.status === 'active'
                                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                    : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                )}
                              >
                                {shop.status === 'active' ? 'Suspender' : 'Ativar'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2A2A2A]">
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#888] p-4">Usuário</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#888] p-4">Email</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#888] p-4">Função</th>
                        <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#888] p-4">Loja</th>
                        <th className="text-right text-[10px] font-bold uppercase tracking-widest text-[#888] p-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="text-center p-8">
                            <Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin inline" />
                          </td>
                        </tr>
                      ) : (
                        <>
                          {/* Users from root collection */}
                          {users.map((u, i) => (
                            <tr key={u.uid || `root-${i}`} className="border-b border-[#2A2A2A]/50 hover:bg-white/5 transition-all">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#9A7A30] flex items-center justify-center text-xs font-bold text-[#0A0A0A]">
                                    {(u.displayName || u.email || '?').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white">{u.displayName || 'Sem nome'}</p>
                                    <p className="text-xs text-[#888]">ID: {u.uid}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-[#eee]">{u.email}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                                  u.role === 'admin' ? "bg-[#C9A84C]/20 text-[#C9A84C]" :
                                  u.role === 'owner' ? "bg-green-500/20 text-green-400" :
                                  "bg-gray-500/20 text-gray-400"
                                )}>
                                  {u.role || 'user'}
                                </span>
                              </td>
                              <td className="p-4 text-xs text-[#888]">N/A (Root)</td>
                              <td className="p-4 text-right">
                                {u.email !== 'michaelmarianodasilva81@gmail.com' && (
                                  <button
                                    onClick={() => handleDeleteUser(u.uid)}
                                    className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                                  >
                                    <Trash2 className="w-3 h-3 inline mr-1" />
                                    Deletar
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}

                          {/* Users from all shops */}
                          {allUsers.map((u, i) => (
                            <tr key={u.id || `shop-${i}`} className="border-b border-[#2A2A2A]/50 hover:bg-white/5 transition-all">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                                    {(u.name || u.email || '?').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-white">{u.name || 'Sem nome'}</p>
                                    <p className="text-xs text-[#888]">ID: {u.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-[#eee]">{u.email || 'N/A'}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                                  u.role === 'barber' ? "bg-blue-500/20 text-blue-400" :
                                  u.role === 'client' ? "bg-purple-500/20 text-purple-400" :
                                  "bg-gray-500/20 text-gray-400"
                                )}>
                                  {u.role || 'user'}
                                </span>
                              </td>
                              <td className="p-4 text-xs text-[#888]">{u.shopId || 'N/A'}</td>
                              <td className="p-4 text-right">
                                <span className="text-[10px] text-[#666]">Shop user</span>
                              </td>
                            </tr>
                          ))}

                          {users.length === 0 && allUsers.length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center p-8 text-[#888] text-sm">
                                Nenhum usuário cadastrado ainda.
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'plans' && (
            <motion.div
              key="plans"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan, i) => (
                  <div key={i} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-4 right-4">
                      {plan.isActive ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-2xl font-bold text-[#C9A84C] mb-4">
                      {plan.price === 0 ? 'Grátis' : formatCurrency(plan.price)}
                      {plan.price > 0 && <span className="text-xs text-[#888]">/mês</span>}
                    </p>
                    <div className="space-y-2">
                      {plan.features?.map((feature: string, j: number) => (
                        <div key={j} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="text-xs text-[#888]">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
                      <p className="text-[10px] text-[#888]">
                        Máx. Barbeiros: {plan.maxBarbers === 0 ? 'Ilimitado' : plan.maxBarbers}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Configurações do Sistema</h3>
                <p className="text-[#888] text-sm">Configurações em desenvolvimento...</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'ia' && (
            <motion.div
              key="ia"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">IA Assistente - Admin</h3>
                  <p className="text-[#888] text-sm mb-6">Tire suas dúvidas sobre o sistema SaaS</p>
                </div>
                
                <div className="h-96 overflow-y-auto p-6 space-y-4 custom-scroll">
                  {messages.map((msg: any, i: number) => (
                    <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] p-4 rounded-2xl",
                        msg.role === 'user' 
                          ? "bg-[#C9A84C] text-[#0A0A0A]" 
                          : "bg-[#141414] text-white"
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        <p className="text-[10px] opacity-50 mt-2">{msg.time}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-[#141414] p-4 rounded-2xl">
                        <Loader2 className="w-5 h-5 text-[#C9A84C] animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="p-6 border-t border-[#2A2A2A]">
                  <div className="flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      placeholder="Pergunte algo sobre o sistema..."
                      className="flex-1 bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C] text-white"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isTyping}
                      className="bg-[#C9A84C] text-[#0A0A0A] p-3 rounded-xl hover:bg-[#E8C96A] transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
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

function PricingView() {
  const [plans, setPlans] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();

  React.useEffect(() => {
    const unsub = subscribeToPlans<any>((data) => {
      setPlans(data.filter((p: any) => p.isActive !== false));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSelectPlan = (plan: any) => {
    if (!user) {
      alert('Faça login para assinar um plano!');
      return;
    }
    // Here you would integrate with a payment gateway like Stripe
    alert(`Plano ${plan.name} selecionado! Integração com pagamento em breve.`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8 py-8"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-bold text-white mb-4">
          Escolha o Plano Ideal para sua <span className="text-[#C9A84C]">Barbearia</span>
        </h1>
        <p className="text-[#888] text-lg max-w-2xl mx-auto">
          Gerencie sua barbearia com inteligência artificial e ferramentas profissionais. Comece grátis!
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin inline" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {plans.map((plan, i) => {
            const isFree = plan.price === 0;
            const isPopular = plan.price === 29.99 || plan.name.toLowerCase().includes('pro');
            
            return (
              <div 
                key={plan.id || i} 
                className={cn(
                  "relative bg-[#141414] border rounded-2xl p-6 transition-all hover:scale-[1.02]",
                  isPopular ? "border-[#C9A84C] shadow-lg shadow-[#C9A84C]/20" : "border-[#2A2A2A] hover:border-[#3A3A3A]",
                  isFree && "border-green-500/50"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-[#0A0A0A] text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    Mais Popular
                  </div>
                )}
                {isFree && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-[#0A0A0A] text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                    Grátis
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    {isFree ? (
                      <span className="text-4xl font-bold text-green-400">Grátis</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-[#C9A84C]">
                          {formatCurrency(plan.price).replace(',', ',')}
                        </span>
                        <span className="text-[#888] text-sm ml-1">
                          /{plan.interval === 'yearly' ? 'ano' : 'mês'}
                        </span>
                      </>
                    )}
                  </div>
                  {plan.trialDays > 0 && (
                    <p className="text-[10px] text-[#C9A84C] font-bold">
                      {plan.trialDays} dias grátis
                    </p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  {plan.features?.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-[#eee]">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      {feature}
                    </div>
                  ))}
                  {plan.maxBarbers > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[#eee]">
                      <Users className="w-4 h-4 text-[#C9A84C] shrink-0" />
                      Até {plan.maxBarbers} barbeiro{plan.maxBarbers > 1 ? 's' : ''}
                    </div>
                  )}
                  {plan.hasAI && (
                    <div className="flex items-center gap-2 text-sm text-[#eee]">
                      <Bot className="w-4 h-4 text-[#C9A84C] shrink-0" />
                      IA Assistente inclusa
                    </div>
                  )}
                  {plan.hasReports && (
                    <div className="flex items-center gap-2 text-sm text-[#eee]">
                      <TrendingUp className="w-4 h-4 text-[#C9A84C] shrink-0" />
                      Relatórios avançados
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold text-sm transition-all",
                    isFree 
                      ? "bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20"
                      : isPopular
                        ? "bg-[#C9A84C] text-[#0A0A0A] hover:bg-[#E8C96A] shadow-lg shadow-[#C9A84C]/20"
                        : "bg-[#1A1A1A] border border-[#2A2A2A] text-white hover:bg-[#222]"
                  )}
                >
                  {isFree ? (
                    <span className="flex items-center justify-center gap-2">
                      <Gift className="w-4 h-4" />
                      Começar Grátis
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4" />
                      Assinar Agora
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-white mb-4">Precisa de algo personalizado?</h3>
        <p className="text-[#888] mb-6">Para barbearias com múltiplas unidades ou necessidades específicas.</p>
        <button className="bg-[#1A1A1A] border border-[#C9A84C]/30 text-[#C9A84C] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#C9A84C]/10 transition-all">
          Fale com Vendas
        </button>
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
