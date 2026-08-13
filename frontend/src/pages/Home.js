import React from 'react';
import { Link } from 'react-router-dom';
import GoogleSignInButton from '../components/GoogleSignInButton';


export default function Home() {
 
 

  return (
    <div>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">C</span>
            CivicFix
          </div>
          
        </div>
      </div>

      <div className="container" style={{ paddingTop: 64, paddingBottom: 80 }}>
        <div className="grid-2" style={{ alignItems: 'center', gap: 48 }}>
          <div>
            <span className="ticket" style={{ marginBottom: 20 }}>
              GRV-2026-000123
            </span>
            <h1 style={{ fontSize: '2.6rem', lineHeight: 1.1, margin: '20px 0 16px' }}>
              See a pothole?
              <br />A broken streetlight?
              <br />
              File it. Track it. Fixed.
            </h1>
            <p className="muted" style={{ fontSize: '1.05rem', maxWidth: 460, marginBottom: 28 }}>
              CivicFix routes your report straight to the right government department using
              automatic classification, with photo/video proof, your live location, and a
              tracking ID so you always know what's happening.
            </p>

            <div className="card" style={{ maxWidth: 320 }}>
              <p style={{ fontWeight: 600, marginBottom: 12 }}>Continue as a citizen</p>
              <GoogleSignInButton />
              <p className="hint" style={{ marginTop: 12 }}>
                First time here? Signing in with Google creates your citizen account automatically —
                no separate registration needed.
              </p>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem' }}>1. Report with proof</h3>
              <p className="muted" style={{ margin: 0 }}>
                Snap a photo or short video right in the app — your live location is attached
                automatically, no typing an address.
              </p>
            </div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem' }}>2. Routed automatically</h3>
              <p className="muted" style={{ margin: 0 }}>
                An NLP model reads your description and sends it straight to the right
                department — roads, water, electricity, sanitation and more.
              </p>
            </div>
            <div className="card">
              <h3 style={{ fontSize: '1rem' }}>3. Verified when fixed</h3>
              <p className="muted" style={{ margin: 0 }}>
                The assigned officer uploads a before/after photo when the issue is resolved,
                and duplicate reports of the same issue are merged automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
