# CivicFix — Government Grievance Redressal System (MERN)

Report civic issues (potholes, broken streetlights, water leaks, garbage,
etc.) with photo/video proof and live location, get them auto-routed to the
right government department, track them to resolution, and let officers close
them out with before/after proof — while duplicate reports of the same issue
are detected and merged automatically.

## Features

- **Citizen portal** (Google sign-in)
  - Register/login with Google (Google Identity Services) — no separate
    signup form; a citizen account is created on first Google sign-in.
  - Report a grievance with a live camera capture (photo **and** video) plus
    the device's live GPS location, attached automatically.
  - **My complaints** list with live status badges.
  - **Track a complaint** by tracking ID (e.g. `GRV-2026-000123`), showing
    the full status timeline and resolution photos once fixed.
  - Duplicate reports of an existing nearby issue are linked instead of
    creating a new work item, and the citizen is told so immediately.
- **Officer portal** (separate email/password login, accounts created only by
  an admin — no public officer signup)
  - Department-scoped queue, sorted by priority and how many citizens
    confirmed the same issue.
  - Claim a complaint, move it through in-progress/rejected, and mark it
    **resolved** by uploading after-photos — before/after evidence is shown
    side-by-side.
- **Hidden admin panel**
  - Not linked anywhere in the UI. Reachable only at a secret URL slug
    (`REACT_APP_ADMIN_ROUTE` / `ADMIN_ROUTE_SECRET` in the env files).
  - The very first admin account is bootstrapped from the command line
    (`npm run seed:admin`) — there is no API route that can create an admin.
  - Analytics dashboard (totals, by status, by department, duplicates
    auto-merged), full complaint oversight, department management, and
    officer account provisioning.
- **NLP department routing** — a Naive Bayes text classifier (via the
  `natural` npm package), trained on a seed corpus per department and boosted
  by admin-configurable keywords, reads the title+description and assigns a
  department automatically. Admins can correct a misclassification, which
  feeds the correction back into the model.
- **Duplicate detection** — new reports are compared against open complaints
  in the same department using geospatial proximity (MongoDB `2dsphere` +
  `$near`, default 75m radius) and text similarity (`string-similarity`)
  within a rolling time window. Matches are linked to the original ("master")
  complaint instead of spawning a duplicate work item, and the master's
  report count increases so officers can see how widely an issue is felt.

## Stack

- **MongoDB** + Mongoose
- **Express** REST API
- **React** (Create React App) + React Router
- **Node.js**
- Google Identity Services for OAuth-based sign-in
- `natural` for NLP classification, `string-similarity` for duplicate text
  matching, `multer` for evidence uploads, `jsonwebtoken` for auth.

## Project structure

```
grievance-system/
├── backend/
│   ├── config/db.js
│   ├── models/          User, Department, Complaint
│   ├── middleware/       auth.js (JWT + role guard), upload.js (multer)
│   ├── routes/           authRoutes, complaintRoutes, officerRoutes, adminRoutes
│   ├── utils/             nlpClassifier, duplicateDetector, generateTrackingId,
│   │                     seedAdmin.js, seedDepartments.js
│   ├── uploads/          before/ after/ videos/  (served at /uploads)
│   └── server.js
└── frontend/
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.js
        ├── components/    Navbar, ProtectedRoute, GoogleSignInButton,
        │                 EvidenceCapture, StatusBadge
        └── pages/
            ├── Home.js               (public homepage, Google sign-in)
            ├── citizen/              (My complaints, New complaint, Track)
            ├── officer/              (login, queue, complaint detail)
            └── admin/                (login, dashboard) — hidden route
```

## Setup

### 1. Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)
- A Google OAuth Client ID (Google Cloud Console → APIs & Services →
  Credentials → OAuth client ID → Web application). Add your frontend origin
  (e.g. `http://localhost:3000`) under **Authorized JavaScript origins**.

### 2. Backend

```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID, ADMIN_ROUTE_SECRET,
# ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD
npm install
npm run seed:departments   # creates the default department list
npm run seed:admin         # creates your one admin account
npm run dev                # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# edit .env: set REACT_APP_API_URL, REACT_APP_GOOGLE_CLIENT_ID, and
# REACT_APP_ADMIN_ROUTE to the SAME secret slug as backend's ADMIN_ROUTE_SECRET
npm install
npm start                  # starts on http://localhost:3000
```

### 4. First-time use

1. Visit `http://localhost:3000` and sign in with Google as a citizen.
2. Log in to the admin console at `http://localhost:3000/<your-admin-slug>/login`
   using the credentials from `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD`.
3. In the admin console, go to **Officers** and create an officer account for
   a department — officers log in separately at `/officer/login`.
4. Submit a grievance as the citizen, then process it as the officer.

## Security notes

- The admin panel's obscurity (secret URL) is a convenience layer only — the
  real protection is that every `/api/admin/*` route requires a valid JWT
  whose role is `admin`, and no endpoint anywhere can create an admin account
  over the network. Rotate `ADMIN_ROUTE_SECRET` per deployment.
- Officer accounts likewise have no public signup route; only an existing
  admin can create one from the admin console.
- Rate limiting is applied to `/api/auth/login` to slow down credential
  stuffing against officer/admin accounts.
- Change `JWT_SECRET` and all bootstrap credentials before deploying.

## Extending it further

- Swap the seed-corpus Bayes classifier for a hosted LLM/embedding call in
  `utils/nlpClassifier.js` if you want higher accuracy on messy, multilingual
  complaint text.
- Add SMS/email notifications on status changes (e.g. via Twilio/SendGrid) by
  hooking into the `statusHistory.push(...)` points in the officer routes.
- Add a public heatmap of open complaints using the existing `2dsphere` index
  on `Complaint.location`.
