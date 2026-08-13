import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ links = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation links for each user role
  const citizenLinks = [
    { to: '/citizen', label: 'My Complaints' },
    { to: '/citizen/new', label: 'Report an Issue' },
    { to: '/citizen/track', label: 'Track Complaint' },
  ];

  const officerLinks = [
    { to: '/officer', label: 'Department Queue' },
  ];

  // Show only links belonging to the logged-in user's role
  const visibleLinks =
    user?.role === 'citizen'
      ? citizenLinks
      : user?.role === 'officer'
      ? officerLinks
      : links;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
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

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}
        >
          {visibleLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="muted"
              style={{
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              {l.label}
            </Link>
          ))}

          {user && (
            <>
              <span
                className="muted"
                style={{ fontSize: '0.85rem' }}
              >
                {user.name}
              </span>

              <button
                className="btn btn-secondary"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          )}
        </nav>

      </div>
    </div>
  );
}