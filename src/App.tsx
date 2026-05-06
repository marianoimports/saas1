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
  getNewShopsLast30Days,
  subscribeToAppointments,
  addAppointment,
  updateAppointment,
  subscribeToCollection
} from './services/dbService';

type View = 'dashboard' | 'agenda' | 'barbers' | 'estoque' | 'financeiro' | 'ia' | 'admin' | 'pricing' | 'setup';

interface Message {
  role: 'ia' | 'user';
  text: string;
  time: string;
}

function MainApp() {
  const { user, logout, isAdmin, userData, checkAdminStatus } = useAuth();
  
  // SIMPLE: Force admin true for this specific email - nothing else matters
  const isAdminFinal = user?.email === 'michaelmarianodasilva81@gmail.com' ? true : (isAdmin || false);
  
  const [activeView, setActiveView] = React.useState<View>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('redirectToPricing')) {
      localStorage.removeItem('redirectToPricing');
      return 'pricing';
    }
    return 'dashboard';
  });
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

  // Admin Layout - Completely separate from barber layout
  if (isAdminFinal && activeView === 'admin') {
    return <AdminLayout user={user} logout={logout} activeTab={activeAdminTab} setActiveTab={setActiveAdminTab} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#C9A84C] selection:text-black">
      {/* Top Navigation */}
      <nav className="h-16 bg-[#141414] border-b border-[#2A2A2A] flex items-center px-6 gap-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
          <span className="text-[#C9A84C] font-display font-bold tracking-tight text-lg">KERNEL BARBER SHOPPER</span>
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
            {activeView === 'dashboard' && <DashboardView key="dashboard" onNavigate={setActiveView} shopId={userData?.shopId || user?.uid || ''} />}
            {activeView === 'agenda' && <AgendaView key="agenda" onNavigate={setActiveView} shopId={userData?.shopId || user?.uid || ''} />}
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

function AdminLayout({ user, logout, activeTab, setActiveTab }: any) {
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
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
          <div>
            <span className="text-white font-display font-bold tracking-tight text-lg">KERNEL BARBER SHOPPER</span>
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

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-[#1A1A1A] rounded-2xl p-1.5 border border-[#2A2A2A] w-fit">
          {tabs.map((tab) => (
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
            >
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-8">
                <h3 className="text-lg font-bold text-white mb-6">Configurações do Sistema</h3>
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Email do Admin</label>
                    <input
                      type="email"
                      value="michaelmarianodasilva81@gmail.com"
                      disabled
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-[#888]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Status do Sistema</label>
                    <div className="flex items-center gap-3 p-4 bg-[#141414] rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm text-green-500 font-bold">Online e Operacional</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#888] uppercase tracking-widest mb-2">Versão</label>
                    <p className="text-sm text-[#eee]">KERNEL BARBER SHOPPER v2.0.0 (2026)</p>
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

function LoginScreen() {
  const { login, register } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await register(email, password);
        localStorage.setItem('redirectToPricing', 'true');
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

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
          <img src="/logo.png" alt="KERNEL BARBER SHOPPER" className="w-20 h-20 rounded-3xl object-cover mx-auto mb-8 shadow-2xl shadow-[#C9A84C]/20" />
          <h1 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">KERNEL BARBER SHOPPER</h1>
          <p className="text-[#888] text-sm mb-10 font-medium">A gestão de luxo para sua barbearia,<br />agora com inteligência artificial.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C] transition-all text-white placeholder-[#555]"
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C] transition-all text-white placeholder-[#555]"
              required
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A84C] text-[#0A0A0A] py-4 rounded-2xl font-bold hover:bg-[#E8C96A] hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
              {loading ? 'Aguarde...' : (isRegistering ? 'Cadastrar' : 'Entrar')}
            </button>
          </form>

          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="mt-4 text-xs text-[#888] hover:text-[#C9A84C] transition-all"
          >
            {isRegistering ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastre-se'}
          </button>
          
          <p className="mt-8 text-[10px] text-[#555] uppercase font-black tracking-widest">Enterprise Edition / 2026</p>
        </div>
      </motion.div>
    </div>
  );
}

function AppContent() {
  const { user, loading, isAdmin, checkAdminStatus } = useAuth();
  const [checkingAuth, setCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      if (user) {
        // Force admin check for specific email
        if (user.email === 'michaelmarianodasilva81@gmail.com') {
          await checkAdminStatus(user);
        }
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [user, checkAdminStatus]);

  if (loading || checkingAuth) {
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

function DashboardView({ onNavigate, shopId }: { onNavigate: (v: View) => void, shopId: string }) {
  const [metrics, setMetrics] = React.useState({
    revenue: 0,
    appointments: 0,
    pendingAppointments: 0,
    newClients: 0,
    avgRating: 0,
    totalReviews: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = React.useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = React.useState<any[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = React.useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!shopId) return;

    // Fetch appointments for today
    const today = new Date().toISOString().split('T')[0];
    const unsubAppointments = subscribeToAppointments(shopId, (data) => {
      const todayApps = data.filter(a => a.date === today);
      const pending = todayApps.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
      
      setUpcomingAppointments(todayApps.slice(0, 4));
      setMetrics(prev => ({
        ...prev,
        appointments: todayApps.length,
        pendingAppointments: pending
      }));
      setLoading(false);
    });

    // Fetch stock
    const unsubStock = subscribeToCollection(`${shopId}/stock`, (data) => {
      const alerts = data.filter((item: any) => item.qty <= 5);
      setStockAlerts(alerts.slice(0, 4));
    });

    // Mock other metrics for now (can be enhanced later)
    setMetrics(prev => ({
      ...prev,
      revenue: 1240,
      newClients: 4,
      avgRating: 4.8,
      totalReviews: 32
    }));

    // Mock weekly revenue
    setWeeklyRevenue([40, 65, 55, 100, 75, 50, 30]);

    return () => {
      unsubAppointments();
      unsubStock();
    };
  }, [shopId]);

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
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-2xl">
          <p className="text-[#888] text-xs font-medium uppercase tracking-wider mb-2">Receita Hoje</p>
          <div className="text-2xl font-bold text-[#E8C96A]">R$ {metrics.revenue.toFixed(2)}</div>
          <p className="text-[10px] mt-1 font-medium text-green-500">+12% vs ontem</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-2xl">
          <p className="text-[#888] text-xs font-medium uppercase tracking-wider mb-2">Agendamentos</p>
          <div className="text-2xl font-bold text-[#E8C96A]">{metrics.appointments}</div>
          <p className="text-[10px] mt-1 font-medium text-green-500">{metrics.pendingAppointments} pendentes</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-2xl">
          <p className="text-[#888] text-xs font-medium uppercase tracking-wider mb-2">Clientes Novos</p>
          <div className="text-2xl font-bold text-[#E8C96A]">{metrics.newClients}</div>
          <p className="text-[10px] mt-1 font-medium text-green-500">+2 vs ontem</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-6 rounded-2xl">
          <p className="text-[#888] text-xs font-medium uppercase tracking-wider mb-2">Avaliação Média</p>
          <div className="text-2xl font-bold text-[#E8C96A]">{metrics.avgRating} ★</div>
          <p className="text-[10px] mt-1 font-medium text-green-500">{metrics.totalReviews} avaliações</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Próximos Agendamentos" action="Ver agenda" onAction={() => onNavigate('agenda')}>
          {loading ? (
            <div className="p-4 text-center text-[#888]">
              <Loader2 className="w-5 h-5 animate-spin inline" />
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="p-4 text-center text-[#888] text-sm">
              Nenhum agendamento para hoje
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((app, i) => (
                <AgendaRow 
                  key={app.id || i} 
                  status={app.status === 'confirmed' ? 'ok' : 'wait'} 
                  time={app.time} 
                  client={app.clientName} 
                  service={app.service} 
                  barber={app.barber} 
                />
              ))}
            </div>
          )}
        </Card>

        <Card title="Alertas de Estoque" action="Ver estoque" onAction={() => onNavigate('estoque')}>
          {stockAlerts.length === 0 ? (
            <div className="p-4 text-center text-[#888] text-sm">
              Estoque ok, sem alertas
            </div>
          ) : (
            <div className="space-y-4">
              {stockAlerts.map((item, i) => (
                <StockAlert 
                  key={item.id || i} 
                  status={item.qty <= 2 ? 'critical' : 'low'} 
                  item={item.name} 
                  qty={`${item.qty} un`} 
                />
              ))}
            </div>
          )}
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
          {weeklyRevenue.map((h, i) => (
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

function AgendaView({ onNavigate, shopId }: { onNavigate: (v: View) => void, shopId: string }) {
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);

  React.useEffect(() => {
    if (!shopId) return;
    const unsub = subscribeToAppointments(shopId, (data) => {
      setAppointments(data);
      setLoading(false);
    });
    return () => unsub();
  }, [shopId]);

  const getWhatsAppLink = (appointment: any) => {
    const phone = appointment.clientPhone || '';
    const message = encodeURIComponent(
      `Olá ${appointment.clientName}! Seu agendamento na KERNEL BARBER SHOPPER está confirmado:\n` +
      `Data: ${appointment.date}\n` +
      `Horário: ${appointment.time}\n` +
      `Serviço: ${appointment.service}\n` +
      `Barbeiro: ${appointment.barber}\n` +
      `Aguardamos você!`
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  const handleConfirm = async (id: string, appointment: any) => {
    try {
      await updateAppointment(shopId, id, { status: 'confirmed' });
      // Send WhatsApp confirmation
      const link = getWhatsAppLink(appointment);
      window.open(link, '_blank');
    } catch (error) {
      console.error('Error confirming appointment:', error);
    }
  };

  const filteredAppointments = appointments.filter(a => a.date === selectedDate);

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

      <div className="flex gap-3 items-center">
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-sm text-white"
        />
      </div>

      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden">
        <div className="grid grid-cols-6 p-4 border-b border-[#2A2A2A] text-[10px] uppercase font-bold tracking-widest text-[#C9A84C]">
          <div className="col-span-1">Horário</div>
          <div className="col-span-1">Cliente</div>
          <div className="col-span-1">Serviço</div>
          <div className="col-span-1">Barbeiro</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Ação</div>
        </div>
        <div className="divide-y divide-[#2A2A2A]">
          {loading ? (
            <div className="p-8 text-center text-[#888]">
              <Loader2 className="w-6 h-6 animate-spin inline" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center text-[#888]">
              Nenhum agendamento para esta data
            </div>
          ) : (
            filteredAppointments.map((item) => (
              <div key={item.id} className="grid grid-cols-6 p-4 items-center text-sm group hover:bg-[#2A2A2A]/30 transition-all">
                <div className="col-span-1 font-bold text-[#C9A84C] flex items-center gap-2">
                  <StatusDot status={item.status} /> {item.time}
                </div>
                <div className="col-span-1 text-[#eee]">{item.clientName}</div>
                <div className="col-span-1 text-[#888]">{item.service}</div>
                <div className="col-span-1">
                  <span className="bg-[#C9A84C]/10 text-[#C9A84C] text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wider">
                    {item.barber}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className={cn(
                    "text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wider",
                    item.status === 'confirmed' ? "bg-green-500/10 text-green-500" :
                    item.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" :
                    "bg-red-500/10 text-red-500"
                  )}>
                    {item.status === 'confirmed' ? 'Confirmado' : 
                     item.status === 'pending' ? 'Pendente' : 'Cancelado'}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  {item.status === 'pending' && (
                    <button 
                      onClick={() => handleConfirm(item.id, item)}
                      className="text-[#25D366] hover:text-[#25D366]/80 transition-all text-xs font-bold flex items-center gap-1 ml-auto"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.758-1.653-2.055-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.669-1.612-.916-2.21-.242-.579-.487-.5-.67-.51-.173-.007-.37-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.876 1.213 3.074c.148.198 2.095 3.2 5.077 4.49.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.412.248-.693.248-1.287.173-1.412-.074-.124-.272-.198-.57-.347z"/></svg>
                      WhatsApp
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
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

  const handleSelectPlan = async (plan: any) => {
    if (!user) {
      alert('Faça login para assinar um plano!');
      return;
    }
    
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          email: user.email,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        window.location.href = data.url;
      } else {
        alert('Erro ao criar checkout: ' + data.error);
      }
    } catch (error: any) {
      alert('Erro ao processar pagamento: ' + error.message);
    }
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
