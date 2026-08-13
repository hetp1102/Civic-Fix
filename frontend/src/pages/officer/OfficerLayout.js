import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';

export default function OfficerLayout() {
  return (
    <div>
      <Navbar links={[{ to: '/officer', label: 'My department queue' }]} />
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <Outlet />
      </div>
    </div>
  );
}
