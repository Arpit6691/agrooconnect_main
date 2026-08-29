import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'farmer',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register(formData);
      // Redirect based on role
      const role = data.user?.role || formData.role;
      if (role === 'farmer') navigate('/farmer-dashboard');
      else if (role === 'trader') navigate('/trader-dashboard');
      else navigate('/marketplace');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-md border border-slate-100 my-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-4">
            <Leaf className="w-6 h-6 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
          <p className="text-slate-500 text-sm mt-1">Join the AgroConnect ecosystem</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm mb-6 border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <button 
              type="button"
              onClick={() => setFormData({...formData, role: 'farmer'})}
              className={`py-3 rounded-xl font-medium border transition-colors ${formData.role === 'farmer' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              I'm a Farmer
            </button>
            <button 
              type="button"
              onClick={() => setFormData({...formData, role: 'trader'})}
              className={`py-3 rounded-xl font-medium border transition-colors ${formData.role === 'trader' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              I'm a Trader
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                name="name"
                required
                className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                name="email"
                required
                className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                name="password"
                required
                minLength="6"
                className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="tel" 
                name="phone"
                className="w-full pl-10 p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg shadow-primary-500/30 mt-6"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
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
          role={formData.role}
          text="signup_with"
          onError={(err) => setError(err)}
        />

        <p className="text-center text-slate-500 text-sm mt-8">
          Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
