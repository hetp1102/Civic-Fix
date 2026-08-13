import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';

// Citizen pages
import CitizenLogin from './pages/citizen/CitizenLogin';
import CitizenLayout from './pages/citizen/CitizenLayout';
import MyComplaints from './pages/citizen/MyComplaints';
import NewComplaint from './pages/citizen/NewComplaint';
import TrackComplaint from './pages/citizen/TrackComplaint';

// Officer pages
import OfficerLogin from './pages/officer/OfficerLogin';
import OfficerLayout from './pages/officer/OfficerLayout';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import ComplaintDetail from './pages/officer/ComplaintDetail';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

import ProtectedRoute from './components/ProtectedRoute';

/*
 * Hidden Admin URL
 * The actual access control is still handled by ProtectedRoute
 * and the backend JWT role check.
 */
const ADMIN_ROUTE =
  process.env.REACT_APP_ADMIN_ROUTE || 'admin';

/*
 * Hidden Officer URL
 * There is intentionally no public link to this URL.
 */
const OFFICER_ROUTE =
  process.env.REACT_APP_OFFICER_ROUTE || 'officer-7x9k2m-panel';

export default function App() {
  return (
    <Routes>

      {/* =====================================================
          HOME
          ===================================================== */}

      <Route
        path="/"
        element={<Home />}
      />


      {/* =====================================================
          CITIZEN LOGIN
          Public route
          ===================================================== */}

      <Route
        path="/citizen/login"
        element={<CitizenLogin />}
      />


      {/* =====================================================
          CITIZEN SURFACE
          Only users with role = citizen can access
          ===================================================== */}

      <Route
        path="/citizen"
        element={
          <ProtectedRoute
            allow={['citizen']}
            redirectTo="/citizen/login"
          >
            <CitizenLayout />
          </ProtectedRoute>
        }
      >
        {/* /citizen */}
        <Route
          index
          element={<MyComplaints />}
        />

        {/* /citizen/new */}
        <Route
          path="new"
          element={<NewComplaint />}
        />

        {/* /citizen/track */}
        <Route
          path="track"
          element={<TrackComplaint />}
        />
      </Route>


      {/* =====================================================
          HIDDEN OFFICER LOGIN
          
          Officer login is NOT linked from Home or Citizen pages.

          Example:
          http://localhost:3000/officer-7x9k2m-panel/login
          ===================================================== */}

      <Route
        path={`/${OFFICER_ROUTE}/login`}
        element={<OfficerLogin />}
      />


      {/* =====================================================
          OFFICER SURFACE
          Only users with role = officer can access
          ===================================================== */}

      <Route
        path="/officer"
        element={
          <ProtectedRoute
            allow={['officer']}
            redirectTo={`/${OFFICER_ROUTE}/login`}
          >
            <OfficerLayout />
          </ProtectedRoute>
        }
      >
        {/* /officer */}
        <Route
          index
          element={<OfficerDashboard />}
        />

        {/* /officer/complaints/:id */}
        <Route
          path="complaints/:id"
          element={<ComplaintDetail />}
        />
      </Route>


      {/* =====================================================
          HIDDEN ADMIN LOGIN
          
          Example:
          http://localhost:3000/ctrl-9f3a7b2e-panel/login
          ===================================================== */}

      <Route
        path={`/${ADMIN_ROUTE}/login`}
        element={<AdminLogin />}
      />


      {/* =====================================================
          ADMIN SURFACE
          Only users with role = admin can access
          ===================================================== */}

      <Route
        path={`/${ADMIN_ROUTE}`}
        element={
          <ProtectedRoute
            allow={['admin']}
            redirectTo={`/${ADMIN_ROUTE}/login`}
          >
            <AdminDashboard />
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          FALLBACK
          Any unknown URL returns to Home
          ===================================================== */}

      <Route
        path="*"
        element={<Home />}
      />

    </Routes>
  );
}