import { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, Clock, CheckCircle, BarChart3, TrendingUp, AlertCircle, Eye, FileText, ShoppingCart, TrendingDown, ClipboardList, Activity, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const TraderDashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleChatWithFarmer = (farmer, crop, offerOrDeal) => {
    const farmerId = farmer?._id || farmer;
    const farmerName = farmer?.name || 'Farmer';
    const cropName = crop?.cropName || 'Crop';
    const initialMsg = offerOrDeal?.offeredPrice 
      ? `Hi ${farmerName}, I placed an offer of ₹${offerOrDeal.offeredPrice} for your ${cropName} (${offerOrDeal.quantity} ${crop?.unit || 'kg'}). Let's discuss!`
      : `Hi ${farmerName}, regarding our deal for ${cropName}.`;

    navigate('/chat', {
      state: {
        receiverId: farmerId,
        receiverName: farmerName,
        initialMessage: initialMsg
      }
    });
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'trader') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch independently so one failure doesn't block the other
        const [offersRes, dealsRes] = await Promise.allSettled([
          api.get('/offers'),
          api.get('/deals')
        ]);
        if (offersRes.status === 'fulfilled') setOffers(offersRes.value.data.data);
        if (dealsRes.status === 'fulfilled') setDeals(dealsRes.value.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading, navigate]);

  // Aggregate deal data for the chart
  const chartData = useMemo(() => {
    const monthlyData = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months including current
    const currentMonth = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      let m = currentMonth - i;
      if (m < 0) m += 12;
      monthlyData[months[m]] = 0;
    }

    deals.forEach(deal => {
      const dealDate = new Date(deal.createdAt);
      const mStr = months[dealDate.getMonth()];
      if (monthlyData[mStr] !== undefined) {
        monthlyData[mStr] += deal.finalPrice;
      }
    });

    return Object.keys(monthlyData).map(key => ({
      name: key,
      spent: monthlyData[key]
    }));
  }, [deals]);

  const totalSpent = deals.reduce((sum, deal) => sum + deal.finalPrice, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trader Overview</h1>
          <p className="text-slate-500">Track your purchases and market activity.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {[
          { title: "Total Spent", value: `₹${totalSpent.toLocaleString()}`, icon: ShoppingCart, color: "text-blue-500", bg: "bg-blue-50" },
          { title: "Active Offers", value: offers.filter(o => o.status === 'Pending').length, icon: Activity, color: "text-amber-500", bg: "bg-amber-50" },
          { title: "Completed Deals", value: deals.length, icon: ClipboardList, color: "text-emerald-500", bg: "bg-emerald-50" },
          { title: "Avg. Savings", value: "15%", icon: TrendingDown, color: "text-purple-500", bg: "bg-purple-50" }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <h3 className="text-slate-500 font-medium mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Weekly Expenditure</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="spent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Pending Offers</h3>
            <button className="text-sm text-primary-600 font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Loading offers...</p>
            ) : offers.length === 0 ? (
              <p className="text-sm text-slate-500">No active offers.</p>
            ) : offers.map((offer) => (
              <div key={offer._id} className="flex flex-col gap-2 p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {offer.farmerId?.name?.charAt(0) || 'F'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{offer.cropId?.cropName || 'Crop'}</h4>
                      <p className="text-sm text-slate-500">Offered: ₹{offer.offeredPrice}/{offer.cropId?.unit || 'unit'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${
                      offer.status === 'Accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      offer.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                      offer.status === 'Countered' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {offer.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                  <span className="text-xs text-slate-400">Farmer: <span className="font-semibold text-slate-700">{offer.farmerId?.name || 'Farmer'}</span></span>
                  <button 
                    onClick={() => handleChatWithFarmer(offer.farmerId, offer.cropId, offer)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 border border-blue-200/60"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Chat with Farmer
                  </button>
                </div>
                {offer.status === 'Accepted' && offer.farmerId?.phone && (
                  <div className="mt-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800 mb-1">Deal Accepted! Farmer Contact Details:</p>
                    <p className="text-sm text-emerald-700 font-medium">Name: {offer.farmerId?.name}</p>
                    <p className="text-sm text-emerald-700 font-medium">Phone: {offer.farmerId?.phone}</p>
                    <p className="text-sm text-emerald-700 font-medium">Email: {offer.farmerId?.email}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Deals</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading deals...</p>
          ) : deals.length === 0 ? (
            <p className="text-sm text-slate-500">No deals yet.</p>
          ) : deals.map((deal) => (
            <div 
              key={deal._id} 
              onClick={() => navigate(`/deals/${deal._id}`)} 
              className="border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow cursor-pointer bg-slate-50 hover:bg-white flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 truncate">{deal.cropId?.cropName}</h4>
                    <p className="text-sm text-slate-500">Farmer: {deal.farmerId?.name}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    deal.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                    deal.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {deal.status}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Amount:</span>
                    <span className="font-bold text-slate-900">₹{deal.finalPrice * deal.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Quantity:</span>
                    <span className="font-medium text-slate-900">{deal.quantity} {deal.cropId?.unit || 'kg'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChatWithFarmer(deal.farmerId, deal.cropId, deal);
                  }}
                  className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border border-blue-200/60"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Chat with Farmer
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/deals/${deal._id}`);
                  }}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  Tracker
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TraderDashboard;
