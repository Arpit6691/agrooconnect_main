import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { History, Leaf, CheckCircle, Bug, AlertTriangle, ShieldAlert, Info, ChevronLeft, Loader, Search, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const PlantDetectionHistory = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'farmer') {
      navigate('/login');
      return;
    }

    const fetchDetections = async () => {
      try {
        const { data } = await api.get('/plant-detection');
        setDetections(data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load detection history');
      } finally {
        setLoading(false);
      }
    };
    fetchDetections();
  }, [user, authLoading, navigate]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this detection record?')) return;
    try {
      await api.delete(`/plant-detection/${id}`);
      setDetections(detections.filter(d => d._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete record');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-400">
        <Loader className="w-10 h-10 animate-spin text-[#16A34A] mb-3" />
        <p className="font-medium text-slate-500">Checking farmer authentication...</p>
      </div>
    );
  }

  if (!user || user.role !== 'farmer') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 text-amber-600 border border-amber-200">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Farmer Login Required</h2>
        <p className="text-slate-500 mb-6 text-sm">
          Detection History is exclusively available to logged-in farmers.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3 bg-[#16A34A] text-white rounded-xl font-bold hover:bg-[#22C55E] transition-colors shadow-lg shadow-[#16A34A]/20"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const getConfidenceStyle = (confidence) => {
    if (confidence >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (confidence >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'High': return <ShieldAlert className="w-3.5 h-3.5" />;
      case 'Moderate': return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'Low': return <Info className="w-3.5 h-3.5" />;
      default: return <CheckCircle className="w-3.5 h-3.5" />;
    }
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'High': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Moderate': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Low': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const filteredDetections = detections.filter(d => {
    const term = searchTerm.toLowerCase();
    return d.cropName.toLowerCase().includes(term) ||
      (d.diseaseName && d.diseaseName.toLowerCase().includes(term)) ||
      d.status.toLowerCase().includes(term);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/plant-disease-detection')}
            className="p-2 text-slate-400 hover:text-[#16A34A] transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <History className="w-6 h-6 text-[#16A34A]" />
              Detection History
            </h1>
            <p className="text-slate-500 mt-1">View your past plant disease analysis results</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/plant-disease-detection')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-semibold hover:bg-[#22C55E] transition-colors shadow-lg shadow-[#16A34A]/20"
        >
          <Leaf className="w-4 h-4" /> New Scan
        </button>
      </div>

      {/* Search */}
      {!loading && detections.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by crop, disease, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-all"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader className="w-10 h-10 animate-spin mb-4 text-[#16A34A]" />
          <p className="font-medium text-slate-500">Loading your detection history...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p className="font-bold text-rose-700 mb-1">Failed to Load History</p>
          <p className="text-sm text-rose-600">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && detections.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-2">No Detection History</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            You haven't analyzed any plants yet. Start by scanning a plant image to check for diseases.
          </p>
          <button
            onClick={() => navigate('/plant-disease-detection')}
            className="px-6 py-3 bg-[#16A34A] text-white rounded-xl font-bold hover:bg-[#22C55E] transition-colors shadow-lg shadow-[#16A34A]/20"
          >
            Start Your First Scan
          </button>
        </div>
      )}

      {/* Detection List */}
      {!loading && !error && filteredDetections.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDetections.map((detection, idx) => (
            <motion.div
              key={detection._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/plant-detection/${detection._id}`)}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#16A34A]/20 transition-all group"
            >
              {/* Image */}
              <div className="h-40 bg-slate-100 relative overflow-hidden">
                <img
                  src={detection.imageUrl}
                  alt={detection.cropName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${
                    detection.status === 'Healthy'
                      ? 'bg-emerald-500 text-white'
                      : detection.status === 'Uncertain'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}>
                    {detection.status === 'Healthy' ? <CheckCircle className="w-3 h-3" /> : detection.status === 'Uncertain' ? <AlertTriangle className="w-3 h-3" /> : <Bug className="w-3 h-3" />}
                    {detection.status}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDelete(detection._id, e)}
                  className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900">{detection.cropName}</h4>
                      {detection.diseaseCategory && detection.diseaseCategory !== 'UNKNOWN' && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {detection.diseaseCategory}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{detection.diseaseName || (detection.status === 'Healthy' ? 'Healthy Plant' : 'Condition Unclear')}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {/* Confidence */}
                  <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold border ${getConfidenceStyle(detection.confidence)}`}>
                    {detection.confidence}%
                  </span>

                  {/* Severity */}
                  {detection.status === 'Diseased' && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold border ${getSeverityStyle(detection.severity)}`}>
                      {getSeverityIcon(detection.severity)}
                      {detection.severity}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mt-3">
                  {new Date(detection.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* No search results */}
      {!loading && !error && detections.length > 0 && filteredDetections.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No results match "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};

export default PlantDetectionHistory;
