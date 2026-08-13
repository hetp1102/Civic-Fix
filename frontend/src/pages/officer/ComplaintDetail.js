import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { FILE_BASE_URL } from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

function MediaGrid({ media }) {
  if (!media || media.length === 0) return <p className="muted">None uploaded yet.</p>;
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {media.map((m, i) =>
        m.type === 'photo' ? (
          <img key={i} src={`${FILE_BASE_URL}${m.url}`} alt="" style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 8 }} />
        ) : (
          <video key={i} src={`${FILE_BASE_URL}${m.url}`} controls style={{ width: 200, borderRadius: 8 }} />
        )
      )}
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [resolveFiles, setResolveFiles] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api
      .get(`/officer/complaints/${id}`)
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load complaint.'));
  };

  useEffect(load, [id]);

  const claim = async () => {
    setBusy(true);
    try {
      await api.patch(`/officer/complaints/${id}/claim`);
      load();
    } catch (err) {
      alert(err.response?.data?.message);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status) => {
    setBusy(true);
    try {
      await api.patch(`/officer/complaints/${id}/status`, { status, note });
      setNote('');
      load();
    } catch (err) {
      alert(err.response?.data?.message);
    } finally {
      setBusy(false);
    }
  };

  const resolve = async (e) => {
    e.preventDefault();
    if (resolveFiles.length === 0) return alert('Attach at least one after-photo.');
    const form = new FormData();
    form.append('note', note);
    resolveFiles.forEach((f) => form.append('media', f));
    setBusy(true);
    try {
      await api.post(`/officer/complaints/${id}/resolve`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNote('');
      setResolveFiles([]);
      load();
    } catch (err) {
      alert(err.response?.data?.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;

  const { complaint, linkedDuplicates } = data;
  const isMine = complaint.assignedOfficer && complaint.assignedOfficer._id === user._id;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>{complaint.title}</h2>
        <StatusBadge status={complaint.status} />
      </div>
      <span className="ticket" style={{ marginBottom: 16, display: 'inline-flex' }}>
        {complaint.trackingId}
      </span>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h4>Report details</h4>
          <p>{complaint.description}</p>
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Filed by {complaint.citizen.name} ({complaint.citizen.email}) on{' '}
            {new Date(complaint.createdAt).toLocaleString()}
          </p>
          <p className="muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            {complaint.location.coordinates[1].toFixed(6)}, {complaint.location.coordinates[0].toFixed(6)}
          </p>
          {linkedDuplicates?.length > 0 && (
            <p className="hint" style={{ background: '#eee', padding: 8, borderRadius: 6 }}>
              {linkedDuplicates.length} other citizen(s) reported the same issue nearby.
            </p>
          )}
        </div>

        <div className="card">
          <h4>Before (citizen-submitted)</h4>
          <MediaGrid media={complaint.beforeMedia} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h4>After (resolution evidence)</h4>
        <MediaGrid media={complaint.afterMedia} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h4>Actions</h4>

        {!complaint.assignedOfficer && (
          <button className="btn btn-primary" disabled={busy} onClick={claim}>
            Claim this complaint
          </button>
        )}

        {complaint.assignedOfficer && isMine && !['resolved', 'rejected'].includes(complaint.status) && (
          <>
            <div className="field" style={{ marginTop: 16 }}>
              <label>Note (optional)</label>
              <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button className="btn btn-outline" disabled={busy} onClick={() => setStatus('in_progress')}>
                Mark in progress
              </button>
              <button className="btn btn-danger" disabled={busy} onClick={() => setStatus('rejected')}>
                Reject
              </button>
            </div>

            <form onSubmit={resolve}>
              <div className="field">
                <label>Upload after-photo(s) to mark resolved</label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => setResolveFiles(Array.from(e.target.files))}
                />
              </div>
              <button className="btn btn-primary" disabled={busy}>
                Mark resolved
              </button>
            </form>
          </>
        )}

        {complaint.assignedOfficer && !isMine && (
          <p className="muted">This complaint is assigned to {complaint.assignedOfficer.name}.</p>
        )}
      </div>
    </div>
  );
}
