import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const AutoLockContext = createContext();

export const useAutoLock = () => {
  const context = useContext(AutoLockContext);
  if (!context) {
    return {
      sessionLock: true,
      lockTimeout: '15',
      updateSessionLock: () => {},
      updateLockTimeout: () => {}
    };
  }
  return context;
};

export const AutoLockProvider = ({ children }) => {
  const navigate = useNavigate();
  const [sessionLock, setSessionLock] = useState(() => {
    const saved = localStorage.getItem('lockify_session_lock');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [lockTimeout, setLockTimeout] = useState(() => {
    const saved = localStorage.getItem('lockify_lock_timeout');
    return saved || '15';
  });

  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const sessionLockRef = useRef(sessionLock);
  const lockTimeoutRef = useRef(lockTimeout);
  const debounceTimeoutRef = useRef(null);

  // Update refs when state changes
  useEffect(() => {
    sessionLockRef.current = sessionLock;
  }, [sessionLock]);

  useEffect(() => {
    lockTimeoutRef.current = lockTimeout;
  }, [lockTimeout]);

  // Reset timer on user activity (with debouncing)
  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Debounce the timer reset to prevent excessive calls
    debounceTimeoutRef.current = setTimeout(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (sessionLockRef.current) {
        const timeoutMs = parseInt(lockTimeoutRef.current) * 60 * 1000; // Convert minutes to milliseconds
        timeoutRef.current = setTimeout(() => {
          handleAutoLock();
        }, timeoutMs);
      }
    }, 100); // 100ms debounce delay
  };

  // Handle auto-lock
  const handleAutoLock = () => {
    // Only auto-lock if user is actually authenticated
    const token = localStorage.getItem('lockify_token');
    if (!token) return;
    
    // Clear auth data
    localStorage.removeItem('lockify_token');
    localStorage.removeItem('lockify_user');
    localStorage.removeItem('lockify_userId');
    localStorage.removeItem('lockify_email');
    
    // Navigate to login page
    navigate('/login');
  };

  // Activity event handlers
  const handleActivity = () => {
    resetTimer();
  };

  // Update session lock setting
  const updateSessionLock = (enabled) => {
    setSessionLock(enabled);
    localStorage.setItem('lockify_session_lock', JSON.stringify(enabled));
    if (enabled) {
      resetTimer();
    } else if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Update lock timeout setting
  const updateLockTimeout = (timeout) => {
    setLockTimeout(timeout);
    localStorage.setItem('lockify_lock_timeout', timeout);
    if (sessionLock) {
      resetTimer();
    }
  };

  // Set up activity listeners
  useEffect(() => {
    const events = [
      'mousedown', 'keypress', 'scroll', 'touchstart', 'click'
    ];

    // Handle mousemove separately with throttling
    let lastMouseTime = 0;
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastMouseTime > 1000) { // Throttle to once per second
        lastMouseTime = now;
        resetTimer();
      }
    };

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });
    
    // Add mousemove with throttling
    document.addEventListener('mousemove', handleMouseMove, true);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      document.removeEventListener('mousemove', handleMouseMove, true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []); // Remove dependencies to prevent re-binding on every state change

  // Initialize timer when component mounts or settings change
  useEffect(() => {
    const token = localStorage.getItem('lockify_token');
    if (sessionLock && token) {
      resetTimer();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [sessionLock, lockTimeout]);

  const value = {
    sessionLock,
    lockTimeout,
    updateSessionLock,
    updateLockTimeout,
    resetTimer
  };

  return (
    <AutoLockContext.Provider value={value}>
      {children}
    </AutoLockContext.Provider>
  );
};
