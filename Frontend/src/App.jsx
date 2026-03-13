import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { ThemeProvider } from './context/ThemeContext';
import { VaultProvider } from './context/VaultContext';
import { AutoLockProvider } from './context/AutoLockContext';

import Home           from './pages/Home';
import Register       from './pages/Register';
import Login          from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp      from './pages/VerifyOtp';
import Dashboard      from './pages/Dashboard';
import AddPassword    from './pages/AddPassword';
import EditPassword   from './pages/EditPassword';
import ViewPassword   from './pages/ViewPassword';
import Settings       from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <VaultProvider>
        <Router>
          <AutoLockProvider>
            <Routes>
              <Route path="/"                    element={<Home />}           />
              <Route path="/register"            element={<Register />}       />
              <Route path="/login"               element={<Login />}          />
              <Route path="/forgot-password"     element={<ForgotPassword />} />
              <Route path="/verify-otp"          element={<VerifyOtp />}      />
              <Route path="/dashboard"           element={<Dashboard />}      />
              <Route path="/add-password"        element={<AddPassword />}    />
              <Route path="/edit-password/:id"   element={<EditPassword />}   />
              <Route path="/passwords"           element={<ViewPassword />}   />
              <Route path="/settings"            element={<Settings />}       />
            </Routes>
          </AutoLockProvider>
        </Router>
      </VaultProvider>
    </ThemeProvider>
  );
}