import { Link, useNavigate } from 'react-router-dom';
import { Leaf, MessageSquare, LogOut, User, Bell } from 'lucide-react';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/notifications');
          setNotifications(res.data.data);
        } catch (err) {
          console.error(err);
        }
      };
      fetchNotifications();
    }
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-primary-600">
        <Leaf className="w-8 h-8" />
        <span className="text-xl font-bold tracking-tight">AgroConnect</span>
      </Link>
      
      <div className="hidden md:flex items-center gap-8 text-slate-600 font-medium">
        <Link to="/marketplace" className="hover:text-primary-600 transition-colors">Marketplace</Link>
        {(!user || user.role === 'farmer') && <Link to="/farmer-dashboard" className="hover:text-primary-600 transition-colors">Farmer Dashboard</Link>}
        {user?.role === 'farmer' && <Link to="/plant-disease-detection" className="hover:text-primary-600 transition-colors text-emerald-600 font-semibold">Plant Health</Link>}
        {(!user || user.role === 'trader') && <Link to="/trader-dashboard" className="hover:text-primary-600 transition-colors">Trader Dashboard</Link>}
        <Link to="/ai-recommendation" className="hover:text-primary-600 transition-colors text-emerald-600 font-semibold">AI Assistant</Link>
        <Link to="/weather" className="hover:text-primary-600 transition-colors text-blue-500 font-semibold">Weather</Link>
      </div>

      <div className="flex items-center gap-4 relative">
        {user ? (
          <>
            <Link to="/chat" className="p-2 text-slate-400 hover:text-primary-600 transition-colors relative">
              <MessageSquare className="w-5 h-5" />
            </Link>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-primary-600 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-900">Notifications</h3>
                    <span className="text-xs text-primary-600 font-medium">{unreadCount} New</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-sm text-slate-500">No notifications.</p>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n._id} 
                          onClick={() => handleMarkAsRead(n._id)}
                          className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!n.isRead ? 'bg-primary-50/30' : ''}`}
                        >
                          <h4 className={`text-sm ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full ml-2">
              <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                {user.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:block">{user.name.split(' ')[0]}</span>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-slate-600 hover:text-primary-600 font-medium px-4 py-2 transition-colors">Log in</Link>
            <Link to="/register" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-full font-medium transition-all shadow-lg shadow-primary-500/30">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
