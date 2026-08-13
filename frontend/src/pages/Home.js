import React from 'react';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Home() {
  return (
    <div>
      {/* =========================
          TOP BAR
          ========================= */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">C</span>
            CivicFix
          </div>
        </div>
      </div>

      {/* =========================
          MAIN CONTENT
          ========================= */}
      <div
        className="container"
        style={{
          paddingTop: 64,
          paddingBottom: 80,
        }}
      >
        <div
          className="grid-2"
          style={{
            alignItems: 'center',
            gap: 48,
          }}
        >
          {/* =========================
              LEFT SIDE
              ========================= */}
          <div>
            <span
              className="ticket"
              style={{
                marginBottom: 20,
              }}
            >
              GRV-2026-000123
            </span>

            <h1
              style={{
                fontSize: '2.6rem',
                lineHeight: 1.1,
                margin: '20px 0 16px',
              }}
            >
              See a pothole?
              <br />
              A broken streetlight?
              <br />
              File it. Track it. Fixed.
            </h1>

            <p
              className="muted"
              style={{
                fontSize: '1.05rem',
                maxWidth: 460,
                marginBottom: 28,
              }}
            >
              CivicFix routes your report straight to the right
              government department using automatic classification,
              with photo/video proof, your live location, and a
              tracking ID so you always know what's happening.
            </p>

            {/* =========================
                CITIZEN LOGIN CARD
                ========================= */}
            <div
              className="card"
              style={{
                maxWidth: 360,
                padding: 24,
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  marginBottom: 16,
                }}
              >
                Continue as a citizen
              </p>

              {/* Google Login */}
              <GoogleSignInButton />

              {/* OR DIVIDER */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  margin: '20px 0',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: '#ddd',
                  }}
                />

                <span
                  className="muted"
                  style={{
                    fontSize: '0.85rem',
                  }}
                >
                  OR
                </span>

                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: '#ddd',
                  }}
                />
              </div>

              {/* MANUAL LOGIN */}
              <a
                href="/citizen/login"
                style={{
                  display: 'block',
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: '#123c3a',
                  color: '#ffffff',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Login with Email / User ID
              </a>

              <p
                className="hint"
                style={{
                  marginTop: 14,
                  marginBottom: 0,
                }}
              >
                You can continue with Google or use your
                registered Email/User ID and password.
              </p>
            </div>
          </div>

          {/* =========================
              RIGHT SIDE
              ========================= */}
          <div>
            {/* CARD 1 */}
            <div
              className="card"
              style={{
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontSize: '1rem',
                }}
              >
                1. Report with proof
              </h3>

              <p
                className="muted"
                style={{
                  margin: 0,
                }}
              >
                Snap a photo or short video right in the app —
                your live location is attached automatically,
                with no need to type an address.
              </p>
            </div>

            {/* CARD 2 */}
            <div
              className="card"
              style={{
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  fontSize: '1rem',
                }}
              >
                2. Routed automatically
              </h3>

              <p
                className="muted"
                style={{
                  margin: 0,
                }}
              >
                An NLP model reads your description and sends it
                straight to the right government department —
                roads, water, electricity, sanitation and more.
              </p>
            </div>

            {/* CARD 3 */}
            <div className="card">
              <h3
                style={{
                  fontSize: '1rem',
                }}
              >
                3. Verified when fixed
              </h3>

              <p
                className="muted"
                style={{
                  margin: 0,
                }}
              >
                The assigned officer uploads a before/after photo
                when the issue is resolved, and duplicate reports
                of the same issue are merged automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}