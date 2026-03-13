import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LockClosedIcon } from './Icons';

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6"  x2="6"  y2="18" />
      <line x1="6"  y1="6"  x2="18" y2="18" />
    </svg>
  );
}

export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">

          <Link to="/" className="navbar-logo">
            <div className="navbar-logo-icon">
              <LockClosedIcon size={16} />
            </div>
            <span className="navbar-logo-name">Lockify</span>
          </Link>

          <div className="navbar-links">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
          </div>

          <div className="navbar-actions">
            <Link to="/login"    className="navbar-sign-in">Sign In</Link>
            <Link to="/register" className="navbar-get-started">Get Started Free</Link>
          </div>

          <button
            className="navbar-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div className={`mobile-nav-overlay ${mobileOpen ? 'open' : ''}`}>
        <button
          className="mobile-nav-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <CloseIcon />
        </button>
        <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
        <a href="#how"      onClick={() => setMobileOpen(false)}>How It Works</a>
        <div className="mobile-nav-cta">
          <Link to="/login"    className="btn-ghost"   onClick={() => setMobileOpen(false)}>Sign In</Link>
          <Link to="/register" className="btn-primary" onClick={() => setMobileOpen(false)}>Get Started Free</Link>
        </div>
      </div>
    </>
  );
}