import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAutoLock } from '../context/AutoLockContext';
import {
  LockClosedIcon, KeyIcon, PlusIcon, GridIcon, SettingsIcon, LogOutIcon,
  UserIcon, MailIcon, ShieldIcon, EyeIcon, EyeOffIcon,
  CheckCircleIcon, AlertTriangleIcon,
  SunIcon, MoonIcon, SmartphoneIcon, PaletteIcon,
  TrashIcon, SaveIcon,
  ChevronRightIcon, ZapIcon,
} from '../components/Icons';

const API_URL = 'http://localhost:5000/api';

/* ── SIDEBAR ── */
function Sidebar({ user }) {
  const navigate = useNavigate();
  
  function handleLogout() {
    localStorage.removeItem('lockify_token');
    localStorage.removeItem('lockify_user');
    localStorage.removeItem('lockify_userId');
    localStorage.removeItem('lockify_email');
    navigate('/');
  }
  
  return (
    <aside className="db-sidebar">
      <div className="db-sidebar-top">
        <Link to="/" className="db-logo">
          <div className="db-logo-icon"><LockClosedIcon size={16} /></div>
          <span className="db-logo-name">Lockify</span>
        </Link>
        <nav className="db-nav">
          <Link to="/dashboard"    className="db-nav-item"><GridIcon     size={17} /> Dashboard</Link>
          <Link to="/add-password" className="db-nav-item"><PlusIcon     size={17} /> Add Password</Link>
          <Link to="/passwords"    className="db-nav-item"><KeyIcon      size={17} /> All Passwords</Link>
          <Link to="/settings"     className="db-nav-item db-nav-active"><SettingsIcon size={17} /> Settings</Link>
        </nav>
      </div>
      <div className="db-sidebar-bottom">
        <div className="db-user">
          <div className="db-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
          <div className="db-user-info">
            <span className="db-user-name">{user?.name || 'User'}</span>
            <span className="db-user-email">{user?.email || 'No email'}</span>
          </div>
        </div>
        <button className="db-logout-btn" onClick={handleLogout} title="Sign out">
          <LogOutIcon size={16} />
        </button>
      </div>
    </aside>
  );
}

