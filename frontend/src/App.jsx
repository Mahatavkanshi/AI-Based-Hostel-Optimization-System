"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, apiRequest } from './api';
import RoleDesk from './role-desk';
import {
  actionLibrary,
  credentialPresets,
  resourceLibrary,
  workspaceTabs,
} from './dashboard-config';

function formatJson(value) {
  return value === null ? '' : JSON.stringify(value, null, 2);
}

function prettyError(error) {
  return {
    message: error.message,
    status: error.status,
    payload: error.payload,
  };
}

function getAvailableItems(roles, library) {
  const result = [...(library.common || [])];
  roles.forEach((role) => {
    if (library[role]) result.push(...library[role]);
  });
  return result;
}

function getStorageValue(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
}

function countData(payload, metric) {
  const data = payload?.data;
  if (metric === 'roles') return Array.isArray(data?.roles) ? data.roles.length : 0;
  if (metric === 'count') return Array.isArray(data) ? data.length : 0;
  if (metric === 'object') return data && typeof data === 'object' ? Object.keys(data).length : 0;
  return 0;
}

function ResponsePreview({ responseState }) {
  return (
    <pre className={`response-view ${responseState?.type || ''}`}>
      {responseState
        ? JSON.stringify(responseState.payload, null, 2)
        : 'Response will appear here after you send a request.'}
    </pre>
  );
}

