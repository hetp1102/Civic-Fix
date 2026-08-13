import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function CitizenLayout() {
  return (
    <div>
      <Navbar
        links={[
          { to: '/citizen', label: 'My complaints' },
          { to: '/citizen/new', label: 'Report an issue' },
          { to: '/citizen/track', label: 'Track a complaint' },
        ]}
      />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <Outlet />
      </div>
    </div>
  );
}
