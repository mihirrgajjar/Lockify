import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LockClosedIcon, MailIcon, ArrowLeftIcon,
  RefreshIcon, CheckCircleIcon, EyeIcon, EyeOffIcon,
  ShieldIcon, AlertTriangleIcon,
} from '../components/Icons';

const MODE_CONFIG = {
  register: { heading:'Verify your email',       sub:'We sent a 6-digit code to confirm your account.',           next:'/dashboard', btnLabel:'Verify & Enter Vault', backTo:'/register',       backLabel:'Back to Register' },
  login:    { heading:'Two-factor verification', sub:'Enter the 6-digit code we sent to your email.',             next:'/dashboard', btnLabel:'Verify & Sign In',    backTo:'/login',          backLabel:'Back to Sign In'  },
  forgot:   { heading:'Reset your password',     sub:'Enter the 6-digit code we sent, then set a new password.', next:'/login',     btnLabel:'Reset Password',      backTo:'/forgot-password',backLabel:'Back'             },
};

const OTP_LENGTH  = 6;
const TIMER_START = 30;

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

export default function VerifyOtp() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const mode           = searchParams.get('mode')  || 'login';
  const email          = searchParams.get('email') || '';
  const config         = MODE_CONFIG[mode] || MODE_CONFIG.login;

  const [otp,         setOtp]         = useState(Array(OTP_LENGTH).fill(''));
  const [timer,       setTimer]       = useState(TIMER_START);
  const [canResend,   setCanResend]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [resending,   setResending]   = useState(false);
  const [verified,    setVerified]    = useState(false);
  const [otpError,    setOtpError]    = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passErrors,  setPassErrors]  = useState({});
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  useEffect(() => {
    if (otp.every(d => d !== '') && mode !== 'forgot') handleVerify();
  }, [otp]);

  function handleOtpChange(val, idx) {
    if (!/^\d?$/.test(val)) return;
    setOtpError('');
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  }
  function handleOtpKeyDown(e, idx) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowLeft'  && idx > 0)              inputRefs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  }
  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...otp];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleResend() {
    if (!canResend) return;
    setResending(true);
    try {
      const userId = searchParams.get('userId') || localStorage.getItem('lockify_userId');
      const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend code');
      }
      
      setTimer(TIMER_START); setCanResend(false);
      setOtp(Array(OTP_LENGTH).fill('')); setOtpError('');
      inputRefs.current[0]?.focus();
    } catch (err) {
      setOtpError(err.message || 'Failed to resend code. Please try again.');
    } finally { setResending(false); }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setOtpError('Please enter the full 6-digit code.'); return; }
    
    const userId = searchParams.get('userId') || localStorage.getItem('lockify_userId');
    
    if (mode === 'forgot' && !verified) {
      setLoading(true);
      try { 
        // For forgot password, we just verify the OTP is valid, then show password fields
        const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, otp: code })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Invalid code');
        }
        
        // OTP is valid, show password reset fields
        setVerified(true); 
      }
      catch (err) { 
        setOtpError(err.message || 'Incorrect code. Please try again.'); 
      }
      finally { 
        setLoading(false); 
      }
      return;
    }
    
    setLoading(true);
    try { 
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp: code })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }
      
      // Store token
      localStorage.setItem('lockify_token', data.token);
      localStorage.setItem('lockify_user', JSON.stringify(data.user));
      
      navigate(config.next); 
    }
    catch (err) { 
      setOtpError(err.message || 'Incorrect code. Please try again.'); 
    }
    finally { 
      setLoading(false); 
    }
  }

  async function handleResetPassword(e) {
    if (e && e.preventDefault) e.preventDefault();
    const errs = {};
    if (!newPass)                     errs.newPass     = 'New password is required';
    else if (newPass.length < 8)      errs.newPass     = 'Minimum 8 characters';
    if (!confirmPass)                 errs.confirmPass = 'Please confirm your password';
    else if (confirmPass !== newPass) errs.confirmPass = 'Passwords do not match';
    setPassErrors(errs);
    if (Object.keys(errs).length) return;
    
    setLoading(true);
    try {
      const userId = searchParams.get('userId') || localStorage.getItem('lockify_userId');
      const code = otp.join('');
      
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          otp: code, 
          newPassword: newPass 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      // Success - navigate to login with success message
      navigate('/login?message=' + encodeURIComponent('Password reset successfully! Please log in with your new password.'));
    }
    catch (err) { 
      setPassErrors({ general: err.message || 'Failed to reset password.' }); 
    }
    finally { 
      setLoading(false); 
    }
  }

  const strength      = getStrength(newPass);
  const strengthLabel = ['','Weak','Fair','Good','Strong'][strength];
  const strengthClass = ['','sw-weak','sw-fair','sw-good','sw-strong'][strength];
  const filledCount   = otp.filter(d => d !== '').length;
  const maskedEmail   = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.max(4, b.length)) + c)
    : 'your email';

  return (
    <div className="vfy-page">

      {/* ══ LEFT PANEL ══ */}
      <div className="vfy-left">
        <div className="vfy-left-glow"  />
        <div className="vfy-left-glow2" />

        <Link to="/" className="vfy-logo">
          <div className="vfy-logo-icon"><LockClosedIcon size={18} /></div>
          <span className="vfy-logo-name">Lockify</span>
        </Link>

        <div className="vfy-art">
          <div className="vfy-art-ring vfy-art-ring-1" />
          <div className="vfy-art-ring vfy-art-ring-2" />
          <div className="vfy-art-ring vfy-art-ring-3" />
          <div className="vfy-art-center">
            {mode === 'forgot' ? <ShieldIcon size={36} /> : <MailIcon size={36} />}
          </div>
          <div className="vfy-dot vfy-dot-1" />
          <div className="vfy-dot vfy-dot-2" />
          <div className="vfy-dot vfy-dot-3" />
          <div className="vfy-dot vfy-dot-4" />
        </div>

        <div className="vfy-left-copy">
          <h2 className="vfy-left-heading">
            {mode === 'forgot' ? 'Secure identity reset' : 'Keeping you safe'}
          </h2>
          <p className="vfy-left-sub">
            {mode === 'forgot'
              ? 'We verify your identity before any changes to protect your vault.'
              : 'Two-factor codes expire in 10 minutes. Never share them with anyone.'}
          </p>
        </div>

        <div className="vfy-badges">
          <div className="vfy-badge"><ShieldIcon size={12} /> End-to-end encrypted</div>
          <div className="vfy-badge"><LockClosedIcon size={12} /> Zero-knowledge vault</div>
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div className="vfy-right">
        <div className="vfy-card">
          <div className="vfy-card-glow" />

          {/* Mobile logo */}
          <Link to="/" className="vfy-logo vfy-logo-mobile">
            <div className="vfy-logo-icon"><LockClosedIcon size={15} /></div>
            <span className="vfy-logo-name">Lockify</span>
          </Link>

          {/* ── Icon ── */}
          <div className="vfy-icon-wrap">
            {mode === 'forgot' ? <ShieldIcon size={24} /> : <MailIcon size={24} />}
          </div>

          {/* ── Title ── */}
          <h1 className="vfy-title">{config.heading}</h1>
          <p className="vfy-sub">{config.sub}</p>

          {/* ── Masked email chip ── */}
          {email && (
            <div className="vfy-email-chip">
              <MailIcon size={12} />
              <span>{maskedEmail}</span>
            </div>
          )}

          {/* ── Divider ── */}
          <div className="vfy-divider" />

          {/* ══ OTP inputs ══ */}
          {!(mode === 'forgot' && verified) && (
            <div className="vfy-otp-section">

              {/* Progress bar */}
              <div className="vfy-progress-wrap">
                <div className="vfy-progress-bar">
                  <div className="vfy-progress-fill" style={{ width:`${(filledCount/OTP_LENGTH)*100}%` }} />
                </div>
                <span className="vfy-progress-label">{filledCount}/{OTP_LENGTH}</span>
              </div>

              {/* 6 individual boxes */}
              <div className="vfy-otp-inputs" onPaste={handleOtpPaste}>
                {otp.map((val, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    className={`vfy-otp-box ${otpError ? 'vfy-otp-err' : ''} ${val ? 'vfy-otp-filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={e => handleOtpChange(e.target.value, i)}
                    onKeyDown={e => handleOtpKeyDown(e, i)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {/* Error */}
              {otpError && (
                <div className="vfy-error-msg">
                  <AlertTriangleIcon size={13} /> {otpError}
                </div>
              )}

              {/* Resend / countdown */}
              <div className="vfy-resend-row">
                {canResend ? (
                  <button className="vfy-resend-btn" onClick={handleResend} disabled={resending}>
                    <RefreshIcon size={13} className={resending ? 'spin' : ''} />
                    {resending ? 'Sending…' : 'Resend code'}
                  </button>
                ) : (
                  <span className="vfy-timer-text">
                    Resend in <span className="vfy-timer-num">0:{String(timer).padStart(2,'0')}</span>
                  </span>
                )}
              </div>

              {/* Verify button — forgot mode only (login/register auto-submits) */}
              {mode === 'forgot' && (
                <button className="vfy-submit-btn" onClick={handleVerify} disabled={loading || otp.some(d => !d)}>
                  {loading ? <span className="auth-spinner" /> : <><ShieldIcon size={16} /> Verify Code</>}
                </button>
              )}
            </div>
          )}

          {/* ══ Reset password form (forgot, after OTP verified) ══ */}
          {mode === 'forgot' && verified && (
            <div className="vfy-reset-form">

              <div className="vfy-verified-notice">
                <CheckCircleIcon size={15} /> Code verified — set your new password.
              </div>

              {passErrors.general && (
                <div className="auth-error-banner"><AlertTriangleIcon size={15} /> {passErrors.general}</div>
              )}

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrap">
                  <span className="input-icon"><LockClosedIcon size={15} /></span>
                  <input
                    className={`form-input input-with-icon input-with-eye ${passErrors.newPass ? 'input-error' : ''}`}
                    type={showNew ? 'text' : 'password'} placeholder="Min. 8 characters"
                    value={newPass}
                    onChange={e => { setNewPass(e.target.value); setPassErrors(p=>({...p,newPass:''})); }}
                    autoComplete="new-password"
                  />
                  <button type="button" className="input-eye" onClick={() => setShowNew(s=>!s)} tabIndex={-1}>
                    {showNew ? <EyeOffIcon size={15}/> : <EyeIcon size={15}/>}
                  </button>
                </div>
                {passErrors.newPass && <span className="form-err">{passErrors.newPass}</span>}
                {newPass && (
                  <div className="strength-meter">
                    <div className="strength-bars">
                      {[1,2,3,4].map(i=><div key={i} className={`strength-bar ${i<=strength?strengthClass:''}`}/>)}
                    </div>
                    <span className={`strength-text ${strengthClass}`}>{strengthLabel}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-wrap">
                  <span className="input-icon"><LockClosedIcon size={15} /></span>
                  <input
                    className={`form-input input-with-icon input-with-eye ${passErrors.confirmPass ? 'input-error' : ''}`}
                    type={showConfirm ? 'text' : 'password'} placeholder="Repeat new password"
                    value={confirmPass}
                    onChange={e => { setConfirmPass(e.target.value); setPassErrors(p=>({...p,confirmPass:''})); }}
                    autoComplete="new-password"
                  />
                  <button type="button" className="input-eye" onClick={() => setShowConfirm(s=>!s)} tabIndex={-1}>
                    {showConfirm ? <EyeOffIcon size={15}/> : <EyeIcon size={15}/>}
                  </button>
                </div>
                {passErrors.confirmPass && <span className="form-err">{passErrors.confirmPass}</span>}
              </div>

              <button className="vfy-submit-btn" onClick={handleResetPassword} disabled={loading}>
                {loading ? <span className="auth-spinner"/> : <><LockClosedIcon size={16}/> {config.btnLabel}</>}
              </button>

            </div>
          )}

          {/* Verify & Sign In button — login / register */}
          {mode !== 'forgot' && (
            <button className="vfy-submit-btn" onClick={handleVerify} disabled={loading || otp.some(d=>!d)}>
              {loading ? <span className="auth-spinner"/> : <><CheckCircleIcon size={16}/> {config.btnLabel}</>}
            </button>
          )}

          {/* Back link */}
          <Link to={config.backTo} className="vfy-back-link">
            <ArrowLeftIcon size={14} /> {config.backLabel}
          </Link>

        </div>
      </div>
    </div>
  );
}