"use client";

import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, apiRequest } from './api';

const credentialPresets = [
  { role: 'ADMIN', email: '22040690@coer.ac.in', password: 'Admin@123' },
  { role: 'WARDEN', email: 'warden1@coer.ac.in', password: 'Warden@123' },
  { role: 'GATEKEEPER', email: 'gatekeeper1@coer.ac.in', password: 'Gate@123' },
  { role: 'SUPERVISOR', email: 'supervisor1@coer.ac.in', password: 'Supervisor@123' },
  { role: 'ACCOUNTANT', email: 'accountant1@coer.ac.in', password: 'Account@123' },
  { role: 'STUDENT', email: 'student1@coer.ac.in', password: 'Student@123' },
];

const actionLibrary = {
  common: [
    {
      label: 'My Profile',
      method: 'GET',
      path: '/auth/me',
      body: null,
      notes: 'Shows the logged-in user profile and assigned roles.',
    },
  ],
  ADMIN: [
    {
      label: 'List Users',
      method: 'GET',
      path: '/users',
      body: null,
      notes: 'See all created users in the system.',
    },
    {
      label: 'Reference Data',
      method: 'GET',
      path: '/users/reference-data',
      body: null,
      notes: 'Fetch hostels and roles before creating staff and students.',
    },
    {
      label: 'Create Student',
      method: 'POST',
      path: '/users/students',
      body: {
        fullName: 'New Student',
        email: 'new.student@coer.ac.in',
        phone: '9100000101',
        password: 'Student@123',
        rollNumber: 'CSE2026-201',
        registrationNumber: 'REG2026-201',
        gender: 'MALE',
        department: 'Computer Science and Engineering',
        course: 'BTech',
        yearOfStudy: 3,
        semester: 6,
        guardianName: 'Guardian Name',
        guardianPhone: '9100000102',
        address: 'Roorkee, Uttarakhand',
      },
      notes: 'Edit email, roll number, and phone before sending again.',
    },
    {
      label: 'Create Warden',
      method: 'POST',
      path: '/users/staff',
      body: {
        fullName: 'New Warden',
        email: 'new.warden@coer.ac.in',
        phone: '9100000103',
        password: 'Warden@123',
        employeeId: 'EMP-WARDEN-201',
        gender: 'FEMALE',
        designation: 'Hostel Warden',
        joiningDate: '2026-04-01',
        assignedHostelId: 'REPLACE_WITH_HOSTEL_ID',
        roleCodes: ['WARDEN'],
      },
      notes: 'Get the hostel id from Reference Data and replace it before submit.',
    },
    {
      label: 'List Hostels',
      method: 'GET',
      path: '/hostels',
      body: null,
      notes: 'Shows full hostel tree with blocks, floors, rooms, and beds.',
    },
    {
      label: 'Create Hostel',
      method: 'POST',
      path: '/hostels',
      body: {
        campusId: 'REPLACE_WITH_CAMPUS_ID',
        name: 'Boys Hostel 2',
        code: 'BH-02',
        type: 'BOYS',
        capacity: 300,
        address: 'West residential zone',
      },
      notes: 'Use GET /hostels/campuses first for the campus id.',
    },
    {
      label: 'Fee Dashboard',
      method: 'GET',
      path: '/fees/dashboard',
      body: null,
      notes: 'Quick summary for invoices and collected amount.',
    },
  ],
  WARDEN: [
    {
      label: 'List Applications',
      method: 'GET',
      path: '/hostel-management/applications',
      body: null,
      notes: 'View all hostel applications waiting for review.',
    },
    {
      label: 'Review Application',
      method: 'PATCH',
      path: '/hostel-management/applications/REPLACE_WITH_APPLICATION_ID/review',
      body: { status: 'APPROVED' },
      notes: 'Change the application id and choose APPROVED, REJECTED, or WAITLISTED.',
    },
    {
      label: 'Create Allocation',
      method: 'POST',
      path: '/hostel-management/allocations',
      body: {
        applicationId: 'REPLACE_WITH_APPLICATION_ID',
        bedId: 'REPLACE_WITH_BED_ID',
        startDate: '2026-07-01',
      },
      notes: 'Allocate a bed only after the application is approved.',
    },
    {
      label: 'List Leaves',
      method: 'GET',
      path: '/leaves',
      body: null,
      notes: 'Review student leave requests.',
    },
    {
      label: 'Review Leave',
      method: 'PATCH',
      path: '/leaves/REPLACE_WITH_LEAVE_ID/review',
      body: { status: 'APPROVED' },
      notes: 'Use APPROVED, REJECTED, or RETURNED.',
    },
    {
      label: 'Review Visitor',
      method: 'PATCH',
      path: '/visitors/requests/REPLACE_WITH_REQUEST_ID/review',
      body: { status: 'APPROVED' },
      notes: 'Approve or reject visitor requests.',
    },
  ],
  GATEKEEPER: [
    {
      label: 'List Visitor Requests',
      method: 'GET',
      path: '/visitors/requests',
      body: null,
      notes: 'See approved visitor requests before check-in.',
    },
    {
      label: 'Visitor Check-In',
      method: 'POST',
      path: '/visitors/entry-logs/check-in',
      body: {
        requestId: 'REPLACE_WITH_REQUEST_ID',
        remarks: 'Verified at main gate',
      },
      notes: 'Gatekeeper records visitor arrival.',
    },
    {
      label: 'Visitor Check-Out',
      method: 'PATCH',
      path: '/visitors/entry-logs/REPLACE_WITH_ENTRY_LOG_ID/check-out',
      body: {
        remarks: 'Visitor exited campus',
      },
      notes: 'Complete visitor exit record.',
    },
    {
      label: 'List Leaves',
      method: 'GET',
      path: '/leaves',
      body: null,
      notes: 'Gatekeeper can verify approved leave requests.',
    },
  ],
  SUPERVISOR: [
    {
      label: 'List Complaints',
      method: 'GET',
      path: '/complaints',
      body: null,
      notes: 'See all maintenance and hostel complaints.',
    },
    {
      label: 'Complaint Reference Data',
      method: 'GET',
      path: '/complaints/reference-data',
      body: null,
      notes: 'Fetch assignable staff and fixed categories.',
    },
    {
      label: 'Assign Complaint',
      method: 'PATCH',
      path: '/complaints/REPLACE_WITH_COMPLAINT_ID/assign',
      body: {
        assignedToId: 'REPLACE_WITH_STAFF_PROFILE_ID',
      },
      notes: 'Assign a complaint to a staff member.',
    },
    {
      label: 'Update Complaint',
      method: 'PATCH',
      path: '/complaints/REPLACE_WITH_COMPLAINT_ID/updates',
      body: {
        message: 'Maintenance work completed successfully.',
        status: 'RESOLVED',
      },
      notes: 'Progress a complaint to RESOLVED or CLOSED.',
    },
  ],
  ACCOUNTANT: [
    {
      label: 'List Fee Structures',
      method: 'GET',
      path: '/fees/structures',
      body: null,
      notes: 'Review current fee structure setup.',
    },
    {
      label: 'Create Fee Structure',
      method: 'POST',
      path: '/fees/structures',
      body: {
        hostelId: 'REPLACE_WITH_HOSTEL_ID',
        academicYear: '2026-27',
        frequency: 'SEMESTER',
        category: 'HOSTEL_FEE',
        amount: 35000,
      },
      notes: 'Create hostel fee or deposit structure.',
    },
    {
      label: 'Generate Invoice',
      method: 'POST',
      path: '/fees/invoices',
      body: {
        studentId: 'REPLACE_WITH_STUDENT_PROFILE_ID',
        feeStructureId: 'REPLACE_WITH_FEE_STRUCTURE_ID',
        academicYear: '2026-27',
        billingSemester: 1,
        amount: 35000,
        dueDate: '2026-08-10',
      },
      notes: 'Generate a payable invoice for a student.',
    },
    {
      label: 'Fee Dashboard',
      method: 'GET',
      path: '/fees/dashboard',
      body: null,
      notes: 'See invoice and collection summary.',
    },
  ],
  STUDENT: [
    {
      label: 'My Applications',
      method: 'GET',
      path: '/hostel-management/applications',
      body: null,
      notes: 'View your hostel applications only.',
    },
    {
      label: 'Apply Hostel',
      method: 'POST',
      path: '/hostel-management/applications',
      body: {
        preferredHostelId: 'REPLACE_WITH_HOSTEL_ID',
        academicYear: '2026-27',
        reason: 'Need accommodation near department block',
      },
      notes: 'Submit hostel application from student account.',
    },
    {
      label: 'Create Leave',
      method: 'POST',
      path: '/leaves',
      body: {
        reason: 'Going home for weekend',
        fromDate: '2026-04-06',
        toDate: '2026-04-07',
      },
      notes: 'Submit a leave request to the warden.',
    },
    {
      label: 'Create Visitor',
      method: 'POST',
      path: '/visitors/requests',
      body: {
        visitDate: '2026-08-14T10:00:00.000Z',
        purpose: 'Family visit',
        visitor: {
          fullName: 'Suresh Kumar',
          phone: '9876543211',
          idProofType: 'Aadhaar',
          idProofNumber: '1234-5678-9000',
          relationToStudent: 'Father',
        },
      },
      notes: 'Create a visitor approval request.',
    },
    {
      label: 'Create Complaint',
      method: 'POST',
      path: '/complaints',
      body: {
        title: 'Fan not working',
        description: 'The fan in room 201 is not working properly.',
        category: 'ELECTRICAL',
        priority: 'HIGH',
      },
      notes: 'Raise a maintenance complaint.',
    },
    {
      label: 'My Fees',
      method: 'GET',
      path: '/fees/invoices',
      body: null,
      notes: 'Check your own invoices and payment status.',
    },
  ],
};

