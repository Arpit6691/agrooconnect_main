import { useState, useEffect, useContext } from 'react';
import { Users, AlertTriangle, ShieldCheck, TrendingUp, Search, Ban } from 'lucide-react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalListings: 0, totalDeals: 0, totalRevenue: 0 });
  const [usersList, setUsersList] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, complaints
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }

    const fetchAdminData = async () => {
      try {
        const [analyticsRes, usersRes, complaintsRes] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/admin/users'),
          api.get('/complaints')
        ]);
        setStats(analyticsRes.data.data);
        setUsersList(usersRes.data.data);
        setComplaints(complaintsRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, navigate]);

  const handleBlockUser = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/block`);
      setUsersList(usersList.map(u => u._id === userId ? res.data.data : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateComplaint = async (complaintId, status) => {
    try {
      const res = await api.put(`/complaints/${complaintId}/status`, { status });
      setComplaints(complaints.map(c => c._id === complaintId ? res.data.data : c));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Control Panel</h1>
          <p className="text-slate-500 mt-2">Manage users, monitor platform activity, and resolve complaints.</p>
        </div>
      </div>

      <div className="flex space-x-4 border-b border-slate-200 mb-8">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Users & Moderation
        </button>
        <button 
          onClick={() => setActiveTab('complaints')}
          className={`py-2 px-4 font-semibold border-b-2 transition-colors ${activeTab === 'complaints' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Complaints & Support
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Total Users</span>
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-900">{stats.totalUsers}</h3>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Total Revenue</span>
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-900">${stats.totalRevenue.toLocaleString()}</h3>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Active Listings</span>
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <Search className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-3xl font-bold text-slate-900">{stats.totalListings}</h3>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Platform Health</span>
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-xl font-bold text-emerald-600">Optimal</h3>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">User Moderation</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-4 font-semibold text-sm text-slate-600">Name</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Email</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Role</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Status</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-900">{u.name}</td>
                    <td className="p-4 text-sm text-slate-500">{u.email}</td>
                    <td className="p-4 text-sm text-slate-500 capitalize">{u.role}</td>
                    <td className="p-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {u.role === 'blocked' ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <button 
                        onClick={() => handleBlockUser(u._id)}
                        className={`p-2 rounded-full transition-colors ${u.role === 'blocked' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-500 hover:bg-red-50'}`}
                      >
                        {u.role === 'blocked' ? <ShieldCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h2 className="text-lg font-bold text-slate-900">Complaints & Tickets</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {complaints.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No complaints reported.</div>
            ) : (
              complaints.map((c) => (
                <div key={c._id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900">{c.subject}</h3>
                      <p className="text-xs text-slate-500 mt-1">Reported by: {c.userId?.name || 'Unknown'} • {new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <select 
                      value={c.status}
                      onChange={(e) => handleUpdateComplaint(c._id, e.target.value)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border outline-none ${c.status === 'Resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}
                    >
                      <option value="Open">Open</option>
                      <option value="In Review">In Review</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100">{c.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
