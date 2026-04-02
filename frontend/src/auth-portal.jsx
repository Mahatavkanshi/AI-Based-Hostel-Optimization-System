"use client";

import { useMemo, useState } from 'react';
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

  const isStudentSignup = role.code === 'STUDENT' && mode === 'signup';

  const titleText = useMemo(() => {
    if (isStudentSignup) return 'Create student account';
    return `Access ${role.code.toLowerCase()} dashboard`;
  }, [isStudentSignup, role.code]);

  function updateSignup(field, value) {
    setSignup((current) => ({ ...current, [field]: value }));
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
      const data = await apiRequest('/auth/signup/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signup),
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
    </div>
  );
}
