import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      // Wait for user to be populated in Context, but we can navigate immediately
      // A better approach is checking the role returned from login to redirect
      navigate('/marketplace');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-md border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <Leaf className="w-6 h-6 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to your AgroConnect account</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-6 border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                required
                className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <a href="#" className="text-sm text-primary-600 font-medium hover:underline">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                required
                className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30 mt-4"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-8">
          Don't have an account? <Link to="/register" className="text-primary-600 font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
