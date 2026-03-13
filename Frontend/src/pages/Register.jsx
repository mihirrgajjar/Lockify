import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldIcon, ZapIcon, BellIcon, MonitorIcon,
  LockClosedIcon, UserIcon, MailIcon, EyeIcon, EyeOffIcon,
  AlertTriangleIcon, CheckIcon,
} from '../components/Icons';

const PERKS = [
  { Icon: ShieldIcon,  label: 'AES-256 zero-knowledge encryption' },
  { Icon: ZapIcon,     label: 'Autofill on any site, any browser'  },
  { Icon: BellIcon,    label: 'Real-time breach monitoring'         },
  { Icon: MonitorIcon, label: 'Sync across all your devices'        },
];

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8)          s++;
  if (pw.length >= 12)         s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);

  const strength      = getStrength(form.password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthClass = ['', 'sw-weak', 'sw-fair', 'sw-good', 'sw-strong'][strength];

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim())                       e.name     = 'Full name is required';
    if (!form.email.trim())                      e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))  e.email    = 'Enter a valid email';
    if (!form.password)                          e.password = 'Password is required';
    else if (form.password.length < 8)           e.password = 'Minimum 8 characters';
    if (!form.confirm)                           e.confirm  = 'Please confirm your password';
    else if (form.confirm !== form.password)     e.confirm  = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Store userId for OTP verification
      localStorage.setItem('lockify_userId', data.userId);
      localStorage.setItem('lockify_email', data.email);
      
      navigate(`/verify-otp?mode=register&email=${encodeURIComponent(data.email)}&userId=${data.userId}`);
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">

      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        <div className="auth-left-inner">

          <Link to="/" className="auth-logo">
            <div className="auth-logo-icon">
              <LockClosedIcon size={17} />
            </div>
            <span className="auth-logo-name">Lockify</span>
          </Link>

          <h2 className="auth-left-title">
            One password<br />to rule them all.
          </h2>
          <p className="auth-left-sub">
            Your vault is encrypted locally before it ever reaches our servers.
            We cannot read your passwords — even if we wanted to.
          </p>

          <div className="auth-perks">
            {PERKS.map(p => (
              <div key={p.label} className="auth-perk">
                <div className="auth-perk-icon">
                  <p.Icon size={16} />
                </div>
                <span className="auth-perk-label">{p.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <div className="auth-card">

          <div className="auth-card-head">
            <h1 className="auth-card-title">Create your account</h1>
            <p className="auth-card-sub">Free forever. No credit card needed.</p>
          </div>

          {errors.general && (
            <div className="auth-error-banner">
              <AlertTriangleIcon size={15} />
              {errors.general}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrap">
                <span className="input-icon"><UserIcon size={15} /></span>
                <input
                  className={`form-input input-with-icon ${errors.name ? 'input-error' : ''}`}
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
              {errors.name && <span className="form-err">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon"><MailIcon size={15} /></span>
                <input
                  className={`form-input input-with-icon ${errors.email ? 'input-error' : ''}`}
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="form-err">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Master Password</label>
              <div className="input-wrap">
                <span className="input-icon"><LockClosedIcon size={15} /></span>
                <input
                  className={`form-input input-with-icon input-with-eye ${errors.password ? 'input-error' : ''}`}
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="input-eye"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                </button>
              </div>
              {errors.password && <span className="form-err">{errors.password}</span>}
              {form.password && (
                <div className="strength-meter">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`strength-bar ${i <= strength ? strengthClass : ''}`} />
                    ))}
                  </div>
                  <span className={`strength-text ${strengthClass}`}>{strengthLabel}</span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-wrap">
                <span className="input-icon"><LockClosedIcon size={15} /></span>
                <input
                  className={`form-input input-with-icon input-with-eye ${errors.confirm ? 'input-error' : ''}`}
                  type={showConfirm ? 'text' : 'password'}
                  name="confirm"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="input-eye"
                  onClick={() => setShowConfirm(s => !s)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                </button>
              </div>
              {errors.confirm && <span className="form-err">{errors.confirm}</span>}
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? <span className="auth-spinner" />
                : <><LockClosedIcon size={16} /> Create Secure Account</>
              }
            </button>

          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">Sign in</Link>
          </p>

        </div>
      </div>

    </div>
  );
}