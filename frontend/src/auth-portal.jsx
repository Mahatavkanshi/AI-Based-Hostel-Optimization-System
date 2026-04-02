"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from './api';
import { credentialPresets } from './dashboard-config';

const roleMeta = {
  admin: { title: 'Admin Login', code: 'ADMIN' },
  warden: { title: 'Warden Login', code: 'WARDEN' },
  gatekeeper: { title: 'Gatekeeper Login', code: 'GATEKEEPER' },
  supervisor: { title: 'Supervisor Login', code: 'SUPERVISOR' },
  accountant: { title: 'Accountant Login', code: 'ACCOUNTANT' },
  student: { title: 'Student Login', code: 'STUDENT' },
};

const emptySignup = {
  fullName: '',
  email: '',
  phone: '',
  password: 'Student@123',
  rollNumber: '',
  registrationNumber: '',
  gender: 'MALE',
  department: 'Computer Science and Engineering',
  course: 'BTech',
  yearOfStudy: 3,
  semester: 6,
  guardianName: '',
  guardianPhone: '',
  address: '',
};

export default function AuthPortal({ roleSlug, mode = 'login' }) {
  const router = useRouter();
  const role = roleMeta[roleSlug] || roleMeta.admin;
  const preset = credentialPresets.find((item) => item.role === role.code);

  const [email, setEmail] = useState(preset?.email || '');
  const [password, setPassword] = useState(preset?.password || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [signup, setSignup] = useState(emptySignup);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [liveCaptureFile, setLiveCaptureFile] = useState(null);
  const [liveCapturePreview, setLiveCapturePreview] = useState('');
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraMessage, setCameraMessage] = useState('');
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const isStudentSignup = role.code === 'STUDENT' && mode === 'signup';

  const titleText = useMemo(() => {
    if (isStudentSignup) return 'Create student account';
    return `Access ${role.code.toLowerCase()} dashboard`;
  }, [isStudentSignup, role.code]);

  function updateSignup(field, value) {
    setSignup((current) => ({ ...current, [field]: value }));
  }

  useEffect(() => {
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  async function startCamera() {
    setError('');
    setCameraMessage('Starting camera...');
    setCameraModalOpen(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;

        await new Promise((resolve) => {
          video.onloadedmetadata = () => resolve();
        });

        await video.play();
      }

      setCameraEnabled(true);
      setCameraReady(true);
      setCameraMessage('Camera ready. Capture your live photo now.');
    } catch (cameraError) {
      setCameraEnabled(false);
      setCameraReady(false);
      setCameraModalOpen(false);
      setCameraMessage('');
      setError('Unable to access camera. Please allow camera permissions and try again.');
    }
  }

  function stopCamera(nextMessage = '', shouldCloseModal = true) {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setCameraEnabled(false);
    setCameraReady(false);
    setCameraMessage(nextMessage);
    if (shouldCloseModal) {
      setCameraModalOpen(false);
    }
  }

  function handleProfilePhotoChange(event) {
    const file = event.target.files?.[0] || null;
    setProfilePhotoFile(file);
    setProfilePhotoPreview(file ? URL.createObjectURL(file) : '');
  }

  function captureLivePhoto() {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;

    if (!cameraReady || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      setError('Camera is not ready yet. Please wait for the live preview before capturing.');
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Unable to capture live photo. Please try again.');
        return;
      }

      const file = new File([blob], `live-capture-${Date.now()}.png`, {
        type: 'image/png',
      });

      setLiveCaptureFile(file);
      setLiveCapturePreview(URL.createObjectURL(blob));
      stopCamera('Live photo captured successfully.');
    }, 'image/png');
  }

  function closeCameraModal() {
    stopCamera('', true);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('hostel-token', data.data.token);
      localStorage.setItem('hostel-user', JSON.stringify(data.data.user));
      router.push('/');
      router.refresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!profilePhotoFile) {
        throw new Error('Profile photo is required.');
      }

      if (!liveCaptureFile) {
        throw new Error('Live camera capture is required.');
      }

      const formData = new FormData();
      Object.entries(signup).forEach(([key, value]) => {
        formData.append(key, String(value ?? ''));
      });
      formData.append('profilePhoto', profilePhotoFile);
      formData.append('liveCapturePhoto', liveCaptureFile);

      const data = await apiRequest('/auth/signup/student', {
        method: 'POST',
        body: formData,
      });

      setSuccess(data.message);
      setEmail(signup.email);
      setPassword(signup.password);
      router.push('/login/student');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-shell">
      <div className="auth-page-backdrop" />
      <div className="auth-page-panel">
        <div className="auth-page-header">
          <button className="auth-back-link" type="button" onClick={() => router.push('/')}>
            Back To Landing
          </button>
          <p className="eyebrow">AI-Based Hostel Optimization System</p>
          <h1>{titleText}</h1>
          <p className="auth-page-copy">
            {isStudentSignup
              ? 'Create your student account first, then log in to access the dashboard.'
              : 'Log in with your assigned credentials and continue to your role workspace.'}
          </p>
        </div>

        <div className="auth-page-card">
          {isStudentSignup ? (
            <form className="auth-page-form auth-grid-form" onSubmit={handleSignup}>
              <label>
                <span>Full Name</span>
                <input value={signup.fullName} onChange={(event) => updateSignup('fullName', event.target.value)} />
              </label>
              <label>
                <span>Email</span>
                <input value={signup.email} onChange={(event) => updateSignup('email', event.target.value)} />
              </label>
              <label>
                <span>Phone</span>
                <input value={signup.phone} onChange={(event) => updateSignup('phone', event.target.value)} />
              </label>
              <label>
                <span>Password</span>
                <input type="password" value={signup.password} onChange={(event) => updateSignup('password', event.target.value)} />
              </label>
              <label>
                <span>Roll Number</span>
                <input value={signup.rollNumber} onChange={(event) => updateSignup('rollNumber', event.target.value)} />
              </label>
              <label>
                <span>Registration Number</span>
                <input value={signup.registrationNumber} onChange={(event) => updateSignup('registrationNumber', event.target.value)} />
              </label>
              <label>
                <span>Department</span>
                <input value={signup.department} onChange={(event) => updateSignup('department', event.target.value)} />
              </label>
              <label>
                <span>Course</span>
                <input value={signup.course} onChange={(event) => updateSignup('course', event.target.value)} />
              </label>

              <label>
                <span>Profile Photo</span>
                <input type="file" accept="image/*" onChange={handleProfilePhotoChange} />
              </label>

              <div className="capture-panel full-span-field">
                <div className="capture-panel-head">
                  <span>Student Selfie Verification</span>
                  <div className="capture-panel-actions">
                    <button type="button" className="secondary-btn" onClick={startCamera}>
                      {liveCapturePreview ? 'Retake Selfie' : 'Open Camera'}
                    </button>
                  </div>
                </div>

                {cameraMessage ? <p className="camera-helper-text">{cameraMessage}</p> : null}

                <div className="capture-grid">
                  <div className="capture-box">
                    <span>Profile Preview</span>
                    {profilePhotoPreview ? <img src={profilePhotoPreview} alt="Profile preview" /> : <div className="capture-placeholder">Upload a profile photo</div>}
                  </div>
                  <div className="capture-box">
                    <span>Captured Selfie</span>
                    {liveCapturePreview ? <img src={liveCapturePreview} alt="Live capture preview" /> : <div className="capture-placeholder">Open camera and capture your live selfie</div>}
                  </div>
                </div>
                <canvas ref={canvasRef} hidden />
              </div>

              <button className="primary-btn auth-page-submit" type="submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form className="auth-page-form" onSubmit={handleLogin}>
              <label>
                <span>Email</span>
                <input value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              <label>
                <span>Password</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              </label>

              <button className="primary-btn auth-page-submit" type="submit" disabled={loading}>
                {loading ? 'Signing In...' : 'Login'}
              </button>
            </form>
          )}

          {success ? <p className="success-text auth-feedback">{success}</p> : null}
          {error ? <p className="error-text auth-feedback">{error}</p> : null}

          {role.code === 'STUDENT' && mode === 'login' ? (
            <button className="auth-secondary-link" type="button" onClick={() => router.push('/signup/student')}>
              New student? Sign up first
            </button>
          ) : null}
        </div>
      </div>

      {cameraModalOpen ? (
        <div className="camera-modal-overlay" onClick={closeCameraModal}>
          <div className="camera-modal" onClick={(event) => event.stopPropagation()}>
            <div className="camera-modal-head">
              <div>
                <p className="eyebrow">Live Selfie Capture</p>
                <h2>Align your face and capture a clear photo</h2>
              </div>
              <button type="button" className="camera-close-btn" onClick={closeCameraModal}>
                Close
              </button>
            </div>

            <div className="camera-modal-stage">
              <div className="camera-live-frame">
                <video ref={videoRef} autoPlay playsInline muted />
                <div className="camera-face-guide" aria-hidden="true" />
              </div>

              <div className="camera-modal-side">
                <p className="camera-helper-text">{cameraMessage || 'Allow camera permission and keep your face inside the frame.'}</p>
                <ul className="camera-tips-list">
                  <li>Face the camera directly</li>
                  <li>Use proper lighting</li>
                  <li>Keep only one face in frame</li>
                </ul>

                <div className="camera-modal-actions">
                  <button type="button" className="primary-btn" onClick={captureLivePhoto} disabled={!cameraReady}>
                    {cameraReady ? 'Capture Photo' : 'Preparing Camera...'}
                  </button>
                  <button type="button" className="secondary-btn" onClick={closeCameraModal}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
