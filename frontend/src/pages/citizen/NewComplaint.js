import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import EvidenceCapture from '../../components/EvidenceCapture';

export default function NewComplaint() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState({ files: [], location: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!evidence.location) {
      setError('We need your live location before this can be submitted. Please allow location access.');
      return;
    }
    if (evidence.files.length === 0) {
      setError('Please attach at least one photo or video of the issue.');
      return;
    }

    const form = new FormData();
    form.append('title', title);
    form.append('description', description);
    form.append('lat', evidence.location.lat);
    form.append('lng', evidence.location.lng);
    form.append('accuracy', evidence.location.accuracy);
    evidence.files.forEach((f) => form.append('media', f.blob, f.name));

    setSubmitting(true);
    try {
      const { data } = await api.post('/complaints', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="card" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <h2>{result.linkedTo ? 'Linked to an existing report' : 'Grievance submitted'}</h2>
        <p className="muted">{result.message}</p>
        <div style={{ margin: '20px 0' }}>
          <span className="ticket">{result.complaint.trackingId}</span>
        </div>
        <p className="hint">Save this tracking ID, or find it any time under "My complaints".</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button className="btn btn-outline" onClick={() => navigate('/citizen')}>
            View my complaints
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setResult(null);
              setTitle('');
              setDescription('');
              setEvidence({ files: [], location: evidence.location });
            }}
          >
            Report another issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Report an issue</h2>
      <p className="muted" style={{ marginBottom: 24 }}>
        Describe what's wrong — our system automatically routes it to the right department.
      </p>

      <form onSubmit={submit} className="card" style={{ maxWidth: 640 }}>
        <div className="field">
          <label>Short title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Large pothole outside 12 MG Road"
            required
          />
        </div>
        <div className="field">
          <label>Describe the issue</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the problem, and how is it affecting you or others nearby?"
            required
          />
        </div>

        <EvidenceCapture onChange={setEvidence} />

        {error && <p className="error-text">{error}</p>}

        <button className="btn btn-primary btn-block" disabled={submitting} style={{ marginTop: 8 }}>
          {submitting ? 'Submitting…' : 'Submit grievance'}
        </button>
      </form>
    </div>
  );
}