function formatJson(value) {
  return value === null ? '' : JSON.stringify(value, null, 2);
}

function getAvailableActions(roles) {
  const list = [...actionLibrary.common];

  roles.forEach((role) => {
    if (actionLibrary[role]) {
      list.push(...actionLibrary[role]);
    }
  });

  return list;
}

function prettyError(error) {
  return {
    message: error.message,
    status: error.status,
    payload: error.payload,
  };
}

export default function App() {
  const [email, setEmail] = useState('22040690@coer.ac.in');
  const [password, setPassword] = useState('Admin@123');
  const [token, setToken] = useState(() =>
    typeof window === 'undefined' ? '' : localStorage.getItem('hostel-token') || ''
  );
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const stored = localStorage.getItem('hostel-user');
    return stored ? JSON.parse(stored) : null;
  });
  const [selectedAction, setSelectedAction] = useState(null);
  const [requestBody, setRequestBody] = useState('');
  const [requestPath, setRequestPath] = useState('');
  const [requestMethod, setRequestMethod] = useState('GET');
  const [responseState, setResponseState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const roles = user?.roles || [];
  const actions = useMemo(() => getAvailableActions(roles), [roles]);

  useEffect(() => {
    if (!token) return;

    apiRequest('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((data) => {
        setUser(data.data);
        localStorage.setItem('hostel-user', JSON.stringify(data.data));
      })
      .catch(() => {
        logout();
      });
  }, []);

  useEffect(() => {
    if (!selectedAction && actions.length > 0) {
      handleActionSelect(actions[0]);
    }
  }, [actions]);

  function handleActionSelect(action) {
    setSelectedAction(action.label);
    setRequestMethod(action.method);
    setRequestPath(action.path);
    setRequestBody(formatJson(action.body));
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      setToken(data.data.token);
      setUser(data.data.user);
      localStorage.setItem('hostel-token', data.data.token);
      localStorage.setItem('hostel-user', JSON.stringify(data.data.user));
      setResponseState({ type: 'success', payload: data });
    } catch (error) {
      setLoginError(error.message);
      setResponseState({ type: 'error', payload: prettyError(error) });
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken('');
    setUser(null);
    setSelectedAction(null);
    setRequestBody('');
    setRequestPath('');
    setRequestMethod('GET');
    localStorage.removeItem('hostel-token');
    localStorage.removeItem('hostel-user');
  }

  async function sendRequest() {
    setLoading(true);
    setResponseState(null);

    try {
      const options = {
        method: requestMethod,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (requestMethod !== 'GET') {
        options.headers['Content-Type'] = 'application/json';
        options.body = requestBody ? requestBody : '{}';
      }

      const data = await apiRequest(requestPath, options);
      setResponseState({ type: 'success', payload: data });
    } catch (error) {
      setResponseState({ type: 'error', payload: prettyError(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <div className="backdrop backdrop-one" />
      <div className="backdrop backdrop-two" />

      <main className="app-frame">
        <section className="hero-panel">
          <div>
            <p className="eyebrow">AI-Based Hostel Optimization System</p>
            <h1>Frontend test console for every hostel role.</h1>
            <p className="hero-copy">
              This free local frontend lets you log in with any role, call backend APIs,
              inspect responses, and customize forms for your final-year project demo.
            </p>
          </div>

          <div className="meta-grid">
            <div className="meta-card">
              <span>Frontend</span>
              <strong>React + Vite</strong>
            </div>
            <div className="meta-card">
              <span>Backend API</span>
              <strong>{API_BASE_URL}</strong>
            </div>
            <div className="meta-card">
              <span>Design goal</span>
              <strong>Fast testing + easy customization</strong>
            </div>
          </div>
        </section>

        {!user ? (
          <section className="auth-layout">
            <div className="panel glass-panel">
              <div className="panel-heading">
                <p className="eyebrow">Sign In</p>
                <h2>Login with any created role</h2>
              </div>

              <form className="login-form" onSubmit={handleLogin}>
                <label>
                  <span>Email</span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>

                <label>
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>

                <button className="primary-btn" type="submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Login to Dashboard'}
                </button>

                {loginError ? <p className="error-text">{loginError}</p> : null}
              </form>
            </div>

            <div className="panel credential-panel">
              <div className="panel-heading">
                <p className="eyebrow">Quick Access</p>
                <h2>Test credentials</h2>
              </div>

              <div className="credential-grid">
                {credentialPresets.map((preset) => (
                  <button
                    className="credential-card"
                    key={preset.role}
                    onClick={() => {
                      setEmail(preset.email);
                      setPassword(preset.password);
                    }}
                    type="button"
                  >
                    <span>{preset.role}</span>
                    <strong>{preset.email}</strong>
                    <small>{preset.password}</small>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="workspace-grid">
            <aside className="panel sidebar-panel">
              <div className="panel-heading">
                <p className="eyebrow">Logged In</p>
                <h2>{user.fullName}</h2>
              </div>

              <div className="profile-card">
                <p>{user.email}</p>
                <div className="role-list">
                  {roles.map((role) => (
                    <span className="role-pill" key={role}>
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div className="action-list">
                {actions.map((action) => (
                  <button
                    key={`${action.method}-${action.path}-${action.label}`}
                    className={
                      selectedAction === action.label ? 'action-btn active' : 'action-btn'
                    }
                    onClick={() => handleActionSelect(action)}
                    type="button"
                  >
                    <span>{action.label}</span>
                    <small>
                      {action.method} {action.path}
                    </small>
                  </button>
                ))}
              </div>

              <button className="secondary-btn" type="button" onClick={logout}>
                Logout
              </button>
            </aside>

            <section className="panel console-panel">
              <div className="panel-heading">
                <p className="eyebrow">Request Builder</p>
                <h2>Customize and send API requests</h2>
              </div>

              <div className="request-bar">
                <select value={requestMethod} onChange={(e) => setRequestMethod(e.target.value)}>
                  {['GET', 'POST', 'PATCH'].map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>

                <input value={requestPath} onChange={(e) => setRequestPath(e.target.value)} />

                <button className="primary-btn" type="button" onClick={sendRequest} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
              </div>

              <div className="panel-tip">
                {actions.find((item) => item.label === selectedAction)?.notes ||
                  'Choose an action from the left and edit it as needed.'}
              </div>

              <div className="editor-grid">
                <div>
                  <label className="editor-label">JSON Body</label>
                  <textarea
                    className="json-editor"
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder="Request body appears here for POST/PATCH actions"
                  />
                </div>

                <div>
                  <label className="editor-label">Response</label>
                  <pre className={`response-view ${responseState?.type || ''}`}>
                    {responseState
                      ? JSON.stringify(responseState.payload, null, 2)
                      : 'Response will appear here after you send a request.'}
                  </pre>
                </div>
              </div>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}
