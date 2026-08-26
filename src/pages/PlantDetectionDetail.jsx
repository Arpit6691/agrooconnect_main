import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Leaf, CheckCircle, Bug, AlertTriangle, ShieldAlert, Info, ChevronRight, Loader, Trash2, Sparkles, Calendar, RotateCcw } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const PlantDetectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useContext(AuthContext);
  const [detection, setDetection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'farmer') {
      navigate('/login');
      return;
    }

    const fetchDetection = async () => {
      try {
        const { data } = await api.get(`/plant-detection/${id}`);
        setDetection(data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load detection details');
      } finally {
        setLoading(false);
      }
    };
    fetchDetection();
  }, [id, user, authLoading, navigate]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this detection record?')) return;
    try {
      await api.delete(`/plant-detection/${id}`);
      navigate('/plant-detection-history');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete record');
    }
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 85) return { label: 'High', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', barColor: 'bg-emerald-500' };
    if (confidence >= 60) return { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', barColor: 'bg-amber-500' };
    return { label: 'Low', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', barColor: 'bg-rose-500' };
  };

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'High': return { color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', icon: ShieldAlert };
      case 'Moderate': return { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle };
      case 'Low': return { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: Info };
      default: return { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle };
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
          Please sign in to your farmer account to view this scan record.
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader className="w-10 h-10 animate-spin text-[#16A34A]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => navigate('/plant-detection-history')} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">
          Back to History
        </button>
      </div>
    );
  }

  if (!detection) return null;

  const conf = getConfidenceLevel(detection.confidence);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/plant-detection-history')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#16A34A] font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back to History
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/plant-disease-detection')}
            className="flex items-center gap-2 px-4 py-2 bg-[#16A34A] text-white rounded-xl font-semibold hover:bg-[#22C55E] transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" /> New Scan
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl font-semibold hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Result Header */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="md:w-1/3 h-64 md:h-auto bg-slate-100 relative">
              <img src={detection.imageUrl} alt={detection.cropName} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                  detection.status === 'Healthy'
                    ? 'bg-emerald-500 text-white'
                    : detection.status === 'Uncertain'
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}>
                  {detection.status === 'Healthy' ? <CheckCircle className="w-4 h-4" /> : detection.status === 'Uncertain' ? <AlertTriangle className="w-4 h-4" /> : <Bug className="w-4 h-4" />}
                  {detection.status}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="text-sm font-bold text-[#16A34A] bg-[#DCFCE7] px-3 py-1 rounded-full">{detection.cropName}</span>
                {detection.diseaseCategory && detection.diseaseCategory !== 'UNKNOWN' && (
                  <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {detection.diseaseCategory}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
                  <Calendar className="w-3 h-3" />
                  {new Date(detection.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                {detection.diseaseName || (detection.status === 'Healthy' ? 'Healthy Plant' : 'Condition Unclear')}
              </h2>

              {detection.description && (
                <p className="text-slate-600 mt-3 leading-relaxed">{detection.description}</p>
              )}
              {detection.message && (
                <p className="text-slate-600 mt-3 leading-relaxed">{detection.message}</p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-4 mt-6">
                <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${conf.bg} ${conf.border}`}>
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full ${conf.barColor} rounded-full`} style={{ width: `${detection.confidence}%` }} />
                  </div>
                  <span className={`text-sm font-bold ${conf.color}`}>{detection.confidence}% ({conf.label})</span>
                </div>

                {detection.status === 'Diseased' && (() => {
                  const sev = getSeverityStyle(detection.severity);
                  return (
                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${sev.bg} ${sev.border}`}>
                      <sev.icon className={`w-4 h-4 ${sev.color}`} />
                      <span className={`text-sm font-bold ${sev.color}`}>Severity: {detection.severity}</span>
                    </div>
                  );
                })()}
              </div>

              {(detection.confidence < 60 || detection.status === 'Uncertain') && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 font-medium">
                    <span className="font-bold">Uncertain / Low Confidence:</span> The diagnosis may not be fully reliable. Please consult an agricultural expert or re-scan with a clearer leaf photo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Agricultural Safety Disclaimer */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-700">Agricultural Advisory Notice:</span> This AI tool provides supportive plant diagnostic suggestions based on visual symptoms. It does not replace on-field laboratory analysis. Always verify symptoms with local agricultural extension officers or certified agronomists before major pesticide or chemical applications.
          </p>
        </div>

        {/* Detail Cards for Diseased */}
        {detection.status === 'Diseased' && (
          <div className="grid md:grid-cols-3 gap-6">
            {detection.possibleCauses?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 rounded-lg"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
                  Possible Causes
                </h3>
                <ul className="space-y-3">
                  {detection.possibleCauses.map((cause, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      {cause}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detection.recommendedTreatment?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg"><Leaf className="w-4 h-4 text-blue-500" /></div>
                  Recommended Treatment
                </h3>
                <ul className="space-y-3">
                  {detection.recommendedTreatment.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detection.preventionTips?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
                  Prevention Tips
                </h3>
                <ul className="space-y-3">
                  {detection.preventionTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Healthy Recommendations */}
        {detection.status === 'Healthy' && detection.recommendations?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
              Care Recommendations
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3">
              {detection.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                  <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PlantDetectionDetail;
