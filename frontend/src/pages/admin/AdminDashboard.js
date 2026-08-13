import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge';

const TABS = ['Overview', 'Complaints', 'Departments', 'Officers', 'Users'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" style={{ background: 'var(--urgent)', color: '#fff' }}>
              A
            </span>
            CivicFix — Admin console
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              {user?.name}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 60 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button key={t} className={tab === t ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' && <Overview />}
        {tab === 'Complaints' && <ComplaintsPanel />}
        {tab === 'Departments' && <DepartmentsPanel />}
        {tab === 'Officers' && <OfficersPanel />}
        {tab === 'Users' && <UsersPanel />}
      </div>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data));
  }, []);
  if (!stats) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="grid-2">
        <div className="card">
          <p className="muted" style={{ marginBottom: 4 }}>
            Total complaints
          </p>
          <h2 style={{ margin: 0 }}>{stats.total}</h2>
        </div>
        <div className="card">
          <p className="muted" style={{ marginBottom: 4 }}>
            Duplicate reports auto-merged
          </p>
          <h2 style={{ margin: 0 }}>{stats.duplicatesBlocked}</h2>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h4>By status</h4>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {stats.byStatus.map((s) => (
            <div key={s._id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <StatusBadge status={s._id} /> <span className="muted">{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h4>By department</h4>
        {stats.byDept.map((d) => (
          <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
            <span>{d.name}</span>
            <strong>{d.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComplaintsPanel() {
  const [complaints, setComplaints] = useState([]);
  const [status, setStatus] = useState('');

  const load = () => {
    api.get('/admin/complaints', { params: status ? { status } : {} }).then(({ data }) => setComplaints(data.complaints));
  };
  useEffect(load, [status]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'submitted', 'assigned', 'in_progress', 'resolved', 'rejected', 'duplicate'].map((s) => (
          <button key={s} className={status === s ? 'btn btn-primary' : 'btn btn-outline'} onClick={() => setStatus(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {complaints.map((c) => (
          <div key={c._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{c.title}</strong>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                {c.trackingId} · {c.citizen?.name} · {c.department?.name || 'Unclassified'} · officer:{' '}
                {c.assignedOfficer?.name || 'unassigned'}
              </p>
            </div>
            <StatusBadge status={c.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function DepartmentsPanel() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', keywords: '' });

  const load = () => api.get('/admin/departments').then(({ data }) => setDepartments(data.departments));
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    await api.post('/admin/departments', {
      name: form.name,
      code: form.code,
      keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
    });
    setForm({ name: '', code: '', keywords: '' });
    load();
  };

  return (
    <div className="grid-2">
      <div>
        <h4>Departments</h4>
        {departments.map((d) => (
          <div key={d._id} className="card" style={{ marginBottom: 10 }}>
            <strong>{d.name}</strong> <span className="muted">({d.code})</span>
            <p className="muted" style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>
              Keywords: {(d.keywords || []).join(', ') || '—'}
            </p>
          </div>
        ))}
      </div>
      <div>
        <h4>Add department</h4>
        <form className="card" onSubmit={create}>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>Code (short, uppercase)</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div className="field">
            <label>Keywords (comma-separated, boosts NLP routing)</label>
            <input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
          </div>
          <button className="btn btn-primary">Create department</button>
        </form>
      </div>
    </div>
  );
}

function OfficersPanel() {
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', departmentId: '' });
  const [msg, setMsg] = useState('');

  const load = () => {
    api.get('/admin/departments').then(({ data }) => setDepartments(data.departments));
    api.get('/admin/users', { params: { role: 'officer' } }).then(({ data }) => setOfficers(data.users));
  };
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api.post('/admin/officers', form);
      setMsg('Officer account created.');
      setForm({ name: '', email: '', password: '', departmentId: '' });
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to create officer.');
    }
  };

  return (
    <div className="grid-2">
      <div>
        <h4>Officers</h4>
        {officers.map((o) => (
          <div key={o._id} className="card" style={{ marginBottom: 10 }}>
            <strong>{o.name}</strong> <span className="muted">({o.email})</span>
            <p className="muted" style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>
              {o.department?.name || 'No department'} · {o.isActive ? 'Active' : 'Disabled'}
            </p>
          </div>
        ))}
      </div>
      <div>
        <h4>Create officer account</h4>
        <p className="hint">
          There is no public officer sign-up — accounts are provisioned here only.
        </p>
        <form className="card" onSubmit={create}>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field">
            <label>Work email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="field">
            <label>Temporary password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label>Department</label>
            <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} required>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          {msg && <p className="hint">{msg}</p>}
          <button className="btn btn-primary">Create officer</button>
        </form>
      </div>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState([]);
  const load = () => api.get('/admin/users').then(({ data }) => setUsers(data.users));
  useEffect(load, []);

  const toggle = async (id, isActive) => {
    await api.patch(`/admin/users/${id}/status`, { isActive: !isActive });
    load();
  };

  return (
    <div>
      <h4>All accounts</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {users.map((u) => (
          <div key={u._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{u.name}</strong> <span className="muted">({u.email})</span>
              <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                {u.role} {u.department ? `· ${u.department.name}` : ''}
              </p>
            </div>
            <button className={u.isActive ? 'btn btn-danger' : 'btn btn-outline'} onClick={() => toggle(u._id, u.isActive)}>
              {u.isActive ? 'Disable' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
