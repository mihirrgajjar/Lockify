import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LockClosedIcon, KeyIcon, PlusIcon, ArrowLeftIcon,
  GridIcon, SettingsIcon, LogOutIcon,
  EyeIcon, EyeOffIcon, CopyIcon, CheckCircleIcon,
  RefreshIcon, ShieldIcon, AlertCircleIcon,
  LinkIcon, TagIcon, StickyNoteIcon, DiceIcon, SaveIcon,
  MailIcon, UserIcon, GlobeIcon,
} from '../components/Icons';

const API_URL = 'http://localhost:5000/api';

/* ── CATEGORIES ── */
const CATEGORIES = ['Work', 'Personal', 'Finance', 'Development', 'Shopping', 'Social', 'Other'];

/* ── PASSWORD GENERATOR ── */
const CHARSETS = {
  upper:   'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower:   'abcdefghijklmnopqrstuvwxyz',
  digits:  '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
};

function generatePassword({ length, upper, lower, digits, symbols }) {
  let pool = '';
  if (upper)   pool += CHARSETS.upper;
  if (lower)   pool += CHARSETS.lower;
  if (digits)  pool += CHARSETS.digits;
  if (symbols) pool += CHARSETS.symbols;
  if (!pool)   pool  = CHARSETS.lower;

  return Array.from({ length }, () =>
    pool[Math.floor(Math.random() * pool.length)]
  ).join('');
}

/* ── STRENGTH ── */
function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)           s++;
  if (pw.length >= 14)          s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  return Math.min(4, s);
}

const STRENGTH_META = [
  null,
  { label: 'Critical', color: 'var(--c-danger)',  cls: 'sw-weak'   },
  { label: 'Weak',     color: 'var(--c-warning)', cls: 'sw-fair'   },
  { label: 'Good',     color: '#60a5fa',           cls: 'sw-good'   },
  { label: 'Strong',   color: 'var(--c-success)', cls: 'sw-strong' },
];

/* ── SIDEBAR (shared layout) ── */
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
          <Link to="/dashboard"    className="db-nav-item"><GridIcon size={17} /> Dashboard</Link>
          <Link to="/add-password" className="db-nav-item db-nav-active"><PlusIcon size={17} /> Add Password</Link>
          <Link to="/passwords"    className="db-nav-item"><KeyIcon size={17} /> All Passwords</Link>
          <Link to="/settings"     className="db-nav-item"><SettingsIcon size={17} /> Settings</Link>
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