export default function App() {
  const router = useRouter();
  const [token, setToken] = useState(() =>
    typeof window === 'undefined' ? '' : localStorage.getItem('hostel-token') || ''
  );
  const [user, setUser] = useState(() => getStorageValue('hostel-user', null));
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedAction, setSelectedAction] = useState(null);
  const [requestBody, setRequestBody] = useState('');
  const [requestPath, setRequestPath] = useState('');
  const [requestMethod, setRequestMethod] = useState('GET');
  const [responseState, setResponseState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [healthState, setHealthState] = useState({ loading: true, ok: false, message: '' });
  const [resourceCards, setResourceCards] = useState([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourcePayload, setResourcePayload] = useState(null);

  const roles = user?.roles || [];
  const primaryRole = roles[0] || null;
  const actions = useMemo(() => getAvailableItems(roles, actionLibrary), [roles]);
  const resources = useMemo(() => getAvailableItems(roles, resourceLibrary), [roles]);

  useEffect(() => {
    apiRequest('/health')
      .then((data) => {
        setHealthState({ loading: false, ok: true, message: data.message });
      })
      .catch((error) => {
        setHealthState({ loading: false, ok: false, message: error.message });
      });
  }, []);

  useEffect(() => {
    if (!token) return;

    apiRequest('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setUser(data.data);
        localStorage.setItem('hostel-user', JSON.stringify(data.data));
      })
      .catch(() => {
        handleLogout();
      });
  }, []);

  useEffect(() => {
    if (!selectedAction && actions.length > 0) {
      handleActionSelect(actions[0]);
    }
  }, [actions, selectedAction]);

  useEffect(() => {
    if (!token || resources.length === 0) return;

    let cancelled = false;

    async function loadOverview() {
      setResourceLoading(true);
      setResourceError('');
      try {
        const cards = await Promise.all(
          resources.slice(0, 4).map(async (resource) => {
            try {
              const payload = await apiRequest(resource.path, {
                headers: { Authorization: `Bearer ${token}` },
              });

              return {
                ...resource,
                status: 'ready',
                payload,
                value: countData(payload, resource.metric),
              };
            } catch (error) {
              return {
                ...resource,
                status: 'error',
                error: error.message,
                value: '--',
              };
            }
          })
        );

        if (!cancelled) {
          setResourceCards(cards);
          if (!selectedResource && cards[0]) {
            setSelectedResource(cards[0].label);
            setResourcePayload(cards[0].payload || null);
          }
        }
      } catch (error) {
        if (!cancelled) setResourceError(error.message);
      } finally {
        if (!cancelled) setResourceLoading(false);
      }
    }

    loadOverview();
    return () => {
      cancelled = true;
    };
  }, [token, resources]);

  function handleActionSelect(action) {
    setSelectedAction(action.label);
    setRequestMethod(action.method);
    setRequestPath(action.path);
    setRequestBody(formatJson(action.body));
  }

  function getRoleSlug(roleLabel) {
    return roleLabel.toLowerCase().replace(/\s+/g, '-');
  }

  function openRoleAuth(roleLabel) {
    router.push(`/login/${getRoleSlug(roleLabel)}`);
  }

  function handleLogout() {
    setToken('');
    setUser(null);
    setSelectedAction(null);
    setRequestBody('');
    setRequestPath('');
    setRequestMethod('GET');
    setResponseState(null);
    setResourceCards([]);
    setResourcePayload(null);
    setSelectedResource(null);
    localStorage.removeItem('hostel-token');
    localStorage.removeItem('hostel-user');
  }

  async function sendRequest() {
    setLoading(true);
    setResponseState(null);

    try {
      const options = {
        method: requestMethod,
        headers: { Authorization: `Bearer ${token}` },
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

  async function openResource(resource) {
    setSelectedResource(resource.label);
    setResourceError('');
    setResourceLoading(true);

    try {
      const payload = resource.payload
        ? resource.payload
        : await apiRequest(resource.path, { headers: { Authorization: `Bearer ${token}` } });
      setResourcePayload(payload);
    } catch (error) {
      setResourcePayload(prettyError(error));
      setResourceError(error.message);
    } finally {
      setResourceLoading(false);
    }
  }

  const selectedActionMeta = actions.find((item) => item.label === selectedAction);
  const landingRoles = ['Warden', 'Student', 'Gatekeeper', 'Supervisor', 'Accountant', 'Admin'];

  return (
    <div className="shell">
      <div className="backdrop backdrop-one" />
      <div className="backdrop backdrop-two" />

      <main className="app-frame">
        {!user ? (
          <>
            <section className="landing-header">
              <div className="landing-brand">
                <div className="landing-brand-mark">A</div>
                <div>
                  <p className="eyebrow">AI-Based Hostel Optimization System</p>
                  <strong>Professional hostel management platform</strong>
                </div>
              </div>

              <div className="landing-role-bar">
                {landingRoles.map((item) => (
                  <button key={item} className="landing-role-button" type="button" onClick={() => openRoleAuth(item)}>
                    {item}
                  </button>
                ))}
              </div>
            </section>

            <section className="landing-hero">
              <div className="landing-image-card full-span-image-card">
                <div className="landing-image-frame">
                  <img className="landing-image" src="/image/hostel%20.png" alt="Hostel building" />
                  <div className="landing-image-overlay" />
                  <div className="landing-image-caption">
                    <span>Single Campus, Multiple Hostels</span>
                    <strong>Professional housing operations for students, wardens, and campus staff</strong>
                  </div>
                  <div className="landing-image-actions">
                    <button className="primary-btn large-btn" type="button" onClick={() => openRoleAuth('Admin')}>
                      Enter Dashboard
                    </button>
                    <div className="landing-mini-grid overlay-mini-grid">
                      <div>
                        <strong>6+</strong>
                        <span>Campus roles</span>
                      </div>
                      <div>
                        <strong>24/7</strong>
                        <span>Operational flow</span>
                      </div>
                      <div>
                        <strong>100%</strong>
                        <span>Open-source stack</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {user ? (
          <section className="workspace-shell">
            <aside className="panel sidebar-panel">
              <div className="panel-heading">
                <p className="eyebrow">Workspace</p>
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

              <nav className="tab-list">
                {workspaceTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={activeTab === tab.id ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="status-card">
                <span>Backend status</span>
                <strong>{healthState.ok ? 'Connected' : 'Not connected'}</strong>
                <small>{healthState.message}</small>
              </div>

              <div className="status-card muted-card">
                <span>Primary role</span>
                <strong>{primaryRole}</strong>
                <small>Switch tabs to explore data, use forms, and call APIs.</small>
              </div>

              <button className="secondary-btn" type="button" onClick={handleLogout}>
                Logout
              </button>
            </aside>

            <section className="main-panel-stack">
              {activeTab === 'desk' ? <RoleDesk primaryRole={primaryRole} token={token} user={user} /> : null}

              {activeTab === 'overview' ? (
                <>
                  <section className="panel overview-panel">
                    <div className="panel-heading compact-heading">
                      <div>
                        <p className="eyebrow">Overview</p>
                        <h2>Role-driven command dashboard</h2>
                      </div>
                      <div className="overview-badge">{roles.join(' · ')}</div>
                    </div>

                    <div className="overview-grid">
                      {resourceCards.map((resource) => (
                        <button
                          key={resource.label}
                          type="button"
                          className={
                            selectedResource === resource.label ? 'insight-card active' : 'insight-card'
                          }
                          onClick={() => openResource(resource)}
                        >
                          <span>{resource.label}</span>
                          <strong>{resource.value}</strong>
                          <small>{resource.note}</small>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="split-layout">
                    <div className="panel explorer-panel">
                      <div className="panel-heading compact-heading">
                        <div>
                          <p className="eyebrow">Explorer</p>
                          <h2>{selectedResource || 'Select a resource'}</h2>
                        </div>
                        {resourceLoading ? <span className="mini-badge">Loading</span> : null}
                      </div>

                      {resourceError ? <p className="error-text">{resourceError}</p> : null}
                      <ResponsePreview
                        responseState={
                          resourcePayload
                            ? { type: 'success', payload: resourcePayload }
                            : null
                        }
                      />
                    </div>

                    <div className="panel quick-panel">
                      <div className="panel-heading">
                        <p className="eyebrow">Suggested Flow</p>
                        <h2>How to demo this role</h2>
                      </div>

                      <div className="flow-list">
                        {actions.slice(0, 5).map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            className="flow-step"
                            onClick={() => {
                              setActiveTab('studio');
                              handleActionSelect(action);
                            }}
                          >
                            <span>{action.method}</span>
                            <strong>{action.label}</strong>
                            <small>{action.notes}</small>
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                </>
              ) : null}

              {activeTab === 'explorer' ? (
                <section className="panel explorer-workbench">
                  <div className="panel-heading compact-heading">
                    <div>
                      <p className="eyebrow">Data Explorer</p>
                      <h2>Live API resources</h2>
                    </div>
                  </div>

                  <div className="resource-grid">
                    {resources.map((resource) => (
                      <button
                        key={resource.label}
                        type="button"
                        className={
                          selectedResource === resource.label ? 'resource-tile active' : 'resource-tile'
                        }
                        onClick={() => openResource(resource)}
                      >
                        <span>{resource.label}</span>
                        <small>{resource.path}</small>
                        <p>{resource.note}</p>
                      </button>
                    ))}
                  </div>

                  <ResponsePreview
                    responseState={
                      resourcePayload ? { type: 'success', payload: resourcePayload } : null
                    }
                  />
                </section>
              ) : null}

              {activeTab === 'studio' ? (
                <section className="panel console-panel">
                  <div className="panel-heading compact-heading">
                    <div>
                      <p className="eyebrow">Action Studio</p>
                      <h2>Editable request builder</h2>
                    </div>
                  </div>

                  <div className="action-chip-row">
                    {actions.map((action) => (
                      <button
                        key={`${action.method}-${action.label}`}
                        type="button"
                        className={selectedAction === action.label ? 'chip active' : 'chip'}
                        onClick={() => handleActionSelect(action)}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>

                  <div className="request-bar">
                    <select value={requestMethod} onChange={(event) => setRequestMethod(event.target.value)}>
                      {['GET', 'POST', 'PATCH'].map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>

                    <input value={requestPath} onChange={(event) => setRequestPath(event.target.value)} />

                    <button className="primary-btn" type="button" onClick={sendRequest} disabled={loading}>
                      {loading ? 'Sending...' : 'Send Request'}
                    </button>
                  </div>

                  <div className="panel-tip">
                    {selectedActionMeta?.notes || 'Choose an action and edit the request before sending.'}
                  </div>

                  <div className="editor-grid">
                    <div>
                      <label className="editor-label">JSON Body</label>
                      <textarea
                        className="json-editor"
                        value={requestBody}
                        onChange={(event) => setRequestBody(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="editor-label">Response</label>
                      <ResponsePreview responseState={responseState} />
                    </div>
                  </div>
                </section>
              ) : null}

              {activeTab === 'credentials' ? (
                <section className="panel credential-workbench">
                  <div className="panel-heading compact-heading">
                    <div>
                      <p className="eyebrow">Role Logins</p>
                      <h2>Quick account switching</h2>
                    </div>
                  </div>

                  <div className="credential-grid large-grid">
                    {credentialPresets.map((preset) => (
                      <button
                        key={preset.role}
                        type="button"
                        className={`credential-card tone-${preset.accent}`}
                        onClick={() => {
                          handleLogout();
                          router.push(`/login/${preset.role.toLowerCase().replace(/_/g, '-').replace('student', 'student')}`);
                        }}
                      >
                        <span>{preset.role}</span>
                        <strong>{preset.email}</strong>
                        <small>{preset.password}</small>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
            </section>
          </section>
        ) : null}
      </main>
    </div>
  );
}
