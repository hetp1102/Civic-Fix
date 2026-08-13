import React, { useState } from 'react';
import api, { FILE_BASE_URL } from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function TrackComplaint() {
  const [trackingId, setTrackingId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await api.get(`/complaints/track/${trackingId.trim()}`);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Complaint not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Track a complaint</h2>
      <form onSubmit={search} style={{ display: 'flex', gap: 10, maxWidth: 480, marginBottom: 30 }}>
        <input
          value={trackingId}
          onChange={(e) => setTrackingId(e.target.value)}
          placeholder="e.g. GRV-2026-000123"
          style={{
            flex: 1,
            padding: '11px 12px',
            border: '1.5px solid var(--line-strong)',
            borderRadius: 'var(--radius-sm)',
          }}
          required
        />
        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching…' : 'Track'}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {result && (
        <div className="card" style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>{result.complaint.title}</h3>
            <StatusBadge status={result.complaint.status} />
          </div>
          <p className="muted">{result.complaint.description}</p>

          {result.linkedMaster && (
            <p className="hint" style={{ background: '#eee', padding: 10, borderRadius: 6 }}>
              This report was linked to an existing case <strong>{result.linkedMaster.trackingId}</strong>{' '}
              (status: {result.linkedMaster.status}) reported by another citizen nearby.
            </p>
          )}

          <h4 style={{ marginTop: 20 }}>Timeline</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {result.complaint.statusHistory.map((h, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <StatusBadge status={h.status} />
                <span className="muted" style={{ fontSize: '0.85rem' }}>
                  {new Date(h.changedAt).toLocaleString()}
                </span>
                {h.note && <span style={{ fontSize: '0.9rem' }}>— {h.note}</span>}
              </li>
            ))}
          </ul>

          {result.complaint.afterMedia?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4>Resolution photos</h4>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {result.complaint.afterMedia.map((m, i) => (
                  <img
                    key={i}
                    src={`${FILE_BASE_URL}${m.url}`}
                    alt=""
                    style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8 }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
