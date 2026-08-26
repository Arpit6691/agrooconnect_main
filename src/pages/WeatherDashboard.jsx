import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, CloudRain, Wind, Droplets, MapPin, Search } from 'lucide-react';
import api from '../api/axios';

const WeatherDashboard = () => {
  const [searchInput, setSearchInput] = useState('Delhi, IN');
  const [activeLocation, setActiveLocation] = useState('Delhi, IN');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/weather?location=${encodeURIComponent(activeLocation)}`);
        setWeatherData(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, [activeLocation]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim().length >= 2) {
      setActiveLocation(searchInput.trim());
    }
  };

  if (loading && !weatherData) {
    return <div className="text-center py-20 text-slate-500">Loading Weather Data...</div>;
  }

  if (!weatherData) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Farm Weather</h1>
          <p className="text-slate-500 mt-1">Real-time weather insights for better farming decisions.</p>
        </div>
        
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search city (e.g. Delhi, Mumbai)..." 
            className="w-full pl-12 pr-24 py-3 rounded-full border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-full transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Current Weather Main Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Sun className="w-64 h-64" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8">
              <MapPin className="w-5 h-5 text-blue-100" />
              <span className="font-medium text-blue-100">{weatherData.location}</span>
            </div>
            
            <div className="flex justify-between items-end mb-12">
              <div>
                <p className="text-blue-100 text-lg mb-2">Today</p>
                <div className="flex items-center gap-4">
                  <h2 className="text-7xl font-bold">{weatherData.current.temp}°C</h2>
                  <Sun className="w-16 h-16 text-yellow-300" />
                </div>
                <p className="text-2xl font-medium mt-2">{weatherData.current.condition}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3">
                <Wind className="w-8 h-8 text-blue-200" />
                <div>
                  <p className="text-blue-200 text-sm">Wind</p>
                  <p className="font-semibold text-lg">{weatherData.current.wind}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Droplets className="w-8 h-8 text-blue-200" />
                <div>
                  <p className="text-blue-200 text-sm">Humidity</p>
                  <p className="font-semibold text-lg">{weatherData.current.humidity}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CloudRain className="w-8 h-8 text-blue-200" />
                <div>
                  <p className="text-blue-200 text-sm">Rain Prob.</p>
                  <p className="font-semibold text-lg">{weatherData.current.rainProb}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts & Next Hours */}
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-amber-400"></div>
            <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              <CloudRain className="w-5 h-5" /> Expected Rainfall
            </h3>
            <p className="text-amber-700 text-sm">Light rain expected tomorrow evening. Good time to hold off on irrigation.</p>
          </div>

          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
            <h3 className="font-bold text-slate-900 mb-6">Today's Forecast</h3>
            <div className="space-y-4">
              {[
                { time: "15:00", temp: "23°", icon: Sun, color: "text-yellow-500" },
                { time: "18:00", temp: "20°", icon: Cloud, color: "text-slate-400" },
                { time: "21:00", temp: "17°", icon: CloudRain, color: "text-blue-500" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <span className="text-slate-500 font-medium">{item.time}</span>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                  <span className="font-bold text-slate-900">{item.temp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* 7-Day Forecast */}
      <div className="mt-8 bg-white border border-slate-100 shadow-sm rounded-3xl p-8">
        <h3 className="font-bold text-slate-900 mb-6 text-xl">7-Day Outlook</h3>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
          {weatherData.forecast.map((day, idx) => {
            const Icon = day.condition === 'Sunny' ? Sun : (day.condition === 'Rain' ? CloudRain : Cloud);
            return (
              <div key={idx} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-primary-50 transition-colors border border-slate-100 hover:border-primary-100 group">
                <span className="text-slate-500 font-medium mb-3 group-hover:text-primary-600 transition-colors">{day.day}</span>
                <Icon className="w-8 h-8 text-slate-700 mb-3 group-hover:text-primary-500 transition-colors" />
                <div className="flex gap-2">
                  <span className="font-bold text-slate-900">{day.temp}</span>
                  <span className="text-slate-400">{day.min}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;
