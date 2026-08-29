import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const GOOGLE_SCOPES = 'openid email profile';

const GoogleAuthButton = ({ role = null, text = 'continue_with', onError, onSuccess }) => {
  const { googleLogin } = useContext(AuthContext);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSignIn = () => {
    if (!clientId) {
      // Dev-only fallback when VITE_GOOGLE_CLIENT_ID is not set
      if (onError) onError('Google Client ID not configured (development mode).');
      return;
    }

    // Save the intended role in sessionStorage so GoogleCallback can use it
    if (role) {
      sessionStorage.setItem('google_pending_role', role);
    } else {
      sessionStorage.removeItem('google_pending_role');
    }

    // Build Google OAuth URL — redirect back to /auth/google/callback
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'token',      // implicit grant — returns access_token in URL hash
      scope: GOOGLE_SCOPES,
      prompt: 'select_account',    // ALWAYS show the account picker
      include_granted_scopes: 'true',
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    // Navigate to Google — will redirect back to /auth/google/callback
    window.location.href = googleAuthUrl;
  };

  const label =
    text === 'signup_with'
      ? 'Sign up with Google'
      : text === 'signin_with'
      ? 'Sign in with Google'
      : 'Continue with Google';

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold rounded-2xl shadow-sm transition-all text-sm hover:-translate-y-0.5 active:translate-y-0"
    >
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
      <span>{label}</span>
    </button>
  );
};

export default GoogleAuthButton;
