import React, { useEffect, useRef, useState } from 'react';

/**
 * Captures live-location + photo/video evidence for a grievance.
 *
 * - Location: requested via navigator.geolocation as soon as the component
 *   mounts, so the coordinates attached to the report are the citizen's
 *   actual position at the time of filing (not a manually-typed address).
 * - Photo/video: uses the device camera through getUserMedia + MediaRecorder
 *   where available (desktop/mobile browsers with camera permission), and
 *   falls back to a native file input with capture="environment" on devices
 *   where that API isn't supported, which still opens the camera app on
 *   mobile.
 *
 * Reports captured files + location up via onChange({ files, location }).
 */
export default function EvidenceCapture({ onChange }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [files, setFiles] = useState([]); // { blob, url, type, name }

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported on this device/browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => setLocationError('Location access denied. Please enable it to file a report.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    onChange?.({ files, location });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, location]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch (err) {
      alert('Could not access camera. You can still attach files below.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCameraOn(false);
  };

  const addFile = (blob, type, name) => {
    const url = URL.createObjectURL(blob);
    setFiles((prev) => [...prev, { blob, url, type, name }]);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => addFile(blob, 'photo', `photo-${Date.now()}.jpg`), 'image/jpeg', 0.9);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
    recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      addFile(blob, 'video', `video-${Date.now()}.webm`);
    };
    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleFilePicker = (e) => {
    Array.from(e.target.files).forEach((f) => {
      const type = f.type.startsWith('video') ? 'video' : 'photo';
      addFile(f, type, f.name);
    });
    e.target.value = '';
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="field">
        <label>Live location</label>
        {location ? (
          <p className="hint" style={{ fontFamily: 'var(--font-mono)' }}>
            {location.lat.toFixed(6)}, {location.lng.toFixed(6)} (±{Math.round(location.accuracy)}m)
          </p>
        ) : locationError ? (
          <p className="error-text">{locationError}</p>
        ) : (
          <p className="hint">Fetching your current location…</p>
        )}
      </div>

      <div className="field">
        <label>Photo / video evidence</label>

        {!cameraOn ? (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-outline" onClick={startCamera}>
              Open camera
            </button>
            <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
              Upload from device
              <input
                type="file"
                accept="image/*,video/*"
                capture="environment"
                multiple
                onChange={handleFilePicker}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        ) : (
          <div className="card" style={{ padding: 10 }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: 8, background: '#000' }} />
            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={capturePhoto}>
                📷 Take photo
              </button>
              {!isRecording ? (
                <button type="button" className="btn btn-outline" onClick={startRecording}>
                  ● Record video
                </button>
              ) : (
                <button type="button" className="btn btn-danger" onClick={stopRecording}>
                  ■ Stop recording
                </button>
              )}
              <button type="button" className="btn btn-ghost" onClick={stopCamera}>
                Close camera
              </button>
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            {files.map((f, idx) => (
              <div key={idx} style={{ position: 'relative', width: 100 }}>
                {f.type === 'photo' ? (
                  <img src={f.url} alt="evidence" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <video src={f.url} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} muted />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  aria-label="Remove"
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    background: 'var(--urgent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
