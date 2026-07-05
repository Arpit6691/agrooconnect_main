import { useState } from 'react';
import { motion } from 'framer-motion';
import { Leaf, MapPin, CloudRain, ThermometerSun, Sparkles, ArrowRight } from 'lucide-react';
import api from '../api/axios';

const AIRecommendation = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    soilType: 'Loamy',
    season: 'Spring (Mar-May)',
    location: 'Midwest, USA',
    rainfall: 800
  });

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/ai/recommend', formData);
      setResult(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-primary-50 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-primary-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">AI Crop Recommendation</h1>
        <p className="text-slate-500 mt-2 max-w-2xl mx-auto">Leverage our machine learning model to determine the best crop to plant based on your soil, weather, and market demand.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Input Parameters</h2>
          <form onSubmit={handlePredict} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Soil Type</label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                value={formData.soilType}
                onChange={(e) => setFormData({...formData, soilType: e.target.value})}
              >
                <option>Loamy</option>
                <option>Clay</option>
                <option>Sandy</option>
                <option>Silt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Season / Planting Month</label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                value={formData.season}
                onChange={(e) => setFormData({...formData, season: e.target.value})}
              >
                <option>Spring (Mar-May)</option>
                <option>Summer (Jun-Aug)</option>
                <option>Autumn (Sep-Nov)</option>
                <option>Winter (Dec-Feb)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Region / Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Enter your city or region" 
                  className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Average Annual Rainfall (mm)</label>
              <div className="relative">
                <CloudRain className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="number" 
                  className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all" 
                  value={formData.rainfall}
                  onChange={(e) => setFormData({...formData, rainfall: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              ) : (
                <>Analyze Data <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-primary-50 p-8 rounded-3xl border border-primary-100 flex flex-col justify-center relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>

          {result ? (
            result.error ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 text-center bg-rose-50/80 backdrop-blur p-8 rounded-3xl border border-rose-100 shadow-sm"
              >
                <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Location Not Found</h3>
                <p className="text-rose-600 font-medium">{result.error}</p>
              </motion.div>
            ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10"
            >
              <div className="text-center mb-8">
                <span className="inline-block px-4 py-1 bg-white text-primary-600 rounded-full text-sm font-bold shadow-sm mb-4">Top Recommendation</span>
                <h3 className="text-4xl font-bold text-slate-900 mb-2">{result.crop}</h3>
                <p className="text-lg text-primary-600 font-medium">Confidence Score: {result.confidence}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 backdrop-blur p-4 rounded-2xl shadow-sm border border-white">
                  <p className="text-sm text-slate-500 mb-1">Expected Yield</p>
                  <p className="text-lg font-bold text-slate-900">{result.yield}</p>
                </div>
                <div className="bg-white/80 backdrop-blur p-4 rounded-2xl shadow-sm border border-white">
                  <p className="text-sm text-slate-500 mb-1">Market Demand</p>
                  <p className="text-lg font-bold text-slate-900">{result.demand}</p>
                </div>
                <div className="col-span-2 bg-white/80 backdrop-blur p-4 rounded-2xl shadow-sm border border-white">
                  <p className="text-sm text-slate-500 mb-1">Price Forecast</p>
                  <p className="text-lg font-bold text-emerald-600">{result.priceTrend}</p>
                </div>
              </div>
            </motion.div>
            )
          ) : (
            <div className="text-center relative z-10 opacity-50">
              <Leaf className="w-20 h-20 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">Enter your farm details and click "Analyze Data" to get AI-powered crop recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIRecommendation;
