import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function MyComplaints() {
  const [complaints, setComplaints] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/complaints/mine')
      .then(({ data }) => setComplaints(data.complaints))
      .catch(() => setError('Could not load your complaints.'));
  }, []);

  if (error) return <p className="error-text">{error}</p>;
  if (!complaints) return <p className="muted">Loading…</p>;

  if (complaints.length === 0) {
    return (
      <div className="empty-state">
        <h3>No complaints yet</h3>
        <p>When you report an issue, it'll show up here so you can track its progress.</p>
        <Link to="/citizen/new" className="btn btn-primary">
          Report your first issue
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2>My complaints</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
        {complaints.map((c) => (
          <div key={c._id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {c.beforeMedia?.[0] && c.beforeMedia[0].type === 'photo' && (
              <img
                src={`${FILE_BASE_URL}${c.beforeMedia[0].url}`}
                alt=""
                style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <strong>{c.title}</strong>
                <StatusBadge status={c.status} />
              </div>
              <p className="muted" style={{ margin: '0 0 6px', fontSize: '0.9rem' }}>
                {c.department?.name || 'Awaiting classification'} · Filed {new Date(c.createdAt).toLocaleDateString()}
              </p>
              <span className="ticket" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                {c.trackingId}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
