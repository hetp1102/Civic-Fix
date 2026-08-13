import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function OfficerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== 'officer') {
        setError('This portal is for government officers only.');
        setLoading(false);
        return;
      }
      loginWithToken(data.token, data.user);
      navigate('/officer');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: 90 }}>
      <Link to="/" className="brand" style={{ marginBottom: 30, display: 'inline-flex' }}>
        <span className="brand-mark">C</span>
        CivicFix
      </Link>
      <div className="card">
        <h2>Officer sign-in</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          Government officer accounts are created by your department administrator. Contact your
          admin if you don't have credentials yet.
        </p>
        <form onSubmit={submit}>
          <div className="field">
            <label>Work email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
