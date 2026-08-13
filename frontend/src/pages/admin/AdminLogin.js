import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ADMIN_ROUTE = process.env.REACT_APP_ADMIN_ROUTE || 'admin';

/**
 * This page is reachable ONLY at /:ADMIN_ROUTE_SECRET/login - it is never
 * linked from the homepage, citizen, or officer surfaces. The route slug
 * itself is just obscurity; real access control is the backend's role check
 * on the JWT (see backend/routes/adminRoutes.js).
 */
export default function AdminLogin() {
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
      if (data.user.role !== 'admin') {
        setError('Not an admin account.');
        setLoading(false);
        return;
      }
      loginWithToken(data.token, data.user);
      navigate(`/${ADMIN_ROUTE}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 400, paddingTop: 100 }}>
      <div className="card">
        <h2>Admin console</h2>
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
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
