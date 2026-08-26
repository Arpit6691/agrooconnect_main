import { useState, useRef, useContext, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, X, Leaf, AlertTriangle, CheckCircle, ShieldAlert, Info, ArrowRight, RotateCcw, History, Loader, Bug, Sparkles, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

const PlantDiseaseDetection = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'farmer') {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

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
          Plant Disease Detection is exclusively available to registered farmers. Please sign in to your farmer account.
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

  const validateFile = (file) => {
    if (!file) return 'No file selected';
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a JPG, PNG, or WebP image.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is 5MB.`;
    }
    return null;
  };

  const handleFileSelect = (file) => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const { data } = await api.post('/plant-detection', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    removeImage();
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

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'FUNGAL': return { label: 'Fungal Pathogen', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
      case 'BACTERIAL': return { label: 'Bacterial Infection', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      case 'VIRAL': return { label: 'Viral Disease', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
      case 'PEST_RELATED': return { label: 'Pest / Insect Damage', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
      case 'NUTRIENT_DEFICIENCY': return { label: 'Nutrient Deficiency', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
      case 'HEALTHY': return { label: 'Healthy Foliage', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      default: return { label: 'General / Unclassified', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-[#DCFCE7] rounded-xl">
              <Leaf className="w-7 h-7 text-[#16A34A]" />
            </div>
            Plant Disease Detection
          </h1>
          <p className="text-slate-500 mt-2">Upload or capture a plant image for AI-powered health analysis</p>
        </div>
        <button
          onClick={() => navigate('/plant-detection-history')}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors shadow-sm"
        >
          <History className="w-4 h-4" /> Detection History
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* ── RESULT VIEW ── */}
        {result ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Result Header */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="md:w-1/3 h-64 md:h-auto bg-slate-100 relative">
                  <img src={imagePreview} alt="Analyzed plant" className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                      result.status === 'Healthy'
                        ? 'bg-emerald-500 text-white'
                        : result.status === 'Uncertain'
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}>
                      {result.status === 'Healthy' ? <CheckCircle className="w-4 h-4" /> : result.status === 'Uncertain' ? <AlertTriangle className="w-4 h-4" /> : <Bug className="w-4 h-4" />}
                      {result.status}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-sm font-bold text-[#16A34A] bg-[#DCFCE7] px-3 py-1 rounded-full">{result.cropName}</span>
                    {result.diseaseCategory && result.diseaseCategory !== 'UNKNOWN' && (() => {
                      const cat = getCategoryBadge(result.diseaseCategory);
                      return (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
                          {cat.label}
                        </span>
                      );
                    })()}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mt-2">
                    {result.diseaseName || (result.status === 'Healthy' ? 'Healthy Plant' : 'Condition Unclear')}
                  </h2>
                  {result.description && (
                    <p className="text-slate-600 mt-3 leading-relaxed">{result.description}</p>
                  )}
                  {result.message && (
                    <p className="text-slate-600 mt-3 leading-relaxed">{result.message}</p>
                  )}

                  {/* Confidence + Severity badges */}
                  <div className="flex flex-wrap gap-4 mt-6">
                    {/* Confidence */}
                    {(() => {
                      const conf = getConfidenceLevel(result.confidence);
                      return (
                        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${conf.bg} ${conf.border}`}>
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${conf.barColor} rounded-full transition-all`} style={{ width: `${result.confidence}%` }} />
                          </div>
                          <span className={`text-sm font-bold ${conf.color}`}>{result.confidence}% Confidence ({conf.label})</span>
                        </div>
                      );
                    })()}

                    {/* Severity */}
                    {result.status === 'Diseased' && (() => {
                      const sev = getSeverityStyle(result.severity);
                      return (
                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${sev.bg} ${sev.border}`}>
                          <sev.icon className={`w-4 h-4 ${sev.color}`} />
                          <span className={`text-sm font-bold ${sev.color}`}>Severity: {result.severity}</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Low confidence or Uncertain warning */}
                  {(result.confidence < 60 || result.status === 'Uncertain') && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800 font-medium">
                        <span className="font-bold">Uncertain / Low Confidence:</span> The leaf symptoms or crop type could not be identified with high confidence. Please upload a well-lit, close-up photograph of an affected leaf, or consult a local agricultural expert.
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

            {/* Detail Cards */}
            {result.status === 'Diseased' && (
              <div className="grid md:grid-cols-3 gap-6">
                {/* Possible Causes */}
                {result.possibleCauses?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <div className="p-1.5 bg-amber-50 rounded-lg"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
                      Possible Causes
                    </h3>
                    <ul className="space-y-3">
                      {result.possibleCauses.map((cause, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          {cause}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Treatment */}
                {result.recommendedTreatment?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 rounded-lg"><Leaf className="w-4 h-4 text-blue-500" /></div>
                      Recommended Treatment
                    </h3>
                    <ul className="space-y-3">
                      {result.recommendedTreatment.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prevention */}
                {result.preventionTips?.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
                      Prevention Tips
                    </h3>
                    <ul className="space-y-3">
                      {result.preventionTips.map((tip, i) => (
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

            {/* Healthy plant recommendations */}
            {result.status === 'Healthy' && result.recommendations?.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 rounded-lg"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
                  Care Recommendations
                </h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <button onClick={resetAnalysis} className="flex items-center gap-2 px-6 py-3 bg-[#16A34A] text-white rounded-xl font-bold hover:bg-[#22C55E] transition-colors shadow-lg shadow-[#16A34A]/20">
                <RotateCcw className="w-5 h-5" /> Scan Another Plant
              </button>
              <button onClick={() => navigate('/plant-detection-history')} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                <History className="w-5 h-5" /> View All History <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          /* ── UPLOAD VIEW ── */
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Upload Area */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
              {!imagePreview ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                    dragActive
                      ? 'border-[#16A34A] bg-[#F0FDF4]'
                      : 'border-slate-200 hover:border-[#16A34A]/50 hover:bg-slate-50'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
                      dragActive ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Upload className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-slate-900 mb-1">
                        {dragActive ? 'Drop your image here' : 'Drag & drop your plant image here'}
                      </p>
                      <p className="text-slate-500">or click to browse from your device</p>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Supports JPG, PNG, WebP • Max 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Preview */}
                  <div className="relative w-full md:w-80 h-64 rounded-2xl overflow-hidden bg-slate-100 shadow-inner shrink-0">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={removeImage}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-600 hover:text-rose-500 shadow-md transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Image Selected</h3>
                      <p className="text-sm text-slate-500 mt-1">{selectedImage?.name}</p>
                      <p className="text-xs text-slate-400 mt-1">{(selectedImage?.size / (1024 * 1024)).toFixed(2)} MB • {selectedImage?.type}</p>
                    </div>
                    <button
                      onClick={analyzeImage}
                      disabled={analyzing}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#16A34A] text-white rounded-xl font-bold hover:bg-[#22C55E] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#16A34A]/20 text-lg"
                    >
                      {analyzing ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Leaf className="w-5 h-5" />
                          Analyze Plant
                        </>
                      )}
                    </button>
                    <button
                      onClick={removeImage}
                      className="text-sm text-slate-500 hover:text-rose-500 font-medium transition-colors"
                    >
                      Remove & choose different image
                    </button>
                  </div>
                </div>
              )}

              {/* Hidden file inputs */}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={handleInputChange} className="hidden" />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleInputChange} className="hidden" />

              {/* Camera + Upload buttons (when no image) */}
              {!imagePreview && (
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                  >
                    <Upload className="w-5 h-5" /> Upload Image
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-2 px-5 py-3 bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#16A34A] rounded-xl font-semibold transition-colors"
                  >
                    <Camera className="w-5 h-5" /> Capture with Camera
                  </button>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-rose-700">Error</p>
                  <p className="text-sm text-rose-600 mt-0.5">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Analyzing Overlay */}
            {analyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl border border-[#16A34A]/20 shadow-lg p-12 flex flex-col items-center justify-center text-center"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 border-4 border-slate-100 border-t-[#16A34A] rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Leaf className="w-8 h-8 text-[#16A34A]" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing your plant image...</h3>
                <p className="text-slate-500 max-w-md">Our AI is examining the leaf patterns, color variations, and overall plant health. This may take a few seconds.</p>
              </motion.div>
            )}

            {/* Tips Card */}
            {!analyzing && !imagePreview && (
              <div className="bg-gradient-to-br from-[#F0FDF4] to-white rounded-3xl border border-[#DCFCE7] p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#16A34A]" /> Tips for Best Results
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Photograph the affected leaf or plant part clearly',
                    'Ensure good lighting — avoid shadows and glare',
                    'Capture close-up images showing disease symptoms',
                    'Include both healthy and affected areas if possible'
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlantDiseaseDetection;
