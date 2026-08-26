import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Wallet, Package, TrendingUp, Bell, Plus, Loader, MapPin, Eye, Check, X, ThermometerSun, Droplets, CloudRain, Cpu, Star, Zap, ShoppingBag, BarChart3, AlertCircle, Edit, Trash2, ArrowRight, MessageSquare } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { getCropImageUrl, handleImageError } from '../utils/imageUrl';

// --- Mock Data ---
const MOCK_MARKET_PRICES = [
  { name: 'Wheat', price: 2450, unit: 'quintal', trend: 5 },
  { name: 'Onion', price: 1800, unit: 'quintal', trend: -2 },
  { name: 'Maize', price: 2100, unit: 'quintal', trend: 3 },
  { name: 'Potato', price: 1600, unit: 'quintal', trend: 1 }
];

const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'New offer received for Rice', unread: true },
  { id: 2, text: 'Wheat price increased by 5%', unread: true },
  { id: 3, text: 'Rainfall expected tomorrow', unread: false },
  { id: 4, text: 'Trader viewed your listing', unread: false }
];

const MOCK_AI_INSIGHTS = [
  "Rice demand expected to rise this week",
  "Rain expected within next 3 days",
  "Best crop for upcoming season: Wheat",
  "Market demand highest in nearby districts"
];

const FarmerDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [crops, setCrops] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chartTab, setChartTab] = useState('Monthly');
  const [showNotifications, setShowNotifications] = useState(false);

  const [newCrop, setNewCrop] = useState({
    cropName: '', category: 'Grains', quantity: '', unit: 'kg', price: '', location: '', description: '', image: null
  });

  const handleInputChange = (e) => {
    if (e.target.name === 'image') {
      setNewCrop({ ...newCrop, image: e.target.files[0] });
    } else {
      setNewCrop({ ...newCrop, [e.target.name]: e.target.value });
    }
  };

  const handleAddCrop = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(newCrop).forEach(key => {
        if (newCrop[key] !== null && newCrop[key] !== '') {
          formData.append(key, newCrop[key]);
        }
      });
      const res = await api.post('/crops', formData);
      setCrops([res.data.data, ...crops]);
      setIsAddModalOpen(false);
      setNewCrop({ cropName: '', category: 'Grains', quantity: '', unit: 'kg', price: '', location: '', description: '', image: null });
    } catch (err) {
      console.error('Failed to add crop', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, cropsRes, offersRes] = await Promise.allSettled([
          api.get('/deals'),
          api.get('/crops'),
          api.get('/offers')
        ]);
        if (dealsRes.status === 'fulfilled') setDeals(dealsRes.value.data.data || []);
        if (cropsRes.status === 'fulfilled') setCrops(cropsRes.value.data.data || []);
        if (offersRes.status === 'fulfilled') setOffers(offersRes.value.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const handleOfferAction = async (offerId, status) => {
    try {
      if(status === 'Counter') {
        alert('Counter offer functionality to be implemented!');
        return;
      }
      const res = await api.put(`/offers/${offerId}`, { status });
      setOffers(offers.map(o => o._id === offerId ? res.data.data : o));
      if (status === 'Accepted') {
        const dealsRes = await api.get('/deals');
        setDeals(dealsRes.data.data);
      }
    } catch (err) {
      console.error('Error updating offer', err);
      alert('Failed to update offer');
    }
  };

  const handleChatWithTrader = (trader, crop, offerOrDeal) => {
    const traderId = trader?._id || trader;
    const traderName = trader?.name || 'Trader';
    const cropName = crop?.cropName || 'Crop';
    const initialMsg = offerOrDeal?.offeredPrice 
      ? `Hi ${traderName}, I saw your offer of ₹${offerOrDeal.offeredPrice} for ${cropName} (${offerOrDeal.quantity} ${crop?.unit || 'kg'}). Let's discuss!`
      : `Hi ${traderName}, regarding our deal for ${cropName}.`;

    navigate('/chat', {
      state: {
        receiverId: traderId,
        receiverName: traderName,
        initialMessage: initialMsg
      }
    });
  };

  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm('Are you sure you want to remove this crop listing?')) return;
    try {
      await api.delete(`/crops/${cropId}`);
      setCrops(crops.filter(c => c._id !== cropId));
    } catch (err) {
      console.error('Failed to delete crop', err);
      alert('Failed to delete crop');
    }
  };

  // --- Dynamic Calculations ---
  const completedDeals = (deals || []).filter(d => d.status === 'Completed' || d.status === 'Paid' || d.status === 'Accepted');
  const totalRevenue = completedDeals.reduce((sum, deal) => sum + deal.finalPrice, 0);
  const myCrops = crops.filter(c => c.farmerId?._id === user?._id || c.farmerId === user?._id);
  const totalCropsSold = completedDeals.length;
  const activeListingsCount = myCrops.length;
  const pendingOffersCount = offers.filter(o => o.status === 'Pending').length;

  const topCropName = myCrops.length > 0 ? myCrops[0].cropName : 'N/A';

  const chartData = useMemo(() => {
    const data = {};
    const labels = chartTab === 'Monthly' 
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : chartTab === 'Weekly' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] 
      : ['2022', '2023', '2024', '2025', '2026'];

    labels.forEach(l => data[l] = 0);

    completedDeals.forEach(deal => {
      const dealDate = new Date(deal.createdAt);
      let key = '';
      if(chartTab === 'Monthly') key = labels[dealDate.getMonth()];
      else if(chartTab === 'Weekly') key = labels[dealDate.getDay() === 0 ? 6 : dealDate.getDay() - 1];
      else key = dealDate.getFullYear().toString();

      if (data[key] !== undefined) {
        data[key] += deal.finalPrice;
      }
    });

    return Object.keys(data).map(key => ({
      name: key,
      revenue: data[key]
    }));
  }, [deals, chartTab, completedDeals]);

  // Dynamic AI Insights based on crops
  const dynamicAIInsights = useMemo(() => {
    if(myCrops.length === 0) return MOCK_AI_INSIGHTS;
    const categories = myCrops.map(c => c.category);
    const mostCommon = categories.sort((a,b) => categories.filter(v => v===a).length - categories.filter(v => v===b).length).pop();
    return [
      `${mostCommon || 'Crop'} demand expected to rise this week`,
      "Rain expected within next 3 days",
      `Best crop for upcoming season: ${myCrops[0]?.cropName || 'Wheat'}`,
      "Market demand highest in nearby districts"
    ];
  }, [myCrops]);

  const quickStats = {
    views: myCrops.length * 24 + 15,
    offers: offers.length,
    orders: completedDeals.length,
    avgPrice: completedDeals.length ? Math.round(totalRevenue / completedDeals.length) : 0
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 min-h-screen bg-slate-50 font-sans">
      
      {/* Dashboard Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 relative">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back, {user?.name?.split(' ')[0] || 'Farmer'} 👋</h1>
          <p className="text-slate-500">Manage your crops, track offers, monitor market prices, and grow your farm business.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Weather Widget */}
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2">
              <ThermometerSun className="w-8 h-8 text-amber-500" />
              <div>
                <p className="font-bold text-slate-900">32°C</p>
                <p className="text-xs text-slate-500">Lucknow</p>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="flex flex-col gap-1 text-xs text-slate-600">
              <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-400"/> 65% Humidity</span>
              <span className="flex items-center gap-1"><CloudRain className="w-3 h-3 text-indigo-400"/> 40% Rain</span>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-[#16A34A] hover:border-[#16A34A]/30 transition-all relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                    <h4 className="font-bold text-slate-900">Notifications</h4>
                    <span className="text-xs font-medium text-[#16A34A] bg-[#DCFCE7] px-2 py-1 rounded-full">2 New</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {MOCK_NOTIFICATIONS.map(notif => (
                      <div key={notif.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-3 ${notif.unread ? 'bg-[#F0FDF4]' : ''}`}>
                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.unread ? 'bg-[#16A34A]' : 'bg-slate-300'}`}></div>
                        <p className="text-sm text-slate-700">{notif.text}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#22C55E] text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-[#16A34A]/20 hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Add Crop
          </button>
        </div>
      </div>

      {/* Analytics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "Total Earnings", value: `₹${totalRevenue.toLocaleString()}`, icon: Wallet, trend: "+12.5% this month", color: "text-[#16A34A]", bg: "bg-[#DCFCE7]", border: "border-[#16A34A]/10" },
          { title: "Total Crops Sold", value: totalCropsSold.toString(), icon: ShoppingBag, trend: "+8 this month", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
          { title: "Active Listings", value: activeListingsCount.toString(), icon: Package, trend: "2 newly added", color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
          { title: "Pending Offers", value: pendingOffersCount.toString(), icon: AlertCircle, trend: "Needs your response", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white rounded-3xl p-6 border ${stat.border} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}
          >
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br from-white to-slate-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-slate-500 font-medium mb-1 relative z-10">{stat.title}</h3>
            <p className="text-3xl font-extrabold text-slate-900 mb-2 relative z-10">{stat.value}</p>
            <p className="text-sm font-medium text-slate-500 relative z-10">{stat.trend}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Today's Market Prices */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#16A34A]" /> Today's Market Prices
              </h3>
              <span className="flex items-center gap-1 text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-3 py-1 rounded-full animate-pulse">
                 <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span> Live
              </span>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {MOCK_MARKET_PRICES.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md transition-all">
                   <h4 className="font-semibold text-slate-700 mb-2">{item.name}</h4>
                   <p className="text-lg font-bold text-slate-900">₹{item.price}<span className="text-xs text-slate-500 font-normal">/{item.unit}</span></p>
                   <p className={`text-sm font-bold mt-1 ${item.trend > 0 ? 'text-[#16A34A]' : 'text-rose-500'}`}>
                     {item.trend > 0 ? '+' : ''}{item.trend}%
                   </p>
                </div>
              ))}
           </div>
        </div>

        {/* Farmer Performance */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
           <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
             <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Farmer Performance
           </h3>
           <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full border-4 border-[#DCFCE7] flex items-center justify-center relative">
                 <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="44" cy="44" r="44" className="stroke-[#16A34A] stroke-[4px] fill-none" strokeDasharray="276" strokeDashoffset="27"></circle>
                 </svg>
                 <span className="text-2xl font-bold text-slate-900">4.8</span>
              </div>
              <div className="space-y-3 flex-1">
                 <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Response Rate</span>
                      <span className="font-bold text-slate-900">96%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[96%]"></div></div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Success Rate</span>
                      <span className="font-bold text-slate-900">87%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-[#16A34A] w-[87%]"></div></div>
                 </div>
              </div>
           </div>
           <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 flex items-center gap-4">
              <div className="p-2 bg-white rounded-xl text-[#16A34A] shadow-sm"><Zap className="w-5 h-5"/></div>
              <div>
                 <p className="text-sm font-bold text-slate-900">Top Performing Crop</p>
                 <p className="text-xs text-slate-500">{topCropName}</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Revenue Analytics Improvement */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#16A34A]" /> Revenue Analytics
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {['Weekly', 'Monthly', 'Yearly'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${chartTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `₹${val}`} />
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Farm Assistant */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#16A34A] rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
               <Cpu className="w-6 h-6 text-[#DCFCE7]" />
            </div>
            <h3 className="text-lg font-bold">AI Farm Assistant</h3>
          </div>
          
          <div className="space-y-4 relative z-10 flex-1">
            {dynamicAIInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                 <Check className="w-5 h-5 text-[#22C55E] shrink-0" />
                 <p className="text-sm text-slate-200">{insight}</p>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl font-bold text-sm transition-colors relative z-10">
            Generate New Insights
          </button>
        </div>
      </div>

      {/* Quick Statistics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Listing Views', val: quickStats.views, icon: Eye },
          { label: 'Total Offers Received', val: quickStats.offers, icon: Bell },
          { label: 'Completed Orders', val: quickStats.orders, icon: Check },
          { label: 'Avg Selling Price', val: `₹${quickStats.avgPrice}`, icon: Wallet }
        ].map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
             <div className="p-2 bg-slate-50 rounded-xl text-slate-500"><item.icon className="w-5 h-5"/></div>
             <div>
               <p className="text-xs text-slate-500 font-medium">{item.label}</p>
               <p className="text-xl font-bold text-slate-900">{item.val}</p>
             </div>
          </div>
        ))}
      </div>

      {/* 🌿 Plant Disease Detection CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate('/plant-disease-detection')}
        className="mb-8 bg-gradient-to-r from-[#16A34A] to-[#22C55E] rounded-3xl p-6 md:p-8 shadow-lg shadow-[#16A34A]/20 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-700" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 17 3.5s1.5 3 1.5 6.5a7 7 0 0 1-7.5 10Z" />
                <path d="M11.5 18a4.5 4.5 0 0 1-2-8.5C13 7 14.5 6 14.5 6s.5 2.5.5 5a4.5 4.5 0 0 1-3.5 7Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">🌿 Plant Disease Detection</h3>
              <p className="text-white/80 text-sm">Upload a leaf photo to instantly detect diseases, get treatment advice, and keep your crops healthy.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-3 rounded-xl font-bold text-sm border border-white/20 whitespace-nowrap hover:bg-white/30 transition-colors">
            Scan Now <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Pending Offers Redesign */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-[500px]">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" /> Pending Offers
          </h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400">
                 <Loader className="w-8 h-8 animate-spin mb-2" />
                 <p>Loading offers...</p>
               </div>
            ) : offers.filter(o => o.status === 'Pending').length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                 <Package className="w-12 h-12 mb-3 text-slate-300" />
                 <p className="font-medium text-slate-600">No pending offers right now</p>
                 <p className="text-sm mt-1 text-center px-4">When traders make an offer on your crops, they will appear here.</p>
               </div>
            ) : offers.filter(o => o.status === 'Pending').map(offer => (
              <div key={offer._id} className="border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow bg-slate-50/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg">Offer for {offer.cropId?.cropName}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <ShoppingBag className="w-4 h-4"/> Trader: {offer.traderId?.name}
                    </p>
                  </div>
                  <span className="bg-amber-100 text-amber-600 text-xs font-bold px-3 py-1 rounded-full">Pending</span>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100 mb-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-500">Offer Price:</span>
                    <span className="font-bold text-2xl text-[#16A34A]">₹{offer.offeredPrice}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-500">Quantity:</span>
                    <span className="font-bold text-slate-900">{offer.quantity} {offer.cropId?.unit || 'kg'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleOfferAction(offer._id, 'Accepted')}
                      className="col-span-1 py-2.5 bg-[#16A34A] hover:bg-[#22C55E] text-white rounded-xl font-bold text-sm transition-colors shadow-sm shadow-[#16A34A]/20 flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4"/> Accept
                    </button>
                    <button 
                      onClick={() => handleOfferAction(offer._id, 'Counter')}
                      className="col-span-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center"
                    >
                      Counter
                    </button>
                    <button 
                      onClick={() => handleOfferAction(offer._id, 'Rejected')}
                      className="col-span-1 py-2.5 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4"/> Reject
                    </button>
                  </div>
                  <button 
                    onClick={() => handleChatWithTrader(offer.traderId, offer.cropId, offer)}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-blue-200/60"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Chat with Trader ({offer.traderId?.name || 'Trader'})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Deals Redesign */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-[500px]">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-500" /> Recent Deals
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400">
                 <Loader className="w-8 h-8 animate-spin mb-2" />
               </div>
            ) : deals.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                 <ShoppingBag className="w-12 h-12 mb-3 text-slate-300" />
                 <p className="font-medium text-slate-600">No deals yet.</p>
               </div>
            ) : deals.map((deal) => (
                <div key={deal._id} onClick={() => navigate(`/deals/${deal._id}`)} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors cursor-pointer group">
                  <div className="w-14 h-14 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] font-bold text-xl shrink-0 group-hover:scale-105 transition-transform">
                    {deal.cropId?.cropName?.substring(0, 2).toUpperCase() || 'CR'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate text-lg">{deal.cropId?.cropName}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                       <span className="font-medium">{deal.quantity} {deal.cropId?.unit || 'kg'}</span>
                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                       <span className="truncate">Trader: {deal.traderId?.name}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <p className="font-bold text-slate-900 text-lg">₹{deal.finalPrice}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChatWithTrader(deal.traderId, deal.cropId, deal);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/60 text-xs font-bold flex items-center gap-1 transition-colors"
                        title="Open Chat with Trader"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat
                      </button>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        deal.status === 'Completed' || deal.status === 'Accepted' || deal.status === 'Paid' ? 'bg-[#DCFCE7] text-[#16A34A]' : 
                        deal.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {deal.status}
                      </span>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Crop Listings Redesign */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-xl font-bold text-slate-900">My Crop Listings</h3>
           <button onClick={() => setIsAddModalOpen(true)} className="text-sm font-bold text-[#16A34A] hover:text-[#22C55E] flex items-center gap-1">
             View All <ArrowRight className="w-4 h-4"/>
           </button>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
             <div className="col-span-full py-12 flex justify-center text-slate-400">
               <Loader className="w-8 h-8 animate-spin" />
             </div>
          ) : myCrops.length === 0 ? (
             <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
               <Package className="w-16 h-16 mb-4 text-slate-300" />
               <p className="text-lg font-bold text-slate-700">No active listings</p>
               <p className="text-sm mt-2 mb-6">Click 'Add Crop' to create your first listing and reach traders.</p>
               <button onClick={() => setIsAddModalOpen(true)} className="bg-[#16A34A] text-white px-6 py-2.5 rounded-xl font-bold">Add Crop</button>
             </div>
          ) : myCrops.map(crop => (
            <div key={crop._id} className="bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="h-48 bg-slate-100 overflow-hidden relative">
                <img 
                  src={getCropImageUrl(crop)} 
                  alt={crop.cropName} 
                  onError={handleImageError}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 shadow-sm flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#16A34A]"/> {crop.location || 'Local'}
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-extrabold text-slate-900 text-lg truncate">{crop.cropName}</h4>
                  <span className="text-[#16A34A] font-black text-lg">₹{crop.price}<span className="text-xs text-slate-500 font-normal">/{crop.unit || 'kg'}</span></span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mb-5 pb-5 border-b border-slate-100">
                   <span className="bg-slate-50 px-2 py-1 rounded-md">{crop.quantity} {crop.unit || 'kg'} Available</span>
                   <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5"/> {Math.floor(Math.random() * 200 + 50)} Views</span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button className="w-full py-2.5 bg-[#DCFCE7] text-[#16A34A] hover:bg-[#16A34A] hover:text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                    <ShoppingBag className="w-4 h-4"/> View Offers ({(Math.random() * 10).toFixed(0)})
                  </button>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1">
                      <Edit className="w-4 h-4"/> Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteCrop(crop._id)}
                      className="flex-1 py-2 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-4 h-4"/> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Crop Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative my-8"
            >
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5"/>
              </button>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Create New Listing</h3>
              <form onSubmit={handleAddCrop} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Crop Details</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" name="cropName" placeholder="Crop Name" required className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#16A34A] focus:border-transparent outline-none transition-all" onChange={handleInputChange} />
                    <select name="category" className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#16A34A] focus:border-transparent outline-none transition-all" onChange={handleInputChange}>
                      <option value="Grains">Grains</option>
                      <option value="Fruits">Fruits</option>
                      <option value="Vegetables">Vegetables</option>
                      <option value="Pulses">Pulses</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Quantity</label>
                    <div className="flex shadow-sm rounded-xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-[#16A34A]">
                      <input type="number" name="quantity" placeholder="e.g. 50" required className="w-full p-3.5 bg-slate-50 outline-none" onChange={handleInputChange} />
                      <select name="unit" className="bg-slate-100 px-3 outline-none border-l border-slate-200 font-medium text-slate-600" onChange={handleInputChange}>
                        <option value="kg">kg</option>
                        <option value="ton">ton</option>
                        <option value="quintal">quintal</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Price (₹)</label>
                    <input type="number" name="price" placeholder="Price per unit" required className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#16A34A] outline-none transition-all" onChange={handleInputChange} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Location & Quality</label>
                  <input type="text" name="location" placeholder="Farm location / City" required className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#16A34A] outline-none transition-all mb-4" onChange={handleInputChange} />
                  <textarea name="description" rows="3" placeholder="Describe the quality, harvest date, etc." className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#16A34A] outline-none transition-all resize-none" onChange={handleInputChange}></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Upload Images</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-[#16A34A] transition-colors cursor-pointer relative">
                     <input type="file" name="image" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleInputChange} />
                     <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                     <p className="text-sm font-bold text-slate-700">Click to upload crop image</p>
                     <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                </div>
                <div className="pt-4">
                  <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-[#16A34A] hover:bg-[#22C55E] text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-[#16A34A]/30 disabled:opacity-50 flex justify-center items-center gap-2">
                    {isSubmitting ? <><Loader className="w-5 h-5 animate-spin"/> Publishing...</> : 'Publish Listing'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

import React from 'react';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-rose-500 bg-rose-50 min-h-screen">
          <h1 className="text-2xl font-bold mb-4">Dashboard Render Error</h1>
          <pre className="bg-white p-4 rounded-xl border border-rose-200 overflow-auto text-sm">{this.state.error && this.state.error.toString()}</pre>
          <p className="mt-4 text-slate-700">Please check the console for more details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SafeFarmerDashboard(props) {
  return <ErrorBoundary><FarmerDashboard {...props} /></ErrorBoundary>;
}
