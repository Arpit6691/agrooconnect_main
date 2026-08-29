import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email.trim().toLowerCase(), password);
      // Redirect based on role
      const userRole = data?.user?.role;
      if (userRole === 'farmer') {
        navigate('/farmer-dashboard');
      } else if (userRole === 'trader') {
        navigate('/trader-dashboard');
      } else {
        navigate('/marketplace');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6 bg-slate-50/50">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-md border border-slate-100 my-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-[#16A34A] shadow-sm">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to your AgroConnect account</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm mb-6 border border-rose-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                required
                className="w-full pl-11 pr-4 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#16A34A] focus:border-transparent outline-none transition-all text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type={showPassword ? 'text' : 'password'} 
                required
                className="w-full pl-11 pr-11 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#16A34A] focus:border-transparent outline-none transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#16A34A] hover:bg-[#22C55E] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#16A34A]/25 mt-6 text-base hover:-translate-y-0.5"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
              Or continue with
            </span>
          </div>
        </div>

        <GoogleAuthButton 
          text="signin_with"
          onError={(err) => setError(err)}
        />

        <p className="text-center text-slate-500 text-sm mt-8">
          Don't have an account? <Link to="/register" className="text-[#16A34A] font-bold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

