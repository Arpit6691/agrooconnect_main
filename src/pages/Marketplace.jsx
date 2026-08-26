import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, MapPin, Star, ChevronDown, Loader, X, Trash2, User } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedCrop, setSelectedCrop] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState('');
  const [offerLoading, setOfferLoading] = useState(false);

  const [buyCrop, setBuyCrop] = useState(null);
  const [buyPaymentMethod, setBuyPaymentMethod] = useState('Cash');
  const [buyLoading, setBuyLoading] = useState(false);

  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const { data } = await api.get('/crops');
        setCrops(data.data);
      } catch (err) {
        console.error('Error fetching crops:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCrops();
  }, []);

  const handleMakeOffer = async (e) => {
    e.preventDefault();
    setOfferLoading(true);
    try {
      await api.post('/offers', {
        cropId: selectedCrop._id,
        farmerId: selectedCrop.farmerId._id,
        offeredPrice: offerPrice,
        quantity: offerQty
      });
      alert('Offer sent successfully!');
      setSelectedCrop(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Error sending offer');
    } finally {
      setOfferLoading(false);
    }
  };

  const handleBuy = (crop) => {
    setBuyCrop(crop);
  };

  const confirmBuy = async (e) => {
    e.preventDefault();
    setBuyLoading(true);
    try {
      await api.post('/deals', {
        cropId: buyCrop._id,
        farmerId: buyCrop.farmerId._id || buyCrop.farmerId,
        finalPrice: buyCrop.price,
        quantity: buyCrop.quantity,
        paymentMethod: buyPaymentMethod
      });
      alert('Purchase successful! Deal has been created.');
      setBuyCrop(null);
      navigate('/trader-dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Error completing purchase');
    } finally {
      setBuyLoading(false);
    }
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

  const filteredCrops = crops.filter(c => {
    const matchesName = c.cropName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = c.location.toLowerCase().includes(searchLocation.toLowerCase());
    return matchesName && matchesLocation;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 relative">
      <AnimatePresence>
        {selectedCrop && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setSelectedCrop(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Make an Offer</h2>
              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-semibold text-slate-800">{selectedCrop.cropName}</p>
                <p className="text-sm text-slate-500">Asking Price: ₹{selectedCrop.price} / {selectedCrop.unit}</p>
                <p className="text-sm text-slate-500">Available: {selectedCrop.quantity} {selectedCrop.unit}</p>
              </div>
              <form onSubmit={handleMakeOffer} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Price (₹/{selectedCrop.unit})</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Quantity Required ({selectedCrop.unit})</label>
                  <input 
                    type="number" 
                    required 
                    min="1"
                    max={selectedCrop.quantity}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    value={offerQty}
                    onChange={(e) => setOfferQty(e.target.value)}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={offerLoading}
                  className="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30 mt-6"
                >
                  {offerLoading ? 'Sending...' : 'Submit Offer'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {buyCrop && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setBuyCrop(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Confirm Purchase</h2>
              
              <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2">Crop Details</h3>
                <p className="text-sm text-slate-600 font-semibold">{buyCrop.cropName}</p>
                <div className="flex justify-between text-sm text-slate-500 mt-1">
                  <span>Price: ₹{buyCrop.price} / {buyCrop.unit}</span>
                  <span>Qty: {buyCrop.quantity} {buyCrop.unit}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 mt-2 pt-2 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span>₹{(buyCrop.price * buyCrop.quantity).toFixed(2)}</span>
                </div>
              </div>

              <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-2">Farmer Details</h3>
                <p className="text-sm text-slate-600 font-semibold">{buyCrop.farmerId?.name}</p>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3"/> {buyCrop.location}</p>
                <p className="text-sm text-slate-500 mt-1">Village: {buyCrop.farmerId?.village || 'N/A'}</p>
                <p className="text-sm text-slate-500">Rating: {buyCrop.farmerId?.rating || 'New'} <Star className="w-3 h-3 inline text-yellow-400 fill-yellow-400 mb-1"/></p>
              </div>

              <form onSubmit={confirmBuy} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                  <select 
                    value={buyPaymentMethod}
                    onChange={(e) => setBuyPaymentMethod(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="Cash">Cash on Delivery</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  disabled={buyLoading}
                  className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-500/30 mt-6"
                >
                  {buyLoading ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Crop Marketplace</h1>
          <p className="text-slate-500 mt-1">Discover premium crops directly from verified farmers.</p>
        </div>
        
        <div className="flex w-full md:w-auto gap-4 flex-col md:flex-row">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search crops..." 
              className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative flex-grow md:w-64">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by location..." 
              className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
          <Loader className="w-6 h-6 animate-spin" /> Loading crops...
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCrops.map((crop, idx) => {
            const currentUserId = user?._id || user?.id;
            const cropFarmerId = crop.farmerId?._id || crop.farmerId;
            const isOwner = Boolean(
              currentUserId &&
              cropFarmerId &&
              String(currentUserId) === String(cropFarmerId)
            );

            return (
              <motion.div 
                key={crop._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                  <img src={crop.images && crop.images.length > 0 ? crop.images[0] : 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80'} alt={crop.cropName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-slate-900 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {crop.farmerId?.rating || 'New'}
                  </div>
                  {isOwner && (
                    <div className="absolute top-4 left-4 z-20 bg-[#16A34A] text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      Your Listing
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900">{crop.cropName}</h3>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#16A34A]">₹{crop.price}</p>
                      <p className="text-xs text-slate-500">per {crop.unit}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <p className="text-slate-600 flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{crop.farmerId?.name?.charAt(0) || 'F'}</span>
                      {crop.farmerId?.name || 'Unknown Farmer'}
                    </p>
                    <p className="text-slate-500 flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-[#16A34A]" /> {crop.location}
                    </p>
                    <p className="text-slate-500 flex items-center gap-2 text-sm">
                      <span className="font-medium">Qty Available:</span> {crop.quantity} {crop.unit}
                    </p>
                  </div>
                  
                  {isOwner ? (
                    /* Only the farmer who created this listing can delete it */
                    <button 
                      onClick={() => handleDeleteCrop(crop._id)}
                      className="w-full py-3 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-rose-100"
                    >
                      <Trash2 className="w-4 h-4" /> Delete My Listing
                    </button>
                  ) : user?.role === 'trader' ? (
                    /* Traders can Buy or Make Offer */
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleBuy(crop)}
                        className="flex-1 py-3 bg-green-50 text-green-700 hover:bg-[#16A34A] hover:text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-green-100"
                      >
                        Buy 
                      </button>
                      <button 
                        onClick={() => setSelectedCrop(crop)}
                        className="flex-1 py-3 bg-emerald-50 text-emerald-700 hover:bg-[#16A34A] hover:text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-1 border border-emerald-100"
                      >
                        Make Offer <ChevronDown className="w-4 h-4 -rotate-90" />
                      </button>
                    </div>
                  ) : user?.role === 'farmer' ? (
                    /* Other Farmers cannot delete someone else's crop */
                    <div className="w-full py-3 bg-slate-50 text-slate-600 rounded-xl text-sm font-medium text-center border border-slate-100 flex items-center justify-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" /> Listed by {crop.farmerId?.name || 'Farmer'}
                    </div>
                  ) : (
                    /* Logged out visitor */
                    <button 
                      onClick={() => navigate('/login')}
                      className="w-full py-3 bg-emerald-50 text-emerald-700 hover:bg-[#16A34A] hover:text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 border border-emerald-100"
                    >
                      Log in to Buy or Offer
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Marketplace;