/* ── TOGGLE SWITCH ── */
function Toggle({ checked, onChange }) {
  return (
    <button
      className={`st-toggle ${checked ? 'st-toggle-on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="st-toggle-knob" />
    </button>
  );
}

/* ── SECTION WRAPPER ── */
function Section({ icon: Icon, title, children }) {
  return (
    <div className="st-section">
      <div className="st-section-head">
        {Icon && <div className="st-section-icon"><Icon size={16} /></div>}
        <h2 className="st-section-title">{title}</h2>
      </div>
      <div className="st-section-body">{children}</div>
    </div>
  );
}

/* ── SETTING ROW ── */
function SettingRow({ label, sub, children, danger }) {
  return (
    <div className={`st-row ${danger ? 'st-row-danger' : ''}`}>
      <div className="st-row-info">
        <span className="st-row-label">{label}</span>
        {sub && <span className="st-row-sub">{sub}</span>}
      </div>
      <div className="st-row-control">{children}</div>
    </div>
  );
}

/* ── DELETE ACCOUNT MODAL ── */
function DeleteAccountModal({ onConfirm, onCancel }) {
  const [confirm, setConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const ready = confirm === 'DELETE' && password.length >= 8;

  return (
    <div className="vp-modal-overlay" onClick={onCancel}>
      <div className="vp-modal" onClick={e => e.stopPropagation()}>
        <div className="vp-modal-glow" />
        <div className="vp-modal-icon" style={{ background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.25)', color: 'var(--c-danger)' }}>
          <TrashIcon size={24} />
        </div>
        <h3 className="vp-modal-title">Delete Account?</h3>
        <p className="vp-modal-sub">
          This will permanently delete your account and all saved passwords. This action <strong>cannot be undone</strong>.
        </p>
        
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ textAlign: 'left' }}>Master Password</label>
          <div className="input-wrap">
            <span className="input-icon"><LockClosedIcon size={15} /></span>
            <input
              className="form-input input-with-icon input-with-eye"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your master password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="button" className="input-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
              {showPassword ? <EyeOffIcon size={14}/> : <EyeIcon size={14}/>}
            </button>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label" style={{ textAlign: 'left' }}>Type <strong style={{ color: 'var(--c-danger)' }}>DELETE</strong> to confirm</label>
          <input
            className={`form-input ${confirm && confirm !== 'DELETE' ? 'input-error' : ''}`}
            type="text"
            placeholder="DELETE"
            value={confirm}
            onChange={e => setConfirm(e.target.value.toUpperCase())}
          />
        </div>

        <div className="vp-modal-actions">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className="vp-modal-confirm"
            onClick={ready ? () => onConfirm(password) : undefined}
            disabled={!ready}
            style={{ opacity: ready ? 1 : 0.45, cursor: ready ? 'pointer' : 'not-allowed' }}
          >
            <TrashIcon size={14} /> Delete Forever
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN ── */
export default function Settings() {
  const navigate = useNavigate();
  const { theme, changeTheme } = useTheme();
  const { sessionLock, lockTimeout, updateSessionLock, updateLockTimeout } = useAutoLock();
  const [user, setUser] = useState(null);
  const [vaultCount, setVaultCount] = useState(0);

  /* Profile */
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [profileSaved, setProfileSaved] = useState(false);

  /* Password change */
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaved, setPwSaved] = useState(false);
  
  // Fetch user data on mount
  useEffect(() => {
    const token = localStorage.getItem('lockify_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Fetch user
    fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setProfile({ name: data.user.name, email: data.user.email });
        }
      })
      .catch(err => console.error('Failed to fetch user:', err));
    
    // Fetch vault stats
    fetch(`${API_URL}/vault/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setVaultCount(data.total || 0);
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  }, [navigate]);

  /* Security */
  const [twoFactor,   setTwoFactor]   = useState(true);

  /* Appearance */
  const [accentColor, setAccentColor] = useState(
    () => getComputedStyle(document.documentElement).getPropertyValue('--c-primary').trim() || '#5e81f4'
  );

  function handleAccentChange(color) {
    setAccentColor(color);
    document.documentElement.style.setProperty('--c-primary', color);
    // Adjust light version
    document.documentElement.style.setProperty('--c-primary-lt', color + '1a');
    localStorage.setItem('lockify-accent', color);
  }
  const [compactMode,  setCompactMode] = useState(false);

  /* Danger zone */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal,  setShowClearModal]  = useState(false);

  function handleLogout() {
    localStorage.removeItem('lockify_token');
    localStorage.removeItem('lockify_user');
    localStorage.removeItem('lockify_userId');
    localStorage.removeItem('lockify_email');
    navigate('/');
  }

  /* Active section tab */
  const TABS = [
    { id: 'profile',      label: 'Profile',      Icon: UserIcon     },
    { id: 'security',     label: 'Security',     Icon: ShieldIcon   },
    { id: 'appearance',   label: 'Appearance',   Icon: PaletteIcon  },
    { id: 'danger',       label: 'Danger Zone',  Icon: AlertTriangleIcon },
  ];
  const [activeTab, setActiveTab] = useState('profile');

  /* ── Handlers ── */
  async function saveProfile(e) {
    e.preventDefault();
    const token = localStorage.getItem('lockify_token');
    try {
      const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: profile.name })
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    const errs = {};
    if (!passwords.current)                        errs.current  = 'Enter current password';
    if (!passwords.newPass)                        errs.newPass  = 'Enter new password';
    else if (passwords.newPass.length < 8)         errs.newPass  = 'Minimum 8 characters';
    if (passwords.confirm !== passwords.newPass)   errs.confirm  = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    
    const token = localStorage.getItem('lockify_token');
    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.newPass
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }
      
      setPasswords({ current: '', newPass: '', confirm: '' });
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      setPwErrors({ current: err.message });
    }
  }

  async function handleDeleteAccount(password) {
    const token = localStorage.getItem('lockify_token');
    try {
      const response = await fetch(`${API_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        alert(data.error || 'Failed to delete account');
        return;
      }
      
      localStorage.removeItem('lockify_token');
      localStorage.removeItem('lockify_user');
      localStorage.removeItem('lockify_userId');
      localStorage.removeItem('lockify_email');
      navigate('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setShowDeleteModal(false);
    }
  }

  async function handleClearVault() {
    const token = localStorage.getItem('lockify_token');
    try {
      await fetch(`${API_URL}/vault`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setVaultCount(0);
    } catch (err) {
      console.error('Failed to clear vault:', err);
    }
    setShowClearModal(false);
  }

  const ACCENT_COLORS = ['#5e81f4', '#22d3ee', '#34d399', '#f472b6', '#fb923c', '#a78bfa'];

  return (
    <div className="db-shell">
      <Sidebar user={user} />

      <main className="db-main">
        <header className="db-topbar">
          <h1 className="db-page-title" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--c-text1)' }}>
            Settings
          </h1>
        </header>

        <div className="db-content">
          <div className="st-layout">

            {/* ── LEFT NAV - Using same classes as main sidebar ── */}
            <aside className="db-sidebar" style={{ position: 'sticky', top: '80px', height: 'auto', maxHeight: 'calc(100vh - 100px)', width: 'auto', borderRadius: '14px', padding: '6px' }}>
              <nav className="db-nav">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const isDanger = tab.id === 'danger';
                
                return (
                  <div
                    key={tab.id}
                    className={`db-nav-item ${isActive ? 'db-nav-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveTab(tab.id)}
                    style={isDanger ? { color: 'var(--c-danger)' } : {}}
                  >
                    <tab.Icon size={16} />
                    <span>{tab.label}</span>
                  </div>
                );
              })}
              </nav>
            </aside>

            {/* ── RIGHT CONTENT ── */}
            <div className="st-content">

              {/* ════════ PROFILE ════════ */}
              {activeTab === 'profile' && (
                <div className="st-panel">
                  <div className="st-panel-head">
                    <h2 className="st-panel-title">Profile Settings</h2>
                    <p className="st-panel-sub">Manage your personal information and account details.</p>
                  </div>

                  {/* Avatar */}
                  <div className="st-avatar-row">
                    <div className="st-avatar-big">{profile.name?.charAt(0).toUpperCase() || 'U'}</div>
                    <div>
                      <p className="st-avatar-name">{profile.name}</p>
                      <p className="st-avatar-email">{profile.email}</p>
                    </div>
                  </div>

                  {profileSaved && (
                    <div className="ap-saved-banner">
                      <CheckCircleIcon size={14} /> Profile updated successfully!
                    </div>
                  )}

                  {/* ── Personal Info ── */}
                  <div className="st-profile-card">
                    <div className="st-profile-card-head">
                      <div className="st-profile-card-icon"><UserIcon size={15}/></div>
                      <span className="st-profile-card-title">Personal Information</span>
                    </div>
                    <div className="st-profile-fields">
                      <div className="st-profile-field-group">
                        <label className="form-label">Full Name</label>
                        <div className="input-wrap">
                          <span className="input-icon"><UserIcon size={15} /></span>
                          <input
                            className="form-input input-with-icon"
                            type="text"
                            value={profile.name}
                            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="st-profile-field-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrap">
                          <span className="input-icon"><MailIcon size={15} /></span>
                          <input
                            className="form-input input-with-icon"
                            type="email"
                            value={profile.email}
                            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="st-profile-card-footer">
                      <button className="btn-primary st-save-btn" onClick={saveProfile}>
                        <SaveIcon size={14} /> Save Profile
                      </button>
                    </div>
                  </div>

                  {/* ── Change Master Password ── */}
                  <div className="st-profile-card">
                    <div className="st-profile-card-head">
                      <div className="st-profile-card-icon st-profile-card-icon-lock"><LockClosedIcon size={15}/></div>
                      <span className="st-profile-card-title">Change Master Password</span>
                    </div>

                    {pwSaved && (
                      <div className="ap-saved-banner" style={{ margin: '0 20px 16px' }}>
                        <CheckCircleIcon size={14} /> Password changed successfully!
                      </div>
                    )}

                    <div className="st-pw-stack">
                      {[
                        { key:'current', label:'Current Password',    ph:'Enter current password' },
                        { key:'newPass', label:'New Master Password',  ph:'Min. 8 characters'      },
                        { key:'confirm', label:'Confirm New Password', ph:'Repeat new password'    },
                      ].map(f => (
                        <div className="st-pw-field" key={f.key}>
                          <label className="form-label">{f.label}</label>
                          <div className="input-wrap">
                            <span className="input-icon"><LockClosedIcon size={15} /></span>
                            <input
                              className={`form-input input-with-icon input-with-eye ${pwErrors[f.key] ? 'input-error' : ''}`}
                              type={showPw[f.key] ? 'text' : 'password'}
                              placeholder={f.ph}
                              value={passwords[f.key]}
                              onChange={e => { setPasswords(p => ({ ...p, [f.key]: e.target.value })); setPwErrors(p => ({ ...p, [f.key]: '' })); }}
                              autoComplete="new-password"
                            />
                            <button type="button" className="input-eye" onClick={() => setShowPw(p => ({ ...p, [f.key]: !p[f.key] }))} tabIndex={-1}>
                              {showPw[f.key] ? <EyeOffIcon size={14}/> : <EyeIcon size={14}/>}
                            </button>
                          </div>
                          {pwErrors[f.key] && <span className="form-err">{pwErrors[f.key]}</span>}
                        </div>
                      ))}
                    </div>

                    <div className="st-profile-card-footer">
                      <button className="btn-primary st-save-btn" onClick={savePassword}>
                        <SaveIcon size={14} /> Update Password
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ SECURITY ════════ */}
              {activeTab === 'security' && (
                <div className="st-panel">
                  <div className="st-panel-head">
                    <h2 className="st-panel-title">Security Settings</h2>
                    <p className="st-panel-sub">Control how your vault is protected and accessed.</p>
                  </div>

                  <Section icon={ShieldIcon} title="Two-Factor Authentication">
                    <SettingRow
                      label="Email OTP Verification"
                      sub="Require a one-time code every time you sign in."
                    >
                      <Toggle checked={twoFactor} onChange={setTwoFactor} />
                    </SettingRow>
                    {twoFactor && (
                      <div className="st-2fa-notice">
                        <CheckCircleIcon size={13} />
                        2FA is active. A code is sent to <strong>{user?.email || 'your email'}</strong> on every login.
                      </div>
                    )}
                  </Section>

                  <Section icon={LockClosedIcon} title="Session & Auto-lock">
                    <SettingRow
                      label="Auto-lock Vault"
                      sub="Automatically lock your vault after inactivity."
                    >
                      <Toggle checked={sessionLock} onChange={updateSessionLock} />
                    </SettingRow>
                    {sessionLock && (
                      <SettingRow label="Lock After" sub="Minutes of inactivity before vault locks.">
                        <select
                          className="st-select"
                          value={lockTimeout}
                          onChange={e => updateLockTimeout(e.target.value)}
                        >
                          {['1', '5', '10', '15', '30', '60'].map(v => (
                            <option key={v} value={v}>{v} minute{v === '1' ? '' : 's'}</option>
                          ))}
                        </select>
                      </SettingRow>
                    )}
                  </Section>

                  <Section icon={SmartphoneIcon} title="Active Sessions">
                    <div className="st-session-row">
                      <div className="st-session-info">
                        <span className="st-session-device">
                          Current Session
                          <span className="st-session-current">Current</span>
                        </span>
                        <span className="st-session-meta">Active now</span>
                      </div>
                    </div>
                    <div className="st-signout-all-wrap">
                      <button className="st-signout-all-btn" onClick={handleLogout}>
                        <LogOutIcon size={14} />
                        Sign out
                      </button>
                    </div>
                  </Section>
                </div>
              )}

              {/* ════════ APPEARANCE ════════ */}
              {activeTab === 'appearance' && (
                <div className="st-panel">
                  <div className="st-panel-head">
                    <h2 className="st-panel-title">Appearance</h2>
                    <p className="st-panel-sub">Customise how Lockify looks and feels.</p>
                  </div>

                  <Section icon={SunIcon} title="Theme">
                    <div className="st-theme-row">
                      {[
                        { key: 'dark',   label: 'Dark',   Icon: MoonIcon },
                        { key: 'light',  label: 'Light',  Icon: SunIcon  },
                        { key: 'system', label: 'System', Icon: SmartphoneIcon },
                      ].map(t => (
                        <button
                          key={t.key}
                          className={`st-theme-btn ${theme === t.key ? 'st-theme-active' : ''}`}
                          onClick={() => changeTheme(t.key)}
                        >
                          <t.Icon size={18} />
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section icon={PaletteIcon} title="Accent Color">
                    <div className="st-color-row">
                      {ACCENT_COLORS.map(c => (
                        <button
                          key={c}
                          className={`st-color-dot ${accentColor === c ? 'st-color-active' : ''}`}
                          style={{ background: c }}
                          onClick={() => handleAccentChange(c)}
                          title={c}
                        >
                          {accentColor === c && <CheckCircleIcon size={14} />}
                        </button>
                      ))}
                    </div>
                  </Section>

                  <Section icon={ZapIcon} title="Display">
                    <SettingRow label="Compact Mode" sub="Reduce padding and spacing for a denser layout.">
                      <Toggle checked={compactMode} onChange={setCompactMode} />
                    </SettingRow>
                  </Section>
                </div>
              )}

              {/* ════════ DANGER ZONE ════════ */}
              {activeTab === 'danger' && (
                <div className="st-panel">
                  <div className="st-panel-head">
                    <h2 className="st-panel-title">Danger Zone</h2>
                    <p className="st-panel-sub">Irreversible actions. Please proceed with caution.</p>
                  </div>

                  <div className="st-danger-section">
                    <div className="st-danger-row">
                      <div className="st-danger-info">
                        <span className="st-danger-label">
                          <TrashIcon size={15} /> Clear Vault
                        </span>
                        <span className="st-danger-sub">
                          Permanently delete all saved passwords from your vault. Your account will remain active.
                        </span>
                      </div>
                      <button
                        className="st-danger-btn"
                        onClick={() => setShowClearModal(true)}
                      >
                        Clear Vault
                      </button>
                    </div>

                    <div className="st-danger-row">
                      <div className="st-danger-info">
                        <span className="st-danger-label">
                          <LogOutIcon size={15} /> Delete Account
                        </span>
                        <span className="st-danger-sub">
                          Permanently delete your Lockify account and all associated data. This cannot be undone.
                        </span>
                      </div>
                      <button
                        className="st-danger-btn st-danger-btn-red"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Delete account modal */}
      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {/* Clear vault modal */}
      {showClearModal && (
        <div className="vp-modal-overlay" onClick={() => setShowClearModal(false)}>
          <div className="vp-modal" onClick={e => e.stopPropagation()}>
            <div className="vp-modal-glow" />
            <div className="vp-modal-icon">
              <TrashIcon size={24} />
            </div>
            <h3 className="vp-modal-title">Clear Entire Vault?</h3>
            <p className="vp-modal-sub">
              All <strong>{vaultCount} saved passwords</strong> will be permanently deleted. Your account stays active.
            </p>
            <div className="vp-modal-actions">
              <button className="btn-ghost" onClick={() => setShowClearModal(false)}>Cancel</button>
              <button className="vp-modal-confirm" onClick={handleClearVault}>
                <TrashIcon size={14} /> Clear Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