export default function AddPassword() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  /* ── Form state ── */
  const [form, setForm] = useState({
    siteName:   '',
    siteUrl:    '',
    username:   '',
    email:      '',
    password:   '',
    category:   'Personal',
    notes:      '',
    tags:       '',
  });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [showPass, setShowPass] = useState(false);
  
  // Fetch user on mount
  useEffect(() => {
    const token = localStorage.getItem('lockify_token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(err => console.error('Failed to fetch user:', err));
  }, [navigate]);

  /* ── Generator state ── */
  const [genLength,  setGenLength]  = useState(16);
  const [genUpper,   setGenUpper]   = useState(true);
  const [genLower,   setGenLower]   = useState(true);
  const [genDigits,  setGenDigits]  = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [genPanelOpen, setGenPanelOpen] = useState(false);
  const [copied,     setCopied]     = useState(false);

  /* Derived */
  const strength = getStrength(form.password);
  const sm       = STRENGTH_META[strength];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  /* ── Generator ── */
  const handleGenerate = useCallback(() => {
    const pw = generatePassword({
      length:  genLength,
      upper:   genUpper,
      lower:   genLower,
      digits:  genDigits,
      symbols: genSymbols,
    });
    setForm(p => ({ ...p, password: pw }));
    setErrors(p => ({ ...p, password: '' }));
  }, [genLength, genUpper, genLower, genDigits, genSymbols]);

  function handleCopy() {
    if (!form.password) return;
    navigator.clipboard.writeText(form.password).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  /* ── Validation ── */
  function validate() {
    const e = {};
    if (!form.siteName.trim())  e.siteName  = 'Site name is required';
    if (!form.username.trim() && !form.email.trim())
                                e.username  = 'Username or email is required';
    if (!form.password)         e.password  = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('lockify_token');
      const response = await fetch(`${API_URL}/vault`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.siteName,
          url: form.siteUrl,
          username: form.username,
          email: form.email,
          password: form.password,
          category: form.category,
          notes: form.notes,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Save password error:', data);
        throw new Error(data.error || 'Failed to save');
      }
      
      setSaved(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      console.error('Error saving password:', err);
      setErrors({ general: err.message || 'Failed to save. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="db-shell">
      <Sidebar user={user} />

      <main className="db-main">

        {/* Top bar */}
        <header className="db-topbar">
          <Link to="/dashboard" className="ap-back-btn">
            <ArrowLeftIcon size={15} /> Back to Dashboard
          </Link>
        </header>

        <div className="db-content">
          <div className="ap-layout">

            {/* ── LEFT: FORM ── */}
            <div className="ap-form-col">
              <div className="ap-form-head">
                <div className="ap-form-head-icon">
                  <PlusIcon size={20} />
                </div>
                <div>
                  <h1 className="ap-title">Add New Password</h1>
                  <p className="ap-sub">Store your credentials securely in your vault.</p>
                </div>
              </div>

              {errors.general && (
                <div className="auth-error-banner" style={{ marginBottom: 20 }}>
                  <AlertCircleIcon size={15} /> {errors.general}
                </div>
              )}

              {saved && (
                <div className="ap-saved-banner">
                  <CheckCircleIcon size={15} /> Password saved successfully! Redirecting…
                </div>
              )}

              <form className="ap-form" onSubmit={handleSubmit} noValidate>

                {/* ── SECTION: Site Info ── */}
                <div className="ap-section">
                  <h2 className="ap-section-title">
                    <GlobeIcon size={15} /> Site Information
                  </h2>
                  <div className="ap-row">
                    <div className="form-group">
                      <label className="form-label">Site Name <span className="ap-required">*</span></label>
                      <div className="input-wrap">
                        <span className="input-icon"><GlobeIcon size={15} /></span>
                        <input
                          className={`form-input input-with-icon ${errors.siteName ? 'input-error' : ''}`}
                          type="text"
                          name="siteName"
                          placeholder="e.g. GitHub"
                          value={form.siteName}
                          onChange={handleChange}
                          autoFocus
                        />
                      </div>
                      {errors.siteName && <span className="form-err">{errors.siteName}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Website URL</label>
                      <div className="input-wrap">
                        <span className="input-icon"><LinkIcon size={15} /></span>
                        <input
                          className="form-input input-with-icon"
                          type="url"
                          name="siteUrl"
                          placeholder="https://github.com"
                          value={form.siteUrl}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION: Credentials ── */}
                <div className="ap-section">
                  <h2 className="ap-section-title">
                    <UserIcon size={15} /> Credentials
                  </h2>

                  <div className="ap-row">
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <div className="input-wrap">
                        <span className="input-icon"><UserIcon size={15} /></span>
                        <input
                          className={`form-input input-with-icon ${errors.username ? 'input-error' : ''}`}
                          type="text"
                          name="username"
                          placeholder="johndoe"
                          value={form.username}
                          onChange={handleChange}
                          autoComplete="off"
                        />
                      </div>
                      {errors.username && <span className="form-err">{errors.username}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <div className="input-wrap">
                        <span className="input-icon"><MailIcon size={15} /></span>
                        <input
                          className="form-input input-with-icon"
                          type="email"
                          name="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={handleChange}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password row */}
                  <div className="form-group">
                    <div className="form-label-row">
                      <label className="form-label">Password <span className="ap-required">*</span></label>
                      <button
                        type="button"
                        className="ap-gen-toggle"
                        onClick={() => setGenPanelOpen(s => !s)}
                      >
                        <DiceIcon size={13} />
                        {genPanelOpen ? 'Hide Generator' : 'Generate Password'}
                      </button>
                    </div>
                    <div className="input-wrap">
                      <span className="input-icon"><LockClosedIcon size={15} /></span>
                      <input
                        className={`form-input input-with-icon input-with-eye ${errors.password ? 'input-error' : ''}`}
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter or generate a password"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                      />
                      <div className="ap-pass-actions">
                        <button type="button" className="input-eye ap-pass-copy" onClick={handleCopy} title="Copy">
                          {copied ? <CheckCircleIcon size={14} className="ap-copy-done" /> : <CopyIcon size={14} />}
                        </button>
                        <button type="button" className="input-eye" onClick={() => setShowPass(s => !s)} title="Toggle visibility">
                          {showPass ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                        </button>
                      </div>
                    </div>
                    {errors.password && <span className="form-err">{errors.password}</span>}

                    {/* Strength meter */}
                    {form.password && (
                      <div className="strength-meter">
                        <div className="strength-bars">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`strength-bar ${i <= strength ? sm?.cls : ''}`} />
                          ))}
                        </div>
                        <span className={`strength-text ${sm?.cls}`}>{sm?.label}</span>
                      </div>
                    )}
                  </div>

                  {/* ── GENERATOR PANEL ── */}
                  {genPanelOpen && (
                    <div className="ap-gen-panel">
                      <div className="ap-gen-glow" />

                      <div className="ap-gen-header">
                        <span className="ap-gen-heading">
                          <DiceIcon size={14} /> Password Generator
                        </span>
                        <button type="button" className="ap-gen-btn" onClick={handleGenerate}>
                          <RefreshIcon size={13} /> Generate
                        </button>
                      </div>

                      {/* Length slider */}
                      <div className="ap-gen-row">
                        <label className="ap-gen-label">
                          Length <span className="ap-gen-val">{genLength}</span>
                        </label>
                        <input
                          type="range"
                          min={8} max={64}
                          value={genLength}
                          onChange={e => setGenLength(Number(e.target.value))}
                          className="ap-slider"
                        />
                        <div className="ap-slider-ticks">
                          <span>8</span><span>64</span>
                        </div>
                      </div>

                      {/* Toggles */}
                      <div className="ap-gen-toggles">
                        {[
                          { key: 'upper',   label: 'A–Z', val: genUpper,   set: setGenUpper   },
                          { key: 'lower',   label: 'a–z', val: genLower,   set: setGenLower   },
                          { key: 'digits',  label: '0–9', val: genDigits,  set: setGenDigits  },
                          { key: 'symbols', label: '!@#', val: genSymbols, set: setGenSymbols },
                        ].map(t => (
                          <button
                            key={t.key}
                            type="button"
                            className={`ap-toggle ${t.val ? 'ap-toggle-on' : ''}`}
                            onClick={() => t.set(s => !s)}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── SECTION: Extra Details ── */}
                <div className="ap-section">
                  <h2 className="ap-section-title">
                    <TagIcon size={15} /> Extra Details
                  </h2>

                  <div className="ap-row">
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <div className="input-wrap">
                        <span className="input-icon"><TagIcon size={15} /></span>
                        <select
                          className="form-input input-with-icon ap-select"
                          name="category"
                          value={form.category}
                          onChange={handleChange}
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tags</label>
                      <div className="input-wrap">
                        <span className="input-icon"><TagIcon size={15} /></span>
                        <input
                          className="form-input input-with-icon"
                          type="text"
                          name="tags"
                          placeholder="work, 2fa, important"
                          value={form.tags}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <div className="input-wrap ap-notes-wrap">
                      <span className="input-icon ap-notes-icon"><StickyNoteIcon size={15} /></span>
                      <textarea
                        className="form-input input-with-icon ap-textarea"
                        name="notes"
                        placeholder="Add any extra notes about this login…"
                        value={form.notes}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* ── ACTIONS ── */}
                <div className="ap-actions">
                  <Link to="/dashboard" className="btn-ghost">
                    <ArrowLeftIcon size={15} /> Cancel
                  </Link>
                  <button type="submit" className="auth-submit ap-submit" disabled={loading || saved}>
                    {loading
                      ? <span className="auth-spinner" />
                      : saved
                      ? <><CheckCircleIcon size={16} /> Saved!</>
                      : <><SaveIcon size={16} /> Save Password</>
                    }
                  </button>
                </div>

              </form>
            </div>

            {/* ── RIGHT: PREVIEW CARD ── */}
            <div className="ap-preview-col">
              <div className="ap-preview-card">
                <div className="ap-preview-glow" />
                <h3 className="ap-preview-heading">
                  <ShieldIcon size={14} /> Live Preview
                </h3>

                <div className="ap-preview-icon">
                  <GlobeIcon size={26} />
                </div>

                <div className="ap-preview-name">
                  {form.siteName || <span className="ap-preview-placeholder">Site Name</span>}
                </div>
                <div className="ap-preview-url">
                  {form.siteUrl || <span className="ap-preview-placeholder">https://example.com</span>}
                </div>

                <div className="ap-preview-divider" />

                <div className="ap-preview-rows">
                  <div className="ap-preview-row">
                    <span className="ap-preview-key">Username</span>
                    <span className="ap-preview-val">
                      {form.username || <span className="ap-preview-placeholder">—</span>}
                    </span>
                  </div>
                  <div className="ap-preview-row">
                    <span className="ap-preview-key">Email</span>
                    <span className="ap-preview-val">
                      {form.email || <span className="ap-preview-placeholder">—</span>}
                    </span>
                  </div>
                  <div className="ap-preview-row">
                    <span className="ap-preview-key">Password</span>
                    <span className="ap-preview-val ap-preview-pw">
                      {form.password
                        ? '•'.repeat(Math.min(form.password.length, 16))
                        : <span className="ap-preview-placeholder">—</span>
                      }
                    </span>
                  </div>
                  <div className="ap-preview-row">
                    <span className="ap-preview-key">Category</span>
                    <span className="ap-preview-val">{form.category}</span>
                  </div>
                </div>

                {/* Strength ring */}
                {form.password && sm && (
                  <div className="ap-preview-strength">
                    <div className="ap-preview-strength-bars">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`strength-bar ${i <= strength ? sm.cls : ''}`} />
                      ))}
                    </div>
                    <span className={`strength-text ${sm.cls}`}>
                      {sm.label} password
                    </span>
                  </div>
                )}

                {/* Tips */}
                <div className="ap-tips">
                  <p className="ap-tips-heading">Quick tips</p>
                  <ul className="ap-tips-list">
                    <li className={form.password.length >= 14 ? 'tip-ok' : ''}>
                      {form.password.length >= 14
                        ? <CheckCircleIcon size={12} />
                        : <AlertCircleIcon size={12} />
                      }
                      At least 14 characters
                    </li>
                    <li className={/[A-Z]/.test(form.password) ? 'tip-ok' : ''}>
                      {/[A-Z]/.test(form.password)
                        ? <CheckCircleIcon size={12} />
                        : <AlertCircleIcon size={12} />
                      }
                      Uppercase letters
                    </li>
                    <li className={/[0-9]/.test(form.password) ? 'tip-ok' : ''}>
                      {/[0-9]/.test(form.password)
                        ? <CheckCircleIcon size={12} />
                        : <AlertCircleIcon size={12} />
                      }
                      Numbers
                    </li>
                    <li className={/[^A-Za-z0-9]/.test(form.password) ? 'tip-ok' : ''}>
                      {/[^A-Za-z0-9]/.test(form.password)
                        ? <CheckCircleIcon size={12} />
                        : <AlertCircleIcon size={12} />
                      }
                      Special characters
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}