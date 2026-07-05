import { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, CheckCircle, Truck, Package, DollarSign, AlertTriangle, Phone, Mail, MessageSquare, Star, Loader, ShieldCheck, FileText, Download, Navigation, Calendar, Clock, Activity, Send, Check, MapPin, TrendingUp, XCircle, AlertOctagon, Info, Camera, Search, UserCheck } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const STATUS_STEPS = ['Accepted', 'Processing', 'Pickup Scheduled', 'In Transit', 'Delivered', 'Payment Pending', 'Completed'];

const MOCK_MESSAGES = [
  { sender: 'System', text: 'Deal initialized. Waiting for transport.', time: '10:00 AM' }
];

const DealDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState(MOCK_MESSAGES);
  
  // Modals
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  // Forms
  const [transportForm, setTransportForm] = useState({ arrangedBy: 'Trader', driverName: '', vehicleNumber: '', trackingId: '', pickupDate: '' });
  const [paymentForm, setPaymentForm] = useState({ method: 'UPI', transactionId: '', proofUrl: 'https://via.placeholder.com/300x500?text=Payment+Receipt' });
  const [reasonForm, setReasonForm] = useState('');

  const fetchDeal = async () => {
    try {
      const res = await api.get(`/deals/${id}`);
      setDeal(res.data.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load deal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeal();
  }, [id]);

  // Actions
  const handleAction = async (endpoint, data = {}, successMsg) => {
    try {
      await api.post(`/deals/${id}/${endpoint}`, data);
      await fetchDeal();
      alert(successMsg);
      // Close all modals
      setShowTransportModal(false);
      setShowPaymentModal(false);
      setShowCancelModal(false);
      setShowDisputeModal(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  const dynamicData = useMemo(() => {
    if (!deal) return null;
    
    const isFarmer = user?.id === deal.farmerId?._id;
    const isTrader = user?.id === deal.traderId?._id;
    const otherParty = isFarmer ? deal.traderId : deal.farmerId;
    
    const currentStatus = deal.status;
    let currentStepIdx = STATUS_STEPS.indexOf(currentStatus);
    if(currentStepIdx === -1) currentStepIdx = 0;
    if(currentStatus === 'Cancelled' || currentStatus === 'Disputed') currentStepIdx = -1;
    
    const progressPercent = currentStepIdx === -1 ? 0 : Math.round(((currentStepIdx + 1) / STATUS_STEPS.length) * 100);
    
    const createdDate = new Date(deal.createdAt);
    
    let countdownText = 'Processing...';
    let health = { status: 'On Schedule', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle };

    if (currentStatus === 'Cancelled') {
      countdownText = 'Cancelled';
      health = { status: 'Cancelled', color: 'bg-slate-100 text-slate-600', icon: XCircle };
    } else if (currentStatus === 'Disputed') {
      countdownText = 'Disputed';
      health = { status: 'Disputed', color: 'bg-rose-50 text-rose-600', icon: AlertOctagon };
    } else if (currentStatus === 'Completed') {
      countdownText = 'Delivered & Paid';
      health = { status: 'Completed', color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle };
    } else if (currentStatus === 'Payment Pending' || deal.payment?.status === 'Verification Pending') {
      countdownText = 'Awaiting Payment';
      health = { status: 'Payment Action Required', color: 'bg-amber-50 text-amber-600', icon: DollarSign };
    } else if (deal.transportation?.pickupDate) {
      const days = Math.ceil((new Date(deal.transportation.pickupDate) - new Date()) / (1000 * 60 * 60 * 24));
      countdownText = days > 0 ? `Pickup in ${days} Days` : 'Pickup Today';
    }

    return { isFarmer, isTrader, otherParty, currentStepIdx, progressPercent, createdDate, countdownText, health, currentStatus };
  }, [deal, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader className="w-8 h-8 animate-spin text-[#16A34A]" /></div>;
  if (!deal || !dynamicData) return <div className="p-8 text-center bg-slate-50 min-h-screen font-bold text-slate-500">Deal not found</div>;

  const { isFarmer, isTrader, otherParty, currentStepIdx, progressPercent, createdDate, countdownText, health, currentStatus } = dynamicData;

  const getPaymentBadge = (status) => {
    switch(status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-700';
      case 'Verification Pending': return 'bg-blue-100 text-blue-700';
      case 'Failed': return 'bg-rose-100 text-rose-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-[#16A34A] font-medium transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back to Dashboard
          </button>
          
          <div className="flex gap-2">
            {currentStatus !== 'Completed' && currentStatus !== 'Cancelled' && currentStatus !== 'Disputed' && (
              <>
                <button onClick={() => setShowCancelModal(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Cancel Deal
                </button>
                <button onClick={() => setShowDisputeModal(true)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-100 transition-colors flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4" /> Open Dispute
                </button>
              </>
            )}
          </div>
        </div>

        {/* Top Header */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">Deal #{deal._id.substring(deal._id.length - 6).toUpperCase()}</h1>
                <span className={`text-sm px-3 py-1 rounded-full font-bold ${currentStatus === 'Cancelled' ? 'bg-slate-100 text-slate-600' : currentStatus === 'Disputed' ? 'bg-rose-100 text-rose-700' : 'bg-[#DCFCE7] text-[#16A34A]'}`}>
                  {currentStatus}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600 font-medium mt-3">
                <div className="flex items-center gap-2"><Package className="w-4 h-4 text-slate-400"/> {deal.cropId?.cropName || 'Crop'} ({deal.quantity} {deal.cropId?.unit || 'KG'})</div>
                <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-slate-400"/> ₹{deal.finalPrice}/{deal.cropId?.unit || 'KG'}</div>
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400"/> Created: {createdDate.toLocaleDateString()}</div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 min-w-[200px]">
              <p className="text-sm text-slate-500 font-medium">Total Value</p>
              <p className="text-3xl font-bold text-slate-900">₹{deal.finalPrice * deal.quantity}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* Action Center & Progress */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-[#16A34A]/20 shadow-[0_0_20px_rgba(22,163,74,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#16A34A]/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-wrap items-center justify-between mb-8 gap-4 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Order Progress</h3>
                  <p className="text-[#16A34A] font-bold text-lg mt-1">{progressPercent}% Completed</p>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status</p>
                      <p className="text-sm font-bold text-slate-900">{countdownText}</p>
                    </div>
                  </div>
                  <div className={`${health.color} px-4 py-3 rounded-2xl border border-transparent flex items-center gap-3`}>
                    <health.icon className="w-5 h-5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-80">Health</p>
                      <p className="text-sm font-bold">{health.status}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {currentStepIdx >= 0 && (
                <div className="relative mb-12 mt-4 hidden sm:block">
                  <div className="absolute top-4 left-0 w-full h-1.5 bg-slate-100 rounded-full"></div>
                  <div className="absolute top-4 left-0 h-1.5 bg-[#16A34A] rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                  <div className="relative flex justify-between">
                    {STATUS_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;
                      return (
                        <div key={step} className="flex flex-col items-center gap-3 w-16">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm z-10 transition-all duration-500 ${isCompleted ? 'bg-[#16A34A] text-white shadow-lg shadow-[#16A34A]/30' : 'bg-slate-100 text-slate-400 border-2 border-slate-200'} ${isCurrent ? 'ring-4 ring-[#16A34A]/20' : ''}`}>
                            {idx < currentStepIdx ? <Check className="w-5 h-5" /> : idx + 1}
                          </div>
                          <span className={`text-xs font-bold text-center leading-tight ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ACTION CENTER */}
              <div className="mt-8 pt-8 border-t border-slate-100 relative z-10">
                <div className="bg-slate-50 border border-[#16A34A]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#16A34A] shadow-sm shrink-0 border border-slate-100">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">Action Center</h4>
                      
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        {currentStatus === 'Cancelled' ? 'This deal was cancelled.' : 
                         currentStatus === 'Disputed' ? 'This deal is under dispute. Support will contact you.' :
                         currentStatus === 'Completed' ? 'This deal has been completed successfully.' :
                         isFarmer ? (
                          currentStatus === 'Accepted' || currentStatus === 'Processing' ? 'Waiting for transportation to be assigned.' :
                          currentStatus === 'Pickup Scheduled' ? 'Transport is scheduled. Please confirm once crop is handed over to the driver.' :
                          currentStatus === 'In Transit' || currentStatus === 'Delivered' ? 'Waiting for Trader to confirm receipt and process payment.' :
                          deal.payment?.status === 'Verification Pending' ? 'Trader has uploaded payment proof. Please verify receipt.' :
                          'Waiting for trader action.'
                         ) : (
                          currentStatus === 'Accepted' || currentStatus === 'Processing' ? 'Please arrange transportation and provide details.' :
                          currentStatus === 'Pickup Scheduled' ? 'Waiting for Farmer to hand over the crop.' :
                          currentStatus === 'In Transit' || currentStatus === 'Delivered' ? 'Please confirm crop receipt to proceed.' :
                          currentStatus === 'Payment Pending' && deal.payment?.status !== 'Verification Pending' ? 'Please complete payment and submit proof.' :
                          deal.payment?.status === 'Verification Pending' ? 'Waiting for Farmer to verify payment.' :
                          'Waiting for farmer action.'
                         )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 shrink-0">
                    {/* Trader Actions */}
                    {isTrader && (currentStatus === 'Accepted' || currentStatus === 'Processing') && (
                      <button onClick={() => setShowTransportModal(true)} className="px-6 py-3 bg-[#16A34A] text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap">
                        <Truck className="w-5 h-5" /> Add Transport
                      </button>
                    )}
                    
                    {isTrader && (currentStatus === 'In Transit' || currentStatus === 'Delivered') && (
                      <button onClick={() => handleAction('receive', {}, 'Crop receipt confirmed!')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap">
                        <Package className="w-5 h-5" /> Confirm Received
                      </button>
                    )}

                    {isTrader && currentStatus === 'Payment Pending' && deal.payment?.status !== 'Verification Pending' && (
                      <button onClick={() => setShowPaymentModal(true)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap">
                        <DollarSign className="w-5 h-5" /> Mark Paid
                      </button>
                    )}

                    {/* Farmer Actions */}
                    {isFarmer && currentStatus === 'Pickup Scheduled' && (
                      <button onClick={() => handleAction('handover', {}, 'Crop handover confirmed!')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap">
                        <CheckCircle className="w-5 h-5" /> Confirm Handover
                      </button>
                    )}

                    {isFarmer && deal.payment?.status === 'Verification Pending' && (
                      <>
                        <button onClick={() => handleAction('reject-payment', {}, 'Payment rejected.')} className="px-4 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl font-bold hover:bg-rose-50 transition-colors shadow-sm whitespace-nowrap">
                          Reject
                        </button>
                        <button onClick={() => handleAction('confirm-payment', {}, 'Payment verified! Deal Completed.')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap">
                          <CheckCircle className="w-5 h-5" /> Verify Payment
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Transport Section */}
            <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Truck className="w-5 h-5 text-blue-500"/> Transportation Route</h3>
              
              {deal.transportation?.driverName ? (
                <div className="space-y-8">
                  <div className="flex flex-wrap gap-6 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">{deal.transportation.driverName.charAt(0)}</div>
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase">Driver / Arranged By</p>
                        <p className="font-bold text-slate-900">{deal.transportation.driverName} <span className="text-xs text-slate-400 font-medium">({deal.transportation.arrangedBy})</span></p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">Vehicle</p>
                      <p className="font-bold text-slate-900">{deal.transportation.vehicleNumber}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase">Tracking ID</p>
                      <p className="font-bold text-slate-900">{deal.transportation.trackingId}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-700 mb-6">Live Route Tracking</p>
                    <div className="flex items-center justify-between relative px-4">
                      <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 -translate-y-1/2 rounded-full"></div>
                      <div className={`absolute top-1/2 left-0 h-1.5 bg-blue-500 -translate-y-1/2 rounded-full transition-all duration-1000 ${currentStepIdx >= 3 ? 'w-1/2' : 'w-0'}`}></div>
                      
                      {['Origin', 'In Transit', 'Destination'].map((loc, i) => {
                        const isActive = (i === 0 && currentStepIdx >= 2) || (i === 1 && currentStepIdx >= 3) || (i === 2 && currentStepIdx >= 4);
                        const isCurrent = (i === 0 && currentStepIdx === 2) || (i === 1 && currentStepIdx === 3) || (i === 2 && currentStepIdx === 4);
                        return (
                          <div key={i} className="relative flex flex-col items-center gap-3">
                            <div className={`w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-colors ${isActive ? 'bg-blue-500' : 'bg-slate-200'} ${isCurrent ? 'ring-4 ring-blue-500/20' : ''}`}></div>
                            <span className={`text-xs font-bold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{loc}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-8 flex justify-center">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-full">
                        <Navigation className="w-4 h-4" /> Current Location: {deal.transportation.currentLocation || 'Dispatch Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Truck className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Transportation has not been arranged yet.</p>
                </div>
              )}
            </div>

            {/* Timelines and Logs */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Status History */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-slate-400"/> Status History</h4>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {[...(deal.statusHistory || [])].reverse().map((event, i) => (
                    <div key={i} className="relative flex items-center justify-normal group">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-white bg-[#16A34A] shadow shrink-0 z-10">
                        <Check className="w-3 h-3 text-white"/>
                      </div>
                      <div className="w-full ml-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-[#16A34A]/30">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-bold text-slate-900 text-sm">{event.status}</h5>
                          <time className="text-xs font-medium text-slate-500">{new Date(event.timestamp).toLocaleDateString()}</time>
                        </div>
                        <p className="text-xs text-slate-500">{event.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Log */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-sm text-white">
                <h4 className="text-lg font-bold mb-6 flex items-center gap-2"><Search className="w-5 h-5 text-slate-400"/> Audit Log</h4>
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {[...(deal.auditLog || [])].reverse().map((log, i) => (
                    <div key={i} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-emerald-400 text-xs">{log.action}</span>
                        <span className="text-slate-500 text-[10px]">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <p className="text-slate-300 text-xs">{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-8">
            
            {/* Payment Info */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" /> Payment Tracking</h3>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 text-center">
                <p className="text-sm text-slate-500 font-medium mb-1">Total Amount</p>
                <p className="text-4xl font-bold text-slate-900 mb-3">₹{deal.finalPrice * deal.quantity}</p>
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold ${getPaymentBadge(deal.payment?.status)}`}>
                  {deal.payment?.status || 'Pending'}
                </span>
              </div>

              {deal.payment?.status && deal.payment.status !== 'Pending' ? (
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-slate-500">Method</span>
                    <span className="font-bold text-slate-900">{deal.payment.method}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-3">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-bold text-slate-900">{deal.payment.transactionId}</span>
                  </div>
                  {deal.payment.proofUrl && (
                    <div className="flex justify-between border-b border-slate-100 pb-3 items-center">
                      <span className="text-slate-500">Proof Document</span>
                      <a href={deal.payment.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold text-xs flex items-center gap-1">
                        <FileText className="w-3 h-3" /> View Receipt
                      </a>
                    </div>
                  )}
                  {deal.payment.verifiedAt && (
                    <div className="flex justify-between pt-1 items-center">
                      <span className="text-slate-500">Verified At</span>
                      <span className="font-bold text-emerald-600 text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {new Date(deal.payment.verifiedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 font-medium text-sm bg-slate-50 rounded-xl border border-slate-100">
                  Payment has not been submitted yet.
                </div>
              )}
            </div>

            {/* Profile Cards */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-[#16A34A]/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <UserCheck className="w-32 h-32" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-6">{isFarmer ? 'Trader Profile' : 'Farmer Profile'}</h3>
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl font-bold text-emerald-700 shrink-0 border-2 border-emerald-200 shadow-sm">
                  {otherParty?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900">{otherParty?.name || 'Unknown User'}</h4>
                  <div className="flex items-center gap-1 text-[#16A34A] text-xs font-bold bg-[#DCFCE7] px-2 py-1 rounded w-fit mt-1 border border-emerald-200">
                    <CheckCircle className="w-3 h-3" /> Verified {isFarmer ? 'Trader' : 'Farmer'}
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-sm relative z-10">
                <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">Rating</span>
                  <span className="font-bold flex items-center gap-1 text-slate-900"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {otherParty?.rating || '4.8'}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-medium">Location</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400"/> {otherParty?.location || 'India'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
        {/* Transport Modal */}
        {showTransportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Add Transportation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Arranged By</label>
                  <select className="w-full p-3 rounded-xl border border-slate-200" value={transportForm.arrangedBy} onChange={e => setTransportForm({...transportForm, arrangedBy: e.target.value})}>
                    <option value="Trader">Trader</option>
                    <option value="Farmer">Farmer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Driver Name</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200" value={transportForm.driverName} onChange={e => setTransportForm({...transportForm, driverName: e.target.value})} placeholder="e.g. Ramesh Singh" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Vehicle Number</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200" value={transportForm.vehicleNumber} onChange={e => setTransportForm({...transportForm, vehicleNumber: e.target.value})} placeholder="e.g. UP32 AB 1234" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tracking ID</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200" value={transportForm.trackingId} onChange={e => setTransportForm({...transportForm, trackingId: e.target.value})} placeholder="e.g. TRK-001" />
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowTransportModal(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Cancel</button>
                  <button onClick={() => handleAction('transport', transportForm, 'Transport added!')} className="flex-1 p-3 bg-[#16A34A] text-white rounded-xl font-bold hover:bg-emerald-600">Submit</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><DollarSign className="w-6 h-6 text-[#16A34A]"/> Submit Payment Proof</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Payment Method</label>
                  <select className="w-full p-3 rounded-xl border border-slate-200" value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Transaction ID</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200" value={paymentForm.transactionId} onChange={e => setPaymentForm({...paymentForm, transactionId: e.target.value})} placeholder="e.g. TXN123456789" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Proof URL (Cloudinary simulation)</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200 text-sm" value={paymentForm.proofUrl} onChange={e => setPaymentForm({...paymentForm, proofUrl: e.target.value})} />
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Camera className="w-3 h-3"/> Image uploads automatically to CDN.</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowPaymentModal(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Cancel</button>
                  <button onClick={() => handleAction('payment', paymentForm, 'Payment proof submitted for verification!')} className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">Submit Proof</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><XCircle className="w-6 h-6 text-rose-500"/> Cancel Deal</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Cancellation Reason</label>
                  <textarea className="w-full p-3 rounded-xl border border-slate-200" rows={3} value={reasonForm} onChange={e => setReasonForm(e.target.value)} placeholder="Why are you cancelling this deal?"></textarea>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowCancelModal(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Keep Deal</button>
                  <button onClick={() => handleAction('cancel', { reason: reasonForm }, 'Deal Cancelled')} className="flex-1 p-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700">Confirm Cancel</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Dispute Modal */}
        {showDisputeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><AlertOctagon className="w-6 h-6 text-amber-500"/> Open Dispute</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Dispute Reason</label>
                  <textarea className="w-full p-3 rounded-xl border border-slate-200" rows={3} value={reasonForm} onChange={e => setReasonForm(e.target.value)} placeholder="e.g. Incorrect Quantity, Damaged Crop, Payment Issue"></textarea>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowDisputeModal(false)} className="flex-1 p-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200">Cancel</button>
                  <button onClick={() => handleAction('dispute', { reason: reasonForm }, 'Dispute Opened. Support will contact you.')} className="flex-1 p-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600">Submit Dispute</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default DealDetails;
