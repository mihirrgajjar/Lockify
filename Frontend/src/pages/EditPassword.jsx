import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  LockClosedIcon, KeyIcon, ArrowLeftIcon,
  GridIcon, SettingsIcon, LogOutIcon, PlusIcon,
  EyeIcon, EyeOffIcon, CopyIcon, CheckCircleIcon,
  RefreshIcon, ShieldIcon, AlertCircleIcon,
  LinkIcon, TagIcon, StickyNoteIcon, DiceIcon, SaveIcon,
  MailIcon, UserIcon, GlobeIcon, EditIcon,
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
  if (pw.length >= 8)          s++;
  if (pw.length >= 14)         s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

const STRENGTH_META = [
  null,
  { label: 'Critical', color: 'var(--c-danger)',  cls: 'sw-weak'   },
  { label: 'Weak',     color: 'var(--c-warning)', cls: 'sw-fair'   },
  { label: 'Good',     color: '#60a5fa',           cls: 'sw-good'   },
  { label: 'Strong',   color: 'var(--c-success)', cls: 'sw-strong' },
];

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
          <Link to="/passwords"    className="db-nav-item db-nav-active"><KeyIcon  size={17} /> All Passwords</Link>
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

/* ════════════════════════════════════════════
   MAIN EDIT PASSWORD PAGE
════════════════════════════════════════════ */
export default function EditPassword() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [existing, setExisting] = useState(null);

  /* ── Form state — pre-filled ── */
  const [form, setForm] = useState({
    siteName: '',
    siteUrl:  '',
    username: '',
    email:    '',
    password: '',
    category: 'Personal',
    tags:     '',
    notes:    '',
  });

  const [errors,       setErrors]       = useState({});
  const [showPass,     setShowPass]     = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [genPanelOpen, setGenPanelOpen] = useState(false);
  
  // Fetch user and item on mount
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
        if (data.user) setUser(data.user);
      })
      .catch(err => console.error('Failed to fetch user:', err));
    
    // Fetch item
    fetch(`${API_URL}/vault/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.item) {
          setExisting(data.item);
          setForm({
            siteName: data.item.name || '',
            siteUrl:  data.item.url || '',
            username: data.item.username || '',
            email:    data.item.email || '',
            password: data.item.password || '',
            category: data.item.category || 'Personal',
            tags:     data.item.tags?.join(', ') || '',
            notes:    data.item.notes || '',
          });
        } else {
          navigate('/passwords');
        }
      })
      .catch(err => {
        console.error('Failed to fetch item:', err);
        navigate('/passwords');
      });
  }, [id, navigate]);

  /* Generator options */
  const [genLength,  setGenLength]  = useState(18);
  const [genUpper,   setGenUpper]   = useState(true);
  const [genLower,   setGenLower]   = useState(true);
  const [genDigits,  setGenDigits]  = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);

  /* Strength */
  const strength = getStrength(form.password);
  const sm       = STRENGTH_META[strength];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  const handleGenerate = useCallback(() => {
    const pw = generatePassword({ length: genLength, upper: genUpper, lower: genLower, digits: genDigits, symbols: genSymbols });
    setForm(p => ({ ...p, password: pw }));
    setErrors(p => ({ ...p, password: '' }));
  }, [genLength, genUpper, genLower, genDigits, genSymbols]);

  function handleCopy() {
    if (!form.password) return;
    navigator.clipboard.writeText(form.password).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function validate() {
    const e = {};
    if (!form.siteName.trim()) e.siteName = 'Site name is required';
    if (!form.username.trim() && !form.email.trim()) e.username = 'Username or email is required';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('lockify_token');
      const response = await fetch(`${API_URL}/vault/${id}`, {
        method: 'PUT',
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
        throw new Error(data.error || 'Failed to update');
      }
      
      setSaved(true);
      setTimeout(() => navigate('/passwords'), 1400);
    } catch (err) {
      setErrors({ general: err.message || 'Failed to update. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (!existing) return null;

  return (
    <div className="db-shell">
      <Sidebar user={user} />

      <main className="db-main">
        {/* Topbar */}
        <header className="db-topbar">
          <Link to="/passwords" className="ap-back-btn">
            <ArrowLeftIcon size={15} /> Back to Passwords
          </Link>
        </header>

        <div className="db-content">
          <div className="ap-layout">

            {/* ══ LEFT: FORM ══ */}
            <div className="ap-form-col">

              {/* Heading */}
              <div className="ap-form-head">
                <div className="ap-form-head-icon" style={{ background: 'rgba(94,129,244,0.15)', color: 'var(--c-primary)' }}>
                  <EditIcon size={20} />
                </div>
                <div>
                  <h1 className="ap-title">Edit Password</h1>
                  <p className="ap-sub">Update credentials for <strong style={{ color: 'var(--c-text1)' }}>{existing.name}</strong></p>
                </div>
              </div>

              {/* Banners */}
              {errors.general && (
                <div className="auth-error-banner" style={{ marginBottom: 20 }}>
                  <AlertCircleIcon size={15} /> {errors.general}
                </div>
              )}
              {saved && (
                <div className="ap-saved-banner">
                  <CheckCircleIcon size={15} /> Changes saved! Redirecting…
                </div>
              )}

              <form className="ap-form" onSubmit={handleSubmit} noValidate>

                {/* ── Site Info ── */}
                <div className="ap-section">
                  <h2 className="ap-section-title"><GlobeIcon size={15} /> Site Information</h2>
                  <div className="ap-row">
                    <div className="form-group">
                      <label className="form-label">Site Name <span className="ap-required">*</span></label>
                      <div className="input-wrap">
                        <span className="input-icon"><GlobeIcon size={15} /></span>
                        <input
                          className={`form-input input-with-icon ${errors.siteName ? 'input-error' : ''}`}
                          type="text" name="siteName"
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
                          type="url" name="siteUrl"
                          placeholder="https://github.com"
                          value={form.siteUrl}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Credentials ── */}
                <div className="ap-section">
                  <h2 className="ap-section-title"><UserIcon size={15} /> Credentials</h2>

                  <div className="ap-row">
                    <div className="form-group">
                      <label className="form-label">Username</label>
                      <div className="input-wrap">
                        <span className="input-icon"><UserIcon size={15} /></span>
                        <input
                          className={`form-input input-with-icon ${errors.username ? 'input-error' : ''}`}
                          type="text" name="username"
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
                          type="email" name="email"
                          placeholder="you@example.com"
                          value={form.email}
                          onChange={handleChange}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="form-group">
                    <div className="form-label-row">
                      <label className="form-label">Password <span className="ap-required">*</span></label>
                      <button type="button" className="ap-gen-toggle" onClick={() => setGenPanelOpen(s => !s)}>
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
                        style={{ fontFamily: showPass ? 'inherit' : 'monospace', letterSpacing: showPass ? 'normal' : '0.12em' }}
                      />
                      <div className="input-eye-group">
                        <button type="button" className="pwd-eye" onClick={() => setShowPass(s => !s)} title={showPass ? 'Hide' : 'Show'}>
                          {showPass ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                        </button>
                        <button type="button" className={`pwd-eye ${copied ? 'pwd-eye-copied' : ''}`} onClick={handleCopy} title="Copy password">
                          {copied ? <CheckCircleIcon size={15} /> : <CopyIcon size={15} />}
                        </button>
                      </div>
                    </div>
                    {errors.password && <span className="form-err">{errors.password}</span>}

                    {/* Strength bar */}
                    {form.password && (
                      <div className="ap-strength-row">
                        <div className="ap-strength-bars">
                          {[1,2,3,4].map(i => (
                            <div key={i} className={`strength-bar ${i <= strength && sm ? sm.cls : ''}`} />
                          ))}
                        </div>
                        {sm && <span className="ap-strength-label" style={{ color: sm.color }}>{sm.label}</span>}
                      </div>
                    )}
                  </div>

                  {/* Generator panel */}
                  {genPanelOpen && (
                    <div className="ap-gen-panel">
                      <div className="ap-gen-header">
                        <span className="ap-gen-title"><DiceIcon size={14} /> Password Generator</span>
                        <button type="button" className="btn-primary ap-gen-btn" onClick={handleGenerate}>
                          <RefreshIcon size={13} /> Generate
                        </button>
                      </div>

                      <div className="ap-gen-length-row">
                        <span className="ap-gen-label">Length: <strong>{genLength}</strong></span>
                        <input
                          type="range" min={8} max={64}
                          value={genLength}
                          onChange={e => setGenLength(Number(e.target.value))}
                          className="ap-gen-slider"
                        />
                      </div>

                      <div className="ap-gen-toggles">
                        {[
                          { key:'upper',   label:'A–Z',  val:genUpper,   set:setGenUpper   },
                          { key:'lower',   label:'a–z',  val:genLower,   set:setGenLower   },
                          { key:'digits',  label:'0–9',  val:genDigits,  set:setGenDigits  },
                          { key:'symbols', label:'!@#',  val:genSymbols, set:setGenSymbols },
                        ].map(t => (
                          <button
                            key={t.key} type="button"
                            className={`ap-toggle ${t.val ? 'ap-toggle-on' : ''}`}
                            onClick={() => t.set(s => !s)}
                          >{t.label}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Extra Details ── */}
                <div className="ap-section">
                  <h2 className="ap-section-title"><TagIcon size={15} /> Extra Details</h2>

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
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tags</label>
                      <div className="input-wrap">
                        <span className="input-icon"><TagIcon size={15} /></span>
                        <input
                          className="form-input input-with-icon"
                          type="text" name="tags"
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
                        placeholder="Add any extra notes…"
                        value={form.notes}
                        onChange={handleChange}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Actions ── */}
                <div className="ap-actions">
                  <Link to="/passwords" className="btn-ghost">
                    <ArrowLeftIcon size={15} /> Cancel
                  </Link>
                  <button type="submit" className="auth-submit ap-submit" disabled={loading || saved}>
                    {loading
                      ? <span className="auth-spinner" />
                      : saved
                      ? <><CheckCircleIcon size={16} /> Saved!</>
                      : <><SaveIcon size={16} /> Save Changes</>
                    }
                  </button>
                </div>

              </form>
            </div>

            {/* ══ RIGHT: LIVE PREVIEW ══ */}
            <div className="ap-preview-col">
              <div className="ap-preview-card">
                <div className="ap-preview-glow" />

                {/* Changed badge */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                  <h3 className="ap-preview-heading"><ShieldIcon size={14} /> Live Preview</h3>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, padding:'3px 8px', borderRadius:20, background:'rgba(94,129,244,0.15)', color:'var(--c-primary)', border:'1px solid rgba(94,129,244,0.3)' }}>
                    Editing
                  </span>
                </div>

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
                    <span className="ap-preview-val">{form.username || <span className="ap-preview-placeholder">—</span>}</span>
                  </div>
                  <div className="ap-preview-row">
                    <span className="ap-preview-key">Email</span>
                    <span className="ap-preview-val">{form.email || <span className="ap-preview-placeholder">—</span>}</span>
                  </div>
                  <div className="ap-preview-row">
                    <span className="ap-preview-key">Password</span>
                    <span className="ap-preview-val ap-preview-pw">
                      {form.password ? '•'.repeat(Math.min(form.password.length, 16)) : <span className="ap-preview-placeholder">—</span>}
                    </span>
                  </div>
                  <div className="ap-preview-row">
                    <span className="ap-preview-key">Category</span>
                    <span className="ap-preview-val">{form.category}</span>
                  </div>
                </div>

                {/* Strength bars */}
                {form.password && sm && (
                  <div className="ap-preview-strength">
                    <div className="ap-preview-strength-bars">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`strength-bar ${i <= strength ? sm.cls : ''}`} />
                      ))}
                    </div>
                    <span className={`strength-text ${sm.cls}`}>{sm.label} password</span>
                  </div>
                )}

                {/* Tips */}
                <div className="ap-tips">
                  <p className="ap-tips-heading">Quick tips</p>
                  <ul className="ap-tips-list">
                    {[
                      [form.password.length >= 14, 'At least 14 characters'],
                      [/[A-Z]/.test(form.password), 'Uppercase letters'],
                      [/[0-9]/.test(form.password), 'Numbers'],
                      [/[^A-Za-z0-9]/.test(form.password), 'Special characters'],
                    ].map(([ok, label]) => (
                      <li key={label} className={ok ? 'tip-ok' : ''}>
                        {ok ? <CheckCircleIcon size={12} /> : <AlertCircleIcon size={12} />}
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Last updated info */}
                <div style={{ marginTop:16, paddingTop:12, borderTop:'1px solid var(--c-border)', fontSize:'0.72rem', color:'var(--c-text3)' }}>
                  <div>Last updated: {existing.lastUpdated}</div>
                  <div>Created: {existing.createdAt}</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}