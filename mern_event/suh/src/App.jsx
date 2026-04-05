// File: suh/src/App.jsx

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentHub from './pages/StudentHub';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true); // THE FIX: The Loading Gate

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Session corrupted");
        localStorage.clear();
      }
    }
    // Only after checking storage do we allow the routes to render
    setIsInitializing(false); 
  }, []);

  // While checking localStorage, show a clean, branded loader
  if (isInitializing) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        backgroundColor: '#EBE5D9', fontFamily: 'Playfair Display' 
      }}>
        <h2 style={{ letterSpacing: '2px', animation: 'pulse 1.5s infinite' }}>Syncing Cultra...</h2>
      </div>
    );
  }

  const currentRole = user?.role;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup setUser={setUser} />} />
        
        {/* Protected Routes - Now they wait for isInitializing to be false */}
        <Route path="/events" element={
          currentRole === 'student' || currentRole === 'admin' 
            ? <StudentHub /> : <Navigate to="/" /> 
        } />
        
        <Route path="/organizer" element={
          currentRole === 'organizer' || currentRole === 'admin' 
            ? <OrganizerDashboard /> : <Navigate to="/" />
        } />
        
        <Route path="/admin" element={
          currentRole === 'admin' ? <AdminDashboard /> : <Navigate to="/" />
        } />
        
        {/* Catch-all redirects back to login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}