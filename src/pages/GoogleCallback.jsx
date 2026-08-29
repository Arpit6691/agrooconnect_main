import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * GoogleCallback
 * 
 * Google redirects back to /auth/google/callback with:
 *   #access_token=TOKEN&token_type=Bearer&...
 * 
 * This component extracts the token, calls the backend,
 * then shows the role selector modal for new users
 * or redirects to the appropriate dashboard.
 */
const GoogleCallback = () => {
  const navigate = useNavigate();
  const { googleLogin } = useContext(AuthContext);
  const [status, setStatus] = useState('Completing sign-in…');
  const [error, setError] = useState(null);

  // Role modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingName, setPendingName] = useState('');
  const [selectedRole, setSelectedRole] = useState('farmer');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', '?'));
    const accessToken = params.get('access_token');
    const errorParam = params.get('error');

    if (errorParam) {
      setError('Google Sign-In was cancelled or denied.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (!accessToken) {
      setError('No access token received from Google. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    // Determine if this was initiated from the register page
    const pendingRole = sessionStorage.getItem('google_pending_role') || null;
    sessionStorage.removeItem('google_pending_role');

    const completeAuth = async () => {
      try {
        setStatus('Verifying your Google account…');
        const data = await googleLogin(accessToken, pendingRole, true);

        if (data?.needsRole) {
          setPendingToken(accessToken);
          setPendingName(data.name || 'Friend');
          setShowRoleModal(true);
          return;
        }

        redirectToDashboard(data?.user?.role || pendingRole || 'farmer');
      } catch (err) {
        const msg = err.response?.data?.error || err.message || 'Google authentication failed.';
        setError(msg);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    completeAuth();
  }, []);

  const redirectToDashboard = (role) => {
    if (role === 'farmer') navigate('/farmer-dashboard');
    else if (role === 'trader') navigate('/trader-dashboard');
    else navigate('/marketplace');
  };

  const handleCompleteWithRole = async (chosenRole) => {
    if (!pendingToken) return;
    setLoading(true);
    try {
      const data = await googleLogin(pendingToken, chosenRole, true);
      setShowRoleModal(false);
      redirectToDashboard(data?.user?.role || chosenRole);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to complete signup.');
      setTimeout(() => navigate('/login'), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* Role Selection Modal */}
      {showRoleModal ? (
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 mx-4">
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-2">
              One Last Step
            </span>
            <h3 className="text-2xl font-bold text-slate-900">
              Welcome, {pendingName}!
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Please select how you want to use AgroConnect:
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => setSelectedRole('farmer')}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                selectedRole === 'farmer'
                  ? 'border-[#16A34A] bg-emerald-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-2xl ${
                selectedRole === 'farmer' ? 'bg-[#16A34A] text-white' : 'bg-slate-100'
              }`}>🌾</div>
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  I am a Farmer
                  {selectedRole === 'farmer' && (
                    <span className="text-xs bg-[#16A34A] text-white px-2 py-0.5 rounded-full font-semibold">Selected</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Sell crops directly, list harvests, connect with verified buyers.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('trader')}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                selectedRole === 'trader'
                  ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-2xl ${
                selectedRole === 'trader' ? 'bg-blue-600 text-white' : 'bg-slate-100'
              }`}>💼</div>
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  I am a Trader
                  {selectedRole === 'trader' && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">Selected</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Browse fresh produce, place offers, manage bulk agricultural deals.
                </p>
              </div>
            </button>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => handleCompleteWithRole(selectedRole)}
            className="w-full py-4 bg-[#16A34A] hover:bg-[#22C55E] text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#16A34A]/25 flex items-center justify-center gap-2 text-base disabled:opacity-60"
          >
            <span>{loading ? 'Creating Account…' : 'Continue to Dashboard →'}</span>
          </button>
        </div>
      ) : error ? (
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">❌</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Sign-In Failed</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <p className="text-xs text-slate-400">Redirecting to login…</p>
        </div>
      ) : (
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Signing you in…</h2>
          <p className="text-slate-500 text-sm">{status}</p>
        </div>
      )}
    </div>
  );
};

export default GoogleCallback;
