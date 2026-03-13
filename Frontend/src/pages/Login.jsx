import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LockClosedIcon, MailIcon, EyeIcon, EyeOffIcon,
  AlertTriangleIcon, ShieldIcon, CheckIcon, KeyIcon,
} from '../components/Icons';

const PERKS = [
  { Icon: ShieldIcon,      label: 'Your data is always encrypted end-to-end' },
  { Icon: LockClosedIcon,  label: 'Zero-knowledge — only you hold the key'   },
  { Icon: KeyIcon,         label: 'Master password never sent to our servers' },
  { Icon: CheckIcon,       label: 'Trusted by 10 million users worldwide'     },
];

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm]           = useState({ email: '', password: '' });
  const [showPass, setShowPass]   = useState(false);
  const [errors,   setErrors]     = useState({});
  const [loading,  setLoading]    = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.email.trim())                      e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))  e.email    = 'Enter a valid email';
    if (!form.password)                          e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      // Use production login endpoint with 2FA
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // If email not verified, still redirect to OTP page
        if (response.status === 403 && data.userId) {
          localStorage.setItem('lockify_userId', data.userId);
          localStorage.setItem('lockify_email', data.email);
          navigate(`/verify-otp?mode=login&email=${encodeURIComponent(data.email)}&userId=${data.userId}`);
          return;
        }
        throw new Error(data.error || 'Login failed');
      }
      
      // Store user info for OTP verification
      localStorage.setItem('lockify_userId', data.userId);
      localStorage.setItem('lockify_email', data.email);
      
      navigate(`/verify-otp?mode=login&email=${encodeURIComponent(data.email)}&userId=${data.userId}`);
    } catch (err) {
      setErrors({ general: err.message || 'Invalid email or password. Please try again.' });
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
            Welcome<br />back.
          </h2>
          <p className="auth-left-sub">
            Your vault is waiting. Sign in with your master password —
            the only password you'll ever need to remember.
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
            <h1 className="auth-card-title">Sign in to Lockify</h1>
            <p className="auth-card-sub">Enter your credentials to access your vault.</p>
          </div>

          {errors.general && (
            <div className="auth-error-banner">
              <AlertTriangleIcon size={15} />
              {errors.general}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

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
                  autoFocus
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
                  placeholder="Your master password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
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
            </div>

            {/* Submit */}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? <span className="auth-spinner" />
                : <><LockClosedIcon size={16} /> Sign In to Vault</>
              }
            </button>

          </form>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register" className="auth-switch-link">Create one free</Link>
          </p>

          <p className="auth-switch" style={{ marginTop: '12px' }}>
            <Link to="/forgot-password" className="auth-switch-link">Forgot your password?</Link>
          </p>

        </div>
      </div>

    </div>
  );
}