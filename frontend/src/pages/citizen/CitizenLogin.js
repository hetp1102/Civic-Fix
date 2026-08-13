import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import { useAuth } from '../../context/AuthContext';

export default function CitizenLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email/User ID and password.');
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post('/auth/citizen-login', {
        email: email.trim(),
        password,
      });

      if (data.user?.role !== 'citizen') {
        setError('This login is only for citizen accounts.');
        return;
      }

      loginWithToken(data.token, data.user);
      navigate('/citizen');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="topbar">
        <div className="topbar-inner">
          <Link
            to="/"
            className="brand"
            style={{ textDecoration: 'none' }}
          >
            <span className="brand-mark">C</span>
            CivicFix
          </Link>
        </div>
      </div>

      <div
        className="container"
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 40,
          paddingBottom: 60,
        }}
      >
        <div
          className="card"
          style={{
            width: '100%',
            maxWidth: 460,
            padding: 32,
          }}
        >
          <h1 style={{ marginBottom: 8 }}>
            Continue as a citizen
          </h1>

          <p className="muted" style={{ marginBottom: 24 }}>
            Sign in to report issues and track your complaints.
          </p>

          <GoogleSignInButton />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '24px 0',
            }}
          >
            <div style={{ flex: 1, height: 1, background: '#ddd' }} />
            <span className="muted">OR</span>
            <div style={{ flex: 1, height: 1, background: '#ddd' }} />
          </div>

          <form onSubmit={handleLogin}>
            <label
              htmlFor="citizen-email"
              style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Email / User ID
            </label>

            <input
              id="citizen-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or User ID"
              autoComplete="username"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                marginBottom: 18,
              }}
            />

            <label
              htmlFor="citizen-password"
              style={{
                display: 'block',
                marginBottom: 8,
                fontWeight: 600,
              }}
            >
              Password
            </label>

            <input
              id="citizen-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                marginBottom: 18,
              }}
            />

            {error && (
              <div
                style={{
                  padding: 12,
                  marginBottom: 18,
                  borderRadius: 8,
                  background: '#fee2e2',
                  color: '#991b1b',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
              }}
            >
              {loading ? 'Signing in...' : 'Login as Citizen'}
            </button>
          </form>

          <p
            className="muted"
            style={{
              marginTop: 20,
              fontSize: '0.9rem',
              textAlign: 'center',
            }}
          >
            First time here? You can continue with Google to create
            your citizen account automatically.
          </p>
        </div>
      </div>
    </div>
  );
}