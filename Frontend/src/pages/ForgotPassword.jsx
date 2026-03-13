import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LockClosedIcon, MailIcon, ArrowLeftIcon,
  ShieldIcon, KeyIcon, AlertTriangleIcon,
} from '../components/Icons';

export default function ForgotPassword() {
  const navigate           = useNavigate();
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!email.trim())                     { setError('Email is required'); return false; }
    if (!/\S+@\S+\.\S+/.test(email))       { setError('Enter a valid email address'); return false; }
    setError('');
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - navigate to OTP verification
        navigate(`/verify-otp?mode=forgot&email=${encodeURIComponent(email)}${data.userId ? `&userId=${data.userId}` : ''}`);
      } else {
        // Handle specific security errors
        if (response.status === 404) {
          setError('No account found with this email address.');
        } else if (response.status === 403) {
          setError('Please verify your email address first.');
        } else {
          setError(data.error || 'Could not send reset code. Please try again.');
        }
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Network error. Please check your connection and try again.');
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
            Locked out?<br />We've got you.
          </h2>
          <p className="auth-left-sub">
            Enter your email address and we'll send a one-time code to reset your master password securely.
          </p>

          <div className="auth-perks">
            {[
              { Icon: MailIcon,   label: 'OTP sent to your registered email' },
              { Icon: ShieldIcon, label: 'Code expires in 10 minutes'        },
              { Icon: KeyIcon,    label: 'Set a new master password securely' },
            ].map(p => (
              <div key={p.label} className="auth-perk">
                <div className="auth-perk-icon"><p.Icon size={16} /></div>
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
            <h1 className="auth-card-title">Forgot your password?</h1>
            <p className="auth-card-sub">
              No worries. Enter your email and we'll send you a reset code.
            </p>
          </div>

          {error && (
            <div className="auth-error-banner">
              <AlertTriangleIcon size={15} />
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrap">
                <span className="input-icon"><MailIcon size={15} /></span>
                <input
                  className={`form-input input-with-icon ${error ? 'input-error' : ''}`}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading
                ? <span className="auth-spinner" />
                : <><MailIcon size={16} /> Send Reset Code</>
              }
            </button>

          </form>

          <Link to="/login" className="otp-back" style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
            <ArrowLeftIcon size={14} />
            Back to Sign In
          </Link>

        </div>
      </div>

    </div>
  );
}