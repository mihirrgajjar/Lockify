import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('lockify-theme') || 'dark'
  );

  /* Restore accent color on mount */
  useEffect(() => {
    const saved = localStorage.getItem('lockify-accent');
    if (saved) {
      document.documentElement.style.setProperty('--c-primary', saved);
      document.documentElement.style.setProperty('--c-primary-lt', saved + '1a');
    }
  }, []);

  /* Apply data-theme to <html> whenever theme changes */
  useEffect(() => {
    const root = document.documentElement;

    function apply(resolved) {
      root.setAttribute('data-theme', resolved);
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      apply(mq.matches ? 'light' : 'dark');
      const handler = e => apply(e.matches ? 'light' : 'dark');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      apply(theme);
    }
  }, [theme]);

  function changeTheme(t) {
    setTheme(t);
    localStorage.setItem('lockify-theme', t);
  }

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: 'dark', changeTheme: () => {} };
  return ctx;
}