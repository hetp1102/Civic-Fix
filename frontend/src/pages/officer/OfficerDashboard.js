import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

export default function OfficerDashboard() {
  const [complaints, setComplaints] = useState(null);
  const [filter, setFilter] = useState('');
  const { user } = useAuth();

  const load = () => {
    api
      .get('/officer/complaints', { params: filter ? { status: filter } : {} })
      .then(({ data }) => setComplaints(data.complaints));
  };

  useEffect(load, [filter]);

  return (
    <div>
      <h2>{user?.department?.name || 'Department'} queue</h2>
      <p className="muted" style={{ marginBottom: 20 }}>
        Complaints routed to your department by the classifier, sorted by priority and how many
        citizens reported the same issue.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['', 'submitted', 'assigned', 'in_progress', 'resolved'].map((s) => (
          <button
            key={s}
            className={filter === s ? 'btn btn-primary' : 'btn btn-outline'}
            onClick={() => setFilter(s)}
          >
            {s || 'All open'}
          </button>
        ))}
      </div>

      {!complaints ? (
        <p className="muted">Loading…</p>
      ) : complaints.length === 0 ? (
        <div className="empty-state">
          <h3>Queue is empty</h3>
          <p>Nothing matches this filter right now.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {complaints.map((c) => (
            <Link
              to={`/officer/complaints/${c._id}`}
              key={c._id}
              className="card"
              style={{ display: 'flex', gap: 16, alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
            >
              {c.beforeMedia?.[0]?.type === 'photo' && (
                <img
                  src={`${FILE_BASE_URL}${c.beforeMedia[0].url}`}
                  alt=""
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{c.title}</strong>
                  <StatusBadge status={c.status} />
                </div>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>
                  {c.citizen?.name} · {c.trackingId}
                  {c.duplicateReports > 0 && ` · confirmed by ${c.duplicateReports} more citizen(s)`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
