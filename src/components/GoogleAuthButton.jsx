import { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sprout, Briefcase, X, ArrowRight } from 'lucide-react';

const GoogleAuthButton = ({ role = null, text = 'continue_with', onError, onSuccess }) => {
  const googleButtonRef = useRef(null);
  const { googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Role selection modal state for new Google users
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);
  const [pendingName, setPendingName] = useState('');
  const [selectedRole, setSelectedRole] = useState('farmer');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Dynamically load Google Identity Services script
  useEffect(() => {
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.warn('Google Identity Services script failed to load');
    };
    document.body.appendChild(script);
  }, []);

  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      if (onError) onError('Google login failed: no credential received.');
      return;
    }

    setLoading(true);
    try {
      // Send token with role (if role is already selected on the page)
      const data = await googleLogin(response.credential, role);

      // If this is a new user and role was not pre-selected, prompt with role modal
      if (data?.needsRole) {
        setPendingToken(data.token || response.credential);
        setPendingName(data.name || 'Friend');
        setShowRoleModal(true);
        setLoading(false);
        return;
      }

      if (onSuccess) {
        onSuccess(data);
      } else {
        const userRole = data?.user?.role || role || 'farmer';
        if (userRole === 'farmer') {
          navigate('/farmer-dashboard');
        } else if (userRole === 'trader') {
          navigate('/trader-dashboard');
        } else {
          navigate('/marketplace');
        }
      }
    } catch (err) {
      console.error('Google Auth error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Google authentication failed.';
      if (onError) onError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistrationWithRole = async (chosenRole) => {
    if (!pendingToken) return;
    setLoading(true);
    try {
      const data = await googleLogin(pendingToken, chosenRole);
      setShowRoleModal(false);

      if (onSuccess) {
        onSuccess(data);
      } else {
        const userRole = data?.user?.role || chosenRole;
        if (userRole === 'farmer') {
          navigate('/farmer-dashboard');
        } else if (userRole === 'trader') {
          navigate('/trader-dashboard');
        } else {
          navigate('/marketplace');
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Failed to complete signup with role.';
      if (onError) onError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Identity Services (without rendering the built-in button)
  useEffect(() => {
    if (!scriptLoaded || !clientId) return;
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    } catch (e) {
      console.error('Error initializing Google Identity Services:', e);
    }
  }, [scriptLoaded, clientId]);

  // Always show the account picker by using the OAuth2 popup flow with prompt=select_account
  const handleGoogleButtonClick = async () => {
    if (!clientId) {
      // Dev fallback
      setLoading(true);
      try {
        const mockToken = 'mock_google_dev_token';
        const data = await googleLogin(mockToken, role);
        if (data?.needsRole) {
          setPendingToken(mockToken);
          setPendingName('Google User');
          setShowRoleModal(true);
          setLoading(false);
          return;
        }
        const userRole = data?.user?.role || role || 'farmer';
        if (userRole === 'farmer') navigate('/farmer-dashboard');
        else if (userRole === 'trader') navigate('/trader-dashboard');
        else navigate('/marketplace');
      } catch (err) {
        const errMsg = err.response?.data?.error || err.message || 'Google authentication failed.';
        if (onError) onError(errMsg);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      if (onError) onError('Google Sign-In is not available. Please refresh the page.');
      return;
    }

    // Use OAuth2 popup so the account picker ALWAYS appears
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          if (onError) onError('Google Sign-In was cancelled or failed.');
          return;
        }
        // Exchange access token for user info, then call backend
        setLoading(true);
        try {
          const userInfoRes = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo`,
            { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
          );
          const userInfo = await userInfoRes.json();
          // Build a pseudo-credential object the backend can handle via /api/auth/google
          // We'll send the access_token so the backend can verify with Google
          const data = await googleLogin(tokenResponse.access_token, role, true);
          if (data?.needsRole) {
            setPendingToken(tokenResponse.access_token);
            setPendingName(data.name || userInfo.name || 'Friend');
            setShowRoleModal(true);
            setLoading(false);
            return;
          }
          if (onSuccess) {
            onSuccess(data);
          } else {
            const userRole = data?.user?.role || role || 'farmer';
            if (userRole === 'farmer') navigate('/farmer-dashboard');
            else if (userRole === 'trader') navigate('/trader-dashboard');
            else navigate('/marketplace');
          }
        } catch (err) {
          const errMsg = err.response?.data?.error || err.message || 'Google authentication failed.';
          if (onError) onError(errMsg);
        } finally {
          setLoading(false);
        }
      },
    });
    tokenClient.requestAccessToken();
  };

  return (
    <>
      <div className="w-full flex flex-col items-center">
        {/* Single custom button — always shows Google account picker */}
        <button
          type="button"
          onClick={handleGoogleButtonClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-2xl shadow-sm transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>
      </div>

      {/* Role Selection Modal for New Google Signups */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative">
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
              {/* Option 1: Farmer */}
              <button
                type="button"
                onClick={() => setSelectedRole('farmer')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                  selectedRole === 'farmer'
                    ? 'border-[#16A34A] bg-emerald-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedRole === 'farmer'
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Sprout className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    I am a Farmer
                    {selectedRole === 'farmer' && (
                      <span className="text-xs bg-[#16A34A] text-white px-2 py-0.5 rounded-full font-semibold">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Sell crops directly, list harvests, connect with verified buyers.
                  </p>
                </div>
              </button>

              {/* Option 2: Trader */}
              <button
                type="button"
                onClick={() => setSelectedRole('trader')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                  selectedRole === 'trader'
                    ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedRole === 'trader'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    I am a Trader
                    {selectedRole === 'trader' && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
                        Selected
                      </span>
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
              onClick={() => handleCompleteRegistrationWithRole(selectedRole)}
              className="w-full py-4 bg-[#16A34A] hover:bg-[#22C55E] text-white rounded-2xl font-bold transition-all shadow-lg shadow-[#16A34A]/25 flex items-center justify-center gap-2 text-base disabled:opacity-60"
            >
              <span>{loading ? 'Creating Account...' : 'Continue to Dashboard'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleAuthButton;
