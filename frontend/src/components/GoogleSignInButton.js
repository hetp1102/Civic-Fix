import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/**
 * Renders Google's own "Continue with Google" button using Google Identity
 * Services (loaded via the <script> tag in public/index.html). On success it
 * sends the ID token credential to POST /api/auth/google, which creates the
 * citizen account on first login ("register or login with Google").
 */
export default function GoogleSignInButton() {
  const divRef = useRef(null);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    const handleCredentialResponse = async (response) => {
      try {
        const { data } = await api.post('/auth/google', { credential: response.credential });
        loginWithToken(data.token, data.user);
        navigate('/citizen');
      } catch (err) {
        alert(err.response?.data?.message || 'Google sign-in failed. Please try again.');
      }
    };

    const tryInit = () => {
      if (!window.google || !divRef.current) return false;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 280,
      });
      return true;
    };

    if (!tryInit()) {
      const interval = setInterval(() => {
        if (tryInit()) clearInterval(interval);
      }, 300);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div ref={divRef} />
      {!process.env.REACT_APP_GOOGLE_CLIENT_ID && (
        <p className="hint" style={{ color: 'var(--urgent)' }}>
          Set REACT_APP_GOOGLE_CLIENT_ID in frontend/.env to enable Google sign-in.
        </p>
      )}
    </div>
  );
}
