
import React, { useState, useEffect, useMemo } from 'react';
import { 
  PlusCircle, 
  History, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Settings, 
  Trash2, 
  Sparkles,
  ArrowRight,
  Calculator as CalcIcon,
  AlignLeft,
  AlignRight,
  BarChart3,
  Globe,
  ShieldCheck,
  Zap,
  Menu,
  X,
  Sun,
  Moon,
  Download,
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { CalculationRecord, BusinessProfile } from './types';
import { StatCard } from './components/StatCard';
import { getFinancialInsights } from './services/geminiService';

const formatCurrency = (value: number, profile: BusinessProfile) => {
  const formatted = value.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  return profile.currencyFormat === 'prefix' 
    ? `${profile.currency}${formatted}` 
    : `${formatted}${profile.currency}`;
};

const CustomTooltip = ({ active, payload, profile, type }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as CalculationRecord;
    const dateObj = new Date(data.timestamp);
    
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl border border-white/50 dark:border-slate-800 min-w-[240px] animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col gap-1 mb-4">
          <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{data.productName}</p>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
            <Globe size={10} />
            {dateObj.toLocaleDateString()}
          </div>
        </div>
        
        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Revenue</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(data.totalRevenue, profile)}</span>
          </div>
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {type === 'margin' ? 'Margin' : 'Profit'}
            </span>
            <span className={`text-base font-black ${type === 'margin' ? 'text-emerald-600' : 'text-blue-600'}`}>
              {type === 'margin' ? `${data.margin.toFixed(1)}%` : formatCurrency(data.totalProfit, profile)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const App: React.FC = () => {
  const [records, setRecords] = useState<CalculationRecord[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('profit_flow_theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [profile, setProfile] = useState<BusinessProfile>({
    name: 'Business Unit One',
    industry: 'Retail',
    currency: '$',
    currencyFormat: 'prefix'
  });
  
  const [currentCalc, setCurrentCalc] = useState({
    productName: '',
    costPrice: '',
    sellingPrice: '',
    quantity: '1'
  });

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'history' | 'analytics'>('calculator');

  useEffect(() => {
    const savedRecords = localStorage.getItem('profit_flow_records');
    const savedProfile = localStorage.getItem('profit_flow_profile');
    if (savedRecords) setRecords(JSON.parse(savedRecords));
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      if (!parsed.currencyFormat) parsed.currencyFormat = 'prefix';
      setProfile(parsed);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('profit_flow_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('profit_flow_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('profit_flow_records', JSON.stringify(records));
    localStorage.setItem('profit_flow_profile', JSON.stringify(profile));
  }, [records, profile]);

  const calculatedValues = useMemo(() => {
    const cost = parseFloat(currentCalc.costPrice) || 0;
    const sell = parseFloat(currentCalc.sellingPrice) || 0;
    const qty = parseInt(currentCalc.quantity) || 1;
    const profit = sell - cost;
    const margin = sell > 0 ? (profit / sell) * 100 : 0;
    const markup = cost > 0 ? (profit / cost) * 100 : 0;
    const totalRevenue = sell * qty;
    const totalProfit = profit * qty;
    return { profit, margin, markup, totalRevenue, totalProfit };
  }, [currentCalc]);

  const stats = useMemo(() => {
    const totalRevenue = records.reduce((sum, r) => sum + r.totalRevenue, 0);
    const totalProfit = records.reduce((sum, r) => sum + r.totalProfit, 0);
    const avgMargin = records.length > 0 
      ? records.reduce((sum, r) => sum + r.margin, 0) / records.length 
      : 0;
    return { totalRevenue, totalProfit, avgMargin };
  }, [records]);

  const handleSaveCalculation = () => {
    if (!currentCalc.productName || !currentCalc.costPrice || !currentCalc.sellingPrice) return;
    const newRecord: CalculationRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      productName: currentCalc.productName,
      costPrice: parseFloat(currentCalc.costPrice),
      sellingPrice: parseFloat(currentCalc.sellingPrice),
      quantity: parseInt(currentCalc.quantity),
      ...calculatedValues
    };
    setRecords(prev => [newRecord, ...prev]);
    setCurrentCalc({ productName: '', costPrice: '', sellingPrice: '', quantity: '1' });
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure? This will permanently delete all your calculation history.")) {
      setRecords([]);
    }
  };

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-flow-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGetAiInsights = async () => {
    if (records.length === 0) return;
    setIsAiLoading(true);
    const insight = await getFinancialInsights(records, profile);
    setAiInsight(insight);
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-500">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('calculator')}>
            <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-200 dark:shadow-none group-hover:scale-110 transition-transform duration-300">
              <Zap size={22} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">ProfitFlow <span className="text-emerald-600">Pro</span></h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{profile.name}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setActiveTab('calculator')} className={`text-sm font-bold transition-colors ${activeTab === 'calculator' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>Calculator</button>
            <button onClick={() => setActiveTab('analytics')} className={`text-sm font-bold transition-colors ${activeTab === 'analytics' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>Analytics</button>
            <button onClick={() => setActiveTab('history')} className={`text-sm font-bold transition-colors ${activeTab === 'history' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>History</button>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
            
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button className="bg-slate-900 dark:bg-emerald-600 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 dark:hover:bg-emerald-500 transition-all shadow-lg shadow-slate-200 dark:shadow-none">
              Get Pro
            </button>
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-500 dark:text-slate-400">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 text-slate-900 dark:text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 py-8 space-y-12 animate-in fade-in duration-700">
        {/* Hero Section */}
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-full text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50">
                <Sparkles size={12} /> Optimized for {profile.industry}
              </div>
              <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1] tracking-tighter">
                Smart Margins. <span className="text-emerald-600">Higher Profit.</span>
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-lg">
                The ultimate companion for entrepreneurs. Calculate cost-basis, selling goals, and net yields in seconds.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-sm bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl">
                  <ShieldCheck size={18} className="text-emerald-500" /> Secure Storage
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-sm bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-xl">
                  <Zap size={18} className="text-emerald-500" /> AI Strategy
                </div>
              </div>
            </div>
            <div className="relative">
               <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[80px] animate-subtle-bounce" />
               <div className="relative glass-card p-10 rounded-[3rem] shadow-2xl space-y-8">
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Projected Net Profit</p>
                      <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(calculatedValues.totalProfit, profile)}</h3>
                    </div>
                    <div className="text-right">
                       <span className="text-3xl font-black text-emerald-600">{calculatedValues.margin.toFixed(1)}%</span>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Margin</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Rev</p>
                      <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">{formatCurrency(calculatedValues.totalRevenue, profile)}</p>
                    </div>
                    <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Markup</p>
                      <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">{calculatedValues.markup.toFixed(1)}%</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Dynamic Title */}
        <div className="space-y-1 mb-8">
           <h3 className="text-3xl font-black text-slate-900 dark:text-white capitalize tracking-tighter">
             {activeTab === 'calculator' ? 'Active Workspace' : activeTab === 'analytics' ? 'Performance Insights' : 'Business Ledger'}
           </h3>
           <div className="h-1 w-12 bg-emerald-500 rounded-full" />
        </div>

        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2 space-y-8">
              <section className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/40 dark:shadow-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Product / Asset</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Corporate License"
                      value={currentCalc.productName}
                      onChange={e => setCurrentCalc({...currentCalc, productName: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500/50 transition-all font-bold text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quantity</label>
                    <input 
                      type="number" 
                      value={currentCalc.quantity}
                      onChange={e => setCurrentCalc({...currentCalc, quantity: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500/50 transition-all font-bold text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cost Base ({profile.currency})</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={currentCalc.costPrice}
                      onChange={e => setCurrentCalc({...currentCalc, costPrice: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500/50 transition-all font-bold text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Selling Goal ({profile.currency})</label>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={currentCalc.sellingPrice}
                      onChange={e => setCurrentCalc({...currentCalc, sellingPrice: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500/50 transition-all font-bold text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveCalculation}
                  disabled={!currentCalc.productName || !currentCalc.costPrice || !currentCalc.sellingPrice}
                  className="w-full mt-12 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-emerald-200 dark:shadow-none transition-all flex items-center justify-center gap-3 group text-lg"
                >
                  Save Entry
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </section>
            </div>

            <div className="space-y-8">
              {/* Settings Sidebar */}
              <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <Settings size={120} />
                </div>
                <h3 className="text-lg font-black mb-6 flex items-center gap-2 relative z-10">
                  <Settings size={20} className="text-emerald-400" />
                  Configurations
                </h3>
                <div className="space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Symbol</label>
                      <input 
                        type="text" 
                        value={profile.currency}
                        onChange={e => setProfile({...profile, currency: e.target.value})}
                        className="w-full bg-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 transition-all text-white outline-none border-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Layout</label>
                      <div className="flex bg-white/5 p-1 rounded-xl">
                        <button onClick={() => setProfile({...profile, currencyFormat: 'prefix'})} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${profile.currencyFormat === 'prefix' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                          <AlignLeft size={14} />
                        </button>
                        <button onClick={() => setProfile({...profile, currencyFormat: 'suffix'})} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${profile.currencyFormat === 'suffix' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>
                          <AlignRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sector</label>
                    <select 
                      value={profile.industry}
                      onChange={e => setProfile({...profile, industry: e.target.value})}
                      className="w-full mt-2 bg-white/10 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 appearance-none text-white outline-none border-none cursor-pointer"
                    >
                      <option className="bg-slate-900">Retail</option>
                      <option className="bg-slate-900">SaaS / Digital</option>
                      <option className="bg-slate-900">Manufacturing</option>
                      <option className="bg-slate-900">Consulting</option>
                    </select>
                  </div>

                  {/* Data Management Section */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data Management</p>
                    <div className="flex gap-2">
                      <button onClick={handleExportData} className="flex-1 bg-white/5 hover:bg-white/10 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
                        <Download size={14} /> Export
                      </button>
                      <button onClick={handleClearAll} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all">
                        <Trash2 size={14} /> Reset
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* AI Insight Card */}
              <section className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-200 dark:shadow-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-45 transition-transform duration-1000">
                  <Sparkles size={80} />
                </div>
                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                  <Sparkles size={20} className="text-white" />
                  Strategy Advisor
                </h3>
                <p className="text-emerald-100 text-sm font-medium mb-6 leading-relaxed">
                  Generate insights for your {profile.industry} strategy.
                </p>
                <button 
                  onClick={handleGetAiInsights}
                  disabled={isAiLoading || records.length === 0}
                  className="w-full bg-white text-emerald-700 font-black py-4 rounded-2xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isAiLoading ? 'Analyzing Data...' : 'Get New Insights'}
                </button>
                {aiInsight && (
                  <div className="mt-6 p-5 bg-black/10 rounded-[1.5rem] text-xs leading-relaxed border border-white/10 animate-in slide-in-from-bottom duration-500 whitespace-pre-wrap font-medium">
                    {aiInsight}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-12 animate-in slide-in-from-bottom duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard label="Business Revenue" value={formatCurrency(stats.totalRevenue, profile)} color="blue" icon={<BarChart3 size={20} />} />
              <StatCard label="Net Operations Profit" value={formatCurrency(stats.totalProfit, profile)} color="emerald" icon={<DollarSign size={20} />} />
              <StatCard label="Portfolio Yield" value={`${stats.avgMargin.toFixed(1)}%`} color="purple" icon={<PieChart size={20} />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <section className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-10">Margin Volatility</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...records].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                      <XAxis dataKey="productName" hide />
                      <YAxis stroke="#64748b" fontSize={10} fontWeight="800" tickFormatter={(val) => `${val}%`} />
                      <Tooltip content={<CustomTooltip profile={profile} type="margin" />} />
                      <Line type="monotone" dataKey="margin" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', strokeWidth: 3, r: 6, stroke: isDarkMode ? '#0f172a' : '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-10">Profit Trajectory</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...records].reverse()}>
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                      <XAxis dataKey="productName" hide />
                      <YAxis stroke="#64748b" fontSize={10} fontWeight="800" />
                      <Tooltip content={<CustomTooltip profile={profile} type="profit" />} />
                      <Area type="monotone" dataKey="totalProfit" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm animate-in zoom-in duration-500">
            <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between md:items-center">
              <div>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Financial Audit Trail</h4>
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Historical data is stored safely in your browser.</p>
              </div>
              <div className="flex items-center gap-2 px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest">
                <History size={14} /> {records.length} Ledger Entries
              </div>
            </div>
            <div className="overflow-x-auto px-10 pb-10">
              <table className="w-full text-left">
                <thead className="text-slate-400 dark:text-slate-600 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-50 dark:border-slate-800">
                  <tr>
                    <th className="py-6">Asset / Product</th>
                    <th className="py-6">Metric Performance</th>
                    <th className="py-6 text-right">Net Return</th>
                    <th className="py-6 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                           <TrendingUp size={64} />
                           <p className="text-lg font-bold">The ledger is currently empty.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    records.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                        <td className="py-8">
                          <p className="font-extrabold text-slate-900 dark:text-white text-lg">{record.productName}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                            {new Date(record.timestamp).toDateString()}
                          </p>
                        </td>
                        <td className="py-8">
                          <div className="flex flex-wrap gap-2">
                             <span className="text-[10px] font-black px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg">
                               {record.margin.toFixed(1)}% MARGIN
                             </span>
                             <span className="text-[10px] font-black px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">
                               {record.quantity} UNITS
                             </span>
                          </div>
                        </td>
                        <td className="py-8 text-right">
                          <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {formatCurrency(record.totalProfit, profile)}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Yield</p>
                        </td>
                        <td className="py-8">
                          <button onClick={() => handleDeleteRecord(record.id)} className="p-3 text-slate-200 dark:text-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 size={20} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Corporate Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 py-20 px-6 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-200/50">
                <Zap size={22} fill="currentColor" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">ProfitFlow <span className="text-emerald-600">Pro</span></h1>
            </div>
            <p className="text-base text-slate-500 dark:text-slate-400 font-medium max-w-sm leading-relaxed">
              Industrial-grade intelligence for small to medium enterprises. Built with precision, driven by AI.
            </p>
            <div className="flex gap-4">
               {[Globe, ShieldCheck, Zap].map((Icon, idx) => (
                 <div key={idx} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 transition-all cursor-pointer">
                   <Icon size={18} />
                 </div>
               ))}
            </div>
          </div>
          <div>
            <h5 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8">Solution</h5>
            <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
              <li className="hover:text-emerald-600 cursor-pointer transition-colors" onClick={() => setActiveTab('calculator')}>Calculator</li>
              <li className="hover:text-emerald-600 cursor-pointer transition-colors" onClick={() => setActiveTab('analytics')}>Analytics</li>
              <li className="hover:text-emerald-600 cursor-pointer transition-colors" onClick={() => setActiveTab('history')}>Audit History</li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8">Legal</h5>
            <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
              <li className="hover:text-emerald-600 cursor-pointer">Privacy</li>
              <li className="hover:text-emerald-600 cursor-pointer">Terms</li>
              <li className="hover:text-emerald-600 cursor-pointer">Security</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-slate-50 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-xs font-bold text-slate-400 dark:text-slate-600">© 2024 ProfitFlow Pro Intelligence Engine. All data remains private on your device.</p>
           <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-full">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
             Production System Online
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
